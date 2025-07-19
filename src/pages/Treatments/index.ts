import type { MetaFunction } from "react-router";

import { Treatments } from "./Treatments";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa - Treatments" },
    { name: "description", content: "Lazy Days Spa - Treatments Page" },
  ];
};

export { Treatments as default, meta };
