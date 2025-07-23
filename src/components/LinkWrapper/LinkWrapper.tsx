import classNames from "classnames";
import type { JSX } from "react";
import { Link, NavLink } from "react-router";

import styles from "./LinkWrapper.module.scss";

const LinkAs = {
  external: 1,
  internal: 2,
  navLink: 3,
} as const;

interface LinkWrapperProps {
  as?: keyof typeof LinkAs;
  children: JSX.Element | string;
  className?: string;
  hasTextDecorationOnHover?: boolean;
  shouldOpenInNewTab?: boolean;
  shouldReplace?: boolean;
  to: string;
}

const LinkWrapper = ({
  as = "external",
  children,
  className,
  hasTextDecorationOnHover = false,
  shouldOpenInNewTab = false,
  shouldReplace = false,
  to,
}: LinkWrapperProps): JSX.Element => {
  const convertedType = Reflect.get(LinkAs, as);

  const linkClassNames = classNames(
    styles["link"],
    {
      [String(styles["hover-text-decoration"])]: hasTextDecorationOnHover,
    },
    className
  );

  switch (convertedType) {
    case LinkAs.internal:
      return (
        <Link className={linkClassNames} replace={shouldReplace} to={to}>
          {children}
        </Link>
      );

    case LinkAs.navLink:
      return (
        <NavLink className={linkClassNames} replace={shouldReplace} to={to}>
          {children}
        </NavLink>
      );

    case LinkAs.external:
    default:
      return (
        <a
          className={linkClassNames}
          href={to}
          rel="noopener noreferrer"
          {...(shouldOpenInNewTab && { target: "_blank" })}
        >
          {children}
        </a>
      );
  }
};

export { LinkWrapper };
