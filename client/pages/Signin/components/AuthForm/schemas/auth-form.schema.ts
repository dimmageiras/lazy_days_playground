import { zEmail, zObject, zString } from "@shared/wrappers/zod.wrapper";

const signinSchema = zObject({
  email: zEmail("Entered value does not match email format"),
  password: zString().min(5, "min length is 5").max(50, "max length is 50"),
});

const signupSchema = zObject({
  confirmPassword: zString()
    .min(5, "min length is 5")
    .max(50, "max length is 50"),
  email: zEmail("Entered value does not match email format"),
  password: zString().min(5, "min length is 5").max(50, "max length is 50"),
});

export { signinSchema, signupSchema };
