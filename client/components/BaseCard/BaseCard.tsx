import classNames from "classnames";
import type { JSX, PropsWithChildren } from "react";

import styles from "./BaseCard.module.scss";

/**
 * Props interface for the BaseCard component
 */
interface BaseCardProps extends PropsWithChildren {
  /** Whether the BaseCard is hidden */
  isHidden?: boolean;
}

/**
 * A base card component that provides a consistent container style for content.
 * This component can be used as a building block for more specific card implementations.
 *
 * @example
 * ```tsx
 * <BaseCard isHidden={false}>
 *   <h2>BaseCard Title</h2>
 *   <p>BaseCard content goes here</p>
 * </BaseCard>
 * ```
 *
 * @param props - The BaseCard component props
 * @param props.children - The content to be rendered inside the BaseCard
 * @param props.isHidden - Whether the BaseCard should be hidden (default: false)
 * @returns JSX.Element - The rendered BaseCard component
 */
const BaseCard = ({
  children,
  isHidden = false,
}: BaseCardProps): JSX.Element => {
  return (
    <article
      className={classNames(styles["base-card"], {
        [String(styles["hidden"])]: isHidden,
      })}
    >
      <div className={styles["content"]}>{children}</div>
    </article>
  );
};

export { BaseCard };
