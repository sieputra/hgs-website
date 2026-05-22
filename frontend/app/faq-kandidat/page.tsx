"use client";

import { useEffect, useState } from "react";

type FAQ = {
  code: string;
  question: string;
  answer: string;
  sort_order: number;
};

type FAQResponse = {
  success: boolean;
  data?: FAQ[];
};

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
  const [apiFaqs, setApiFaqs] = useState<FAQ[]>([]);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadFaqs() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/extl/v1/faqs", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load FAQ content.");
        }

        const payload = (await response.json()) as FAQResponse;

        if (!payload.success || !Array.isArray(payload.data)) {
          throw new Error("Invalid FAQ response.");
        }

        const orderedFaqs = payload.data.slice().sort((a, b) => a.sort_order - b.sort_order);

        setApiFaqs(orderedFaqs);
        setOpenCode(orderedFaqs[0]?.code ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setApiFaqs([]);
        setOpenCode(null);
        setErrorMessage("FAQ content is unavailable right now.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFaqs();

    return () => {
      controller.abort();
    };
  }, []);

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
        <div className="faq-list" aria-busy={isLoading}>
          {isLoading && <p className="faq-status">Loading FAQ content...</p>}
          {!isLoading && errorMessage && <p className="faq-status">{errorMessage}</p>}
          {!isLoading && !errorMessage && apiFaqs.length === 0 && <p className="faq-status">No FAQ content is available.</p>}
          {!isLoading &&
            !errorMessage &&
            apiFaqs.map((item) => {
              const isOpen = item.code === openCode;
              const panelId = `faq-panel-${item.code}`;

              return (
                <article className="faq-item" key={item.code}>
                  <h2>
                    <button aria-controls={panelId} aria-expanded={isOpen} className="faq-trigger" onClick={() => setOpenCode(isOpen ? null : item.code)} type="button">
                      <span>{item.question}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        {isOpen ? <path d="m6 9 6 6 6-6" /> : <path d="m6 15 6-6 6 6" />}
                      </svg>
                    </button>
                  </h2>
                  <div className="faq-answer" hidden={!isOpen} id={panelId}>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <footer className="footer">
        <picture className="footer-logo">
          <source srcSet="/images/logo.webp" type="image/webp" />
          <img src="/images/logo.webp" alt="HGS logo" width="1600" height="872" loading="lazy" decoding="async" />
        </picture>
        <div>
          <strong>PT Handal Guna Sarana</strong>
          <p>Grand ITC Permata Hijau, Jakarta Selatan</p>
        </div>
      </footer>
    </main>
  );
}
