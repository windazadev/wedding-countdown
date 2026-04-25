export const WEDDING_DATE = new Date("2026-05-09T17:00:00-05:00");
export const PROPOSAL_DATE = new Date("2026-03-13T00:00:00-05:00");
export const ANNIVERSARY_DAY = 26;

export const QUOTES = [
  "Cada día que pasa es un día más cerca de amarte para siempre.",
  "Pereira nos vio nacer como pareja, y nos verá prometernos eternidad.",
  "Contigo, cada segundo tiene sentido.",
  "El 9 de mayo no es solo una fecha — es el inicio de nuestra historia más grande.",
  "Tú eres la razón por la que creo en el amor para siempre.",
  "En tus ojos encontré mi hogar.",
  "Faltan pocos días y ya soy el hombre más afortunado del mundo.",
  "Desde el 13 de marzo supe que te quería a mi lado toda la vida.",
  "Eres mi promesa favorita.",
  "Cada anochecer nos acerca un poco más a nuestro día.",
  "Te elegí ayer, te elijo hoy y te elegiré el 9 de mayo y siempre.",
  "Nuestro amor es la historia más bonita que jamás hemos vivido.",
  "Pereira, Colombia — donde comenzó nuestro para siempre.",
  "Seré tuyo por el resto de mi vida.",
  "Juntos, hasta que los días ya no tengan nombre.",
];

export function getDailyQuote(): string {
  const now = new Date();
  const index = (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % QUOTES.length;
  return QUOTES[index];
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
