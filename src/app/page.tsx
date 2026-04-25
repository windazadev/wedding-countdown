"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WEDDING_DATE, PROPOSAL_DATE,
  getDailyQuote, getTimeLeft, getDaysSince, pad,
} from "@/lib/utils";

/* ─── types ─────────────────────────────────────── */
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; total: number; }
interface Particle { id: number; x: number; size: number; duration: number; delay: number; char: string; }

/* ─── Botanical SVG corner ornaments ─────────────── */
function Ornament({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const flip = pos === "tr" || pos === "br" ? "scale(-1,1)" : "";
  const flipY = pos === "bl" || pos === "br" ? "scale(1,-1)" : "";
  const transform = `${flip} ${flipY}`.trim() || undefined;
  const corner: Record<string, string> = {
    tl: "top-0 left-0", tr: "top-0 right-0",
    bl: "bottom-0 left-0", br: "bottom-0 right-0",
  };
  return (
    <div className={`absolute ${corner[pos]} pointer-events-none overflow-hidden`}
      style={{ width: "clamp(110px,22vw,200px)", height: "clamp(110px,22vw,200px)" }}
      aria-hidden>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ transform, width: "100%", height: "100%", opacity: 0.18 }}>
        <path d="M10,190 Q10,10 190,10" stroke="#c9a96e" strokeWidth="0.6" fill="none"/>
        <path d="M30,190 Q30,30 190,30" stroke="#c9a96e" strokeWidth="0.4" fill="none"/>
        {/* stems */}
        <path d="M10,100 Q40,80 60,50 Q70,35 65,15" stroke="#c9a96e" strokeWidth="0.8" fill="none"/>
        <path d="M10,140 Q50,120 80,90 Q95,75 90,50" stroke="#c9a96e" strokeWidth="0.6" fill="none"/>
        <path d="M60,190 Q80,150 100,120 Q115,100 110,70" stroke="#c9a96e" strokeWidth="0.6" fill="none"/>
        {/* leaves */}
        <ellipse cx="65" cy="22" rx="8" ry="14" fill="#c9a96e" transform="rotate(-40 65 22)" opacity="0.7"/>
        <ellipse cx="50" cy="38" rx="7" ry="12" fill="#c49a8a" transform="rotate(-55 50 38)" opacity="0.6"/>
        <ellipse cx="95" cy="58" rx="7" ry="12" fill="#c9a96e" transform="rotate(-30 95 58)" opacity="0.6"/>
        <ellipse cx="80" cy="72" rx="6" ry="10" fill="#c49a8a" transform="rotate(-50 80 72)" opacity="0.5"/>
        <ellipse cx="108" cy="82" rx="6" ry="10" fill="#c9a96e" transform="rotate(-20 108 82)" opacity="0.5"/>
        {/* roses */}
        <circle cx="65" cy="15" r="6" fill="#c49a8a" opacity="0.55"/>
        <circle cx="65" cy="15" r="3.5" fill="#e8c4b8" opacity="0.6"/>
        <circle cx="90" cy="50" r="5.5" fill="#c49a8a" opacity="0.5"/>
        <circle cx="90" cy="50" r="3" fill="#e8c4b8" opacity="0.55"/>
        <circle cx="110" cy="70" r="5" fill="#c49a8a" opacity="0.5"/>
        <circle cx="110" cy="70" r="2.5" fill="#e8c4b8" opacity="0.5"/>
      </svg>
    </div>
  );
}

/* ─── Floating particles ─────────────────────────── */
function Particles() {
  const [list, setList] = useState<Particle[]>([]);
  const ref = useRef(0);
  useEffect(() => {
    const chars = ["✦", "·", "✧", "♡", "·", "✦"];
    const add = () => {
      ref.current++;
      setList(p => [...p.slice(-12), {
        id: ref.current,
        x: Math.random() * 100,
        size: 7 + Math.random() * 9,
        duration: 14 + Math.random() * 14,
        delay: Math.random() * 1.5,
        char: chars[Math.floor(Math.random() * chars.length)],
      }]);
    };
    add();
    const t = setInterval(add, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {list.map(p => (
        <motion.span key={p.id}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, 0.45, 0.3, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
          onAnimationComplete={() => setList(l => l.filter(x => x.id !== p.id))}
          style={{
            position: "fixed", left: `${p.x}%`, bottom: 0,
            fontSize: p.size, color: "var(--gold)", filter: "blur(0.4px)",
          }}
        >{p.char}</motion.span>
      ))}
    </div>
  );
}

/* ─── Gold thin horizontal rule ─────────────────── */
function Rule({ w = "80px", opacity = 0.35 }: { w?: string; opacity?: number }) {
  return (
    <div style={{
      height: "1px", width: w, opacity,
      background: "linear-gradient(to right, transparent, var(--gold), transparent)",
    }} />
  );
}

/* ─── Ornamental diamond divider ─────────────────── */
function DiamondDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto">
      <Rule w="100%" />
      <span style={{ color: "var(--gold)", fontSize: "0.55rem", whiteSpace: "nowrap",
        letterSpacing: "0.25em", textTransform: "uppercase", flexShrink: 0 }}>
        {label ?? "✦"}
      </span>
      <Rule w="100%" />
    </div>
  );
}

