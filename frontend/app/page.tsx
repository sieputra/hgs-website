"use client";

import { useEffect, useRef, useState } from "react";

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "#social-media", label: "Social Media" },
  { href: "#contact", label: "Contact" },
  { href: "#careers", label: "Careers" },
  { href: "/faq-kandidat", label: "FAQ-Kandidat" },
];

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

type PublicService = {
  code: string;
  title: string;
  summary: string;
  sort_order: number;
};

type ServicesResponse = {
  success: boolean;
  data?: PublicService[];
};

const fallbackServices: PublicService[] = [
  {
    code: "TRUCKING",
    title: "Trucking",
    summary: "Daily fleet movement for dependable product distribution.",
    sort_order: 1,
  },
  {
    code: "WAREHOUSING",
    title: "Warehousing",
    summary: "Storage operations built for organized inbound and outbound flow.",
    sort_order: 2,
  },
  {
    code: "FIRST_MILE_DELIVERY",
    title: "First Mile Delivery",
    summary: "Pickup support from source locations into the logistics network.",
    sort_order: 3,
  },
  {
    code: "LAST_MILE_DELIVERY",
    title: "Last Mile Delivery",
    summary: "Final delivery coordination for stores, channels, and customers.",
    sort_order: 4,
  },
  {
    code: "DISTRIBUTION_CENTER",
    title: "Distribution Center",
    summary: "Practical handling for FMCG distribution and route readiness.",
    sort_order: 5,
  },
  {
    code: "E_FULFILLMENT",
    title: "E-Fulfillment",
    summary: "Order fulfillment support for modern commerce operations.",
    sort_order: 6,
  },
];

type GalleryImage = {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
};

type GalleryResponse = {
  success: boolean;
  data?: GalleryImage[];
};

