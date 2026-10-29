// Negative n mirrors positive: sum_to_n(-3) === -(1 + 2 + 3) === -6.

// (a) Gauss formula.
var sum_to_n_a = function(n) {
    const m = Math.abs(n);
    const sum = (m * (m + 1)) / 2;
    return n < 0 ? -sum : sum;
};

// (b) Iterative loop.
var sum_to_n_b = function(n) {
    let sum = 0;
    for (let i = 1; i <= Math.abs(n); i++) sum += i;
    return n < 0 ? -sum : sum;
};

// (c) Divide and conquer: split the range in half and recurse (stack depth log n).
var sum_to_n_c = function(n) {
    const sumRange = (lo, hi) => {
        if (lo > hi) return 0;
        if (lo === hi) return lo;
        const mid = Math.floor((lo + hi) / 2);
        return sumRange(lo, mid) + sumRange(mid + 1, hi);
    };
    const sum = sumRange(1, Math.abs(n));
    return n < 0 ? -sum : sum;
};
