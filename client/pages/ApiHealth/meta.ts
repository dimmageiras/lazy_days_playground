import type { MetaFunction } from "react-router";

const meta: MetaFunction = () => {
  return [
    { title: "API Health Status" },
    {
      name: "description",
      content: "API Health Status - Server and Database Monitoring",
    },
  ];
};

export { meta };
