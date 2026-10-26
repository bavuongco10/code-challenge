export const convert = (amount: number, fromPrice: number, toPrice: number) =>
  (amount * fromPrice) / toPrice;

export const minReceived = (buyAmount: number, slippagePct: number) =>
  buyAmount * (1 - slippagePct / 100);
