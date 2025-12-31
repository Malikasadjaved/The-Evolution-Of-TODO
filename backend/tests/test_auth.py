"""
Authentication Tests - JWT Verification

Tests for src/api/auth.py::get_current_user middleware.

CRITICAL: 100% test coverage required for authentication module.
All tests must follow TDD approach:
1. Write test (FAIL)
2. Implement feature (PASS)
3. Refactor

Test Coverage:
- Valid JWT token → Returns user_id
- Expired JWT token → 401 error
- Invalid signature → 401 error
- Malformed token → 401 error
- Missing Authorization header → 401 error
- Wrong Bearer format → 401 error
- Missing user_id in payload → 401 error
"""

import pytest
from fastapi import HTTPException
from src.api.auth import get_current_user


# ============================================================================
# T038: Test Valid JWT Token
# ============================================================================


@pytest.mark.asyncio
async def test_valid_jwt_token_returns_user_id(test_jwt_token: str):
    """
    Test that get_current_user returns user_id from valid JWT token.

    Given: A valid JWT token with user_id in payload
    When: get_current_user is called with Authorization header
    Then: Returns the user_id from token payload
    """
    # Arrange
    authorization_header = f"Bearer {test_jwt_token}"

    # Act
    user_id = await get_current_user(authorization=authorization_header)

    # Assert
    assert user_id == "test_user_123"
    assert isinstance(user_id, str)


# ============================================================================
# T039: Test Expired JWT Token
# ============================================================================


@pytest.mark.asyncio
async def test_expired_jwt_token_raises_401(expired_jwt_token: str):
    """
    Test that expired JWT token raises 401 Unauthorized.

    Given: An expired JWT token (exp in the past)
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    And: Error message mentions token expiration
    """
    # Arrange
    authorization_header = f"Bearer {expired_jwt_token}"

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


# ============================================================================
# T040: Test Invalid JWT Signature
# ============================================================================


@pytest.mark.asyncio
async def test_invalid_signature_raises_401(invalid_signature_jwt_token: str):
    """
    Test that JWT token with wrong signature raises 401.

    Given: A JWT token signed with wrong secret key
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    And: Error message indicates invalid token
    """
    # Arrange
    authorization_header = f"Bearer {invalid_signature_jwt_token}"

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401
    assert "invalid" in exc_info.value.detail.lower()


# ============================================================================
# T041: Test Malformed JWT Token
# ============================================================================


@pytest.mark.asyncio
async def test_malformed_token_raises_401():
    """
    Test that malformed JWT token raises 401.

    Given: A malformed token (not a valid JWT structure)
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    """
    # Arrange - malformed tokens
    malformed_tokens = [
        "not.a.jwt",  # Invalid structure
        "invalid_token",  # Not base64 encoded
        "Bearer.token.here",  # Wrong format
        "",  # Empty token
    ]

    for malformed_token in malformed_tokens:
        authorization_header = f"Bearer {malformed_token}"

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization=authorization_header)

        assert exc_info.value.status_code == 401


# ============================================================================
# T042: Test Missing Authorization Header
# ============================================================================


@pytest.mark.asyncio
async def test_missing_authorization_header_raises_401():
    """
    Test that missing Authorization header raises 401.

    Given: No Authorization header provided
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    And: Error message mentions missing token
    """
    # Arrange
    authorization_header = None

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401
    assert "missing" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_empty_authorization_header_raises_401():
    """
    Test that empty Authorization header raises 401.

    Given: Empty string Authorization header
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    """
    # Arrange
    authorization_header = ""

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401


# ============================================================================
# T043: Test Wrong Bearer Format
# ============================================================================


@pytest.mark.asyncio
async def test_invalid_bearer_format_raises_401(test_jwt_token: str):
    """
    Test that Authorization header without 'Bearer ' prefix raises 401.

    Given: Valid token but wrong Authorization format
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    And: Error message mentions invalid format
    """
    # Arrange - various invalid formats
    invalid_formats = [
        test_jwt_token,  # No "Bearer " prefix
        f"Token {test_jwt_token}",  # Wrong prefix
        f"bearer {test_jwt_token}",  # Lowercase 'bearer'
        f"Bearer{test_jwt_token}",  # No space after Bearer
    ]

    for invalid_format in invalid_formats:
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization=invalid_format)

        assert exc_info.value.status_code == 401
        assert (
            "invalid" in exc_info.value.detail.lower() or "format" in exc_info.value.detail.lower()
        )


# ============================================================================
# T044: Test Missing user_id in Token Payload
# ============================================================================


@pytest.mark.asyncio
async def test_missing_user_id_in_payload_raises_401():
    """
    Test that JWT token without user_id in payload raises 401.

    Given: A valid JWT token but missing user_id field
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    And: Error message mentions missing user_id
    """
    import jwt
    from datetime import datetime, timedelta
    from src.api.config import settings

    # Arrange - create token without user_id
    payload = {
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        # Note: user_id is missing
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    authorization_header = f"Bearer {token}"

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401
    assert "user_id" in exc_info.value.detail.lower()


# ============================================================================
# Additional Edge Cases
# ============================================================================


@pytest.mark.asyncio
async def test_token_with_extra_spaces_raises_401(test_jwt_token: str):
    """
    Test that Authorization header with extra spaces raises 401.

    Given: Valid token but extra spaces in header
    When: get_current_user is called
    Then: Raises HTTPException with 401 status
    """
    # Arrange
    authorization_header = f"Bearer  {test_jwt_token}"  # Two spaces

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(authorization=authorization_header)

    assert exc_info.value.status_code == 401
