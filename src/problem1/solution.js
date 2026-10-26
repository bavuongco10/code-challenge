var sum_to_n_a = function(n) {
    const m = Math.abs(n);
    return Math.sign(n) * (m * (m + 1)) / 2;
};

var sum_to_n_b = function(n) {
    const step = n < 0 ? -1 : 1;
    let sum = 0;
    for (let i = step; Math.abs(i) <= Math.abs(n); i += step)
        sum += i;
    return sum;
};

var sum_to_n_c = function(n) {
    if (n === 0) return 0;
    return n + sum_to_n_c(n - Math.sign(n));
};