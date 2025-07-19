import type { MetaFunction } from "react-router";

import { Staff } from "./Staff";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa - Staff" },
    { name: "description", content: "Lazy Days Spa - Staff Page" },
  ];
};

export { Staff as default, meta };
