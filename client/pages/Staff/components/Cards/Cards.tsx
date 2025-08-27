import type { JSX } from "react";

import { ListRenderer } from "@client/components/ListRenderer";

import { Card } from "./components/Card";

interface CardsProps {
  staff: {
    id: number;
    name: string;
    treatmentNames: string[];
    image: {
      fileName: string;
      authorName: string;
      authorLink: string;
      platformName: string;
      platformLink: string;
    };
  }[];
}

const Cards = ({ staff }: CardsProps): JSX.Element => {
  return (
    <ListRenderer
      data={staff}
      getKey={(staffMember): string => staffMember.name}
      renderComponent={({ data }): JSX.Element => {
        return <Card staffMemberData={data} />;
      }}
    />
  );
};

export { Cards };
