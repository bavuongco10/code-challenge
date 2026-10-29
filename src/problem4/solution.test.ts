// Run: node --test src/problem4 (Node >= 23.6 strips types natively)
import test from "node:test";
import assert from "node:assert/strict";
import { sum_to_n_a, sum_to_n_b, sum_to_n_c, MAX_N } from "./solution.ts";

const all = [sum_to_n_a, sum_to_n_b, sum_to_n_c];

test("known values", () => {
    for (const f of all) for (const [n, s] of [[0, 0], [1, 1], [5, 15], [-5, -15], [100, 5050]]) assert.equal(f(n), s);
});

test("all three agree on -500..500", () => {
    for (let n = -500; n <= 500; n++) {
        assert.equal(sum_to_n_b(n), sum_to_n_a(n));
        assert.equal(sum_to_n_c(n), sum_to_n_a(n));
    }
});

test("boundary is exact and safe", () => {
    assert.equal(sum_to_n_a(MAX_N), 9_007_199_187_632_128);
    assert.equal(sum_to_n_c(MAX_N), sum_to_n_a(MAX_N));
    assert.equal(sum_to_n_a(-MAX_N), -sum_to_n_a(MAX_N));
});

test("rejects out-of-contract input", () => {
    for (const f of all) {
        for (const bad of [1.5, NaN, Infinity, "5", null]) assert.throws(() => f(bad as number), TypeError);
        assert.throws(() => f(MAX_N + 1), RangeError);
    }
});
