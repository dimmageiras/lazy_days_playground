import type { JSX } from "react";

import { ListRenderer } from "@client/components/ListRenderer";
import { RouterLink } from "@client/components/RouterLink";

import styles from "./NavItems.module.scss";

const NAV_ITEMS = [
  {
    "aria-label": "Treatments",
    label: "Treatments",
    to: "/treatments",
  },
  {
    "aria-label": "Staff",
    label: "Staff",
    to: "/staff",
  },
  {
    "aria-label": "Calendar",
    label: "Calendar",
    to: "/calendar",
  },
];

const NavItems = (): JSX.Element => {
  return (
    <ListRenderer
      data={NAV_ITEMS}
      getKey={(item): string => item.label}
      renderComponent={({ data }): JSX.Element => {
        return (
          <RouterLink
            activeClassName={styles["active"]}
            aria-label={data["aria-label"]}
            as="navLink"
            className={String(styles["nav-item"])}
            key={data.label}
            prioritizeOnClick
            shouldReplace
            to={data.to}
          >
            {data.label}
          </RouterLink>
        );
      }}
    />
  );
};

export { NavItems };
