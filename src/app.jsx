// Main App: TopNav + Intro hero + scrollable sections

const { useEffect, useRef, useState } = React;

function TopNav({ visible, current }) {
  const links = [
    { label: "About", id: "about" },
    { label: "Team", id: "team" },
    { label: "Careers", id: "careers" },
    { label: "News", id: "news" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <nav className="tc-nav" style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px",
      background: "rgba(250, 250, 247, 0.78)",
      backdropFilter: "saturate(140%) blur(10px)",
      WebkitBackdropFilter: "saturate(140%) blur(10px)",
      borderBottom: "1px solid var(--line)",
      zIndex: 50,
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : -8}px)`,
      transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
      pointerEvents: visible ? "auto" : "none",
    }}>
      <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M 6 14 Q 12 4, 18 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <span className="serif" style={{ fontSize: 22, fontStyle: "italic", letterSpacing: "-0.01em" }}>
          Top Crop
        </span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "var(--ink-3)", marginLeft: 8 }}>
          TANZANIA
        </span>
      </a>

      <div className="tc-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {links.map((l) => (
          <a key={l.id} href={`#${l.id}`} className="nav-link"
             style={{
               fontFamily: "var(--mono)", fontSize: 12,
               letterSpacing: ".14em", textTransform: "uppercase",
               color: "var(--ink-3)",
               position: "relative", padding: "6px 0",
             }}>
            {l.label}
            <span className="nav-link__line" style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              height: 1, background: "var(--ink)",
              transform: "scaleX(0)", transformOrigin: "left center",
              transition: "transform .35s cubic-bezier(.2,.7,.2,1)",
            }}/>
          </a>
        ))}
        <a className="tc-nav-cta" href="#contact" style={{
          marginLeft: 12,
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em",
          textTransform: "uppercase",
          padding: "10px 18px",
          border: "1px solid var(--ink)",
          color: "var(--ink)",
        }}>Get in touch →</a>
      </div>
    </nav>
  );
}

function App() {
  const [introProgress, setIntroProgress] = useState(0);
  const introDone = introProgress >= 0.995;
  const [activeSection, setActiveSection] = useState("about");

  // Track which section is currently in view
  useEffect(() => {
    const ids = ["intro", "about", "team", "careers", "news", "contact"];
    const handler = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      }
      setActiveSection(cur);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Section reveal on intersect
  useEffect(() => {
    const els = document.querySelectorAll(".sec-fade");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // In-page anchor navigation (top nav, footer, "Get in touch" button, etc.)
  // The default <a href="#id"> behaviour breaks while the intro is still
  // running: body.intro-locked sets overflow:hidden so the browser can't
  // scroll, the intro's wheel handler keeps re-locking it, and every section
  // is wrapped in .sec-fade with opacity:0 until IntersectionObserver fires.
  // Net effect for the user: clicking About/Team/Careers/etc. lands them on
  // a "blank section". So we hijack any anchor click, force the intro into
  // its released state, reveal the wrappers, and smooth-scroll explicitly.
  useEffect(() => {
    const onAnchorClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      // Hard-release the intro so further wheel events don't re-lock scroll.
      window.__forceIntroComplete && window.__forceIntroComplete();
      document.body.classList.remove("intro-locked");
      // Reveal every section wrapper so the target isn't hidden behind opacity:0.
      document.querySelectorAll(".sec-fade").forEach((w) => w.classList.add("in"));
      // Defer one frame so layout settles after class changes, then scroll.
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", href);
      });
    };
    document.addEventListener("click", onAnchorClick);
    return () => document.removeEventListener("click", onAnchorClick);
  }, []);

  // Nav visible once intro starts (after first wheel tick), and always after intro
  const navVisible = introProgress > 0.04 || introDone;

  return (
    <>
      <TopNav visible={navVisible} current={activeSection}/>

      <Intro onProgressChange={setIntroProgress} />

      {/* Sections sit below the intro section in normal document flow.
          When the intro animation completes, body scroll unlocks and the user simply
          scrolls down to the next section like any other. */}
      <main>
        <div className="sec-fade"><AboutSection/></div>
        <div className="sec-fade"><TeamSection/></div>
        <div className="sec-fade"><CareersSection/></div>
        <div className="sec-fade"><NewsSection/></div>
        <div className="sec-fade"><ContactSection/></div>
        <Footer/>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
