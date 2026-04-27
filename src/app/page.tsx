"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WEDDING_DATE, PROPOSAL_DATE,
  getDailyQuote, getTimeLeft, getDaysSince, pad, getSentQuotes,
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

  useEffect(() => {
    const chars = ["✦", "·", "✧", "♡", "✦", "·"];
    const add = () => {
      const id = Math.random();
      setList(p => [...p.slice(-16), {
        id,
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

function DiamondDivider({ label, scale = 1, noLines = false }: { label?: string; scale?: number; noLines?: boolean }) {
  return (
    <motion.div className="flex items-center gap-3 w-full max-w-sm mx-auto justify-center"
      initial={{ opacity: 0, scaleX: 0.6 }} whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.9, ease: "easeOut" }}>
      {!noLines && <Rule w="100%" />}
      <span style={{ color: "var(--gold)", fontSize: `${0.52 * scale}rem`, whiteSpace: "nowrap",
        letterSpacing: "0.28em", textTransform: "uppercase", flexShrink: 0 }}>
        {label ?? "✦"}
      </span>
      {!noLines && <Rule w="100%" />}
    </motion.div>
  );
}

/* ─── Countdown unit (secondary: horas / minutos / segundos) ── */
function Unit({ value, label, delay, small }: { value: number; label: string; delay: number; small?: boolean }) {
  const uid = useRef(Math.random().toString(36).slice(2));
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
      style={{ gap: "clamp(0.4rem, 1.5vh, 1.2rem)" }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: "easeOut" }}>
      <AnimatePresence mode="wait">
        <motion.span key={`${uid.current}-${value}`}
          initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.18 }}
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontWeight: 300, lineHeight: 1,
            fontSize: small ? "clamp(2.2rem, 4.5vh, 3.8rem)" : "clamp(2.5rem, 6.5vh, 5.5rem)",
            color: bump ? "var(--rose-lt)" : "var(--gold-lt)",
            transition: "color 0.25s ease",
            textShadow: "0 0 20px rgba(201,169,110,.5), 0 0 50px rgba(201,169,110,.2)",
          }}>
          {pad(value)}
        </motion.span>
      </AnimatePresence>
      <span style={{ fontSize: "clamp(0.6rem, 1.4vh, 0.75rem)", letterSpacing: "0.32em",
        textTransform: "uppercase", color: "var(--rose)" }}>
        {label}
      </span>
    </motion.div>
  );
}

function VSep({ delay }: { delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.28 }} transition={{ delay }}
      style={{ width: "1px", flexShrink: 0, height: "clamp(20px, 6vh, 70px)",
        background: "linear-gradient(to bottom, transparent, var(--gold), transparent)" }} />
  );
}

