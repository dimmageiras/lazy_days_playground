import classNames from "classnames";
import type { JSX } from "react";
import { memo } from "react";

import { BaseCard } from "@client/components/BaseCard";
import { RouterLink } from "@client/components/RouterLink";

import styles from "./MediaCard.module.scss";

/**
 * Image configuration object
 */
interface Image {
  /** Link to author profile */
  authorLink: string;
  /** Image author name */
  authorName: string;
  /** Image source URL */
  fileName: string;
  /** Link to platform */
  platformLink: string;
  /** Platform name (e.g., "Unsplash") */
  platformName: string;
}

/**
 * Props interface for the MediaCard component
 */
interface MediaCardProps {
  /** Card description */
  description: string;
  /** Text alignment for description (default: 'center') */
  descriptionAlign?: "left" | "center";
  /** Whether the card is hidden */
  isHidden?: boolean;
  /** Image configuration */
  image: Image;
  /** Card title */
  name: string;
}

/**
 * A card component designed for displaying media content with image, title, description, and image attribution.
 * The component is optimized for performance using React.memo to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * <MediaCard
 *   description="Experience ultimate relaxation with our therapeutic massage treatments."
 *   descriptionAlign="center"
 *   image={{
 *     authorLink: "https://unsplash.com/@johndoe",
 *     authorName: "John Doe",
 *     fileName: "/images/massage.jpg",
 *     platformLink: "https://unsplash.com",
 *     platformName: "Unsplash",
 *   }}
 *   isHidden={false}
 *   name="Relaxing Massage"
 * />
 * ```
 *
 * @param props - The MediaCard component props
 * @param props.description - Card description
 * @param props.descriptionAlign - Text alignment for description (default: 'center')
 * @param props.image - Image configuration object
 * @param props.image.authorLink - Link to author profile
 * @param props.image.authorName - Image author name
 * @param props.image.fileName - Image source URL
 * @param props.image.platformLink - Link to platform
 * @param props.image.platformName - Platform name (e.g., "Unsplash")
 * @param props.isHidden - Whether the card should be hidden (default: false)
 * @param props.name - Card title
 * @returns JSX.Element - The rendered media card component
 */
const MediaCard = memo(
  ({
    description,
    descriptionAlign = "center",
    image: { authorLink, authorName, fileName, platformLink, platformName },
    isHidden = false,
    name,
  }: MediaCardProps): JSX.Element => {
    return (
      <BaseCard isHidden={isHidden}>
        <figure className={styles["image-container"]}>
          <img alt={name} className={styles["image"]} src={fileName} />
          <figcaption className={styles["credit"]}>
            Photo by
            <RouterLink
              aria-label="Author link"
              className={styles["link"]}
              hasTextDecorationOnHover
              shouldOpenInNewTab
              to={authorLink}
            >
              {authorName}
            </RouterLink>
            from
            <RouterLink
              aria-label="Platform link"
              className={styles["link"]}
              hasTextDecorationOnHover
              shouldOpenInNewTab
              to={platformLink}
            >
              {platformName}
            </RouterLink>
          </figcaption>
        </figure>
        <div className={styles["details"]}>
          <h2 className={styles["name"]}>{name}</h2>
          <p
            className={classNames(styles["description"], {
              [String(styles["center"])]: descriptionAlign === "center",
              [String(styles["left"])]: descriptionAlign === "left",
            })}
          >
            {description}
          </p>
        </div>
      </BaseCard>
    );
  }
);

MediaCard.displayName = "MediaCard";

export { MediaCard };
