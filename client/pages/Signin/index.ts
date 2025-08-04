import type { MetaFunction } from "react-router";

import { Signin } from "./Signin";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa - Signin" },
    { name: "description", content: "Lazy Days Spa - Signin Page" },
  ];
};

export { Signin as default, meta };
