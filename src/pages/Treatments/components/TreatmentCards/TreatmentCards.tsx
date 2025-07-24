import type { JSX } from "react";

import { TreatmentCard } from "./components/TreatmentCard";

interface TreatmentCardsProps {
  treatments: {
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
  }[];
}

const TreatmentCards = ({ treatments }: TreatmentCardsProps): JSX.Element[] => {
  return treatments.map((treatmentData) => (
    <TreatmentCard key={treatmentData.id} treatmentData={treatmentData} />
  ));
};

export { TreatmentCards };
