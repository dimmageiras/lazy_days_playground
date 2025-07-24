import type { JSX } from "react";

import { ListRenderer } from "~/components/ListRenderer";

import { StaffCard } from "./components/StaffCard";

interface StaffCardsProps {
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

const StaffCards = ({ staff }: StaffCardsProps): JSX.Element => {
  return (
    <ListRenderer
      data={staff}
      renderComponent={({ data }): JSX.Element => {
        return <StaffCard staffMemberData={data} />;
      }}
      getKey={(staffMember) => staffMember.id}
    />
  );
};

export { StaffCards };
