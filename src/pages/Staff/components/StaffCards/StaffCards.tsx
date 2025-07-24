import type { JSX } from "react";

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

const StaffCards = ({ staff }: StaffCardsProps): JSX.Element[] => {
  return staff.map((staffMemberData) => (
    <StaffCard key={staffMemberData.id} staffMemberData={staffMemberData} />
  ));
};

export { StaffCards };
