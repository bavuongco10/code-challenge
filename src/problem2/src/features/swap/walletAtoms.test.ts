import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WALLET_KEY, WALLET_MODE_KEY } from "./constants.ts";
import {
  applySwapAtom,
  balancesAtom,
  connectAtom,
  connectedAtom,
  disconnectAtom,
  walletAtom,
  walletModeAtom,
} from "./walletAtoms.ts";

let mem: Map<string, string>;
beforeEach(() => {
  mem = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  });
});

const act = (sellAmount: string, buyAmount: string) => ({
  sell: "ETH",
  sellAmount,
  buy: "USDC",
  buyAmount,
  at: 1,
});

describe("wallet atoms", () => {
  it("defaults: demo mode, no wallet, nothing written", () => {
    const s = createStore();
    expect(s.get(walletModeAtom)).toBe("demo");
    expect(s.get(walletAtom)).toBeNull();
    expect(s.get(connectedAtom)).toBe(false);
    expect(s.get(balancesAtom)).toBeNull();
    expect(mem.size).toBe(0);
  });

  it("first connect creates the default wallet", () => {
    const s = createStore();
    s.set(connectAtom);
    expect(JSON.parse(mem.get(WALLET_KEY)!)).toMatchObject({
      connected: true,
      address: "0x1234567890abcdef1234567890abcdef12345678",
      balances: { ETH: "1.5", USDC: "1000", SWTH: "250000" },
      activity: [],
    });
    expect(s.get(balancesAtom)).toMatchObject({ ETH: 1.5, USDC: 1000 });
    expect(s.get(balancesAtom)!.NOPE ?? 0).toBe(0);
  });

  it("corrupt or wrong-shape storage falls back to default", () => {
    mem.set(WALLET_KEY, "{not json");
    expect(createStore().get(walletAtom)).toBeNull();
    mem.set(WALLET_KEY, JSON.stringify({ connected: "yes" }));
    expect(createStore().get(walletAtom)).toBeNull();
    mem.set(WALLET_MODE_KEY, '"mainnet"');
    expect(createStore().get(walletModeAtom)).toBe("demo");
  });

  it("disconnect keeps data; reconnect keeps balances", () => {
    const s = createStore();
    s.set(connectAtom);
    s.set(applySwapAtom, act("0.5", "1000"));
    s.set(disconnectAtom);
    expect(s.get(connectedAtom)).toBe(false);
    expect(s.get(balancesAtom)).toBeNull();
    expect(s.get(walletAtom)).toMatchObject({
      balances: { ETH: "1" },
      activity: [{ at: 1 }],
    });
    s.set(connectAtom);
    expect(s.get(balancesAtom)).toMatchObject({ ETH: 1, USDC: 2000 });
  });

  it("swap math is trimmed to 8 decimals and prepends activity", () => {
    const s = createStore();
    s.set(connectAtom);
    expect(s.set(applySwapAtom, act("0.1", "0.123456789"))).toBe(true);
    const w = s.get(walletAtom)!;
    expect(w.balances.ETH).toBe("1.4");
    expect(w.balances.USDC).toBe("1000.12345679");
    s.set(applySwapAtom, { ...act("0.1", "1"), at: 2 });
    expect(s.get(walletAtom)!.activity.map((a) => a.at)).toEqual([2, 1]);
  });

  it("too-low swap is rejected and changes nothing", () => {
    const s = createStore();
    s.set(connectAtom);
    const before = mem.get(WALLET_KEY);
    expect(s.set(applySwapAtom, act("2", "3000"))).toBe(false);
    expect(mem.get(WALLET_KEY)).toBe(before);
    s.set(disconnectAtom);
    expect(s.set(applySwapAtom, act("0.1", "1"))).toBe(false);
  });

  it("changing mode disconnects and persists", () => {
    const s = createStore();
    s.set(connectAtom);
    s.set(walletModeAtom, "sepolia");
    expect(s.get(connectedAtom)).toBe(false);
    expect(mem.get(WALLET_MODE_KEY)).toBe('"sepolia"');
  });

  it("in sepolia mode, reads sepolia wallet and activity", () => {
    const s = createStore();
    s.set(walletModeAtom, "sepolia");
    expect(s.get(connectedAtom)).toBe(false);
    expect(s.get(walletAtom)).toBeNull();
  });
});
