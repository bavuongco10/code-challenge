import { MAX_DEADLINE } from "../constants.ts";

/** Keep first ".", cap decimals. Input must already contain only digits and ".". */
function limitDecimals(s: string, max: number): string {
  const i = s.indexOf(".");
  if (i < 0) return s;
  return (
    s.slice(0, i + 1) +
    s
      .slice(i + 1)
      .replaceAll(".", "")
      .slice(0, max)
  );
}

export function sanitizeAmount(raw: string): string {
  return limitDecimals(raw.replaceAll(",", ".").replace(/[^0-9.]/g, ""), 8);
}

export function sanitizeSlippage(prev: string, raw: string): string {
  const next = limitDecimals(raw.replace(/[^0-9.]/g, ""), 2);
  return toNumber(next) > 100 ? prev : next;
}

export function sanitizeDeadline(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? "" : String(Math.min(Number(digits), MAX_DEADLINE));
}

export function toNumber(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
