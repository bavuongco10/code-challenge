// (a) Gauss formula. Time O(1), space O(1).
function sum_to_n_a(n: number): number {
    const m = Math.abs(n);
    return Math.sign(n) * (m * (m + 1)) / 2;
}

// (b) Loop. Time O(|n|), space O(1).
function sum_to_n_b(n: number): number {
    const step = n < 0 ? -1 : 1;
    let sum = 0;
    for (let i = step; Math.abs(i) <= Math.abs(n); i += step) sum += i;
    return sum;
}

// (c) Recursion. Time O(|n|), space O(|n|) call stack — overflows for large |n| (~10k+).
function sum_to_n_c(n: number): number {
    if (n === 0) return 0;
    return n + sum_to_n_c(n - Math.sign(n));
}