/* ─── Subscribe / PWA install ────────────────────── */
function Subscribe() {
  const [phase, setPhase] = useState<"idle"|"ios-prompt"|"ios-old"|"android-prompt"|"loading"|"done"|"error"|"unsupported">("idle");
  const [who, setWho] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const detect = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
      const isAndroid = /Android/.test(ua);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || window.matchMedia("(display-mode: minimal-ui)").matches
        || window.matchMedia("(display-mode: fullscreen)").matches
        || window.matchMedia("(display-mode: window-controls-overlay)").matches
        || (navigator as unknown as Record<string, unknown>).standalone === true
        || document.referrer.includes("android-app://")
        || (window.navigator as unknown as Record<string, unknown>).standalone === true;

      if (isIOS) {
        const match = ua.match(/OS (\d+)_(\d+)/);
        const major = match ? parseInt(match[1]) : 0;
        const minor = match ? parseInt(match[2]) : 0;
        const supportsWebPush = major > 16 || (major === 16 && minor >= 4);
        if (!supportsWebPush) { setPhase("ios-old"); return; }
        if (!isStandalone) { setPhase("ios-prompt"); return; }
      }

      if (isAndroid && !isStandalone) { setPhase("android-prompt"); return; }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPhase("unsupported");
      }
    };

    const saved = localStorage.getItem("push_name");
    if (saved) {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        navigator.serviceWorker.ready
          .then(reg => reg.pushManager.getSubscription().then(existing => ({ reg, existing })))
          .then(({ reg, existing }) => {
            if (!existing) {
              localStorage.removeItem("push_name");
              detect();
              return;
            }
            // Re-subscribe silently to get the current (possibly rotated) token
            // and keep the server in sync on every app open
            reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            }).then(sub => {
              reg.active?.postMessage({ type: "STORE_NAME", name: saved });
              fetch("/api/subscribe", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub.toJSON(), name: saved }),
              }).catch(() => {});
            }).catch(() => {});
            setWho(saved); setMsg(`¡Listo, ${saved}!`); setPhase("done");
          })
          .catch(() => { setWho(saved); setMsg(`¡Listo, ${saved}!`); setPhase("done"); });
      } else {
        setWho(saved); setMsg(`¡Listo, ${saved}!`); setPhase("done");
      }
      return;
    }

    detect();
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
      localStorage.setItem("push_name", name);
      reg.active?.postMessage({ type: "STORE_NAME", name });
      setMsg(`¡Listo, ${name}!`);
      setPhase("done");
    } catch {
      setMsg("Activa permisos de notificación e intenta de nuevo.");
      setPhase("error"); setWho("");
    }
  };

  if (phase === "unsupported") return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ color: "var(--muted)", fontSize: "0.72rem", letterSpacing: "0.06em",
        textAlign: "center", maxWidth: "260px", lineHeight: 1.7 }}>
      Las notificaciones requieren Chrome en Android o Safari en iPhone (iOS 16.4+).
    </motion.p>
  );

  if (phase === "ios-old") return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 text-center"
      style={{ maxWidth: "280px" }}>
      <p style={{ color: "var(--gold-lt)", fontSize: "0.78rem", letterSpacing: "0.04em", lineHeight: 1.7 }}>
        Tu iPhone necesita <strong style={{ color: "var(--gold)" }}>iOS 16.4 o superior</strong> para recibir notificaciones.
      </p>
      <p style={{ color: "var(--muted)", fontSize: "0.68rem", lineHeight: 1.6 }}>
        Actualiza en Ajustes → General → Actualización de software.
      </p>
    </motion.div>
  );

  if (phase === "ios-prompt") return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 text-center"
      style={{ maxWidth: "300px" }}>
      <p style={{ color: "var(--gold-lt)", fontSize: "0.8rem", letterSpacing: "0.05em", lineHeight: 1.7 }}>
        Para recibir notificaciones en iPhone:
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: "12px",
        padding: "1rem 1.4rem", background: "rgba(201,169,110,0.04)" }}>
        <ol style={{ color: "var(--cream)", fontSize: "0.75rem", lineHeight: 2,
          textAlign: "left", listStyleType: "decimal", paddingLeft: "1.2rem" }}>
          <li>Abre esta página en <strong style={{ color: "var(--gold)" }}>Safari</strong></li>
          <li>Toca el ícono <strong style={{ color: "var(--gold)" }}>Compartir</strong> ↑</li>
          <li>Selecciona <strong style={{ color: "var(--gold)" }}>&ldquo;Añadir a pantalla de inicio&rdquo;</strong></li>
          <li>Abre la app y vuelve aquí para elegir tu nombre ↓</li>
        </ol>
      </div>
    </motion.div>
  );

  if (phase === "android-prompt") return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 text-center"
      style={{ maxWidth: "300px" }}>
      <p style={{ color: "var(--gold-lt)", fontSize: "0.8rem", letterSpacing: "0.05em", lineHeight: 1.7 }}>
        Para recibir notificaciones en Android:
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: "12px",
        padding: "1rem 1.4rem", background: "rgba(201,169,110,0.04)" }}>
        <ol style={{ color: "var(--cream)", fontSize: "0.75rem", lineHeight: 2,
          textAlign: "left", listStyleType: "decimal", paddingLeft: "1.2rem" }}>
          <li>Toca el menú <strong style={{ color: "var(--gold)" }}>⋮</strong> (arriba a la derecha)</li>
          <li>Selecciona <strong style={{ color: "var(--gold)" }}>&ldquo;Añadir a pantalla de inicio&rdquo;</strong></li>
          <li>Abre la app desde el ícono en tu pantalla de inicio</li>
        </ol>
      </div>
      <motion.button
        onClick={() => setPhase("idle")}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: "0.5rem",
          padding: "0.6rem 1.8rem",
          border: "1px solid var(--border)",
          borderRadius: "100px",
          background: "transparent",
          color: "var(--gold)",
          fontSize: "0.72rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}>
        Ya la instalé →
      </motion.button>
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
              padding: "0.7rem 2rem",
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

