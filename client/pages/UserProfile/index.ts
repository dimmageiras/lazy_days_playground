import type { MetaFunction } from "react-router";

import { UserProfile } from "./UserProfile";

const meta: MetaFunction = () => {
  return [
    { title: "Lazy Days Spa - User Profile" },
    { name: "description", content: "Lazy Days Spa - User Profile Page" },
  ];
};

export { UserProfile as default, meta };
