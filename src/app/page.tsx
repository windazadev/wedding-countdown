"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WEDDING_DATE, PROPOSAL_DATE,
  getDailyQuote, getTimeLeft, getDaysSince, pad,
} from "@/lib/utils";

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; total: number; }
interface Particle { id: number; x: number; size: number; duration: number; delay: number; char: string; }

/* ─── Botanical corner ornaments ─────────────────── */
function Ornament({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const flipX = pos === "tr" || pos === "br" ? "scaleX(-1)" : "";
  const flipY = pos === "bl" || pos === "br" ? "scaleY(-1)" : "";
  const tf = [flipX, flipY].filter(Boolean).join(" ") || "none";
  const corner: Record<string, string> = {
    tl: "top-0 left-0", tr: "top-0 right-0",
    bl: "bottom-0 left-0", br: "bottom-0 right-0",
  };
  return (
    <div className={`absolute ${corner[pos]} pointer-events-none`}
      style={{ width: "clamp(90px,18vw,160px)", height: "clamp(90px,18vw,160px)" }} aria-hidden>
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ transform: tf, width: "100%", height: "100%", opacity: 0.22 }}>
        <path d="M8,152 Q8,8 152,8" stroke="#c9a96e" strokeWidth="0.7" fill="none"/>
        <path d="M24,152 Q24,24 152,24" stroke="#c9a96e" strokeWidth="0.4" fill="none"/>
        <path d="M8,80 Q32,64 48,40 Q56,28 52,12" stroke="#c9a96e" strokeWidth="0.9" fill="none"/>
        <path d="M8,112 Q40,96 64,72 Q76,60 72,40" stroke="#c9a96e" strokeWidth="0.65" fill="none"/>
        <path d="M48,152 Q64,120 80,96 Q92,80 88,56" stroke="#c9a96e" strokeWidth="0.65" fill="none"/>
        <ellipse cx="52" cy="14" rx="7" ry="12" fill="#c9a96e" transform="rotate(-40 52 14)" opacity="0.75"/>
        <ellipse cx="40" cy="30" rx="6" ry="11" fill="#c49a8a" transform="rotate(-55 40 30)" opacity="0.65"/>
        <ellipse cx="76" cy="46" rx="6" ry="10" fill="#c9a96e" transform="rotate(-30 76 46)" opacity="0.65"/>
        <ellipse cx="64" cy="58" rx="5" ry="9" fill="#c49a8a" transform="rotate(-50 64 58)" opacity="0.55"/>
        <circle cx="52" cy="12" r="5.5" fill="#c49a8a" opacity="0.6"/>
        <circle cx="52" cy="12" r="3" fill="#e8c4b8" opacity="0.65"/>
        <circle cx="72" cy="40" r="5" fill="#c49a8a" opacity="0.55"/>
        <circle cx="72" cy="40" r="2.5" fill="#e8c4b8" opacity="0.6"/>
        <circle cx="88" cy="56" r="4.5" fill="#c49a8a" opacity="0.5"/>
        <circle cx="88" cy="56" r="2" fill="#e8c4b8" opacity="0.55"/>
      </svg>
    </div>
  );
}

/* ─── Floating particles ─────────────────────────── */
function Particles() {
  const [list, setList] = useState<Particle[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const chars = ["✦", "·", "✧", "♡", "✦", "·"];
    const add = () => {
      counter.current++;
      setList(p => [...p.slice(-16), {
        id: counter.current,
        x: 5 + Math.random() * 90,
        size: 9 + Math.random() * 11,
        duration: 12 + Math.random() * 12,
        delay: 0,
        char: chars[Math.floor(Math.random() * chars.length)],
      }]);
    };
    add(); add(); add();
    const t = setInterval(add, 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }} aria-hidden>
      {list.map(p => (
        <motion.span key={p.id}
          initial={{ y: "105vh", opacity: 0 }}
          animate={{ y: "-5vh", opacity: [0, 0.6, 0.5, 0] }}
          transition={{ duration: p.duration, ease: "linear" }}
          onAnimationComplete={() => setList(l => l.filter(x => x.id !== p.id))}
          style={{
            position: "fixed",
            left: `${p.x}%`,
            bottom: 0,
            fontSize: p.size,
            color: p.char === "♡" ? "var(--rose-lt)" : "var(--gold)",
            filter: "blur(0.3px)",
            userSelect: "none",
          }}
        >{p.char}</motion.span>
      ))}
    </div>
  );
}