/* ─── Quotes Modal ───────────────────────────────── */
function QuotesModal({ onClose }: { onClose: () => void }) {
  const quotes = getSentQuotes();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = document.getElementById("main-scroll-container");
    if (el) el.style.overflow = "hidden";
    return () => { if (el) el.style.overflow = ""; };
  }, []);

  const go = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= quotes.length) return;
    setDirection(dir);
    setIndex(next);
  };

  const current = quotes[index];
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -280 : 280, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(8,8,20,0.5)",
        WebkitBackdropFilter: "blur(18px)", backdropFilter: "blur(18px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        touchAction: "none",
      }}>

      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: "clamp(1.2rem,4vh,2rem)", right: "clamp(1.2rem,4vw,2rem)",
        background: "none", border: "none", cursor: "pointer",
        color: "var(--gold)", opacity: 0.7, fontSize: "1.4rem", lineHeight: 1, padding: "0.5rem",
      }}>✕</button>

      {/* Card container */}
      <div style={{ position: "relative", width: "min(85vw, 480px)" }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragStart={() => setDragging(true)}
            onDragEnd={(_, info) => {
              setDragging(false);
              if (info.offset.x < -45) go(1);
              else if (info.offset.x > 45) go(-1);
            }}
            onClick={(e) => { if (dragging) e.stopPropagation(); }}
            style={{
              position: "relative",
              background: "rgba(201,169,110,0.04)",
              border: "1px solid rgba(201,169,110,0.15)",
              borderRadius: "2px",
              padding: "clamp(2.5rem,6vh,4rem) clamp(2rem,6vw,3rem)",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "clamp(1.2rem,3vh,2rem)",
              cursor: "grab", userSelect: "none", width: "100%",
              boxShadow: "0 0 60px rgba(201,169,110,0.05), 0 24px 60px rgba(0,0,0,0.5)",
            }}>

            {/* Date */}
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--gold)", opacity: 1, margin: 0 }}>
              {current.date}
            </p>

            {/* Ornament */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(201,169,110,0.3))" }} />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(201,169,110,0.45)">
                <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88Z" />
              </svg>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(201,169,110,0.3))" }} />
            </div>

            {/* Quote */}
            <blockquote style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(1.15rem,3.8vh,1.8rem)",
              color: "var(--cream)", lineHeight: 1.6, letterSpacing: "0.01em",
              textAlign: "center", margin: 0,
            }}>
              {current.quote}
            </blockquote>

            {/* Ornament */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(201,169,110,0.3))" }} />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(201,169,110,0.45)">
                <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88Z" />
              </svg>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(201,169,110,0.3))" }} />
            </div>

            {/* Signature */}
            <p style={{ fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--gold)", opacity: 1, margin: 0 }}>
              by win, for yeimy
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrow buttons + Dots */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: "flex", alignItems: "center", gap: "clamp(3.5rem,12vw,6rem)", marginTop: "clamp(1.5rem,3.5vh,2.5rem)" }}>

        {/* Prev arrow */}
        <motion.button
          onClick={() => go(-1)}
          whileTap={{ scale: 0.88 }}
          disabled={index === 0}
          style={{
            background: "none", border: "1px solid rgba(201,169,110,0.25)", borderRadius: "50%",
            width: "52px", height: "52px", cursor: index === 0 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--gold)", opacity: index === 0 ? 0.2 : 0.75,
            transition: "opacity 0.2s", flexShrink: 0, padding: 0,
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        {/* Dots */}
        {quotes.length > 1 && (
          <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
            {quotes.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                style={{
                  width: i === index ? "20px" : "6px", height: "6px",
                  borderRadius: "3px", border: "none", cursor: "pointer", padding: 0,
                  background: i === index ? "var(--gold)" : "rgba(201,169,110,0.3)",
                  transition: "all 0.3s ease",
                }} />
            ))}
          </div>
        )}

        {/* Next arrow */}
        <motion.button
          onClick={() => go(1)}
          whileTap={{ scale: 0.88 }}
          disabled={index === quotes.length - 1}
          style={{
            background: "none", border: "1px solid rgba(201,169,110,0.25)", borderRadius: "50%",
            width: "52px", height: "52px", cursor: index === quotes.length - 1 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--gold)", opacity: index === quotes.length - 1 ? 0.2 : 0.75,
            transition: "opacity 0.2s", flexShrink: 0, padding: 0,
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Swipe hint */}
      {quotes.length > 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 0.5 }}
          style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--muted)", marginTop: "1rem" }}>
          desliza para navegar
        </motion.p>
      )}
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────── */
export default function Page() {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(WEDDING_DATE));
  const [mounted, setMounted] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const quote = getDailyQuote();
  const daysSince = getDaysSince(PROPOSAL_DATE);

  useEffect(() => {
    if (canScroll) return;
    
    const mainEl = document.getElementById("main-scroll-container");
    if (mainEl) mainEl.scrollTo(0, 0);

    const blockTouch = (e: TouchEvent) => e.preventDefault();
    const blockWheel = (e: WheelEvent) => e.preventDefault();
    const blockKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "Space", "PageUp", "PageDown", "Home", "End"].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener("touchmove", blockTouch, { passive: false });
    window.addEventListener("wheel", blockWheel, { passive: false });
    window.addEventListener("keydown", blockKey, { passive: false });

    return () => {
      window.removeEventListener("touchmove", blockTouch);
      window.removeEventListener("wheel", blockWheel);
      window.removeEventListener("keydown", blockKey);
    };
  }, [canScroll]);

  useEffect(() => {
    setMounted(true);
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    const t = setInterval(() => setTime(getTimeLeft(WEDDING_DATE)), 1000);

    const saved = localStorage.getItem("push_name");
    if (saved) {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        navigator.serviceWorker.ready
          .then(reg => reg.pushManager.getSubscription())
          .then(sub => { if (sub) setSubscribed(true); })
          .catch(() => setSubscribed(true));
      } else {
        setSubscribed(true);
      }
    }

    const goToFrase = () => {
      if (window.location.hash === "#frase") {
        setCanScroll(true);
        setTimeout(() => {
          document.getElementById("frase")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    goToFrase();
    window.addEventListener("hashchange", goToFrase);

    return () => {
      clearInterval(t);
      window.removeEventListener("hashchange", goToFrase);
    };
  }, []);

  return (
    <main id="main-scroll-container" className="relative overflow-x-hidden"
      style={{ 
        height: "100svh", 
        width: "100vw",
        overflowY: canScroll ? "scroll" : "hidden",
        scrollSnapType: canScroll ? "y mandatory" : "none",
        overscrollBehaviorY: "none",
        WebkitOverflowScrolling: "touch",
        background: "radial-gradient(ellipse 130% 70% at 50% -5%, #2e1020 0%, #0f0608 55%)" 
      }}>

      {/* ambient glows */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 1,
        background:
          "radial-gradient(ellipse 50% 40% at 12% 18%, rgba(196,136,122,.08) 0%, transparent 65%)," +
          "radial-gradient(ellipse 50% 40% at 88% 80%, rgba(201,169,110,.07) 0%, transparent 65%)",
      }} />

      <Particles />

      {/* ══════ HERO — 100svh, nombres + countdown ══════ */}
      <section className="relative flex flex-col items-center text-center"
        style={{
          zIndex: 10,
          height: "100svh",
          padding: "clamp(1.2rem, 3.5vw, 2.5rem) clamp(1rem, 4vw, 3rem)",
          justifyContent: "space-between",
          scrollSnapAlign: "start"
        }}>

        <Ornament pos="tl" /><Ornament pos="tr" />
        <Ornament pos="bl" /><Ornament pos="br" />

        {/* TOP — tagline */}
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ color: "var(--rose)", fontSize: "clamp(0.55rem, 1vh, 0.65rem)",
            letterSpacing: "0.42em", textTransform: "uppercase" }}>
          Pereira · Colombia
        </motion.p>

        {/* CENTER — nombres + countdown agrupados */}
        <div className="flex flex-col items-center" style={{ gap: "clamp(0.3rem, 1.5vh, 1.2rem)" }}>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="serif gold-text"
            style={{
              ...{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontWeight: 300, lineHeight: 1.05, letterSpacing: "0.03em",
              background: "linear-gradient(150deg, var(--gold-lt) 0%, var(--gold) 40%, var(--rose-lt) 70%, var(--gold-lt) 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 6s linear infinite",
              fontSize: "clamp(3.8rem, 8.5vh, 8rem)",
              }}}
            >
            Edwin<br />&amp; Yeimy
          </motion.h1>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.4 }}>
            <Rule w="clamp(60px, 13vw, 100px)" opacity={0.38} />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}

            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1.1rem, 2vh, 1.35rem)",
              color: "var(--gold-lt)", fontStyle: "italic", fontWeight: 300,
              letterSpacing: "0.12em",
            }}>
            9 de Mayo, 2026
          </motion.p>

          {/* countdown — pegado a los nombres */}
          {mounted && (
            <div className="flex flex-col items-center countdown-container" style={{ gap: "clamp(0.2rem, 1vh, 1rem)" }}>
              <motion.div className="main-days-block flex flex-col items-center"
                style={{ gap: "clamp(0.3rem, 1vh, 2.5rem)" }}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}>
                <AnimatePresence mode="wait">
                  <motion.span key={`days-${time.days}`}
                    initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.18 }}

                    style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontWeight: 300, lineHeight: 1, fontSize: "clamp(5rem, 11vh, 9rem)",
                      color: "var(--gold-lt)",
                      textShadow: "0 0 35px rgba(201,169,110,.65), 0 0 80px rgba(201,169,110,.28), 0 0 140px rgba(201,169,110,.12)",
                    }}>
                    {pad(time.days)}
                  </motion.span>
                </AnimatePresence>
                <span style={{ fontSize: "clamp(0.7rem, 1.5vh, 0.9rem)", letterSpacing: "0.42em",
                  textTransform: "uppercase", color: "var(--rose)" }}>
                  días
                </span>
              </motion.div>

              <div className="flex items-center max-sm:gap-5 sm:gap-[clamp(0.8rem,3.5vw,2.5rem)]">
                <Unit value={time.hours}   label="horas"    delay={0.9} small />
                <VSep delay={1.0} />
                <Unit value={time.minutes} label="minutos"  delay={1.1} small />
                <VSep delay={1.2} />
                <Unit value={time.seconds} label="segundos" delay={1.3} small />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM — solo la flecha */}
        <motion.button
          onClick={() => {
            setCanScroll(true);
            setTimeout(() => {
              document.getElementById("milestones")?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          style={{ background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span className="gold-text" style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1rem, 2vh, 1.1rem)",
              fontStyle: "italic",
              letterSpacing: "0.15em" }}>
              Nuestra historia
            </span>
            <span style={{ color: "var(--gold)", opacity: 0.6, fontSize: "clamp(1.2rem, 2.5vh, 1.8rem)" }}>↓</span>
          </motion.div>
        </motion.button>
      </section>

      {/* ══════ HISTORIA ══════ */}
      <PageSection id="milestones" py="clamp(1.5rem, 4vh, 4rem)" minHeight="100svh" justify="center">
        <DiamondDivider label="Nuestra historia" scale={1.6} />
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-3xl mx-auto px-12 sm:px-4 justify-items-center"
          style={{ marginTop: "clamp(0.5rem, 2vh, 3.5rem)", gap: "clamp(1.5rem, 4vh, 3rem)" }}>
          {[
            { n: String(daysSince), unit: "", label: "Los días que Dios lleva sumando latidos a nuestra promesa.", sub: "13 · Marzo · 2026" },
            { n: "26",              unit: "",     label: "Cuando el calendario dejó de ser solo números", sub: "El 26 de cada mes" },
            { n: "∞",               unit: "",     label: "Nuestra única medida de tiempo a partir de ahora", sub: "Para siempre" },
          ].map(({ n, unit, label, sub }, i) => {
            const baseDelay = 0.5 + (i * 0.18);
            return (
              <div key={i}
                className="flex flex-col items-center text-center relative px-8 w-full max-w-[320px] mx-auto"
                style={{ gap: "clamp(0.2rem, 0.8vh, 1rem)", padding: "clamp(0.5rem, 1.5vh, 2rem) 0" }}>
                {/* ambient glow */}
                <motion.div aria-hidden
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: canScroll ? 1 : 0 }}
                  transition={{ delay: baseDelay, duration: 1.5 }}
                  style={{
                    position: "absolute", top: "35%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "140px", height: "140px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />
                <motion.div className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 40, filter: "blur(12px)" }} 
                  animate={canScroll ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 40, filter: "blur(12px)" }}
                  transition={{ delay: baseDelay, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ gap: "2px" }}>
                  <span style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "clamp(4rem, 8.5vh, 7.5rem)", fontWeight: 300, color: "var(--gold-lt)",
                    textShadow: "0 0 35px rgba(201,169,110,.6), 0 0 80px rgba(201,169,110,.25)",
                    lineHeight: 1,
                  }}>{n}</span>
                  {unit && (
                    <span style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontSize: "clamp(0.85rem, 1.8vh, 1.15rem)", fontWeight: 300,
                      color: "var(--gold)", letterSpacing: "0.22em", textTransform: "uppercase",
                    }}>{unit}</span>
                  )}
                </motion.div>
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }} 
                  animate={canScroll ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                  transition={{ delay: baseDelay + 0.3, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
                  <Rule w="36px" opacity={0.32} />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} 
                  animate={canScroll ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(8px)" }}
                  transition={{ delay: baseDelay + 0.45, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "clamp(1.1rem, 2.5vh, 1.8rem)", fontWeight: 300,
                    color: "var(--cream)", letterSpacing: "0.04em", lineHeight: 1.4,
                    maxWidth: "300px", margin: "0 auto"
                  }}>{label}</motion.p>
                <motion.p
                  initial={{ opacity: 0, filter: "blur(5px)" }} 
                  animate={canScroll ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(5px)" }}
                  transition={{ delay: baseDelay + 0.6, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ fontSize: "clamp(0.65rem, 1.5vh, 0.85rem)", color: "var(--rose)",
                    letterSpacing: "0.28em", textTransform: "uppercase", marginTop: "0.5rem" }}>{sub}</motion.p>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* ══════ QUOTE ══════ */}
      <PageSection id="frase" py="3rem" minHeight="100svh" justify="center">
        
        {/* Top Edge Ornament */}
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }} transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-[6vh] sm:top-[8vh] left-0 w-full flex justify-center items-center gap-4 pointer-events-none px-4">
           <div className="h-[1px] bg-gradient-to-r from-transparent to-[var(--gold)] w-[30vw] max-w-[150px] opacity-40" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="0.5" className="opacity-80">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="var(--gold)" fillOpacity="0.15" />
            </svg>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-[var(--gold)] w-[30vw] max-w-[150px] opacity-40" />
        </motion.div>

        {/* Bottom Edge Ornament */}
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }} transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-[6vh] sm:bottom-[8vh] left-0 w-full flex justify-center items-center gap-4 pointer-events-none px-4">
           <div className="h-[1px] bg-gradient-to-r from-transparent to-[var(--gold)] w-[30vw] max-w-[150px] opacity-40" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="0.5" className="opacity-80">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="var(--gold)" fillOpacity="0.15" />
            </svg>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-[var(--gold)] w-[30vw] max-w-[150px] opacity-40" />
        </motion.div>

        <DiamondDivider label="frase del día" scale={1.6} noLines />
        
        <div className="relative flex flex-col items-center px-6 w-full" style={{ marginTop: "clamp(2.5rem, 6vh, 5rem)", maxWidth: "800px" }}>

          {/* ambient glow */}
          <motion.div aria-hidden
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }} transition={{ duration: 2.5 }}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: "250px", height: "250px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)", zIndex: -1 }} />

          <motion.blockquote
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-15%" }} transition={{ duration: 1.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
              fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(1.2rem, 4.5vh, 4.5rem)", textAlign: "center",
              color: "var(--cream)", lineHeight: 1.3, letterSpacing: "0.01em",
              width: "100%", padding: "0 12vw" }}>
            {quote}
          </motion.blockquote>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }} transition={{ delay: 0.6, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ margin: "clamp(2rem, 4vh, 3rem) 0 clamp(1.5rem, 3vh, 2rem) 0" }}>
            <Rule w="40px" opacity={0.4} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-15%" }} transition={{ delay: 0.8, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: "clamp(0.5rem, 1vh, 0.9rem)", color: "var(--gold)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
            by win, for yeimy
          </motion.p>

          <motion.button
            onClick={() => setShowAllQuotes(true)}
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }} transition={{ delay: 1.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ opacity: 1 }} whileTap={{ scale: 0.96 }}
            style={{
              background: "none", border: "1px solid rgba(201,169,110,0.3)", borderRadius: "100px",
              padding: "0.45rem 1.4rem", cursor: "pointer",
              fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase",
              color: "var(--gold)", opacity: 0.7, marginTop: "clamp(2rem, 4vh, 3rem)",
              transition: "border-color 0.2s, opacity 0.2s",
            }}>
            ver todas
          </motion.button>
        </div>
      </PageSection>

      <AnimatePresence>
        {showAllQuotes && <QuotesModal onClose={() => setShowAllQuotes(false)} />}
      </AnimatePresence>

      {/* ══════ NOTIFICACIONES ══════ */}
      {!subscribed && <PageSection py="clamp(2rem, 5vh, 5rem)" minHeight="100svh" justify="center">
        <DiamondDivider label="recordatorio diario" scale={1.6} />
        <div className="flex flex-col items-center gap-5 text-center w-full" style={{ marginTop: "clamp(1.5rem, 4vh, 3rem)", padding: "0 10vw" }}>
          <motion.p
            initial={{ opacity: 0, y: 35, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-15%" }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1rem, 3.5vh, 2.5rem)", fontWeight: 300,
              fontStyle: "italic", color: "var(--cream)", lineHeight: 1.3 }}>
            Cada mañana, el countdown de nuestro día
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-15%" }} transition={{ delay: 0.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: "clamp(0.6rem, 1.2vh, 0.95rem)", color: "var(--muted)", maxWidth: "320px", lineHeight: 1.75 }}>
            Activa las notificaciones y recibe cada día<br />cuánto falta para la boda.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-15%" }} transition={{ delay: 0.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
            <Subscribe />
          </motion.div>
        </div>
      </PageSection>}

      {/* ══════ FOOTER ══════ */}
      <motion.footer
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 1 }}
        className="relative flex flex-col items-center gap-4 pt-10" 
        style={{ zIndex: 10, scrollSnapAlign: "end", paddingBottom: "clamp(4rem, 8vh, 6rem)" }}>
        <Rule w="clamp(50px,12vw,80px)" opacity={0.2} />
        <p style={{ fontSize: "clamp(0.5rem, 1vh, 0.95rem)", color: "var(--muted)", letterSpacing: "0.25em",
          textTransform: "uppercase", textAlign: "center", padding: "0 1rem" }}>
          Hecho con amor · Edwin &amp; Yeimy · 2026
        </p>
      </motion.footer>
    </main>
  );
}

function PageSection({ children, id, py = "5rem", minHeight, justify }: { children: React.ReactNode; id?: string; py?: string; minHeight?: string; justify?: string }) {
  return (
    <section id={id} className="relative flex flex-col items-center gap-6 px-5 text-center w-full"
      style={{ zIndex: 10, paddingTop: py, paddingBottom: py, minHeight, justifyContent: justify, scrollSnapAlign: "start" }}>
      {children}
    </section>
  );
}
