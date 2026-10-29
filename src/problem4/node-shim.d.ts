// Minimal typings so tsc is green without @types/node (nothing is installed in the repo).
declare module "node:test" {
    const test: (name: string, fn: () => void) => void;
    export default test;
}
declare module "node:assert/strict" {
    const assert: {
        equal(a: unknown, b: unknown, msg?: string): void;
        ok(v: unknown, msg?: string): void;
        throws(fn: () => unknown, e?: unknown): void;
    };
    export default assert;
}
