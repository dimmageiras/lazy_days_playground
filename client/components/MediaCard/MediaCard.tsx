import classNames from "classnames";
import type { JSX } from "react";

import { RouterLink } from "@Client/components/RouterLink";

import styles from "./MediaCard.module.scss";

/**
 * Props interface for the MediaCard component
 */
interface MediaCardProps {
  /** Card description */
  description: string;
  /** Text alignment for description (default: 'center') */
  descriptionAlign?: "left" | "center";
  /** Image configuration */
  image: {
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
  };
  /** Card title */
  name: string;
}

/**
 * A card component designed for displaying media content with image, title, description, and image attribution.
 *
 * @example
 * ```tsx
 * <MediaCard
 *   name="Relaxing Massage"
 *   description="Experience ultimate relaxation with our therapeutic massage treatments."
 *   descriptionAlign="center"
 *   image={{
 *     fileName: "/images/massage.jpg",
 *     authorName: "John Doe",
 *     authorLink: "https://unsplash.com/@johndoe",
 *     platformName: "Unsplash",
 *     platformLink: "https://unsplash.com",
 *   }}
 * />
 * ```
 *
 * @param props - The MediaCard component props
 * @param props.name - Card title
 * @param props.description - Card description
 * @param props.descriptionAlign - Text alignment for description (default: 'center')
 * @param props.image - Image configuration object
 * @param props.image.fileName - Image source URL
 * @param props.image.authorName - Image author name
 * @param props.image.authorLink - Link to author profile
 * @param props.image.platformName - Platform name (e.g., "Unsplash")
 * @param props.image.platformLink - Link to platform
 * @returns JSX.Element - The rendered media card component
 */
const MediaCard = ({
  description,
  descriptionAlign = "center",
  image: { authorLink, authorName, fileName, platformLink, platformName },
  name,
}: MediaCardProps): JSX.Element => {
  return (
    <article className={styles["card"]}>
      <div className={styles["content"]}>
        <figure className={styles["image-container"]}>
          <img alt={name} className={styles["image"]} src={fileName} />
          <figcaption className={styles["credit"]}>
            Photo by
            <RouterLink
              className={styles["link"]}
              hasTextDecorationOnHover
              shouldOpenInNewTab
              to={authorLink}
            >
              {authorName}
            </RouterLink>
            from
            <RouterLink
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
      </div>
    </article>
  );
};

export { MediaCard };
