// Run: node --test src/problem1
const test = require("node:test");
const assert = require("node:assert/strict");
const { sum_to_n_a, sum_to_n_b, sum_to_n_c, MAX_N } = require("./solution.js");

const all = [sum_to_n_a, sum_to_n_b, sum_to_n_c];

test("known values", () => {
    for (const f of all) for (const [n, s] of [[0, 0], [1, 1], [5, 15], [-5, -15], [100, 5050]]) assert.equal(f(n), s);
});

// Independent oracle: BigInt loop, shares no code with the solutions.
const oracle = (n) => {
    let s = 0n;
    for (let i = 1n; i <= BigInt(Math.abs(n)); i++) s += i;
    return n < 0 ? -s : s;
};

test("all three match an independent BigInt oracle", () => {
    const ns = [10_000, 123_456, -99_999];
    for (let n = -500; n <= 500; n++) ns.push(n);
    for (const f of all) for (const n of ns) assert.equal(BigInt(f(n)), oracle(n), `${f.name}(${n})`);
});

test("zero is +0", () => {
    for (const f of all) assert.ok(Object.is(f(0), 0) && Object.is(f(-0), 0), f.name);
});

test("boundary +-MAX_N is exact and safe", () => {
    const m = BigInt(MAX_N);
    const expected = (m * (m + 1n)) / 2n; // closed form
    for (const f of all) {
        for (const [n, e] of [[MAX_N, expected], [-MAX_N, -expected]]) {
            const r = f(n);
            assert.ok(Number.isSafeInteger(r), `${f.name}(${n}) not safe`);
            assert.equal(BigInt(r), e, `${f.name}(${n})`);
        }
    }
});

test("rejects out-of-contract input", () => {
    for (const f of all) {
        for (const bad of [1.5, NaN, Infinity, "5", null]) assert.throws(() => f(bad), TypeError);
        assert.throws(() => f(MAX_N + 1), RangeError);
    }
});
