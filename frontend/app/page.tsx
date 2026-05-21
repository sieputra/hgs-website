const navItems = ["Home", "Careers", "Gallery", "Social Media", "About", "Contact", "FAQ-Kandidat"];

const slides = [
  {
    image: "/images/hero-training.svg",
    kicker: "PT Handal Guna Sarana",
    title: ["Simplify", "Complexity"],
    script: "your",
    scriptColor: "teal",
    body: "Our effort is to take your complexity so you can simply focus on your greatness.",
    cta: "Learn More",
    accent: "teal",
  },
  {
    image: "/images/hero-road.svg",
    kicker: "PT Handal Guna Sarana",
    title: ["Our", "Daily Job", "To Deliver", "goods"],
    script: "is",
    scriptColor: "amber",
    body: "Trucking - Warehouse - Last Mile Delivery - First Mile Delivery - Motorist - Distribution Center - E-Fulfillment.",
    cta: "Learn More",
    accent: "amber",
  },
  {
    image: "/images/hero-drivers.svg",
    kicker: "PT Handal Guna Sarana",
    title: ["To Drive", "Driver"],
    script: "you need",
    scriptColor: "red",
    body: "Drivers are the people who keep goods moving. Looking for a job? Come join us.",
    cta: "Apply",
    accent: "red",
  },
  {
    image: "/images/hero-warehouse.svg",
    kicker: "PT Handal Guna Sarana",
    title: ["Our service"],
    script: "are",
    scriptColor: "green",
    body: "Last/First Mile delivery, warehousing, motorist, distribution centre, and customized logistics projects.",
    cta: "Learn More",
    accent: "green",
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
  return (
    <main>
      <header className="site-header" aria-label="Primary navigation">
        <nav className="nav">
          {navItems.map((item) => (
            <a className={item === "Home" ? "active" : ""} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero-slider" id="home" aria-label="HGS company highlights">
        {slides.map((slide, index) => (
          <article className={`hero hero-${index + 1}`} id={`hero-slide-${index + 1}`} key={slide.image}>
            <div className="hero-media">
              <img className="brand-logo" src="/images/logo.jpeg" alt="HGS Simply to serve logo" />
              <img className="hero-image" src={slide.image} alt="" />
              <div className="socials" aria-label="Social media">
                <a href="#social-media" aria-label="Facebook">f</a>
                <a href="#social-media" aria-label="Instagram">◎</a>
                <a href="#social-media" aria-label="YouTube">▶</a>
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
        ))}
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
        <img src="/images/logo.jpeg" alt="HGS logo" />
        <div>
          <strong>PT Handal Guna Sarana</strong>
          <p>Grand ITC Permata Hijau, Jakarta Selatan</p>
        </div>
      </footer>
    </main>
  );
}
