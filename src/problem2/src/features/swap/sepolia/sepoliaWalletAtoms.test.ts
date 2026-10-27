import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEPOLIA_ACTIVITY_PREFIX, SEPOLIA_CHAIN_ID } from "../constants.ts";
import {
  addSepoliaActivityAtom,
  isWrongChainAtom,
  sepoliaAccountAtom,
  sepoliaActivityAtom,
  sepoliaAddressAtom,
  sepoliaChainIdAtom,
  sepoliaConnectedAtom,
} from "./sepoliaWalletAtoms.ts";

let mem: Map<string, string>;
beforeEach(() => {
  mem = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  });
});

describe("sepolia wallet atoms", () => {
  it("defaults to disconnected, no address, no chain", () => {
    const s = createStore();
    expect(s.get(sepoliaConnectedAtom)).toBe(false);
    expect(s.get(sepoliaAddressAtom)).toBeNull();
    expect(s.get(sepoliaChainIdAtom)).toBeNull();
    expect(s.get(isWrongChainAtom)).toBe(false);
    expect(s.get(sepoliaActivityAtom)).toEqual([]);
  });

  it("updates connection status and detects wrong chain", () => {
    const s = createStore();
    const addr = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;

    // Connected on Sepolia (11155111)
    s.set(sepoliaAccountAtom, {
      connected: true,
      address: addr,
      chainId: SEPOLIA_CHAIN_ID,
    });
    expect(s.get(sepoliaConnectedAtom)).toBe(true);
    expect(s.get(sepoliaAddressAtom)).toBe(addr);
    expect(s.get(isWrongChainAtom)).toBe(false);

    // Switched to Ethereum Mainnet (1) -> wrong chain!
    s.set(sepoliaAccountAtom, {
      connected: true,
      address: addr,
      chainId: 1,
    });
    expect(s.get(isWrongChainAtom)).toBe(true);
  });

  it("stores and retrieves activity per address in localStorage", () => {
    const s = createStore();
    const addr = "0x1234567890abcdef1234567890abcdef12345678" as const;
    s.set(sepoliaAccountAtom, {
      connected: true,
      address: addr,
      chainId: SEPOLIA_CHAIN_ID,
    });

    const act1 = {
      sell: "ETH",
      sellAmount: "1",
      buy: "USDC",
      buyAmount: "2000",
      at: 1000,
      hash: "0xhash1",
    };
    s.set(addSepoliaActivityAtom, act1);

    expect(s.get(sepoliaActivityAtom)).toEqual([act1]);

    const storedKey = `${SEPOLIA_ACTIVITY_PREFIX}${addr.toLowerCase()}`;
    expect(JSON.parse(mem.get(storedKey)!)).toEqual([act1]);
  });
});
