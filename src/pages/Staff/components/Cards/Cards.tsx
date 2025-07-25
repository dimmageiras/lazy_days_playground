import type { JSX } from "react";

import { ListRenderer } from "~/components/ListRenderer";

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
      renderComponent={({ data }): JSX.Element => {
        return <Card staffMemberData={data} />;
      }}
      getKey={(staffMember) => staffMember.id}
    />
  );
};

export { Cards };
