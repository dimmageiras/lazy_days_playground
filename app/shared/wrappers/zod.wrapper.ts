import { z } from "zod";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

const zNumber = z.number;
const zObject = z.object;
const zString = z.string;

export { zNumber, zObject, zString };
