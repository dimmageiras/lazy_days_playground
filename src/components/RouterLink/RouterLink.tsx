import classNames from "classnames";
import type { JSX, Ref } from "react";
import { Link, NavLink } from "react-router";

import styles from "./RouterLink.module.scss";

const LinkAs = {
  external: 1,
  internal: 2,
  navLink: 3,
} as const;

interface RouterLinkProps {
  activeClassName?: string;
  as?: keyof typeof LinkAs;
  children?: JSX.Element | string | null;
  className?: string;
  hasTextDecorationOnHover?: boolean;
  ref?: Ref<HTMLAnchorElement | null>;
  shouldOpenInNewTab?: boolean;
  shouldReplace?: boolean;
  to: string;
}

const RouterLink = ({
  activeClassName,
  as = "external",
  children = null,
  className,
  hasTextDecorationOnHover = false,
  ref,
  shouldOpenInNewTab = false,
  shouldReplace = false,
  to,
}: RouterLinkProps): JSX.Element => {
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
        <Link
          className={linkClassNames}
          ref={ref}
          replace={shouldReplace}
          to={to}
        >
          {children}
        </Link>
      );

    case LinkAs.navLink:
      return (
        <NavLink
          className={({ isActive }): string =>
            classNames(linkClassNames, {
              [String(activeClassName)]: isActive,
            })
          }
          ref={ref}
          replace={shouldReplace}
          to={to}
        >
          {children}
        </NavLink>
      );

    case LinkAs.external:
    default:
      return (
        <a
          className={linkClassNames}
          href={to}
          ref={ref}
          rel="noopener noreferrer"
          {...(shouldOpenInNewTab && { target: "_blank" })}
        >
          {children}
        </a>
      );
  }
};

export { RouterLink };
