from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token
from app.core.security import decode_access_token
from app.core.security import hash_password
from app.core.security import verify_password


def test_admin_password_hash_round_trip() -> None:
    password_hash = hash_password("correct-horse-battery-staple")

    assert verify_password("correct-horse-battery-staple", password_hash) is True
    assert verify_password("wrong-password", password_hash) is False
    assert "correct-horse-battery-staple" not in password_hash


def test_admin_access_token_round_trip() -> None:
    user_id = uuid4()
    token = create_access_token(
        user_id=user_id,
        role_code="super_admin",
        permissions=["*"],
    )

    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "super_admin"
    assert payload["permissions"] == ["*"]


def test_admin_access_token_rejects_tampering() -> None:
    token = create_access_token(
        user_id=uuid4(),
        role_code="admin",
        permissions=["user.read"],
    )
    replacement = "x" if token[-1] != "x" else "y"
    tampered_token = f"{token[:-1]}{replacement}"

    with pytest.raises(HTTPException):
        decode_access_token(tampered_token)
