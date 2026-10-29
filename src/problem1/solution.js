// Negative n mirrors positive: sum_to_n(-3) === -(1 + 2 + 3) === -6.

// Largest |n| whose sum stays <= Number.MAX_SAFE_INTEGER (2^27 - 1, sum ~ 2^53 - 2^27).
// m * (m + 1) is always even, so it stays exact up to 2^54 and (a) needs no halve-first trick.
const MAX_N = 134_217_727;

const magnitude = (n) => {
    if (!Number.isSafeInteger(n)) throw new TypeError(`n must be a safe integer, got ${n}`);
    const m = Math.abs(n);
    if (m > MAX_N) throw new RangeError(`|n| must be <= ${MAX_N}, got ${n}`);
    return m;
};

// (a) Gauss formula. Time O(1), space O(1).
var sum_to_n_a = function(n) {
    const m = magnitude(n);
    const sum = (m * (m + 1)) / 2;
    return n < 0 ? -sum : sum;
};

// (b) Iterative loop. Time O(|n|), space O(1).
var sum_to_n_b = function(n) {
    const m = magnitude(n);
    let sum = 0;
    for (let i = 1; i <= m; i++) sum += i;
    return n < 0 ? -sum : sum;
};

// (c) Divide and conquer: split the range in half and recurse.
// Time O(|n|), space O(log |n|) call stack, so it never overflows the stack.
var sum_to_n_c = function(n) {
    const sumRange = (lo, hi) => {
        if (lo > hi) return 0;
        if (lo === hi) return lo;
        const mid = Math.floor((lo + hi) / 2);
        return sumRange(lo, mid) + sumRange(mid + 1, hi);
    };
    const sum = sumRange(1, magnitude(n));
    return n < 0 ? -sum : sum;
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c, MAX_N };
