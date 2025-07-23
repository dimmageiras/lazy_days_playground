import classNames from "classnames";
import type { JSX } from "react";

import styles from "./Card.module.scss";

interface CardProps {
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

const Card = ({
  description,
  descriptionAlign = "center",
  image: { authorLink, authorName, fileName, platformLink, platformName },
  name,
}: CardProps): JSX.Element => {
  return (
    <div className={styles["card"]}>
      <div className={styles["content"]}>
        <div className={styles["image-container"]}>
          <img alt={name} className={styles["image"]} src={fileName} />
          <p className={styles["credit"]}>
            Photo by
            <a className={styles["link"]} href={authorLink}>
              {authorName}
            </a>
            from
            <a className={styles["link"]} href={platformLink}>
              {platformName}
            </a>
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

export { Card };
