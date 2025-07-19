import type { MetaFunction } from "react-router";

import { Home } from "./Home";

const meta: MetaFunction = () => {
  return [
    { title: "This is the Visma Chili Home Page" },
    { name: "description", content: "This is the Visma Chili Home Page" },
  ];
};

export { Home as default, meta };
