import argparse
import getpass
import sys

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import get_session_factory
from app.repositories.admin import AdminRepository
from app.services.admin import AdminService


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create or update an HGS admin user with a system role."
    )
    parser.add_argument("--email", required=True, help="Admin email address.")
    parser.add_argument("--full-name", required=True, help="Admin full name.")
    parser.add_argument(
        "--role",
        required=True,
        help="Role code, for example: super_admin, admin, content_admin.",
    )
    parser.add_argument(
        "--activate",
        action="store_true",
        help="Reactivate the account when it already exists.",
    )
    args = parser.parse_args()

    if not settings.database_url:
        print("DATABASE_URL is required before creating admin users.", file=sys.stderr)
        return 2

    if not settings.admin_cli_secret:
        print("ADMIN_CLI_SECRET must be configured to unlock this script.", file=sys.stderr)
        return 2

    provided_secret = getpass.getpass("Admin CLI secret: ")
    if provided_secret != settings.admin_cli_secret:
        print("Admin CLI secret did not match.", file=sys.stderr)
        return 1

    password = getpass.getpass("New admin password: ")
    password_confirmation = getpass.getpass("Confirm admin password: ")
    if password != password_confirmation:
        print("Passwords did not match.", file=sys.stderr)
        return 1
    if len(password) < 12:
        print("Admin password must be at least 12 characters.", file=sys.stderr)
        return 1

    email = args.email.strip().lower()
    full_name = args.full_name.strip()
    role_code = args.role.strip()

    session_factory = get_session_factory()
    with session_factory() as session:
        repository = AdminRepository(session)
        service = AdminService(repository)
        service.ensure_default_roles()
        role = repository.get_role_by_code(role_code)
        if role is None:
            print(f"Unknown admin role: {role_code}", file=sys.stderr)
            return 1

        user = repository.get_user_by_email(email)
        if user is None:
            user = repository.create_user(
                email=email,
                full_name=full_name,
                password_hash=hash_password(password),
                role=role,
                is_active=True,
            )
            action = "Created"
        else:
            user = repository.update_user(
                user,
                full_name=full_name,
                role=role,
                is_active=True if args.activate else user.is_active,
                password_hash=hash_password(password),
            )
            action = "Updated"

    print(f"{action} admin user {user.email} with role {user.role.code}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
