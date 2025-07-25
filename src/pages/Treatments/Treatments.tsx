import type { JSX } from "react";

import { PageTitle } from "~/components/PageTitle";

import { Cards } from "./components/Cards/TreatmentCards";
import facialImage from "./images/facial.jpg";
import massageImage from "./images/massage.jpg";
import scrubImage from "./images/scrub.jpg";
import styles from "./Treatments.module.scss";

const TREATMENTS = [
  {
    id: 1,
    name: "Massage",
    durationInMinutes: 60,
    image: {
      fileName: massageImage,
      authorName: "Mariolh",
      authorLink:
        "https://pixabay.com/users/mariolh-62451/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=567021",
      platformName: "Pixabay",
      platformLink:
        "https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=567021",
    },
    description:
      "Restore your sense of peace and ease with a relaxing massage.",
  },
  {
    id: 2,
    name: "Facial",
    durationInMinutes: 30,
    image: {
      fileName: facialImage,
      authorName: "engin akyurt",
      authorLink:
        "https://unsplash.com/@enginakyurt?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      platformName: "Unsplash",
      platformLink: "https://unsplash.com/",
    },
    description: "Give your face a healthy glow with this cleansing treatment.",
  },
  {
    id: 3,
    name: "Scrub",
    durationInMinutes: 15,
    image: {
      fileName: scrubImage,
      authorName: "Monfocus",
      authorLink:
        "https://pixabay.com/users/monfocus-2516394/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=5475880",
      platformName: "Pixabay",
      platformLink:
        "https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=5475880",
    },
    description:
      "Invigorate your body and spirit with a scented Himalayan salt scrub.",
  },
];

const Treatments = (): JSX.Element => {
  return (
    <main className={styles["treatments"]}>
      <PageTitle pageTitle="Available Treatments" />
      <div className={styles["treatment-list"]}>
        <Cards treatments={TREATMENTS} />
      </div>
    </main>
  );
};

export { Treatments };
