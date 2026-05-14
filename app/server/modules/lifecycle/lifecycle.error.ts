import createError from "@fastify/error";

const ReentrancyError = createError<[string]>(
  "LIFECYCLE_REENTRANCY",
  'lifecycleBus.emit("%s") called re-entrantly during its own dispatch',
  500,
);

export { ReentrancyError };
