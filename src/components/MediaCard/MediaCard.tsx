import classNames from "classnames";
import type { JSX } from "react";

import { RouterLink } from "~/components/RouterLink";

import styles from "./MediaCard.module.scss";

interface MediaCardProps {
  description: string;
  descriptionAlign?: "left" | "center";
  image: {
    authorLink: string;
    authorName: string;
    fileName: string;
    platformLink: string;
    platformName: string;
  };
  name: string;
}

const MediaCard = ({
  description,
  descriptionAlign = "center",
  image: { authorLink, authorName, fileName, platformLink, platformName },
  name,
}: MediaCardProps): JSX.Element => {
  return (
    <div className={styles["card"]}>
      <div className={styles["content"]}>
        <div className={styles["image-container"]}>
          <img alt={name} className={styles["image"]} src={fileName} />
          <p className={styles["credit"]}>
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
          </p>
        </div>
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
    </div>
  );
};

export { MediaCard };
