// Negative n mirrors positive: sum_to_n(-3) === -(1 + 2 + 3) === -6.

// (a) Gauss formula. Time O(1), space O(1).
function sum_to_n_a(n: number): number {
    const m = Math.abs(n);
    const sum = (m * (m + 1)) / 2;
    return n < 0 ? -sum : sum;
}

// (b) Iterative loop. Time O(|n|), space O(1).
function sum_to_n_b(n: number): number {
    let sum = 0;
    for (let i = 1; i <= Math.abs(n); i++) sum += i;
    return n < 0 ? -sum : sum;
}

// (c) Divide and conquer: split the range in half and recurse.
// Time O(|n|), space O(log |n|) call stack, so it never overflows the stack
// (a naive one-step-per-call recursion overflows at about 10k).
function sum_to_n_c(n: number): number {
    const sumRange = (lo: number, hi: number): number => {
        if (lo > hi) return 0;
        if (lo === hi) return lo;
        const mid = Math.floor((lo + hi) / 2);
        return sumRange(lo, mid) + sumRange(mid + 1, hi);
    };
    const sum = sumRange(1, Math.abs(n));
    return n < 0 ? -sum : sum;
}