/* ─── Countdown unit ─────────────────────────────── */
function Unit({ value, label, delay }: { value: number; label: string; delay: number }) {
  const prev = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prev.current !== value) { setBump(true); setTimeout(() => setBump(false), 320); prev.current = value; }
  }, [value]);
  return (
    <motion.div className="flex flex-col items-center"
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}>
      <AnimatePresence mode="wait">
        <motion.span key={value}
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.22 }}
          className="glow-gold tabular-nums"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(3rem, 11vw, 6.5rem)",
            fontWeight: 300, lineHeight: 1,
            color: bump ? "var(--rose-lt)" : "var(--gold-lt)",
            transition: "color 0.28s ease",
          }}>
          {pad(value)}
        </motion.span>
      </AnimatePresence>
      <span style={{
        fontSize: "clamp(0.5rem, 1.5vw, 0.62rem)",
        letterSpacing: "0.35em", textTransform: "uppercase",
        color: "var(--rose)", marginTop: "6px",
      }}>{label}</span>
    </motion.div>
  );
}

/* ─── Subscribe button ───────────────────────────── */
function Subscribe() {
  const [phase, setPhase] = useState<"idle"|"loading"|"done"|"error"|"unsupported">("idle");
  const [who, setWho] = useState<string>("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) setPhase("unsupported");
  }, []);

  const go = async (name: string) => {
    if (phase === "loading") return;
    setWho(name); setPhase("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        });
      const r = await fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), name }),
      });
      if (!r.ok) throw new Error();
      setMsg(`¡Listo, ${name}! Te avisamos cada mañana.`);
      setPhase("done");
    } catch {
      setMsg("Activa permisos de notificación e intenta de nuevo.");
      setPhase("error"); setWho("");
    }
  };

  if (phase === "unsupported") return null;
  if (phase === "done") return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ color: "var(--rose-lt)", fontSize: "0.82rem", letterSpacing: "0.08em", textAlign: "center" }}>
      ✦ {msg}
    </motion.p>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p style={{ color: "var(--muted)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        ¿Quién eres?
      </p>
      <div className="flex gap-4">
        {["Edwin", "Yeimy"].map(n => (
          <motion.button key={n} onClick={() => go(n)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            disabled={phase === "loading"}
            style={{
              padding: "0.65rem 2rem",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              background: phase === "loading" && who === n
                ? "rgba(201,169,110,0.15)" : "transparent",
              color: "var(--gold-lt)",
              fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: phase === "loading" ? "not-allowed" : "pointer",
              opacity: phase === "loading" && who !== n ? 0.4 : 1,
              transition: "all 0.2s",
            }}>
            {phase === "loading" && who === n ? "…" : n}
          </motion.button>
        ))}
      </div>
      {phase === "error" && (
        <p style={{ color: "var(--rose)", fontSize: "0.7rem", textAlign: "center" }}>{msg}</p>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────── */
export default function Page() {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(WEDDING_DATE));
  const [mounted, setMounted] = useState(false);
  const quote = getDailyQuote();
  const daysSince = getDaysSince(PROPOSAL_DATE);

  useEffect(() => {
    setMounted(true);
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    const t = setInterval(() => setTime(getTimeLeft(WEDDING_DATE)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative min-h-svh flex flex-col overflow-x-hidden"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% -10%, #2a1020 0%, var(--bg) 55%)" }}>

      {/* ambient glows */}
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0" style={{
        background:
          "radial-gradient(ellipse 55% 45% at 15% 20%, rgba(196,136,122,.07) 0%, transparent 70%)," +
          "radial-gradient(ellipse 55% 45% at 85% 75%, rgba(201,169,110,.06) 0%, transparent 70%)",
      }} />

      <Particles />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-svh px-6 text-center"
        style={{ gap: "clamp(1.2rem, 3.5vh, 2rem)", paddingTop: "clamp(3rem,8vh,6rem)", paddingBottom: "clamp(3rem,8vh,6rem)" }}>

        <Ornament pos="tl" /><Ornament pos="tr" />
        <Ornament pos="bl" /><Ornament pos="br" />

        {/* tagline */}
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ color: "var(--rose)", fontSize: "clamp(0.52rem,1.6vw,.65rem)",
            letterSpacing: "0.45em", textTransform: "uppercase" }}>
          Pereira · Colombia
        </motion.p>

        {/* thin rule */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}>
          <Rule w="clamp(60px,15vw,120px)" opacity={0.4} />
        </motion.div>

        {/* NAMES */}
        <motion.h1 className="serif gold-text"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3 }}
          style={{
            fontSize: "clamp(3.2rem, 14vw, 8rem)",
            fontWeight: 300, letterSpacing: "0.04em", lineHeight: 1,
          }}>
          Edwin<br />&amp;<br />Yeimy
        </motion.h1>

        {/* thin rule */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}>
          <Rule w="clamp(60px,15vw,120px)" opacity={0.4} />
        </motion.div>

        {/* date */}
        <motion.p className="serif"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{ color: "var(--gold-lt)", fontSize: "clamp(0.85rem,3vw,1.2rem)",
            fontWeight: 300, letterSpacing: "0.18em", fontStyle: "italic" }}>
          9 de Mayo, 2026
        </motion.p>

        {/* COUNTDOWN */}
        {mounted && (
          <div className="flex items-center" style={{ gap: "clamp(1rem,4vw,3rem)", marginTop: "clamp(.5rem,2vh,1rem)" }}>
            <Unit value={time.days}    label="días"     delay={0.7} />
            <GoldSep delay={0.85} />
            <Unit value={time.hours}   label="horas"    delay={0.9} />
            <GoldSep delay={1.05} />
            <Unit value={time.minutes} label="minutos"  delay={1.1} />
            <GoldSep delay={1.25} />
            <Unit value={time.seconds} label="segundos" delay={1.3} />
          </div>
        )}

        {/* scroll hint */}
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          style={{ color: "var(--border)", fontSize: "0.75rem", marginTop: "clamp(.5rem,2vh,1rem)" }}>
          ↓
        </motion.div>
      </section>

      {/* ══════════════════ MILESTONES ══════════════════ */}
      <Section>
        <DiamondDivider label="nuestra historia" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl mx-auto mt-6">
          {[
            { n: String(daysSince), label: "días desde\nque dijiste sí", sub: "13 · Mar · 2026" },
            { n: "26", label: "nuestro día\ncada mes", sub: "aniversario mensual" },
            { n: "∞",  label: "años juntos\nnos esperan", sub: "Pereira, Colombia" },
          ].map(({ n, label, sub }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.7 }}
              className="flex flex-col items-center gap-2 text-center"
              style={{
                padding: "2rem 1.5rem",
                border: "1px solid var(--border-lt)",
                borderRadius: "4px",
                background: "rgba(201,169,110,.03)",
              }}>
              <span className="serif glow-gold"
                style={{ fontSize: "clamp(2.5rem,7vw,3.5rem)", fontWeight: 300, color: "var(--gold-lt)" }}>
                {n}
              </span>
              <Rule w="32px" opacity={0.4} />
              <p style={{ fontSize: "0.78rem", color: "var(--cream)", lineHeight: 1.5,
                whiteSpace: "pre-line" }}>{label}</p>
              <p style={{ fontSize: "0.6rem", color: "var(--rose)", letterSpacing: "0.2em",
                textTransform: "uppercase" }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════════ QUOTE ══════════════════ */}
      <Section>
        <DiamondDivider label="frase del día" />
        <motion.blockquote className="serif"
          initial={{ opacity: 0, scale: .97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.9 }}
          style={{
            fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.1rem,4vw,1.55rem)",
            color: "var(--cream)", lineHeight: 1.7,
            maxWidth: "520px", textAlign: "center",
          }}>
          &ldquo;{quote}&rdquo;
        </motion.blockquote>
        <p style={{ fontSize: "0.65rem", color: "var(--gold)", letterSpacing: "0.3em",
          textTransform: "uppercase", marginTop: ".5rem" }}>
          — Edwin
        </p>
      </Section>

      {/* ══════════════════ NOTIFICATIONS ══════════════════ */}
      <Section>
        <DiamondDivider label="recordatorio diario" />
        <motion.div className="flex flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <p className="serif"
            style={{ fontSize: "clamp(1.2rem,4vw,1.8rem)", fontWeight: 300,
              fontStyle: "italic", color: "var(--cream)" }}>
            Cada mañana, el countdown de nuestro día
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", maxWidth: "280px", lineHeight: 1.75 }}>
            Activa las notificaciones para recibir<br />un mensaje cada día con cuánto falta.
          </p>
          <Subscribe />
        </motion.div>
      </Section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="relative z-10 flex flex-col items-center gap-3 py-12">
        <Rule w="clamp(60px,15vw,100px)" opacity={0.25} />
        <p style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.25em",
          textTransform: "uppercase" }}>
          Hecho con amor · Edwin &amp; Yeimy · 2026
        </p>
      </footer>
    </main>
  );
}

/* ─── helpers ────────────────────────────────────── */
function GoldSep({ delay }: { delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      style={{ width: "1px", height: "clamp(50px,10vw,80px)",
        background: "linear-gradient(to bottom, transparent, var(--gold), transparent)",
        opacity: 0.3, flexShrink: 0 }} />
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center w-full">
      {children}
    </section>
  );
}
