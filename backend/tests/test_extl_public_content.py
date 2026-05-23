import pytest
from httpx import ASGITransport
from httpx import AsyncClient

from app.main import create_app


pytestmark = pytest.mark.anyio


async def test_extl_health_check_uses_standard_response_shape() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "EXTL API is healthy",
        "data": {"status": "ok"},
        "meta": {},
    }


async def test_extl_services_returns_ordered_public_services() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/services")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 6
    assert [service["code"] for service in payload["data"]] == [
        "TRUCKING",
        "WAREHOUSING",
        "FIRST_MILE_DELIVERY",
        "LAST_MILE_DELIVERY",
        "DISTRIBUTION_CENTER",
        "E_FULFILLMENT",
    ]


async def test_extl_faqs_returns_public_recruitment_faqs() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/faqs")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 17
    assert payload["data"][0]["code"] == "BUSINESS_FIELD"
    assert payload["data"][-1]["code"] == "THR_BENEFIT"


async def test_extl_gallery_returns_ordered_public_images() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/gallery/images")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 6
    assert payload["data"][0]["title"] == "Operations"
    assert payload["data"][1]["title"] == "Colleagues"
    assert payload["data"][0]["image_url"].startswith("/images/gallery/")


async def test_intl_admin_gallery_requires_admin_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/intl/v1/gallery/images")

    assert response.status_code == 401


async def test_intl_admin_gallery_update_requires_admin_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.patch(
            "/api/intl/v1/gallery/images/8a93a98c-f3bb-4928-87ee-59dc5f5d7401",
        )

    assert response.status_code == 401


async def test_intl_admin_gallery_delete_requires_admin_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.delete(
            "/api/intl/v1/gallery/images/8a93a98c-f3bb-4928-87ee-59dc5f5d7401",
        )

    assert response.status_code == 401


async def test_intl_admin_services_requires_admin_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/intl/v1/services")

    assert response.status_code == 401


async def test_intl_admin_faqs_requires_admin_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/intl/v1/faqs")

    assert response.status_code == 401
