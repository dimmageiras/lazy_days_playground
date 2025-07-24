import type { JSX } from "react";

import { ListRenderer } from "~/components/ListRenderer";

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

const TreatmentCards = ({ treatments }: TreatmentCardsProps): JSX.Element => {
  return (
    <ListRenderer
      data={treatments}
      getKey={(treatment) => treatment.id}
      renderComponent={({ data }): JSX.Element => {
        return <TreatmentCard treatmentData={data} />;
      }}
    />
  );
};

export { TreatmentCards };