/* ─── Decorators ─────────────────────────────────── */
function Rule({ w = "70px", opacity = 0.35 }: { w?: string; opacity?: number }) {
  return <div style={{ height: "1px", width: w, opacity,
    background: "linear-gradient(to right, transparent, var(--gold), transparent)" }} />;
}

function DiamondDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
      <Rule w="100%" />
      <span style={{ color: "var(--gold)", fontSize: "0.52rem", whiteSpace: "nowrap",
        letterSpacing: "0.28em", textTransform: "uppercase", flexShrink: 0 }}>
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
    if (prev.current !== value) {
      setBump(true);
      setTimeout(() => setBump(false), 300);
      prev.current = value;
    }
  }, [value]);

  return (
    <motion.div className="flex flex-col items-center"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: "easeOut" }}>
      <AnimatePresence mode="wait">
        <motion.span key={value}
          initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.18 }}
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(2.4rem, 9vw, 5.5rem)",
            fontWeight: 300, lineHeight: 1,
            color: bump ? "var(--rose-lt)" : "var(--gold-lt)",
            transition: "color 0.25s ease",
            textShadow: "0 0 20px rgba(201,169,110,.5), 0 0 50px rgba(201,169,110,.2)",
          }}>
          {pad(value)}
        </motion.span>
      </AnimatePresence>
      <span style={{ fontSize: "clamp(0.45rem, 1.3vw, 0.58rem)", letterSpacing: "0.32em",
        textTransform: "uppercase", color: "var(--rose)", marginTop: "4px" }}>
        {label}
      </span>
    </motion.div>
  );
}

function VSep({ delay }: { delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.28 }} transition={{ delay }}
      style={{ width: "1px", height: "clamp(40px,7vw,65px)", flexShrink: 0,
        background: "linear-gradient(to bottom, transparent, var(--gold), transparent)" }} />
  );
}

