import {
  zIsoDateTime,
  zObject,
  zString,
  zUnknown,
} from "../../wrappers/zod.wrapper.ts";

const databaseHealthSchema = zObject({
  database: zString().optional(),
  details: zString().optional(),
  dsn: zString().optional(),
  error: zString().optional(),
  test_result: zUnknown().optional(),
  timestamp: zIsoDateTime(),
});

export { databaseHealthSchema };
