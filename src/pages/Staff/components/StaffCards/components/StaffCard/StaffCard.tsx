import type { JSX } from "react";

import { Card } from "~/components/Card";

interface StaffCardProps {
  staffMemberData: {
    image: {
      authorLink: string;
      authorName: string;
      fileName: string;
      platformLink: string;
      platformName: string;
    };
    name: string;
    treatmentNames: string[];
  };
}

const StaffCard = ({
  staffMemberData: { image, name, treatmentNames },
}: StaffCardProps): JSX.Element => {
  const description = treatmentNames.join(", ");

  return <Card description={description} image={image} name={name} />;
};

export { StaffCard };
