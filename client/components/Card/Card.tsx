import classNames from "classnames";
import type { JSX, PropsWithChildren } from "react";

import styles from "./Card.module.scss";

/**
 * Props interface for the Card component
 */
interface CardProps extends PropsWithChildren {
  /** Whether the card is hidden */
  isHidden?: boolean;
}

/**
 * A base card component that provides a consistent container style for content.
 * This component can be used as a building block for more specific card implementations.
 *
 * @example
 * ```tsx
 * <Card isHidden={false}>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 *
 * @param props - The Card component props
 * @param props.children - The content to be rendered inside the card
 * @param props.isHidden - Whether the card should be hidden (default: false)
 * @returns JSX.Element - The rendered card component
 */
const Card = ({ children, isHidden = false }: CardProps): JSX.Element => {
  return (
    <article
      className={classNames(styles["card"], {
        [String(styles["hidden"])]: isHidden,
      })}
    >
      <div className={styles["content"]}>{children}</div>
    </article>
  );
};

export { Card };
