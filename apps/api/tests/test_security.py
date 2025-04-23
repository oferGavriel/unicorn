from app.core import security

def test_password_hash_roundtrip():
    raw = "secret123"
    hashed = security.hash_password(raw)
    assert security.verify_password(raw, hashed)
    assert not security.verify_password("wrongpassword", hashed)

def test_jwt_roundtrip():
    sub = "test-user"
    token = security.create_access_token(sub)
    payload = security.decode_token(token)
    assert payload["sub"] == sub
    assert payload["type"] == "access"
    