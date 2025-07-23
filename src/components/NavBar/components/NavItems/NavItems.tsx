import type { JSX } from "react";

import { LinkWrapper } from "~/components/LinkWrapper";

import styles from "./NavItems.module.scss";

const NavItems = (): JSX.Element[] => {
  const navItems = [
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

  return navItems.map((item): JSX.Element => {
    return (
      <LinkWrapper
        activeClassName={styles["active"]}
        as="navLink"
        className={styles["nav-item"]}
        key={item.label}
        shouldReplace
        to={item.to}
      >
        {item.label}
      </LinkWrapper>
    );
  });
};

export { NavItems };
