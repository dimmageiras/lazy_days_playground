import type { JSX } from "react";

import { PageTitle } from "~/components/PageTitle";

import { Cards } from "./components/Cards";
import { TreatmentFilter } from "./components/TreatmentFilter";
import divyaImage from "./images/divya.jpg";
import mateoImage from "./images/mateo.jpg";
import michaelImage from "./images/michael.jpg";
import sandraImage from "./images/sandra.jpg";
import styles from "./Staff.module.scss";

const staff = [
  {
    id: 1,
    name: "Divya",
    treatmentNames: ["facial", "scrub"],
    image: {
      fileName: divyaImage,
      authorName: "Pradeep Ranjan",
      authorLink:
        "https://unsplash.com/@tinywor1d?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      platformName: "Unsplash",
      platformLink: "https://unsplash.com/",
    },
  },
  {
    id: 2,
    name: "Sandra",
    treatmentNames: ["facial", "massage"],
    image: {
      fileName: sandraImage,
      authorName: "Pj Go",
      authorLink:
        "https://unsplash.com/@phizzahot?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      platformName: "Unsplash",
      platformLink: "https://unsplash.com/",
    },
  },
  {
    id: 3,
    name: "Michael",
    treatmentNames: ["facial", "scrub", "massage"],
    image: {
      fileName: michaelImage,
      authorName: "Fortune Vieyra",
      authorLink:
        "https://unsplash.com/@fortunevieyra?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      platformName: "Unsplash",
      platformLink: "https://unsplash.com/",
    },
  },
  {
    id: 4,
    name: "Mateo",
    treatmentNames: ["massage"],
    image: {
      fileName: mateoImage,
      authorName: "Luis Quintero",
      authorLink:
        "https://unsplash.com/@jibarofoto?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      platformName: "Unsplash",
      platformLink: "https://unsplash.com/",
    },
  },
];

const Staff = (): JSX.Element => {
  return (
    <main className={styles["staff"]}>
      <PageTitle pageTitle="Our Staff" />
      <div className={styles["staff-list"]}>
        <Cards staff={staff} />
      </div>
      <TreatmentFilter />
    </main>
  );
};

export { Staff };