const fallbackGalleryImages: GalleryImage[] = [
  {
    id: "8a93a98c-f3bb-4928-87ee-59dc5f5d7401",
    title: "Operations",
    caption: "Daily logistics activity around HGS fleet and distribution teams.",
    image_url: "/images/gallery/rio7985-2.webp",
    image_alt: "HGS team member checking a truck during operations",
    sort_order: 1,
  },
  {
    id: "3506545f-4a17-4c31-8010-887f83c1d6c2",
    title: "Colleagues",
    caption: "Most of our time, perhaps is spent with you.",
    image_url: "/images/gallery/dsc0632-1-1.webp",
    image_alt: "HGS colleagues gathered outdoors",
    sort_order: 2,
  },
  {
    id: "cf4de750-9d34-44c5-81e3-ff86c1b46fe7",
    title: "Office",
    caption: "Coordination and administration keep each delivery route moving.",
    image_url: "/images/gallery/img-20171111-wa0007.webp",
    image_alt: "HGS office team working at computers",
    sort_order: 3,
  },
  {
    id: "e5b891b7-8a32-4b13-9b46-dad9b5f11a04",
    title: "Fleet Yard",
    caption: "Preparation starts before the first mile leaves the yard.",
    image_url: "/images/gallery/dsc0651-1-1.webp",
    image_alt: "HGS staff observing parked trucks in a yard",
    sort_order: 4,
  },
  {
    id: "cb802d0b-8bb6-4fd9-b72b-ad025b1f9254",
    title: "Distribution",
    caption: "Goods move through HGS routes with practical field support.",
    image_url: "/images/gallery/truck23.webp",
    image_alt: "HGS green distribution truck on the road",
    sort_order: 5,
  },
  {
    id: "996b877c-481c-46a7-a508-e3bd711a1431",
    title: "Warehouse",
    caption: "Fleet and warehouse teams work together from loading to dispatch.",
    image_url: "/images/gallery/truck.webp",
    image_alt: "HGS truck parked near a warehouse loading area",
    sort_order: 6,
  },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [apiServices, setApiServices] = useState<PublicService[]>(fallbackServices);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(fallbackGalleryImages);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const galleryTrackRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        setIsServicesLoading(true);
        const response = await fetch("/api/extl/v1/services", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const payload = (await response.json()) as ServicesResponse;
        if (!payload.success || !Array.isArray(payload.data)) {
          throw new Error("Invalid services response.");
        }

        const orderedServices = payload.data.slice().sort((a, b) => a.sort_order - b.sort_order);
        setApiServices(orderedServices.length > 0 ? orderedServices : fallbackServices);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setApiServices(fallbackServices);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsServicesLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGalleryImages() {
      try {
        setIsGalleryLoading(true);
        const response = await fetch("/api/extl/v1/gallery/images", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load gallery images.");
        }

        const payload = (await response.json()) as GalleryResponse;
        if (!payload.success || !Array.isArray(payload.data)) {
          throw new Error("Invalid gallery response.");
        }

        const orderedImages = payload.data.slice().sort((a, b) => a.sort_order - b.sort_order);
        setGalleryImages(orderedImages.length > 0 ? orderedImages : fallbackGalleryImages);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setGalleryImages(fallbackGalleryImages);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsGalleryLoading(false);
        }
      }
    }

    loadGalleryImages();

    return () => {
      controller.abort();
    };
  }, []);

  function scrollGallery(direction: "previous" | "next") {
    galleryTrackRef.current?.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? 520 : -520,
    });
  }

  return (
    <main>
      <header className="site-header" aria-label="Primary navigation">
        <a className="mobile-header-logo" href="#home" aria-label="HGS home">
          <img src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
        </a>
        <nav className="nav">
          {navItems.map((item) => (
            <a className={item.label === "Home" ? "active" : ""} href={item.href} key={item.label}>
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
              <a className={item.label === "Home" ? "active" : ""} href={item.href} key={item.label}>
                {item.label}
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
                <a className={`cta ${slide.accent}`} href={slide.cta === "Apply" ? "/career" : "#about"}>
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

      <section className="gallery-section" id="gallery" aria-label="HGS photo gallery">
        <div className="gallery-shell" aria-busy={isGalleryLoading}>
          <button className="gallery-arrow gallery-arrow-left" onClick={() => scrollGallery("previous")} type="button" aria-label="Previous gallery images">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>

          <div className="gallery-track" ref={galleryTrackRef} tabIndex={0}>
            <div className="gallery-mosaic">
              {galleryImages.map((image, index) => (
                <article className={`gallery-card gallery-card-${(index % 6) + 1}`} key={image.id} tabIndex={0}>
                  <img src={image.image_url} alt={image.image_alt} loading={index < 4 ? "eager" : "lazy"} decoding="async" />
                  <div className="gallery-caption">
                    <h2>{image.title}</h2>
                    <p>{image.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button className="gallery-arrow gallery-arrow-right" onClick={() => scrollGallery("next")} type="button" aria-label="Next gallery images">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Built for transport, warehouse, and delivery teams.</h2>
        </div>
        <div className="service-grid" aria-busy={isServicesLoading}>
          {apiServices.map((service) => (
            <article key={service.code}>
              <span aria-hidden="true">▰</span>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
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
        <a className="cta red" href="/career">Apply</a>
      </section>

      <section className="contact-section" id="contact" aria-label="HGS contact details">
        <div className="contact-details">
          <p className="eyebrow">Head Office</p>
          <p>Grand ITC Permata Hijau, Jl. Arteri Permata Hijau blok saphire No.19, RT.7/RW.10, Grogol Utara, Kec. Kby. Lama, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12210.</p>
          <p>
            <strong>Email :</strong> <a href="mailto:admin@hgs.co.id">admin@hgs.co.id</a><br />
            <strong>Phone :</strong> <a href="tel:+622153664200">(021)53664200</a> / <a href="tel:+6282114540078">+6282114540078</a><br />
            <strong>Whatsapp :</strong> <a href="https://wa.me/6282260580533">+62 822-6058-0533</a>
          </p>
        </div>
        <iframe
          className="contact-map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.323329807692!2d106.7826676!3d-6.221026599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1329e5ce641%3A0x49d62303d582d554!2sPT.%20Handal%20Guna%20Sarana!5e0!3m2!1sen!2sid!4v1779442399452!5m2!1sen!2sid"
          title="PT Handal Guna Sarana location map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
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
