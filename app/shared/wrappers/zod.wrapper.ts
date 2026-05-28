import { z } from "zod";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

const zCoerce = z.coerce;
const zObject = z.object;

export { zCoerce, zObject };
