const faqs = [
  {
    question: "Bergerak di bidang apa?",
    answer: "Logistik, trucking, pergudangan, distribusi, dan fulfillment.",
  },
  {
    question: "Apakah recruitment berbayar?",
    answer: "Tidak. Proses recruitment HGS tidak dikenakan biaya apa pun.",
  },
  {
    question: "Bagaimana cara melamar?",
    answer: "Kandidat dapat menghubungi tim HR atau mengikuti form kandidat resmi HGS.",
  },
];

const navItems = [
  { href: "/#home", label: "Home" },
  { href: "/#careers", label: "Careers" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#social-media", label: "Social Media" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
  { href: "/faq-kandidat", label: "FAQ-Kandidat" },
];

export default function FaqKandidatPage() {
  return (
    <main className="faq-page">
      <header className="site-header" aria-label="Primary navigation">
        <a className="mobile-header-logo" href="/#home" aria-label="HGS home">
          <img src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
        </a>
        <nav className="nav">
          {navItems.map((item) => (
            <a className={item.label === "FAQ-Kandidat" ? "active" : ""} href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </summary>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a className={item.label === "FAQ-Kandidat" ? "active" : ""} href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>
        </details>
      </header>

      <section className="faq-section faq-page-section">
        <div className="section-heading">
          <p className="eyebrow">FAQ Kandidat</p>
          <h1>Clear answers for applicants.</h1>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
