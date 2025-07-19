import type { MetaFunction } from "react-router";

import { Calendar } from "./Calendar";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa - Calendar" },
    { name: "description", content: "Lazy Days Spa - Calendar Page" },
  ];
};

export { Calendar as default, meta };
