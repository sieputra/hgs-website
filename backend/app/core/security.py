import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC
from datetime import datetime
from datetime import timedelta
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from fastapi import status

from app.core.config import settings


PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 390_000
TOKEN_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return "$".join(
        [
            PASSWORD_ALGORITHM,
            str(PASSWORD_ITERATIONS),
            _base64_url_encode(salt),
            _base64_url_encode(password_hash),
        ]
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != PASSWORD_ALGORITHM:
        return False

    calculated_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        _base64_url_decode(salt),
        int(iterations),
    )
    return hmac.compare_digest(_base64_url_encode(calculated_hash), expected_hash)


def create_access_token(
    *,
    user_id: UUID,
    role_code: str,
    permissions: list[str],
) -> str:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.admin_access_token_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role_code,
        "permissions": permissions,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _encode_token(payload)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        header_part, payload_part, signature_part = token.split(".", 2)
    except ValueError as exc:
        raise _invalid_token() from exc

    message = f"{header_part}.{payload_part}".encode("ascii")
    expected_signature = _sign(message)
    if not hmac.compare_digest(
        _base64_url_decode(signature_part),
        expected_signature,
    ):
        raise _invalid_token()

    try:
        header = json.loads(_base64_url_decode(header_part))
        payload = json.loads(_base64_url_decode(payload_part))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise _invalid_token() from exc

    if header.get("alg") != TOKEN_ALGORITHM:
        raise _invalid_token()

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at < int(datetime.now(UTC).timestamp()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin session has expired.",
        )

    return payload


def _encode_token(payload: dict[str, Any]) -> str:
    header = {"alg": TOKEN_ALGORITHM, "typ": "JWT"}
    header_part = _base64_url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_part = _base64_url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signature = _sign(f"{header_part}.{payload_part}".encode("ascii"))
    signature_part = _base64_url_encode(signature)
    return f"{header_part}.{payload_part}.{signature_part}"


def _sign(message: bytes) -> bytes:
    secret = settings.admin_auth_secret_key
    if settings.app_env != "local" and secret == "dev-insecure-admin-secret-change-me":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ADMIN_AUTH_SECRET_KEY must be configured.",
        )
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).digest()


def _base64_url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64_url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def _invalid_token() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin session.",
    )
