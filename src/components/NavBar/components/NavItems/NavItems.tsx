import type { JSX } from "react";

import { ListRenderer } from "~/components/ListRenderer";
import { RouterLink } from "~/components/RouterLink";

import styles from "./NavItems.module.scss";

const NAV_ITEMS = [
  {
    label: "Treatments",
    to: "/treatments",
  },
  {
    label: "Staff",
    to: "/staff",
  },
  {
    label: "Calendar",
    to: "/calendar",
  },
];

const NavItems = (): JSX.Element => {
  return (
    <ListRenderer
      data={NAV_ITEMS}
      getKey={(item) => item.label}
      renderComponent={({ data }): JSX.Element => {
        return (
          <RouterLink
            activeClassName={styles["active"]}
            as="navLink"
            className={styles["nav-item"]}
            key={data.label}
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
