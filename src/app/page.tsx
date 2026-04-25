"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WEDDING_DATE,
  PROPOSAL_DATE,
  getDailyQuote,
  getTimeLeft,
  getDaysSince,
  pad,
} from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface Heart {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  char: string;
}

function FloatingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const CHARS = ["♡", "✦", "·", "♡", "✧", "♡"];
    const spawn = () => {
      counterRef.current += 1;
      const id = counterRef.current;
      setHearts((prev) => [
        ...prev.slice(-14),
        {
          id,
          x: Math.random() * 100,
          size: 8 + Math.random() * 10,
          duration: 12 + Math.random() * 16,
          delay: Math.random() * 2,
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
        },
      ]);
    };
    spawn();
    const interval = setInterval(spawn, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, 0.5, 0.4, 0] }}
          transition={{ duration: h.duration, delay: h.delay, ease: "linear" }}
          onAnimationComplete={() =>
            setHearts((p) => p.filter((x) => x.id !== h.id))
          }
          style={{
            position: "fixed",
            left: `${h.x}%`,
            bottom: 0,
            fontSize: h.size,
            color: "var(--rose)",
            filter: "blur(0.3px)",
          }}
        >
          {h.char}
        </motion.span>
      ))}
    </div>
  );
}

function CountUnit({
  value,
  label,
  delay,
}: {
  value: number;
  label: string;
  delay: number;
}) {
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 300);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="card-glass rounded-2xl flex items-center justify-center"
        style={{
          width: "clamp(68px, 18vw, 110px)",
          height: "clamp(72px, 19vw, 116px)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="number-glow font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "clamp(1.6rem, 5vw, 3rem)",
              color: pop ? "var(--gold-light)" : "var(--cream)",
              transition: "color 0.3s ease",
            }}
          >
            {pad(value)}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className="uppercase tracking-[0.2em] text-center"
        style={{
          fontSize: "clamp(0.55rem, 1.8vw, 0.7rem)",
          color: "var(--rose)",
          letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function PushSubscribeButton() {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "error" | "unsupported">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
    }
  }, []);

  const subscribe = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      });
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setState("subscribed");
      setMsg("¡Listo! Recibirás un recordatorio cada mañana.");
    } catch {
      setState("error");
      setMsg("Activa los permisos de notificación e intenta de nuevo.");
    }
  };

  if (state === "unsupported") return null;
  if (state === "subscribed") return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center text-sm"
      style={{ color: "var(--rose-light)" }}
    >
      ✦ {msg}
    </motion.p>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={subscribe}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        disabled={state === "loading"}
        className="rounded-full px-8 py-3 text-sm font-medium tracking-widest uppercase transition-opacity"
        style={{
          background: "linear-gradient(135deg, var(--rose) 0%, var(--gold) 100%)",
          color: "#0d0d1a",
          letterSpacing: "0.15em",
          opacity: state === "loading" ? 0.7 : 1,
        }}
      >
        {state === "loading" ? "Activando..." : "Recibir recordatorios diarios"}
      </motion.button>
      {state === "error" && (
        <p className="text-xs text-center" style={{ color: "var(--rose-light)", opacity: 0.8 }}>
          {msg}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(WEDDING_DATE));
  const [mounted, setMounted] = useState(false);
  const quote = getDailyQuote();
  const daysSinceProposal = getDaysSince(PROPOSAL_DATE);

  useEffect(() => {
    setMounted(true);
    const sw = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    };
    sw();
    const interval = setInterval(() => setTime(getTimeLeft(WEDDING_DATE)), 1000);
    return () => clearInterval(interval);
  }, []);

  const weddingPassed = time.total <= 0;

  return (
    <main className="relative min-h-svh flex flex-col">
      <FloatingHearts />

      {/* Radial bg glow */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(196,154,138,0.07) 0%, transparent 70%), " +
            "radial-gradient(ellipse 50% 40% at 20% 80%, rgba(201,169,110,0.05) 0%, transparent 60%)",
        }}
      />

      {/* ── HERO ── */}
      <section
        className="relative z-10 flex flex-col items-center justify-center min-h-svh px-6 py-16 text-center"
        style={{ gap: "clamp(1.5rem, 4vh, 2.5rem)" }}
      >
        {/* Names */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col items-center gap-1"
        >
          <p
            className="uppercase tracking-[0.35em]"
            style={{ fontSize: "clamp(0.6rem, 2vw, 0.75rem)", color: "var(--rose)", letterSpacing: "0.35em" }}
          >
            Edwin &amp; Yeimy
          </p>
          <h1
            className="gradient-text leading-tight"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(2.8rem, 9vw, 6rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.1,
            }}
          >
            {weddingPassed ? "¡Ya somos esposos!" : "Faltan…"}
          </h1>
        </motion.div>

        {/* Countdown units */}
        {!weddingPassed && mounted && (
          <div className="flex items-end gap-3 sm:gap-5">
            <CountUnit value={time.days}    label="días"     delay={0.2} />
            <Separator delay={0.3} />
            <CountUnit value={time.hours}   label="horas"    delay={0.4} />
            <Separator delay={0.5} />
            <CountUnit value={time.minutes} label="minutos"  delay={0.6} />
            <Separator delay={0.7} />
            <CountUnit value={time.seconds} label="segundos" delay={0.8} />
          </div>
        )}

        {/* Wedding info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col items-center gap-2"
        >
          <p
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1rem, 3vw, 1.35rem)",
              color: "var(--gold-light)",
              fontWeight: 300,
            }}
          >
            9 de Mayo, 2026
          </p>
          <p
            className="uppercase tracking-widest"
            style={{ fontSize: "clamp(0.55rem, 1.6vw, 0.68rem)", color: "var(--muted)", letterSpacing: "0.25em" }}
          >
            Pereira, Colombia
          </p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
          className="absolute bottom-8"
          style={{ color: "var(--rose)", fontSize: "0.8rem", letterSpacing: "0.2em" }}
        >
          ↓
        </motion.div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="relative z-10 px-8">
        <div className="divider max-w-sm" />
      </div>

      {/* ── MILESTONES ── */}
      <section className="relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="gradient-text"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            fontWeight: 400,
            fontStyle: "italic",
          }}
        >
          Nuestra historia
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <MilestoneCard
            number={String(daysSinceProposal)}
            label="días desde que dijiste sí"
            sublabel="13 de Marzo, 2026"
            delay={0.1}
          />
          <MilestoneCard
            number="26"
            label="el día que nos une cada mes"
            sublabel="nuestro aniversario"
            delay={0.25}
          />
          <MilestoneCard
            number="∞"
            label="años que nos quedan juntos"
            sublabel="Pereira nos espera"
            delay={0.4}
          />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="relative z-10 px-8">
        <div className="divider max-w-sm" />
      </div>

      {/* ── QUOTE ── */}
      <section className="relative z-10 flex flex-col items-center gap-6 px-8 py-16 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="card-glass rounded-3xl p-8 flex flex-col gap-4"
        >
          <p
            style={{
              color: "var(--rose)",
              fontSize: "clamp(0.55rem, 1.6vw, 0.68rem)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Frase del día
          </p>
          <blockquote
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--cream)",
              lineHeight: 1.65,
            }}
          >
            "{quote}"
          </blockquote>
          <p
            style={{
              color: "var(--gold)",
              fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
              letterSpacing: "0.2em",
            }}
          >
            — Edwin
          </p>
        </motion.div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="relative z-10 px-8">
        <div className="divider max-w-sm" />
      </div>

      {/* ── NOTIFICATIONS ── */}
      <section className="relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <h2
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(1.3rem, 4vw, 2rem)",
              fontWeight: 400,
              color: "var(--cream)",
            }}
          >
            Recibe el countdown cada día
          </h2>
          <p
            style={{
              fontSize: "clamp(0.78rem, 2.2vw, 0.88rem)",
              color: "var(--muted)",
              maxWidth: "280px",
              lineHeight: 1.7,
            }}
          >
            Activa las notificaciones y cada mañana te recordaremos cuánto falta.
          </p>
          <PushSubscribeButton />
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 text-center py-10"
        style={{
          color: "var(--muted)",
          fontSize: "clamp(0.6rem, 1.6vw, 0.7rem)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Hecho con amor para Yeimy ♡ Edwin
      </footer>
    </main>
  );
}

function Separator({ delay }: { delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      style={{
        color: "var(--rose)",
        fontSize: "clamp(1rem, 3vw, 1.5rem)",
        paddingBottom: "clamp(1.5rem, 4vw, 2rem)",
        opacity: 0.4,
      }}
    >
      :
    </motion.span>
  );
}

function MilestoneCard({
  number, label, sublabel, delay,
}: {
  number: string; label: string; sublabel: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="card-glass rounded-2xl p-6 flex flex-col items-center gap-2"
    >
      <span
        className="number-glow"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(2rem, 6vw, 3rem)",
          fontWeight: 500,
          color: "var(--gold-light)",
        }}
      >
        {number}
      </span>
      <p style={{ fontSize: "0.78rem", color: "var(--cream)", lineHeight: 1.4, maxWidth: "140px" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.62rem", color: "var(--rose)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {sublabel}
      </p>
    </motion.div>
  );
}
