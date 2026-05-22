import pytest
from httpx import ASGITransport
from httpx import AsyncClient

from app.main import create_app


pytestmark = pytest.mark.anyio


async def test_extl_divisions_returns_master_data_with_positions() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/divisions")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 9
    assert payload["data"][0]["code"] == "OPERATIONAL_TRANSPORT"
    assert payload["data"][0]["positions"][0]["code"] == "MT_TRANSPORT_LOGISTIC"
    assert payload["data"][-1]["code"] == "DIVISI_SALES"


async def test_extl_jobs_returns_seeded_public_jobs() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/jobs")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["meta"]["total"] == 3
    assert [job["slug"] for job in payload["data"]] == [
        "driver-operasional",
        "helper-gudang",
        "staff-hrd",
    ]


async def test_extl_job_detail_returns_job_by_slug() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/jobs/driver-operasional")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["code"] == "DRIVER_OPERASIONAL"
    assert payload["data"]["position_code"] == "DRIVER"


async def test_extl_job_detail_returns_404_for_unknown_slug() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/extl/v1/jobs/missing-job")

    assert response.status_code == 404
    assert response.json()["detail"] == "Career job not found"


async def test_extl_contact_accepts_public_submission() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/extl/v1/contact",
            json={
                "full_name": "Budi Santoso",
                "email": "budi@example.com",
                "phone_number": "08123456789",
                "company_name": "PT Contoh",
                "message": "Saya ingin berdiskusi tentang layanan distribusi.",
            },
        )
    payload = response.json()

    assert response.status_code == 201
    assert payload["success"] is True
    assert payload["message"] == "Contact submission received"
    assert payload["data"]["status"] == "submitted"
    assert payload["data"]["id"]


async def test_extl_career_application_accepts_candidate_submission() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/extl/v1/career-applications",
            json={
                "career_job_slug": "driver-operasional",
                "full_name": "Andi Saputra",
                "nickname": "Andi",
                "identity_number": "3171000000000001",
                "identity_valid_until": "2030-12-31",
                "identity_address": "Jakarta Selatan",
                "domicile_address": "Jakarta Selatan",
                "driving_license_number": "SIMB10001",
                "driving_license_class": "B1",
                "driving_license_valid_until": "2030-12-31",
                "birth_place": "Jakarta",
                "birth_date": "1994-05-10",
                "age": 31,
                "marital_status": "Menikah",
                "gender": "Laki-laki",
                "mother_name": "Siti",
                "religion": "Islam",
                "phone_number": "08123456789",
                "medical_history": None,
                "education_level": "SMA",
                "school_name": "SMA Contoh",
                "major": "IPA",
                "applied_position": "Driver",
                "vacancy_source": "Website",
                "preferred_area": "Jakarta",
                "willing_to_be_placed_anywhere": True,
                "available_interview_date": "2026-06-01",
                "interview_invitation_reason": (
                    "Berpengalaman sebagai driver distribusi."
                ),
                "work_experiences": [
                    {
                        "company_name": "PT Lama",
                        "position": "Driver",
                        "employment_duration": "2 tahun",
                        "salary": "4500000",
                        "company_phone_number": "021123456",
                        "leaving_reason": "Kontrak selesai",
                        "company_comment": "Lingkungan kerja baik",
                    }
                ],
            },
        )
    payload = response.json()

    assert response.status_code == 201
    assert payload["success"] is True
    assert payload["message"] == "Career application submitted"
    assert payload["data"]["status"] == "submitted"
    assert payload["data"]["id"]


async def test_extl_career_application_rejects_unknown_job_slug() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/extl/v1/career-applications",
            json={
                "career_job_slug": "missing-job",
                "full_name": "Andi Saputra",
                "nickname": "Andi",
                "identity_number": "3171000000000001",
                "identity_valid_until": "2030-12-31",
                "identity_address": "Jakarta Selatan",
                "domicile_address": "Jakarta Selatan",
                "driving_license_number": "SIMB10001",
                "driving_license_valid_until": "2030-12-31",
                "birth_place": "Jakarta",
                "birth_date": "1994-05-10",
                "age": 31,
                "mother_name": "Siti",
                "phone_number": "08123456789",
                "applied_position": "Driver",
                "vacancy_source": "Website",
                "willing_to_be_placed_anywhere": True,
                "interview_invitation_reason": (
                    "Berpengalaman sebagai driver distribusi."
                ),
            },
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Career job not found"
