from fastapi.testclient import TestClient

from app.main import create_app


client = TestClient(create_app())


def test_extl_health_check_uses_standard_response_shape() -> None:
    response = client.get("/api/extl/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "EXTL API is healthy",
        "data": {"status": "ok"},
        "meta": {},
    }


def test_extl_services_returns_ordered_public_services() -> None:
    response = client.get("/api/extl/v1/services")
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


def test_extl_faqs_returns_public_recruitment_faqs() -> None:
    response = client.get("/api/extl/v1/faqs")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 17
    assert payload["data"][0]["code"] == "BUSINESS_FIELD"
    assert payload["data"][-1]["code"] == "THR_BENEFIT"
