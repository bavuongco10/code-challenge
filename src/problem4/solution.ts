// Negative n mirrors positive: sum_to_n(-3) === -(1 + 2 + 3) === -6.

// Largest |n| whose sum stays <= Number.MAX_SAFE_INTEGER (2^27 - 1, sum ~ 2^53 - 2^27).
// m * (m + 1) is always even, so it stays exact up to 2^54 and (a) needs no halve-first trick.
export const MAX_N = 134_217_727;

// `number` doesn't encode "integer", so the contract is checked at runtime.
function magnitude(n: number): number {
    if (!Number.isSafeInteger(n)) throw new TypeError(`n must be a safe integer, got ${n}`);
    const m = Math.abs(n);
    if (m > MAX_N) throw new RangeError(`|n| must be <= ${MAX_N}, got ${n}`);
    return m;
}

// (a) Gauss formula. Time O(1), space O(1).
export function sum_to_n_a(n: number): number {
    const m = magnitude(n);
    const sum = (m * (m + 1)) / 2;
    return n < 0 ? -sum : sum;
}

// (b) Iterative loop. Time O(|n|), space O(1).
export function sum_to_n_b(n: number): number {
    const m = magnitude(n);
    let sum = 0;
    for (let i = 1; i <= m; i++) sum += i;
    return n < 0 ? -sum : sum;
}

function sumRange(lo: number, hi: number): number {
    if (lo > hi) return 0;
    if (lo === hi) return lo;
    const mid = Math.floor((lo + hi) / 2);
    return sumRange(lo, mid) + sumRange(mid + 1, hi);
}

// (c) Divide and conquer: split the range in half and recurse.
// T(n) = 2T(n/2) + O(1) => O(|n|) time, O(log |n|) call stack (depth ~27 at MAX_N),
// so it never overflows the stack (a naive one-step-per-call recursion overflows at about 10k).
export function sum_to_n_c(n: number): number {
    const sum = sumRange(1, magnitude(n));
    return n < 0 ? -sum : sum;
}
