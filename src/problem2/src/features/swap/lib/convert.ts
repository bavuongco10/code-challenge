/** A finite price as an exact fraction, from its shortest round-trip decimal. */
function toFraction(p: number): [bigint, bigint] {
  const [mantissa, e] = p.toExponential().split("e");
  const [int, frac = ""] = mantissa.split(".");
  const exp = Number(e) - frac.length;
  const n = BigInt(int + frac);
  return exp >= 0 ? [n * 10n ** BigInt(exp), 1n] : [n, 10n ** BigInt(-exp)];
}

/** Exact conversion of raw units via USD prices. Floors unless `roundUp`. */
export function convert(
  raw: bigint,
  fromPrice: number,
  toPrice: number,
  roundUp = false,
): bigint {
  const [fn, fd] = toFraction(fromPrice);
  const [tn, td] = toFraction(toPrice);
  const num = raw * fn * td;
  const den = fd * tn;
  return roundUp ? (num + den - 1n) / den : num / den;
}

export const minReceived = (buyAmount: number, slippagePct: number) =>
  buyAmount * (1 - slippagePct / 100);
