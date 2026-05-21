"use client";

import { useEffect, useRef, useState } from "react";

const navItems = ["Home", "Careers", "Gallery", "Social Media", "About", "Contact", "FAQ-Kandidat"];

const videoExtensions = [".mp4", ".webm", ".ogg"];

const slides = [
  {
    image: "/images/hero/herovid.mp4",
    imageAlt: "HGS logistics operations video",
    imageHeight: 960,
    imageWidth: 1600,
    media_align: "right",
    poster: "/images/hero/hero1.webp",
    kicker: "PT Handal Guna Sarana",
    title: ["Our", "Daily Job", "To Deliver", "goods"],
    script: "is",
    scriptColor: "amber",
    body: "Trucking - Warehouse - Last Mile Delivery - First Mile Delivery - Motorist - Distribution Center - E-Fulfillment.",
    cta: "Learn More",
    accent: "amber",
  },
  {
    image: "/images/hero/hero2.webp",
    imageAlt: "HGS professional drivers in training uniforms",
    imageHeight: 960,
    imageWidth: 1600,
    media_align: "left",
    kicker: "PT Handal Guna Sarana",
    title: ["To Drive", "Driver"],
    script: "you need",
    scriptColor: "red",
    body: "Drivers are the people who keep goods moving. Looking for a job? Come join us.",
    cta: "Apply",
    accent: "red",
  },
  {
    image: "/images/hero/hero3.webp",
    imageAlt: "HGS service team and logistics support activity",
    imageHeight: 452,
    imageWidth: 916,
    media_align: "left",
    kicker: "PT Handal Guna Sarana",
    title: ["Our service", ""],
    script: "are",
    scriptColor: "green",
    body: "Last/First Mile delivery, warehousing, motorist, distribution centre, and customized logistics projects.",
    cta: "Learn More",
    accent: "green",
  },
  {
    image: "/images/hero/hero1.webp",
    imageAlt: "HGS driver training session with team members",
    imageHeight: 960,
    imageWidth: 1600,
    media_align: "left",
    kicker: "PT Handal Guna Sarana",
    title: ["Simplify", "Complexity"],
    script: "your",
    scriptColor: "teal",
    body: "Our effort is to take your complexity so you can simply focus on your greatness.",
    cta: "Learn More",
    accent: "teal",
  },
];

