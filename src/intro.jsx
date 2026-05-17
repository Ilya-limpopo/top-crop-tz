// Intro: scroll-hijacked stage with closed box → opening → bananas rise → zoom + 360° rotate
// 3 cross-fading copy panels track the animation.

const { useEffect, useRef, useState, useMemo } = React;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Returns 0..1 opacity for a panel that fades in over [a,b], stays 1 over [b,c], fades out [c,d]
function bandOpacity(p, a, b, c, d) {
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
}

// Captions and video URL come from window.TOPCROP.intro, injected into the
// page by the server. Empty fallbacks keep the file syntactically valid if
// the payload ever fails to load — the animation will still play, captions
// will just be blank.
const INTRO_DATA = (window.TOPCROP && window.TOPCROP.intro) || { videoUrl: "", captions: [] };
const FACTS = INTRO_DATA.captions.length
  ? INTRO_DATA.captions
  : [{ eyebrow: "", title: "", body: "" },
     { eyebrow: "", title: "", body: "" },
     { eyebrow: "", title: "", body: "" }];
const INTRO_VIDEO_URL = INTRO_DATA.videoUrl || "uploads/Banana_box.mp4";

// Scroll prompt indicator
function ScrollHint({ visible, label = "Scroll to begin" }) {
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: 36, transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      opacity: visible ? 1 : 0, transition: "opacity .5s ease",
      pointerEvents: "none", zIndex: 30,
    }}>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em",
        textTransform: "uppercase", color: "var(--ink-3)",
      }}>{label}</span>
      <div style={{
        width: 1, height: 36, background: "var(--ink-3)",
        animation: "scrollHintLine 1.6s ease-in-out infinite",
        transformOrigin: "top",
      }}/>
      <style>{`
        @keyframes scrollHintLine {
          0%   { transform: scaleY(0); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Step indicator — 4 dots: closed / fact1 / fact2 / fact3
function StepDots({ progress }) {
  const stops = [0.00, 0.18, 0.50, 0.85];
  return (
    <div data-tc="step-dots" style={{
      position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
      display: "flex", flexDirection: "column", gap: 14, zIndex: 30,
    }}>
      {stops.map((s, i) => {
        const active = progress >= s - 0.02;
        const current = progress >= s - 0.02 && (i === stops.length - 1 || progress < stops[i + 1] - 0.02);
        return (
          <span key={i} style={{
            width: current ? 22 : 8, height: 1.5,
            background: active ? "var(--ink)" : "var(--line-strong)",
            transition: "all .5s ease",
          }}/>
        );
      })}
    </div>
  );
}

// Video scene — minimal, scroll-driven.
// Forward (delta > 0): play() at a rate scaled to scroll velocity. We do NOT
//   try to sync currentTime to the scroll target — every "drift seek" we tried
//   ended up snapping to a keyframe, which is what caused the video to jump to
//   the start mid-animation.
// Backward (delta < 0): pause and step currentTime down in small increments
//   each RAF. The browser draws each step.
// Idle: pause, hold last frame.
function VideoScene({ progress, videoStateRef }) {
  const videoRef = useRef(null);
  const targetRef = useRef(0);
  const lastTargetRef = useRef(0);
  const lastMoveRef = useRef(0);

  useEffect(() => { targetRef.current = clamp(progress); }, [progress]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();

    let raf;
    let lastTick = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;
      const dur = v.duration;
      if (dur && isFinite(dur)) {
        // Expose live video state to parent so it can throttle scroll progress
        if (videoStateRef) {
          videoStateRef.current = { time: v.currentTime, duration: dur };
        }
        const cur = targetRef.current;
        const last = lastTargetRef.current;
        const delta = cur - last;
        if (Math.abs(delta) > 0.0001) lastMoveRef.current = now;
        lastTargetRef.current = cur;

        const movingForward  = delta >  0.0002;
        const movingBackward = delta < -0.0002;
        const idleFor = now - lastMoveRef.current;

        const tgtT = cur * dur;
        const curT = v.currentTime;

        if (movingForward) {
          // If we've already played past the scroll target, stop and hold.
          if (curT >= tgtT - 0.02) {
            if (!v.paused) v.pause();
          } else {
            // Play forward at 1x — playback time tracks scroll progress 1:1.
            v.playbackRate = 1;
            if (v.paused) {
              const p = v.play();
              if (p && p.catch) p.catch(() => {});
            }
          }
        } else if (movingBackward) {
          if (!v.paused) v.pause();
          // Walk currentTime backward at 1 sec of video per 1 sec of wall time
          // (matches forward 1x rate). Doesn't overshoot the target.
          const newT = Math.max(tgtT, curT - dt);
          if (newT < curT) {
            try { v.currentTime = newT; } catch {}
          }
        } else if (idleFor > 80) {
          // Idle: pause to hold the current frame
          if (!v.paused) v.pause();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "grid", placeItems: "center",
      background: "var(--bg)",
    }}>
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        style={{
          width: "100%", height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// Legacy SVG scene — kept for fallback; not currently rendered
function BananaScene({ progress }) {
  // Stage A: opening — flaps rotate outward over 0.04 → 0.22
  const openT  = clamp((progress - 0.04) / 0.18);
  // Stage B: banana bunch rises out of box — 0.32 → 0.55
  const riseT  = easeOut(clamp((progress - 0.32) / 0.23));
  // Stage C: zoom-in — 0.62 → 0.78
  const zoomT  = ease(clamp((progress - 0.62) / 0.16));
  // Stage C: full 360° rotation around vertical axis — 0.70 → 1.0
  const rotT   = clamp((progress - 0.70) / 0.30);

  const flapOpen = lerp(0, 118, easeOut(openT)); // degrees
  const lidShadow = lerp(0, 0.55, openT);

  // Bananas hover then ascend slightly more during rotation phase.
  // Base Y is 540 (inside box, hidden by clip-path). Goes to 540-310=230 → fully revealed above rim.
  const bunchY = lerp(0, -310, riseT) + lerp(0, -20, zoomT);
  const bunchScale = lerp(0.75, 1, riseT);

  // Camera: zoom in towards bunch during stage C
  const cameraScale = lerp(1, 1.45, zoomT);
  const cameraY = lerp(0, 60, zoomT); // shift down so bunch sits centered when zoomed

  // Vertical-axis rotation: simulate via scaleX + slight skew. 0 → 1 → 0 → -1 → 0 over 360°
  const angle = rotT * 360;
  const rad = (angle * Math.PI) / 180;
  const bunchScaleX = Math.cos(rad);     // -1..1
  const showBack = Math.cos(rad) < 0;    // when scaleX < 0 we are "behind" — flip a darker version

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "grid", placeItems: "center",
      perspective: "1400px",
    }}>
      <svg
        viewBox="0 0 800 800"
        style={{
          width: "min(78vh, 78vw)", height: "min(78vh, 78vw)",
          transform: `translateY(${cameraY}px) scale(${cameraScale})`,
          transformOrigin: "50% 42%",
          transition: "transform .05s linear",
        }}
      >
        <defs>
          <linearGradient id="card-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D4AE7A"/>
            <stop offset="1" stopColor="#B68C55"/>
          </linearGradient>
          <linearGradient id="card-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B58A55"/>
            <stop offset="1" stopColor="#8E6A3A"/>
          </linearGradient>
          <linearGradient id="card-flap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E2BD83"/>
            <stop offset="1" stopColor="#C29B5E"/>
          </linearGradient>
          <linearGradient id="banana-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4D575"/>
            <stop offset="0.55" stopColor="#E8BE45"/>
            <stop offset="1" stopColor="#B98D1F"/>
          </linearGradient>
          <linearGradient id="banana-fill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9A847"/>
            <stop offset="1" stopColor="#8C6B19"/>
          </linearGradient>
          <radialGradient id="box-inside" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="#3A2A14"/>
            <stop offset="1" stopColor="#1A1208"/>
          </radialGradient>
          {/* Hides anything below the box rim — bunch lives inside box until it rises */}
          <clipPath id="above-rim">
            <rect x="-200" y="-200" width="1200" height="586"/>
          </clipPath>
          <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
            <feOffset dx="0" dy="6"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Soft floor shadow */}
        <ellipse cx="400" cy="640" rx={200 - riseT * 30} ry={14 + riseT * 4}
          fill="#000" opacity={0.16 - riseT * 0.04}/>

        {/* === BOX === */}
        <g>
          {/* Right side (depth) */}
          <path d="M 590 410 L 640 380 L 640 600 L 590 630 Z" fill="url(#card-side)"/>
          {/* Front face */}
          <rect x="220" y="410" width="370" height="220" fill="url(#card-front)"/>
          {/* Top edge (back rim) — only visible when open */}
          <path d="M 220 410 L 270 380 L 640 380 L 590 410 Z"
                fill="#7A5A2E" opacity={openT > 0.05 ? 1 : 0}/>
          {/* Inside (dark void) — appears as flaps open */}
          <path d="M 232 408 L 280 384 L 632 384 L 580 408 Z"
                fill="url(#box-inside)" opacity={openT}/>

          {/* Top stamp / label on front face */}
          <g opacity="0.85">
            <rect x="260" y="448" width="120" height="2" fill="#6E5532" opacity="0.4"/>
            <text x="260" y="478" fontFamily="ui-monospace, monospace" fontSize="14"
                  letterSpacing="2" fill="#5A3F18" opacity="0.9">TOP CROP</text>
            <text x="260" y="500" fontFamily="ui-monospace, monospace" fontSize="9"
                  letterSpacing="1.6" fill="#5A3F18" opacity="0.55">PREMIUM CAVENDISH · 18.5 KG</text>
            <text x="260" y="514" fontFamily="ui-monospace, monospace" fontSize="9"
                  letterSpacing="1.6" fill="#5A3F18" opacity="0.55">RUFIJI / TANZANIA · D43</text>
            {/* small logo mark */}
            <g transform="translate(540 470)">
              <circle r="22" fill="none" stroke="#5A3F18" strokeWidth="1.2" opacity="0.6"/>
              <path d="M -10 6 Q -2 -10 10 -6" fill="none" stroke="#5A3F18" strokeWidth="1.6" opacity="0.75"/>
            </g>
          </g>

          {/* Tape seam down middle when closed, fades as it opens */}
          <rect x="403" y="380" width="4" height="30" fill="#9C7848" opacity={1 - openT}/>

          {/* === FLAPS === pivots at top-back of box */}
          {/* Left flap: pivots at left-back corner (270, 380), opens up-left */}
          <g transform={`translate(270 380) rotate(${-flapOpen})`} style={{ transformBox: "fill-box" }}>
            <rect x="0" y="-8" width="186" height="14" fill="url(#card-flap)" stroke="#8E6A3A" strokeWidth="0.5"/>
            {/* underside hint */}
            <rect x="0" y="-12" width="186" height="4" fill="#A07E4A" opacity={openT}/>
          </g>
          {/* Right flap: pivots at right-back corner (640, 380), opens up-right */}
          <g transform={`translate(640 380) rotate(${flapOpen})`}>
            <rect x="-186" y="-8" width="186" height="14" fill="url(#card-flap)" stroke="#8E6A3A" strokeWidth="0.5"/>
            <rect x="-186" y="-12" width="186" height="4" fill="#A07E4A" opacity={openT}/>
          </g>
        </g>

        {/* === BANANA BUNCH === clipped to above rim so it's invisible inside the closed box */}
        <g clipPath="url(#above-rim)">
          <g transform={`translate(400 ${540 + bunchY}) scale(${bunchScale})`}>
            {/* The whole bunch flips horizontally for vertical-axis rotation simulation */}
            <g transform={`scale(${Math.max(0.06, Math.abs(bunchScaleX))} 1)`}>
              <Bunch back={showBack}/>
            </g>
          </g>
        </g>
        {/* shadow below bunch when hovering — on the ground, not clipped */}
        <ellipse
          cx="400"
          cy={lerp(620, 470, riseT)}
          rx={lerp(70, 56, riseT) * Math.max(0.3, Math.abs(bunchScaleX))}
          ry={5}
          fill="#000"
          opacity={0.16 * riseT}
        />
      </svg>
    </div>
  );
}

function Bunch({ back }) {
  const fill = back ? "url(#banana-fill-back)" : "url(#banana-fill)";
  const stroke = back ? "#7A5A18" : "#9E771E";
  // 5 banana fingers fanned around a crown
  return (
    <g>
      {/* Crown / stem */}
      <path d="M -10 -120 Q 0 -140, 10 -120 Q 14 -100, 8 -90 Q 0 -82, -8 -90 Q -14 -100, -10 -120 Z"
            fill="#5C3F1A" stroke="#3A2810" strokeWidth="1"/>
      <path d="M -2 -125 Q 0 -150, 2 -125" stroke="#3A2810" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Back-row bananas (slightly darker) */}
      <g opacity="0.92">
        <Banana x={-26} y={-86} rot={-18} scale={0.95} fill={fill} stroke={stroke}/>
        <Banana x={26} y={-86} rot={18} scale={0.95} fill={fill} stroke={stroke}/>
      </g>
      {/* Mid */}
      <Banana x={-46} y={-78} rot={-32} scale={1.04} fill={fill} stroke={stroke}/>
      <Banana x={46} y={-78} rot={32} scale={1.04} fill={fill} stroke={stroke}/>
      {/* Front center */}
      <Banana x={0} y={-90} rot={0} scale={1.1} fill={fill} stroke={stroke}/>
    </g>
  );
}

function Banana({ x, y, rot, scale, fill, stroke }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      {/* Body — curved finger pointing down */}
      <path d="
        M 0 0
        C -8 8, -16 30, -14 60
        C -12 92, -2 118, 14 122
        C 22 124, 28 120, 28 112
        C 22 110, 12 104, 6 86
        C 0 66, 2 38, 10 18
        C 14 8, 10 0, 0 0 Z"
        fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round"/>
      {/* highlight */}
      <path d="M -4 14 C -10 36, -10 70, -4 92" fill="none" stroke="#FFF3C8" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round"/>
      {/* tip */}
      <circle cx="20" cy="120" r="2.2" fill="#5A3F18"/>
    </g>
  );
}

function FactPanel({ fact, opacity }) {
  return (
    <div data-tc="fact-panel" style={{
      position: "absolute", left: "50%", bottom: "10%",
      transform: "translateX(-50%)",
      width: "min(720px, 86vw)",
      textAlign: "center",
      opacity,
      transition: "opacity .55s ease",
      pointerEvents: "none",
      padding: "32px 44px 36px",
      background: "rgba(250, 250, 247, 0.42)",
      backdropFilter: "saturate(130%) blur(8px)",
      WebkitBackdropFilter: "saturate(130%) blur(8px)",
      border: "1px solid rgba(22, 22, 20, 0.05)",
      borderRadius: 24,
      boxShadow: "0 16px 50px -24px rgba(22, 22, 20, 0.12)",
    }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{fact.eyebrow}</div>
      <h2 className="serif" style={{
        margin: "0 0 18px",
        fontSize: "clamp(40px, 6vw, 76px)",
        lineHeight: 1.02,
        letterSpacing: "-0.01em",
        fontStyle: "italic",
        color: "var(--ink)",
      }}>{fact.title}</h2>
      <p style={{
        margin: 0, fontSize: 16, lineHeight: 1.55,
        color: "var(--ink-2)", maxWidth: 560, marginInline: "auto",
      }}>{fact.body}</p>
    </div>
  );
}

function Intro({ onProgressChange }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0); // 0..4 — 4 = released
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const stepRef = useRef(0);
  const lastWheelTsRef = useRef(0);
  const wheelIdleRef = useRef(true);
  const rafRef = useRef(0);
  const videoStateRef = useRef({ time: 0, duration: 0 });

  // Discrete step model:
  //   step 0 → progress 0      (closed box, no caption)
  //   step 1 → progress 0.34   (first 1/3 of video, caption 1)
  //   step 2 → progress 0.67   (second 1/3, caption 2)
  //   step 3 → progress 1.0    (final 1/3, caption 3)
  //   step 4 → release scroll, captions gone, page proceeds to About
  //
  // Each wheel "gesture" advances exactly one step. A gesture is a burst of
  // wheel events; consecutive events within 60ms are coalesced.
  useEffect(() => {
    document.body.classList.add("intro-locked");

    const STEP_PROGRESS = [0, 0.34, 0.67, 1.0, 1.0];

    const setStepRef = (n) => {
      const clamped = Math.max(0, Math.min(4, n));
      stepRef.current = clamped;
      setStep(clamped);
      targetRef.current = STEP_PROGRESS[clamped];
      if (clamped >= 4) {
        document.body.classList.remove("intro-locked");
        // When the intro releases, smooth-scroll to the next section so the
        // user doesn't have to swipe a second time on mobile. The scroll
        // behaviour is skipped if the user is already past the intro
        // (e.g. they triggered release via an in-page anchor click).
        const about = document.getElementById("about");
        if (about && window.scrollY <= 4) {
          // Defer one frame so the unlock takes effect before scrolling.
          requestAnimationFrame(() => about.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
      } else {
        document.body.classList.add("intro-locked");
        window.scrollTo(0, 0);
      }
    };

    const advance = (dir) => {
      // Only enforce "video must finish this step's slice" when going FORWARD,
      // and only for the intermediate steps (0->1, 1->2, 2->3) where the
      // current caption's video slice still needs to play. The final step
      // (3->4 release) must ALWAYS work — otherwise on mobile, where the
      // video may not have settled exactly on the threshold by the time the
      // user swipes, the user gets stuck unable to reach the About section.
      const cur = stepRef.current;
      if (dir > 0 && cur < 3) {
        const dur = videoStateRef.current.duration;
        const vt = videoStateRef.current.time;
        const stepTime = STEP_PROGRESS[cur] * (dur || 0);
        const settled = !dur || vt >= stepTime - 0.25;
        if (!settled) return;
      }
      const now = performance.now();
      if (now - lastWheelTsRef.current < 300) return;
      lastWheelTsRef.current = now;
      setStepRef(stepRef.current + dir);
    };

    const onWheel = (e) => {
      const cur = stepRef.current;
      const atTop = window.scrollY <= 4;

      if (cur < 4) {
        e.preventDefault();
        if (e.deltaY > 0) advance(+1);
        else if (e.deltaY < 0) advance(-1);
        return;
      }
      // Released. Defensive: make sure body is unlocked.
      document.body.classList.remove("intro-locked");
      // At top, wheeling up replays from step 3.
      if (atTop && e.deltaY < 0) {
        e.preventDefault();
        advance(-1);
      }
    };

    const onKey = (e) => {
      const cur = stepRef.current;
      const atTop = window.scrollY <= 1;
      if (cur < 4 && ["ArrowDown", "PageDown", "Space"].includes(e.code)) {
        e.preventDefault(); advance(+1);
      }
      if ((cur < 4 || atTop) && ["ArrowUp", "PageUp"].includes(e.code)) {
        e.preventDefault(); advance(-1);
      }
    };

    let touchY = null;
    let touchAccum = 0;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; touchAccum = 0; };
    const onTouchMove = (e) => {
      if (touchY == null) return;
      const cur = stepRef.current;
      const atTop = window.scrollY <= 1;
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      touchAccum += dy;
      if (cur < 4) e.preventDefault();
      // Lower threshold on touch makes mobile feel responsive (was 40px).
      if (Math.abs(touchAccum) > 25) {
        if (cur < 4 || (atTop && touchAccum < 0)) {
          advance(touchAccum > 0 ? +1 : -1);
          touchAccum = 0;
        }
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    // Allow other components (TopNav anchor clicks, footer links) to bypass
    // the scroll-hijack and jump straight to the released state. Without this
    // the intro keeps re-adding `body.intro-locked` on the next wheel tick.
    window.__forceIntroComplete = () => setStepRef(4);

    // Smooth lerp from current progress to step target, but capped so progress
    // never outruns actual video playback (video plays at 1x). Combined, this
    // makes each step play exactly 1/3 of the video before the next click.
    const tick = () => {
      const tgt = targetRef.current;
      const cur = progressRef.current;
      const vs = videoStateRef.current;
      let ceiling = tgt;
      if (vs.duration > 0) {
        const videoNorm = vs.time / vs.duration;
        ceiling = Math.min(tgt, videoNorm + 0.04);
      }
      const next = cur + (ceiling - cur) * 0.10;
      progressRef.current = next;
      setProgress(next);
      onProgressChange?.(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(rafRef.current);
      document.body.classList.remove("intro-locked");
    };
  }, [onProgressChange]);

  // Captions tied to step (not to continuous progress) — discrete fades
  const op1 = step === 1 ? 1 : 0;
  const op2 = step === 2 ? 1 : 0;
  const op3 = step === 3 ? 1 : 0;

  const sceneOpacity = 1;

  return (
    <section
      id="intro"
      data-screen-label="00 Intro"
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid lines for sophistication */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "calc(100%/12) 100%",
        pointerEvents: "none",
        opacity: 0.6,
      }}/>

      {/* Top hairline under nav */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 80,
        height: 1, background: "var(--line)",
        opacity: progress > 0.04 ? 1 : 0,
        transition: "opacity .6s ease",
      }}/>

      {/* Scene */}
      <div style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}>
        <VideoScene progress={progress} videoStateRef={videoStateRef}/>
      </div>

      {/* Fact panels */}
      <FactPanel fact={FACTS[0]} opacity={op1}/>
      <FactPanel fact={FACTS[1]} opacity={op2}/>
      <FactPanel fact={FACTS[2]} opacity={op3}/>

      {/* Side step indicator after first scroll */}
      <div style={{ opacity: progress > 0.03 ? 1 : 0, transition: "opacity .6s ease" }}>
        <StepDots progress={progress}/>
      </div>

      {/* Initial "Scroll to begin" hint, fades after first interaction */}
      <ScrollHint visible={step === 0}/>

      {/* End hint — "keep scrolling to next section" */}
      <div style={{
        position: "absolute", left: "50%", bottom: 28, transform: "translateX(-50%)",
        opacity: step >= 3 ? 0.8 : 0,
        transition: "opacity .4s ease",
        fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em",
        textTransform: "uppercase", color: "var(--ink-3)",
        pointerEvents: "none",
      }}>Continue to About ↓</div>
    </section>
  );
}

window.Intro = Intro;
