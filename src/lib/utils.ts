export const WEDDING_DATE = new Date("2026-05-09T00:00:00-05:00");
export const PROPOSAL_DATE = new Date("2026-03-13T00:00:00-05:00");
export const ANNIVERSARY_DAY = 26;

export const COUNTDOWN_QUOTES: Record<number, string> = {
  12: "El tiempo dejó de ser una medida y se convirtió en la urgencia vital de llegar a ti.",
  11: "Eres la única coincidencia perfecta en un universo que antes me parecía lleno de caos.",
  10: "Si el destino ya estaba escrito, tú eres la única certeza que siempre quise leer.",
   9: "Hiciste de mis días comunes una obra de arte; a tu lado, hasta el silencio es poesía.",
   8: "Mi hogar no tiene coordenadas físicas. Mi hogar es tu voz, tu paz y la luz inmensa de nuestra hija.",
   7: "Antes de ti, solo sobrevivía al azar. Contigo, descubrí que la magia tiene nombre propio.",
   6: "Eres la melodía exacta que le dio sentido y compás al ruido del mundo. Ya casi llegamos.",
   5: "Nuestro amor no es casualidad; es la prueba más hermosa de que Dios escuchó las oraciones que ni siquiera sabíamos que estábamos haciendo.",
   4: "Cuando Dios te puso en mi camino, no solo me entregó una compañera, me dio el milagro de entender su gracia a través de tus ojos.",
   3: "El hilo que nos une no lo tejimos nosotros; lo trazó la mano de Dios desde antes de que el tiempo existiera.",
   2: "Que este matrimonio sea un altar, no solo para nosotros, sino un reflejo del amor infinito que Dios ya derramó sobre nuestra familia.",
   1: "Mañana le juramos a Dios lo que Él ya sabe: que nos creó con el propósito exacto de encontrarnos y hacernos uno solo.",
   0: "¡Hoy es nuestro día! El amor que construimos llega a su altar. ♡",
};

// Returns calendar days remaining based on Colombia date (UTC-5, no DST).
// Uses date comparison, not raw hours, so 8pm on May 8 correctly returns 1 (not 0).
export function getColombiaCalendarDays(): number {
  const nowUTC = Date.now();
  // Shift to Colombia time then zero out the time portion to get midnight UTC of that Colombia date
  const colombiaMidnight = new Date(nowUTC - 5 * 3_600_000);
  colombiaMidnight.setUTCHours(0, 0, 0, 0);
  // May 9 midnight Colombia = May 9 05:00 UTC
  const weddingMidnightUTC = new Date("2026-05-09T05:00:00Z");
  const days = Math.round((weddingMidnightUTC.getTime() - colombiaMidnight.getTime()) / 86_400_000);
  return Math.max(0, days);
}

export function getDailyQuote(): string {
  const days = getColombiaCalendarDays();
  return COUNTDOWN_QUOTES[days] ?? "Cada día que pasa es un paso más hacia nuestro para siempre.";
}

export function getSentQuotes(): { day: number; date: string; quote: string }[] {
  const currentDays = getColombiaCalendarDays();
  const weddingMidnightUTC = new Date("2026-05-09T05:00:00Z");
  const result: { day: number; date: string; quote: string }[] = [];
  for (let d = 12; d >= currentDays; d--) {
    const dateUTC = new Date(weddingMidnightUTC.getTime() - d * 86_400_000);
    const dateStr = dateUTC.toLocaleDateString("es-CO", {
      day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota",
    });
    result.push({
      day: d,
      date: dateStr,
      quote: COUNTDOWN_QUOTES[d] ?? "Cada día que pasa es un paso más hacia nuestro para siempre.",
    });
  }
  return result.reverse(); // más reciente primero
}

export function getTimeLeft(target: Date) {
  const now = Date.now();
  const diff = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

export function getDaysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function getMonthsSince(day: number): number {
  const now = new Date();
  const currentDay = now.getDate();
  const months =
    (now.getFullYear() - 2025) * 12 + now.getMonth() -
    (currentDay >= day ? 0 : 1);
  return Math.max(0, months);
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}