/* ─── Subscribe / PWA install ────────────────────── */
function Subscribe() {
  const [phase, setPhase] = useState<"idle"|"ios-prompt"|"loading"|"done"|"error"|"unsupported">("idle");
  const [who, setWho] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as Record<string, unknown>).standalone === true;

    if (isIOS && !isStandalone) {
      setPhase("ios-prompt");
    } else if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPhase("unsupported");
    }
    // else stays "idle"
  }, []);

  const go = async (name: string) => {
    if (phase === "loading") return;
    setWho(name); setPhase("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        });
      const r = await fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), name }),
      });
      if (!r.ok) throw new Error();
      setMsg(`¡Listo, ${name}!`);
      setPhase("done");
    } catch {
      setMsg("Activa permisos de notificación e intenta de nuevo.");
      setPhase("error"); setWho("");
    }
  };

  if (phase === "unsupported") return null;

  if (phase === "ios-prompt") return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 text-center"
      style={{ maxWidth: "280px" }}>
      <p style={{ color: "var(--gold-lt)", fontSize: "0.8rem", letterSpacing: "0.05em", lineHeight: 1.7 }}>
        Para recibir notificaciones en iPhone:
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: "12px",
        padding: "1rem 1.2rem", background: "rgba(201,169,110,0.04)" }}>
        <ol style={{ color: "var(--cream)", fontSize: "0.75rem", lineHeight: 1.9,
          textAlign: "left", listStyleType: "decimal", paddingLeft: "1.2rem" }}>
          <li>Toca el ícono <strong style={{ color: "var(--gold)" }}>Compartir</strong> de Safari</li>
          <li>Selecciona <strong style={{ color: "var(--gold)" }}>"Añadir a pantalla de inicio"</strong></li>
          <li>Abre la app desde el ícono que aparece</li>
          <li>Vuelve a esta sección y activa</li>
        </ol>
      </div>
    </motion.div>
  );

  if (phase === "done") return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ color: "var(--rose-lt)", fontSize: "0.82rem", letterSpacing: "0.08em" }}>
      ✦ {msg} Recibirás el countdown cada mañana.
    </motion.p>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.22em",
        textTransform: "uppercase" }}>¿Quién eres?</p>
      <div className="flex gap-4">
        {["Edwin", "Yeimy"].map(n => (
          <motion.button key={n} onClick={() => go(n)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            disabled={phase === "loading"}
            style={{
              padding: "0.6rem 1.8rem",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              background: phase === "loading" && who === n ? "rgba(201,169,110,0.12)" : "transparent",
              color: "var(--gold-lt)", fontSize: "0.78rem",
              letterSpacing: "0.18em", textTransform: "uppercase",
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

/* ─── Main ───────────────────────────────────────── */
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
    <main className="relative overflow-x-hidden"
      style={{ minHeight: "100svh", background: "radial-gradient(ellipse 130% 70% at 50% -5%, #2e1020 0%, #0f0608 55%)" }}>

      {/* ambient glows */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 1,
        background:
          "radial-gradient(ellipse 50% 40% at 12% 18%, rgba(196,136,122,.08) 0%, transparent 65%)," +
          "radial-gradient(ellipse 50% 40% at 88% 80%, rgba(201,169,110,.07) 0%, transparent 65%)",
      }} />

      <Particles />

      {/* ══════ HERO — 100svh, solo nombres ══════ */}
      <section className="relative flex flex-col items-center justify-center text-center"
        style={{
          zIndex: 10,
          height: "100svh",
          padding: "clamp(1rem, 4vw, 3rem)",
          gap: "clamp(1rem, 2.5vh, 1.8rem)",
        }}>

        <Ornament pos="tl" /><Ornament pos="tr" />
        <Ornament pos="bl" /><Ornament pos="br" />

        {/* tagline */}
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ color: "var(--rose)", fontSize: "clamp(0.5rem, 1.5vw, 0.65rem)",
            letterSpacing: "0.42em", textTransform: "uppercase" }}>
          Pereira · Colombia
        </motion.p>

        {/* top rule */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.15 }}>
          <Rule w="clamp(60px, 13vw, 100px)" opacity={0.38} />
        </motion.div>

        {/* NAMES — tamaño original grande */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25 }}
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(3.2rem, 14vw, 8rem)",
            fontWeight: 300, lineHeight: 1.05, letterSpacing: "0.03em",
            background: "linear-gradient(150deg, var(--gold-lt) 0%, var(--gold) 40%, var(--rose-lt) 70%, var(--gold-lt) 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer 6s linear infinite",
          }}>
          Edwin<br />&amp; Yeimy
        </motion.h1>

        {/* bottom rule */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.4 }}>
          <Rule w="clamp(60px, 13vw, 100px)" opacity={0.38} />
        </motion.div>

        {/* date */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            color: "var(--gold-lt)", fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1rem, 3vw, 1.35rem)", letterSpacing: "0.12em",
          }}>
          9 de Mayo, 2026
        </motion.p>

        {/* flecha al countdown */}
        <motion.button
          onClick={() => document.getElementById("countdown")?.scrollIntoView({ behavior: "smooth" })}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          style={{
            position: "absolute", bottom: "clamp(1.5rem, 4vh, 2.5rem)",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
            color: "var(--gold)", opacity: 0.7,
          }}>
          <span style={{ fontSize: "0.52rem", letterSpacing: "0.3em", textTransform: "uppercase",
            color: "var(--rose)" }}>ver countdown</span>
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>↓</span>
        </motion.button>
      </section>

      {/* ══════ COUNTDOWN ══════ */}
      <section id="countdown" className="relative flex flex-col items-center justify-center text-center"
        style={{ zIndex: 10, minHeight: "60svh", padding: "clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 3rem)", gap: "clamp(1rem, 2.5vh, 1.8rem)" }}>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ color: "var(--rose)", fontSize: "clamp(0.5rem, 1.5vw, 0.62rem)",
            letterSpacing: "0.35em", textTransform: "uppercase" }}>
          faltan
        </motion.p>
        {mounted && (
          <div className="flex items-center" style={{ gap: "clamp(1rem, 4vw, 3rem)" }}>
            <Unit value={time.days}    label="días"     delay={0.1} />
            <VSep delay={0.2} />
            <Unit value={time.hours}   label="horas"    delay={0.3} />
            <VSep delay={0.4} />
            <Unit value={time.minutes} label="minutos"  delay={0.5} />
            <VSep delay={0.6} />
            <Unit value={time.seconds} label="segundos" delay={0.7} />
          </div>
        )}
      </section>

      {/* ══════ MILESTONES ══════ */}
      <PageSection>
        <DiamondDivider label="nuestra historia" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mx-auto mt-4">
          {[
            { n: String(daysSince), label: "días desde\nque dijiste sí", sub: "13 · Mar · 2026" },
            { n: "26",              label: "nuestro día\ncada mes",        sub: "aniversario" },
            { n: "∞",               label: "años juntos\nnos esperan",     sub: "para siempre" },
          ].map(({ n, label, sub }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.65 }}
              className="flex flex-col items-center gap-2 text-center"
              style={{ padding: "1.75rem 1.25rem",
                border: "1px solid rgba(201,169,110,0.12)", borderRadius: "4px",
                background: "rgba(201,169,110,0.025)" }}>
              <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(2.2rem, 6vw, 3rem)", fontWeight: 300, color: "var(--gold-lt)",
                textShadow: "0 0 18px rgba(201,169,110,.4)" }}>
                {n}
              </span>
              <Rule w="28px" opacity={0.35} />
              <p style={{ fontSize: "0.75rem", color: "var(--cream)", lineHeight: 1.55,
                whiteSpace: "pre-line" }}>{label}</p>
              <p style={{ fontSize: "0.58rem", color: "var(--rose)", letterSpacing: "0.18em",
                textTransform: "uppercase" }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* ══════ QUOTE ══════ */}
      <PageSection>
        <DiamondDivider label="frase del día" />
        <motion.div className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          style={{ maxWidth: "500px", textAlign: "center" }}>
          <blockquote style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
            fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.1rem, 3.8vw, 1.5rem)",
            color: "var(--cream)", lineHeight: 1.72 }}>
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p style={{ fontSize: "0.6rem", color: "var(--gold)", letterSpacing: "0.28em",
            textTransform: "uppercase" }}>— Edwin</p>
        </motion.div>
      </PageSection>

      {/* ══════ NOTIFICATIONS ══════ */}
      <PageSection>
        <DiamondDivider label="recordatorio diario" />
        <motion.div className="flex flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.75 }}>
          <p style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(1.15rem, 3.5vw, 1.7rem)", fontWeight: 300,
            fontStyle: "italic", color: "var(--cream)" }}>
            Cada mañana, el countdown de nuestro día
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "270px", lineHeight: 1.75 }}>
            Activa las notificaciones y recibe cada día<br />cuánto falta para la boda.
          </p>
          <Subscribe />
        </motion.div>
      </PageSection>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative flex flex-col items-center gap-3 py-10" style={{ zIndex: 10 }}>
        <Rule w="clamp(50px,12vw,80px)" opacity={0.2} />
        <p style={{ fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.22em",
          textTransform: "uppercase" }}>
          Hecho con amor · Edwin &amp; Yeimy · 2026
        </p>
      </footer>
    </main>
  );
}

function PageSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex flex-col items-center gap-6 px-5 py-14 text-center w-full"
      style={{ zIndex: 10 }}>
      {children}
    </section>
  );
}
