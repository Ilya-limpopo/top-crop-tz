// Page sections: About, Team, Careers, News, Contacts + Footer
//
// All content (eyebrows, titles, bodies, members, vacancies, news cards,
// offices, socials) now reads from window.TOPCROP / window.NEWS_STORIES /
// window.JOBS, which the server injects into the page before this file
// loads. Layout, styling and animation are unchanged from the prototype.

const TOPCROP = window.TOPCROP || {};
const SITE = {
  about:   TOPCROP.about   || { eyebrow:"", title:"", subtitle:"", body:"", photos:[], facts:[] },
  team:    TOPCROP.team    || { eyebrow:"", title:"", description:"", members:[] },
  careers: TOPCROP.careers || { eyebrow:"", title:"", description:"", benefits:[] },
  news:    TOPCROP.news    || { eyebrow:"", title:"", description:"" },
  contact: TOPCROP.contact || { eyebrow:"", title:"", subtitle:"", offices:[] },
  socials: TOPCROP.socials || [],
};

// Tiny rich-text helper: turns *foo* into <em> and \n into <br/>.
// Optional emProps lets a callsite style the <em> (used for the
// leaf-coloured italic in the About body and the banana-coloured italic
// in the Contact title — both originally inline-styled in the prototype).
function rich(text, emProps) {
  if (text == null || text === "") return null;
  const lines = String(text).split("\n");
  const out = [];
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`}/>);
    line.split(/(\*[^*]+\*)/g).forEach((tok, ti) => {
      if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
        out.push(<em key={`em-${li}-${ti}`} {...(emProps || {})}>{tok.slice(1, -1)}</em>);
      } else if (tok) {
        out.push(tok);
      }
    });
  });
  return out;
}

const SectionHeader = ({ index, eyebrow, title, body }) => (
  <header style={{
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1fr) minmax(0, 3fr)",
    gap: 48,
    paddingBottom: 48,
    borderBottom: "1px solid var(--line)",
    marginBottom: 64,
    alignItems: "start",
  }}>
    <div>
      <div className="eyebrow">{`Section / ${index}`}</div>
      <div className="serif" style={{
        marginTop: 14, fontSize: 64, lineHeight: 0.95,
        fontStyle: "italic", color: "var(--leaf)",
      }}>{`0${parseInt(index, 10)}`}</div>
    </div>
    <div>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
      <h2 className="serif" style={{
        margin: 0, fontSize: "clamp(40px, 4.5vw, 64px)",
        lineHeight: 1.04, letterSpacing: "-0.01em",
        fontStyle: "italic", fontWeight: 400,
      }}>{title}</h2>
      {body && (
        <p style={{
          marginTop: 26, fontSize: 17, lineHeight: 1.6,
          color: "var(--ink-2)", maxWidth: 720,
        }}>{body}</p>
      )}
    </div>
  </header>
);

// ====== ABOUT ======
//
// The 5 photo slots have fixed grid placements baked into the layout
// (1 wide + 1 tall + 3 vertical — README §3.2). Only the URLs come from
// content; positions and aspect ratios stay here.
const ABOUT_PHOTO_LAYOUT = [
  { label: "PLANTATION · WIDE / 16:9",        style: { gridColumn: "1 / span 8", aspectRatio: "16/9" } },
  { label: "HARVEST · CLOSE-UP",              style: { gridColumn: "9 / span 4", height: "100%" } },
  { label: "LOGISTICS · DAR ES SALAAM PORT",  style: { gridColumn: "1 / span 4", aspectRatio: "4/5" } },
  { label: "WORKERS · FIELD",                 style: { gridColumn: "5 / span 4", aspectRatio: "4/5" } },
  { label: "PRECISION IRRIGATION",            style: { gridColumn: "9 / span 4", aspectRatio: "4/5" } },
];

function AboutSection() {
  const a = SITE.about;
  return (
    <section id="about" data-screen-label="01 About" style={sectionShell}>
      <SectionHeader
        index="1"
        eyebrow={a.eyebrow}
        title={rich(a.title)}
        body={rich(a.subtitle)}
      />

      <div data-tc="about-photos" style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 24,
        marginBottom: 64,
      }}>
        {ABOUT_PHOTO_LAYOUT.map((slot, i) => {
          const url = a.photos[i] && a.photos[i].url;
          return (
            <div key={slot.label} className="ph" data-label={slot.label}
                 style={{ ...slot.style, backgroundImage: url ? `url("${encodeURI(url)}")` : undefined }}/>
          );
        })}
      </div>

      <div data-tc="about-bottom" style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
        gap: 80, alignItems: "start",
      }}>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--ink)", margin: 0 }}>
          {rich(a.body, { className: "serif", style: { color: "var(--leaf)" } })}
        </p>

        <dl style={{
          margin: 0, padding: 0,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 24px",
        }}>
          {a.facts.map((f) => (
            <div key={f.label} style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <dt className="serif" style={{
                fontSize: 56, lineHeight: 1, fontStyle: "italic",
                color: "var(--ink)", letterSpacing: "-0.02em",
              }}>{f.number}</dt>
              <dd style={{
                margin: "10px 0 0", fontSize: 13, color: "var(--ink-3)",
                fontFamily: "var(--mono)", letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ====== TEAM ======
function TeamCard({ person, featured }) {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      data-tc-featured={featured ? "true" : "false"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: featured ? "span 2" : "span 1",
        gridRow: featured ? "span 2" : "span 1",
      }}
    >
      <div className="ph"
           data-label={`PORTRAIT · ${person.name.toUpperCase()}`}
           style={{
             aspectRatio: featured ? "1/1" : "3/4",
             marginBottom: 14,
             backgroundImage: person.photoUrl ? `url("${encodeURI(person.photoUrl)}")` : undefined,
             backgroundSize: "cover",
             backgroundPosition: "center top",
             filter: hover ? "none" : "grayscale(1) contrast(1.05)",
             transition: "filter .5s ease",
           }}/>
      <div style={{ marginTop: 0 }}>
        <h3 className="serif" style={{
          margin: 0, fontSize: featured ? 32 : 22, lineHeight: 1.1,
          fontStyle: "italic", fontWeight: 400,
        }}>{person.name}</h3>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-2)" }}>{person.role}</p>
    </article>
  );
}

function TeamSection() {
  const t = SITE.team;
  return (
    <section id="team" data-screen-label="02 Team" style={sectionShell}>
      <SectionHeader
        index="2"
        eyebrow={t.eyebrow}
        title={rich(t.title)}
        body={rich(t.description)}
      />

      <div data-tc="team-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "minmax(280px, auto)",
        gap: 28,
      }}>
        {t.members.map((p) => (
          <TeamCard key={p.id || p.name} person={p} featured={p.featured}/>
        ))}
      </div>

      <p style={{
        marginTop: 64, fontSize: 17, color: "var(--ink-2)",
        maxWidth: 640, fontStyle: "italic",
      }} className="serif">
        From the fields of Rufiji to our headquarters in Dar es Salaam, our departments
        work in perfect synergy to deliver the best of Tanzania to the world.
      </p>
    </section>
  );
}

// ====== CAREERS ======
function VacancyRow({ v, i }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={`/careers/${v.slug}`}
       data-tc="vacancy-row"
       onMouseEnter={() => setHover(true)}
       onMouseLeave={() => setHover(false)}
       style={{
         display: "grid",
         gridTemplateColumns: "60px minmax(0, 4fr) minmax(0, 3fr) 200px 28px",
         alignItems: "center",
         padding: "32px 16px",
         borderTop: i === 0 ? "1px solid var(--line)" : "none",
         borderBottom: "1px solid var(--line)",
         gap: 24,
         color: "var(--ink)",
         transition: "background .35s ease, box-shadow .35s ease",
         background: hover ? "var(--bg)" : "transparent",
         boxShadow: hover ? "inset 3px 0 0 var(--leaf)" : "inset 0 0 0 transparent",
       }}>
      <span className="mono" style={{
        fontSize: 11, letterSpacing: ".1em", color: "var(--ink-3)",
      }}>{v.code}</span>
      <div>
        <h3 className="serif" style={{
          margin: 0, fontSize: 28, lineHeight: 1.1,
          fontStyle: "italic", fontWeight: 400,
        }}>{v.title}</h3>
      </div>
      <p style={{
        margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.45,
      }}>{v.summary}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--ink-3)" }}>
          {v.location}
        </span>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--ink-3)" }}>
          {v.type}
        </span>
      </div>
      <span style={{
        fontSize: 22, color: "var(--ink)",
        transform: hover ? "translateX(4px)" : "translateX(0)",
        transition: "transform .3s ease",
      }}>→</span>
    </a>
  );
}

function CareersSection() {
  const c = SITE.careers;
  // Source vacancies from window.JOBS — same dataset that powers Job Posting.html.
  const VACANCIES = Object.entries(window.JOBS || {}).map(([slug, j]) => ({
    slug, code: j.code, title: j.title, location: j.location, type: j.type, summary: j.summary,
  }));

  return (
    <section id="careers" data-screen-label="03 Careers"
             style={{ ...sectionShell, background: "var(--bg-warm)" }}>
      <SectionHeader
        index="3"
        eyebrow={c.eyebrow}
        title={rich(c.title)}
        body={rich(c.description)}
      />

      <div data-tc="benefits-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 24, marginBottom: 80,
      }}>
        {c.benefits.map((b, i) => (
          <div key={b.title} style={{
            borderTop: "1px solid var(--line-strong)", paddingTop: 18,
          }}>
            <div className="mono" style={{
              fontSize: 11, color: "var(--ink-3)", letterSpacing: ".1em",
              marginBottom: 10,
            }}>{`0${i + 1}`}</div>
            <h4 className="serif" style={{
              margin: "0 0 10px", fontSize: 24, lineHeight: 1.1,
              fontStyle: "italic", fontWeight: 400,
            }}>{b.title}</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>{b.body}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h3 className="serif" style={{
          margin: 0, fontSize: 36, fontStyle: "italic", fontWeight: 400,
        }}>Current vacancies</h3>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--ink-3)" }}>
          {`${VACANCIES.length} OPEN ROLES · UPDATED MAY 2026`}
        </span>
      </div>

      <div>
        {VACANCIES.map((v, i) => <VacancyRow key={v.code} v={v} i={i}/>)}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <a href="All Openings.html" className="mono" style={{
          fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase",
          borderBottom: "1px solid var(--ink)", paddingBottom: 4,
        }}>View all openings →</a>
      </div>
    </section>
  );
}

// ====== NEWS ======
function NewsCard({ n, large }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={`/news/${n.slug}`}
       onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
       style={{
         gridColumn: large ? "span 2" : "span 1",
         display: "block", color: "var(--ink)",
       }}>
      <div className="ph" data-label={n.img} style={{
        aspectRatio: large ? "16/9" : "4/3",
        marginBottom: 18,
        transform: hover ? "scale(1.005)" : "scale(1)",
        transition: "transform .6s ease",
        backgroundImage: n.photo ? `url("${encodeURI(n.photo)}")` : undefined,
      }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span className="mono" style={{
          fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--leaf)",
        }}>{n.tag}</span>
        <span className="mono" style={{
          fontSize: 11, letterSpacing: ".1em", color: "var(--ink-3)",
        }}>{n.date}</span>
      </div>
      <h3 className="serif" style={{
        margin: 0, fontSize: large ? 36 : 24, lineHeight: 1.15,
        fontStyle: "italic", fontWeight: 400,
        textWrap: "pretty",
      }}>{n.title}</h3>
      <span style={{
        display: "inline-block", marginTop: 16,
        fontSize: 12, fontFamily: "var(--mono)",
        letterSpacing: ".18em", textTransform: "uppercase",
        borderBottom: "1px solid currentColor", paddingBottom: 2,
        transform: hover ? "translateX(3px)" : "translateX(0)",
        transition: "transform .3s ease",
      }}>Read story →</span>
    </a>
  );
}

function NewsSection() {
  const ns = SITE.news;
  // Source the home-page news cards from window.NEWS_STORIES — same dataset
  // that powers News Article.html and All News.html.
  const NEWS = Object.entries(window.NEWS_STORIES || {}).map(([slug, s]) => ({
    slug,
    tag: s.tag,
    title: s.title,
    date: s.date,
    photo: s.photo,
    img: `PHOTO · ${(s.tag || "").toUpperCase()}`,
  }));

  return (
    <section id="news" data-screen-label="04 News" style={sectionShell}>
      <SectionHeader
        index="4"
        eyebrow={ns.eyebrow}
        title={rich(ns.title)}
        body={rich(ns.description)}
      />

      <div data-tc="news-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
        gap: 36,
      }}>
        {NEWS[0] && <NewsCard n={NEWS[0]} large/>}
        {NEWS.slice(1).map((n) => <NewsCard key={n.slug} n={n}/>)}
      </div>

      <div style={{ marginTop: 56, textAlign: "center" }}>
        <a href="All News.html" className="mono" style={{
          fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase",
          borderBottom: "1px solid var(--ink)", paddingBottom: 4,
        }}>Previous news →</a>
      </div>
    </section>
  );
}

// ====== CONTACTS ======
function ContactSection() {
  const ct = SITE.contact;
  const [form, setForm] = React.useState({ name: "", email: "", company: "", topic: "Partnership", message: "" });
  const [sent, setSent] = React.useState(false);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ name: "", email: "", company: "", topic: "Partnership", message: "" }); }, 4000);
  };

  const inputStyle = {
    width: "100%", padding: "16px 0", border: "none",
    borderBottom: "1px solid #4a4a44", background: "transparent",
    fontFamily: "var(--sans)", fontSize: 17, color: "#F2EFE3",
    outline: "none",
    caretColor: "var(--banana)",
  };
  const labelStyle = {
    fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em",
    textTransform: "uppercase", color: "var(--ink-3)",
  };

  return (
    <section id="contact" data-screen-label="05 Contact"
             style={{ background: "var(--ink)", color: "#F2EFE3", padding: "120px 0", width: "100%" }}>
      <div style={{ maxWidth: 1480, margin: "0 auto", padding: "0 56px" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(0, 3fr)",
        gap: 48, paddingBottom: 48, marginBottom: 64,
        borderBottom: "1px solid #2a2a26",
      }}>
        <div>
          <div className="eyebrow" style={{ color: "#9C9C92" }}>Section / 5</div>
          <div className="serif" style={{
            marginTop: 14, fontSize: 64, lineHeight: 0.95,
            fontStyle: "italic", color: "var(--banana)",
          }}>05</div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: "#9C9C92", marginBottom: 14 }}>{ct.eyebrow}</div>
          <h2 className="serif" style={{
            margin: 0, fontSize: "clamp(40px, 4.5vw, 64px)",
            lineHeight: 1.04, letterSpacing: "-0.01em",
            fontStyle: "italic", fontWeight: 400, color: "#F2EFE3",
          }}>{rich(ct.title, { style: { color: "var(--banana)" } })}</h2>
          <p style={{ marginTop: 26, fontSize: 17, lineHeight: 1.6, color: "#C9C5B6", maxWidth: 720 }}>
            {rich(ct.subtitle)}
          </p>
        </div>
      </div>

      <div data-tc="contact-body" style={{
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
        gap: 80,
      }}>
        {/* LEFT — addresses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {ct.offices.map((a) => (
            <div key={a.label} style={{ borderTop: "1px solid #2a2a26", paddingTop: 18 }}>
              <div className="mono" style={{
                fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase",
                color: "#9C9C92", marginBottom: 10,
              }}>{a.label}</div>
              <div className="serif" style={{
                fontSize: 26, fontStyle: "italic", lineHeight: 1.2, color: "#F2EFE3",
              }}>{a.headline}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#C9C5B6" }}>{a.contact}</div>
            </div>
          ))}
        </div>

        {/* RIGHT — form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div data-tc="contact-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <label>
              <span style={labelStyle}>01 — Your name</span>
              <input style={inputStyle} value={form.name} onChange={update("name")} placeholder="Full name" required/>
            </label>
            <label>
              <span style={labelStyle}>02 — Email</span>
              <input style={inputStyle} type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required/>
            </label>
          </div>
          <div data-tc="contact-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <label>
              <span style={labelStyle}>03 — Company (optional)</span>
              <input style={inputStyle} value={form.company} onChange={update("company")} placeholder="Organisation"/>
            </label>
            <label>
              <span style={labelStyle}>04 — Topic</span>
              <select style={{ ...inputStyle, appearance: "none", backgroundImage: "linear-gradient(45deg, transparent 50%, #C9C5B6 50%), linear-gradient(135deg, #C9C5B6 50%, transparent 50%)", backgroundPosition: "calc(100% - 12px) 26px, calc(100% - 6px) 26px", backgroundSize: "6px 6px, 6px 6px", backgroundRepeat: "no-repeat" }}
                      value={form.topic} onChange={update("topic")}>
                <option style={{ color: "#000" }}>Partnership</option>
                <option style={{ color: "#000" }}>Distribution & Export</option>
                <option style={{ color: "#000" }}>Careers</option>
                <option style={{ color: "#000" }}>Press</option>
                <option style={{ color: "#000" }}>Other</option>
              </select>
            </label>
          </div>
          <label>
            <span style={labelStyle}>05 — Message</span>
            <textarea rows={4} style={{ ...inputStyle, resize: "vertical", paddingTop: 16 }}
                      value={form.message} onChange={update("message")}
                      placeholder="Tell us about your inquiry…" required/>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "#9C9C92" }}>
              We respond within two business days.
            </span>
            <button type="submit" style={{
              border: "1px solid #F2EFE3", background: sent ? "var(--banana)" : "transparent",
              color: sent ? "var(--ink)" : "#F2EFE3", padding: "16px 32px",
              fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".2em",
              textTransform: "uppercase", cursor: "pointer",
              transition: "all .35s ease",
            }}
              onMouseEnter={(e) => { if (!sent) { e.currentTarget.style.background = "#F2EFE3"; e.currentTarget.style.color = "var(--ink)"; } }}
              onMouseLeave={(e) => { if (!sent) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#F2EFE3"; } }}
            >
              {sent ? "✓  Message sent" : "Send message →"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
}

// ====== FOOTER ======
function Footer() {
  return (
    <footer data-tc="footer" style={{
      background: "var(--ink)", color: "#9C9C92",
      padding: "60px 56px 40px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      borderTop: "1px solid #2a2a26",
      flexWrap: "wrap", gap: 24,
    }}>
      <div className="serif" style={{ fontSize: 96, lineHeight: 0.9, color: "#F2EFE3", fontStyle: "italic" }}>
        Top<br/>Crop.
      </div>
      <div style={{ display: "flex", gap: 64, fontSize: 13 }}>
        <div>
          <div className="mono" style={{ color: "#6A6A64", letterSpacing: ".14em", fontSize: 10, marginBottom: 8 }}>SITE</div>
          {["About", "Team", "Careers", "News", "Contact"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ display: "block", color: "#C9C5B6", padding: "4px 0" }}>{l}</a>
          ))}
        </div>
        <div>
          <div className="mono" style={{ color: "#6A6A64", letterSpacing: ".14em", fontSize: 10, marginBottom: 8 }}>SOCIAL</div>
          {SITE.socials.map((s) => (
            <a key={s.platform} href={s.url || "#"} style={{ display: "block", color: "#C9C5B6", padding: "4px 0" }}>{s.platform}</a>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: ".1em", color: "#6A6A64" }}>
        © 2026 Top Crop Tanzania Limited<br/>
        A flagship investment of D43 · Dubai
      </div>
    </footer>
  );
}

// shared
const sectionShell = {
  padding: "120px 56px",
  maxWidth: 1480, margin: "0 auto",
};

Object.assign(window, { AboutSection, TeamSection, CareersSection, NewsSection, ContactSection, Footer });