const services = [
  {
    title: "Trucking",
    text: "Daily fleet movement for dependable product distribution.",
  },
  {
    title: "Warehousing",
    text: "Storage operations built for organized inbound and outbound flow.",
  },
  {
    title: "First Mile Delivery",
    text: "Pickup support from source locations into the logistics network.",
  },
  {
    title: "Last Mile Delivery",
    text: "Final delivery coordination for stores, channels, and customers.",
  },
  {
    title: "Distribution Center",
    text: "Practical handling for FMCG distribution and route readiness.",
  },
  {
    title: "E-Fulfillment",
    text: "Order fulfillment support for modern commerce operations.",
  },
];

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

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const heroSlider = document.querySelector(".hero-slider");
    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!activeEntry) {
          return;
        }

        const slideIndex = Number((activeEntry.target as HTMLElement).dataset.slideIndex);

        if (!Number.isNaN(slideIndex)) {
          setActiveSlide(slideIndex);
        }
      },
      {
        root: heroSlider,
        threshold: [0.45, 0.6, 0.75],
      },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) {
        observer.observe(slide);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main>
      <header className="site-header" aria-label="Primary navigation">
        <a className="mobile-header-logo" href="#home" aria-label="HGS home">
          <img src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
        </a>
        <nav className="nav">
          {navItems.map((item) => (
            <a className={item === "Home" ? "active" : ""} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>
              {item}
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
              <a className={item === "Home" ? "active" : ""} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>
                {item}
              </a>
            ))}
          </nav>
        </details>
      </header>

      <section className="hero-slider" id="home" aria-label="HGS company highlights">
        {slides.map((slide, index) => {
          const isVideo = videoExtensions.some((extension) => slide.image.endsWith(extension));

          return (
            <article
              className={`hero hero-${index + 1} ${activeSlide === index ? "is-active" : ""}`}
              data-slide-index={index}
              id={`hero-slide-${index + 1}`}
              key={`${slide.image}-${index}`}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
            >
              <div className="hero-media">
                <img className="brand-logo" src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
                {isVideo ? (
                  <video
                    aria-label={`${slide.kicker} hero video`}
                    autoPlay
                    className="hero-image"
                    loop
                    muted
                    playsInline
                    poster={slide.poster}
                    preload="metadata"
                    style={{ objectPosition: slide.media_align }}
                  >
                    <source src={slide.image} type="video/mp4" />
                    Your browser does not support the hero video.
                  </video>
                ) : (
                  <picture>
                    <source srcSet={slide.image} type="image/webp" />
                    <img
                      alt={slide.imageAlt}
                      className="hero-image"
                      decoding={index === 0 ? "sync" : "async"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      height={slide.imageHeight}
                      loading={index === 0 ? "eager" : "lazy"}
                      src={slide.image}
                      style={{ objectPosition: slide.media_align }}
                      width={slide.imageWidth}
                    />
                  </picture>
                )}
                <div className="socials" aria-label="Social media">
                  <a href="#social-media" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14.5 8.6V6.7c0-.8.5-1 1.1-1h1.5V2.2C16.4 2.1 15.4 2 14.3 2c-2.8 0-4.7 1.7-4.7 4.8v1.8H6.5v3.9h3.1V22h3.9v-9.5h3l.5-3.9h-3.5Z" />
                    </svg>
                  </a>
                  <a href="#social-media" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" />
                    </svg>
                  </a>
                  <a href="#social-media" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21.5 7.1c-.2-.9-.9-1.6-1.8-1.8C18.1 4.8 12 4.8 12 4.8s-6.1 0-7.7.5c-.9.2-1.6.9-1.8 1.8C2 8.7 2 12 2 12s0 3.3.5 4.9c.2.9.9 1.6 1.8 1.8 1.6.5 7.7.5 7.7.5s6.1 0 7.7-.5c.9-.2 1.6-.9 1.8-1.8.5-1.6.5-4.9.5-4.9s0-3.3-.5-4.9ZM10 15.4V8.6l5.7 3.4Z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="hero-copy">
                <p className="company">{slide.kicker}</p>
                <div className="hero-message">
                  <h1>
                    {slide.title.map((line, lineIndex) => (
                      <span key={`${line}-${lineIndex}`}>
                        {lineIndex === 1 && <em className={slide.scriptColor}>{slide.script}</em>}
                        {line}
                      </span>
                    ))}
                  </h1>
                  <p className="hero-body">{slide.body}</p>
                </div>
                <a className={`cta ${slide.accent}`} href={slide.cta === "Apply" ? "#careers" : "#about"}>
                  {slide.cta}
                </a>
                <div className="slide-controls" aria-label="Hero slide navigation">
                  <a href={`#hero-slide-${index === 0 ? slides.length : index}`} aria-label="Previous hero slide">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 15 6-6 6 6" />
                    </svg>
                  </a>
                  <a href={`#${index === slides.length - 1 ? "about" : `hero-slide-${index + 2}`}`} aria-label="Next hero slide">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="content-band" id="about">
        <div>
          <p className="eyebrow">About HGS</p>
          <h2>Logistics support that keeps operations simple.</h2>
        </div>
        <p>
          PT Handal Guna Sarana We started to deliver and distribute products to the market in 1985. 
          Since then, we are grateful to have our daily in logistic industry including Distribution , 
          Trucking, Warehousing, and E-fullfillment. 
          Our smile is when we can reduce our client's complexity in that daily job in logistic.
        </p>
      </section>

      <section className="services" id="gallery">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Built for transport, warehouse, and delivery teams.</h2>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article key={service.title}>
              <span aria-hidden="true">▰</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="social-band" id="social-media">
        <div>
          <p className="eyebrow">Social Media</p>
          <h2>Follow HGS updates and recruitment announcements.</h2>
        </div>
        <div className="social-links" aria-label="HGS social links">
          <a href="#contact">Facebook</a>
          <a href="#contact">Instagram</a>
          <a href="#contact">YouTube</a>
        </div>
      </section>

      <section className="career-cta" id="careers">
        <div>
          <p className="eyebrow">Careers</p>
          <h2>Drive your career with HGS.</h2>
          <p>Driver, helper, warehouse, fleet, HR, finance, IT, and sales opportunities are prepared to grow into dedicated recruitment routes.</p>
        </div>
        <a className="cta red" href="#contact">Apply</a>
      </section>

      <section className="faq-section" id="faq-kandidat">
        <div className="section-heading">
          <p className="eyebrow">FAQ Kandidat</p>
          <h2>Clear answers for applicants.</h2>
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

      <footer className="footer" id="contact">
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
