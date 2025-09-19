import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const serverHealthSchema = zObject({
  error: zString().optional(),
  service: zString().optional(),
  status: zString().optional(),
  timestamp: zIsoDateTime(),
});

export { serverHealthSchema };
