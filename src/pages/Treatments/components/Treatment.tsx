import type { JSX } from "react";

import styles from "./Treatment.module.scss";

interface TreatmentProps {
  treatmentData: {
    id: number;
    name: string;
    durationInMinutes: number;
    image: {
      fileName: string;
      authorName: string;
      authorLink: string;
      platformName: string;
      platformLink: string;
    };
    description: string;
  };
}

const Treatment = ({ treatmentData }: TreatmentProps): JSX.Element => {
  return (
    <div className={styles["treatment"]}>
      <div className={styles["content"]}>
        <div className={styles["image-container"]}>
          <img
            alt={treatmentData.name}
            className={styles["image"]}
            src={treatmentData.image.fileName}
          />
          <p className={styles["credit"]}>
            Photo by
            <a className={styles["link"]} href={treatmentData.image.authorLink}>
              {treatmentData.image.authorName}
            </a>
            from
            <a
              className={styles["link"]}
              href={treatmentData.image.platformLink}
            >
              {treatmentData.image.platformName}
            </a>
          </p>
        </div>
        <div className={styles["details"]}>
          <h2 className={styles["name"]}>{treatmentData.name}</h2>
          <p>{treatmentData.description}</p>
        </div>
      </div>
    </div>
  );
};

export { Treatment };
