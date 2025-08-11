import type { JSX } from "react";

import { ListRenderer } from "@client/components/ListRenderer";

import { Filter } from "./components/Filter";

const TREATMENTS = [
  {
    id: 1,
    name: "Massage",
  },
  {
    id: 2,
    name: "Facial",
  },
  {
    id: 3,
    name: "Scrub",
  },
] as const;

const Filters = (): JSX.Element => {
  const filters = [{ id: 0, name: "All" }, ...TREATMENTS] as const;

  return (
    <ListRenderer
      data={filters}
      getKey={(treatment): number => treatment.id}
      renderComponent={({ data: filter }): JSX.Element => {
        return <Filter filter={filter} />;
      }}
    />
  );
};

export { Filters };
