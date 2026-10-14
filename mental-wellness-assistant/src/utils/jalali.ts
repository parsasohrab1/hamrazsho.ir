/**
 * Gregorian → Solar Hijri (Jalali) date conversion, used to reset the
 * monthly free-use counters on the Persian month boundary (1st of
 * Farvardin, Ordibehesht, …) rather than the Gregorian one. Pure
 * arithmetic (the standard jalaali-js algorithm) — no dependence on the
 * JS engine's Intl calendar support, which varies across Android devices.
 */
const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

/** `leap`: years since the last leap year (0 = jy itself is leap);
 *  `march`: the March day on which Farvardin 1 of jy falls. */
const jalCal = (jy: number) => {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { gy, march, leap };
};

/** Gregorian date → Julian Day Number. */
const g2d = (gy: number, gm: number, gd: number) => {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
};

export const toJalali = (date: Date): { jy: number; jm: number; jd: number } => {
  const gy = date.getFullYear();
  const jdn = g2d(gy, date.getMonth() + 1, date.getDate());
  let jy = gy - 621;
  const r = jalCal(jy);
  let k = jdn - g2d(gy, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1; // previous year was leap → Esfand has 30 days
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
};

/** "1405-07" — the key the monthly counters are stored under. */
export const jalaliMonthKey = (date: Date = new Date()): string => {
  const { jy, jm } = toJalali(date);
  return `${jy}-${String(jm).padStart(2, "0")}`;
};
