import type { JSX } from "react";

import { ListRenderer } from "@client/components/ListRenderer";

import { Card } from "./components/Card";

interface CardsProps {
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

const Cards = ({ treatments }: CardsProps): JSX.Element => {
  return (
    <ListRenderer
      data={treatments}
      getKey={(treatment): number => treatment.id}
      renderComponent={({ data }): JSX.Element => {
        return <Card treatmentData={data} />;
      }}
    />
  );
};

export { Cards };
