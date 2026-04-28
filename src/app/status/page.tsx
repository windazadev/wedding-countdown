import { notFound } from "next/navigation";
import { getTimeLeft, WEDDING_DATE } from "@/lib/utils";
import { getAllSubscriptions } from "@/lib/subscriptions";

const STATUS_TOKEN = process.env.STATUS_TOKEN ?? "EdwinYeimy0926";

interface Step {
  step: string;
  status: "done" | "in-progress" | "pending" | "error";
  ts?: string;
  note?: string;
}

const BUILD_PROGRESS: Step[] = [
  { step: "Scaffold Next.js 16 + Tailwind", status: "done", ts: "2026-04-25" },
  { step: "Instalar dependencias (framer-motion, web-push)", status: "done", ts: "2026-04-25" },
  { step: "UI principal (countdown, milestones, quote, notif)", status: "done", ts: "2026-04-25" },
  { step: "PWA manifest + service worker", status: "done", ts: "2026-04-25" },
  { step: "API web push (subscribe + cron diario)", status: "done", ts: "2026-04-25" },
  { step: "Página /status con progreso en vivo", status: "done", ts: "2026-04-25" },
  { step: "Vercel cron diario 8am hora Colombia (13:00 UTC)", status: "done", ts: "2026-04-25" },
  { step: "Repo GitHub windazadev/wedding-countdown", status: "done", ts: "2026-04-25" },
  { step: "Deploy a Vercel (production)", status: "done", ts: "2026-04-25", note: "wedding-countdown-psi.vercel.app" },
  { step: "Env vars en Vercel (VAPID, CRON, STATUS)", status: "done", ts: "2026-04-25" },
  { step: "Migrar storage a Vercel Blob (fix Android)", status: "done", ts: "2026-04-28", note: "Suscripciones ahora en Blob, no env vars" },
  { step: "Retry con backoff en cron push", status: "done", ts: "2026-04-28", note: "3 reintentos con backoff exponencial" },
  { step: "Service Worker v2 (cache fix + renotify)", status: "done", ts: "2026-04-28" },
  { step: "Verificar notificaciones Android", status: "in-progress", note: "Pendiente re-suscripción tras deploy" },
];

function StatusDot({ status }: { status: Step["status"] }) {
  const map = {
    done: "bg-emerald-400",
    "in-progress": "bg-amber-400 animate-pulse",
    pending: "bg-zinc-600",
    error: "bg-red-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />;
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (token !== STATUS_TOKEN) return notFound();

  const time = getTimeLeft(WEDDING_DATE);
  const done = BUILD_PROGRESS.filter((s) => s.status === "done").length;
  const total = BUILD_PROGRESS.length;
  const pct = Math.round((done / total) * 100);

  const allSubs = await getAllSubscriptions();
  const knownNames = ["EDWIN", "YEIMY"];
  const subsDiag = knownNames.map((name) => {
    const found = allSubs.find((s) => s.name === name);
    let host: string | null = null;
    if (found) {
      try { host = new URL((found.sub as { endpoint: string }).endpoint).host; } catch {}
    }
    const provider = host?.includes("fcm.googleapis.com")
      ? "FCM (Android/Chrome)"
      : host?.includes("web.push.apple.com")
        ? "APNs (iOS/Safari)"
        : host?.includes("mozilla.com")
          ? "Mozilla autopush"
          : host
            ? "Otro"
            : null;
    return { name, host, provider, present: !!found };
  });

  return (
    <main
      className="min-h-svh flex flex-col items-center justify-start px-5 py-12"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col gap-1">
          <p style={{ color: "var(--rose)", fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Estado del deploy
          </p>
          <h1
            className="gradient-text"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "2rem",
              fontStyle: "italic",
            }}
          >
            Edwin &amp; Yeimy
          </h1>
        </div>

        {/* Countdown summary */}
        <div
          className="card-glass rounded-2xl p-5 flex flex-col items-center gap-1 text-center"
        >
          <p style={{ color: "var(--muted)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Faltan para la boda
          </p>
          <p
            className="number-glow"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "2.4rem",
              color: "var(--gold-light)",
            }}
          >
            {time.days} días
          </p>
          <p style={{ color: "var(--rose)", fontSize: "0.75rem" }}>
            {time.hours}h {time.minutes}m {time.seconds}s
          </p>
        </div>

        {/* Progress bar */}
        <div className="card-glass rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p style={{ color: "var(--cream)", fontSize: "0.78rem", fontWeight: 500 }}>
              Progreso del deploy
            </p>
            <p style={{ color: "var(--gold)", fontSize: "0.78rem" }}>{pct}%</p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--rose), var(--gold))",
              }}
            />
          </div>

          {/* Steps */}
          <ul className="flex flex-col gap-2 mt-2">
            {BUILD_PROGRESS.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 shrink-0">
                  <StatusDot status={s.status} />
                </span>
                <div className="flex flex-col">
                  <span style={{ fontSize: "0.78rem", color: s.status === "done" ? "var(--cream)" : s.status === "in-progress" ? "var(--gold-light)" : "var(--muted)" }}>
                    {s.step}
                  </span>
                  {s.ts && (
                    <span style={{ fontSize: "0.62rem", color: "var(--muted)" }}>{s.ts}</span>
                  )}
                  {s.note && (
                    <span style={{ fontSize: "0.62rem", color: "var(--rose-light)" }}>{s.note}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Suscripciones push */}
        <div className="card-glass rounded-2xl p-5 flex flex-col gap-3">
          <p style={{ color: "var(--cream)", fontSize: "0.78rem", fontWeight: 500 }}>
            Suscripciones push
          </p>
          <ul className="flex flex-col gap-2">
            {subsDiag.map((s) => (
              <li key={s.name} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${s.present ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span style={{ fontSize: "0.78rem", color: "var(--cream)" }}>{s.name}</span>
                  {s.provider && (
                    <span style={{ fontSize: "0.62rem", color: "var(--gold-light)" }}>· {s.provider}</span>
                  )}
                </div>
                <span style={{ fontSize: "0.6rem", color: "var(--muted)", marginLeft: "1rem", wordBreak: "break-all" }}>
                  {s.host ?? "sin suscripción"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Note */}
        <p className="text-center" style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.12em" }}>
          Actualizado manualmente. Si no hay cambios en 30 min y el deploy está pendiente, algo puede estar trabado.
        </p>

        <p className="text-center" style={{ fontSize: "0.6rem", color: "var(--rose)", opacity: 0.5 }}>
          Hecho con amor ♡
        </p>
      </div>
    </main>
  );
}
