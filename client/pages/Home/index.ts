import type { MetaFunction } from "react-router";

import { Home } from "./Home";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa" },
    { name: "description", content: "Lazy Days Spa - Home Page" },
  ];
};

export { Home as default, meta };
