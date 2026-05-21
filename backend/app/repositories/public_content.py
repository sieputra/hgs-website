from dataclasses import dataclass


@dataclass(frozen=True)
class PublicServiceRecord:
    code: str
    title: str
    summary: str
    sort_order: int
    is_active: bool = True


@dataclass(frozen=True)
class FAQRecord:
    code: str
    question: str
    answer: str
    sort_order: int
    is_active: bool = True


class PublicContentRepository:
    """Seed-backed public content until the PostgreSQL repository is added."""

    _services = (
        PublicServiceRecord(
            code="TRUCKING",
            title="Trucking",
            summary="Daily fleet movement for dependable product distribution.",
            sort_order=1,
        ),
        PublicServiceRecord(
            code="WAREHOUSING",
            title="Warehousing",
            summary="Storage operations built for organized inbound and outbound flow.",
            sort_order=2,
        ),
        PublicServiceRecord(
            code="FIRST_MILE_DELIVERY",
            title="First Mile Delivery",
            summary="Pickup support from source locations into the logistics network.",
            sort_order=3,
        ),
        PublicServiceRecord(
            code="LAST_MILE_DELIVERY",
            title="Last Mile Delivery",
            summary="Final delivery coordination for stores, channels, and customers.",
            sort_order=4,
        ),
        PublicServiceRecord(
            code="DISTRIBUTION_CENTER",
            title="Distribution Center",
            summary="Practical handling for FMCG distribution and route readiness.",
            sort_order=5,
        ),
        PublicServiceRecord(
            code="E_FULFILLMENT",
            title="E-Fulfillment",
            summary="Order fulfillment support for modern commerce operations.",
            sort_order=6,
        ),
    )

    _faqs = (
        FAQRecord(
            code="BUSINESS_FIELD",
            question="Bergerak di bidang apa?",
            answer="Logistik, Trucking, Pergudangan, dan Distribusi FMCG.",
            sort_order=1,
        ),
        FAQRecord(
            code="COMPANY_LOCATION",
            question="Dimana lokasi perusahaan?",
            answer=(
                "Grand ITC Permata Hijau, Blok Sapphire No.19, Kebayoran Lama, "
                "Jakarta Selatan."
            ),
            sort_order=2,
        ),
        FAQRecord(
            code="OUTSOURCING_COMPANY",
            question="Apakah ini perusahaan outsourcing?",
            answer="Bukan, kami bukan perusahaan outsourcing.",
            sort_order=3,
        ),
        FAQRecord(
            code="COMPANY_CLIENTS",
            question="Apa saja client perusahaan ini?",
            answer=(
                "Bervariasi, salah satunya: Danone (AQUA), Nutricia, Japfa, "
                "Heinz-ABC, Agriaku, Wings Group, Bukalapak, DHL, PT. Balina "
                "Agung Perkasa."
            ),
            sort_order=4,
        ),
        FAQRecord(
            code="PLACEMENT_LOCATIONS",
            question="Lokasi di mana saja? Penempatan di mana saja?",
            answer=(
                "Kebanyakan di Jawa Barat dan Jakarta. Misalnya, Subang, Bandung, "
                "Parung, Ciherang, Sentul, Ciawi, Sunter Jakarta, Ciracas Jakarta, "
                "Cipinang - Jakarta, Permata Hijau - Jakarta - Tangerang. "
                "Penempatan disesuaikan kebutuhan yang ada."
            ),
            sort_order=5,
        ),
        FAQRecord(
            code="INTERVIEW_AFTER_WA_OR_PHONE",
            question=(
                "Saya sudah mendapatkan pesan dari WA / Telepon, bagaimana "
                "untuk interviewnya?"
            ),
            answer=(
                "Lanjutkan ke daftar jadwal interview di WA anda. Setelah diisi, "
                "anda tinggal datang pada jadwal yang ditentukan."
            ),
            sort_order=6,
        ),
        FAQRecord(
            code="NO_EXPERIENCE_APPLY",
            question="Apakah yang belum berpengalaman dapat mendaftar?",
            answer=(
                "Diutamakan yang sudah berpengalaman. Tapi yang belum berpengalaman, "
                "secara berkala kami juga buka posisi magang."
            ),
            sort_order=7,
        ),
        FAQRecord(
            code="INTERNSHIP_MEANING",
            question="Apakah maksudnya magang?",
            answer=(
                "Artinya diberi kesempatan belajar dalam bekerja di dalam waktu "
                "terbatas, misalnya 3 bulan."
            ),
            sort_order=8,
        ),
        FAQRecord(
            code="ONLINE_INTERVIEW_OUT_OF_TOWN",
            question="Saya di luar kota, bolehkah interview online?",
            answer="Mohon untuk telepon Admin HR kami.",
            sort_order=9,
        ),
        FAQRecord(
            code="HOW_TO_APPLY",
            question="Bagaimana cara mendaftar?",
            answer=(
                "Isi CV anda di https://bit.ly/kandidathgs, lalu lanjutkan untuk "
                "isi kapan anda dapat interview. Tunggu konfirmasi dari Admin HR kami."
            ),
            sort_order=10,
        ),
        FAQRecord(
            code="INTERVIEW_REQUIREMENTS",
            question="Apa saja yang harus dipersiapkan?",
            answer=(
                "Untuk para Driver, SIM A, SIM B. Bila ada SIM B1 dan B2. "
                "Untuk Staff, KTP."
            ),
            sort_order=11,
        ),
        FAQRecord(
            code="AFTER_INTERVIEW_STATUS",
            question=(
                "Setelah di interview, bagaimana saya mengetahui status lebih lanjut?"
            ),
            answer=(
                "Biasanya jawaban akan diberikan sebelum 2 minggu. Bila tidak ada "
                "jawaban lewat dari 2 minggu, artinya belum diterima. Atau telepon "
                "HR admin kami pada jam kerja."
            ),
            sort_order=12,
        ),
        FAQRecord(
            code="RECRUITMENT_FEE",
            question="Apakah dikenai biaya?",
            answer=(
                "Sama sekali tidak! Mohon bila ada yang minta biaya, dapat "
                "diberitahukan kepada kami lewat WA atau telepon."
            ),
            sort_order=13,
        ),
        FAQRecord(
            code="COMPANY_ESTABLISHED",
            question="Berdiri sejak kapan, Handal Guna Sarana?",
            answer="Berdiri sejak tahun 2012.",
            sort_order=14,
        ),
        FAQRecord(
            code="CAREER_PATH",
            question=(
                "Apakah pada jenjang karir ada peluang kedepannya atau tidak?"
            ),
            answer="Jenjang karir terbuka lebar untuk seluruh staff.",
            sort_order=15,
        ),
        FAQRecord(
            code="BPJS_BENEFIT",
            question="Apakah disediakan BPJS?",
            answer=(
                "Iya, kami menyediakan BPJS Kesehatan dan BPJS Ketenagakerjaan "
                "untuk seluruh staff."
            ),
            sort_order=16,
        ),
        FAQRecord(
            code="THR_BENEFIT",
            question="Apakah ada tunjangan hari raya?",
            answer="Iya, kami menyediakan tunjangan hari raya untuk seluruh staff.",
            sort_order=17,
        ),
    )

    def list_services(self) -> list[PublicServiceRecord]:
        return sorted(
            (service for service in self._services if service.is_active),
            key=lambda service: service.sort_order,
        )

    def list_faqs(self) -> list[FAQRecord]:
        return sorted(
            (faq for faq in self._faqs if faq.is_active),
            key=lambda faq: faq.sort_order,
        )
