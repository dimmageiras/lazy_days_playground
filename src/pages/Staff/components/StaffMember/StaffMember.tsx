import type { JSX } from "react";

import { Card } from "~/components/Card";

interface StaffMemberProps {
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

const StaffMember = ({
  staffMemberData: { image, name, treatmentNames },
}: StaffMemberProps): JSX.Element => {
  const description = treatmentNames.join(", ");

  return <Card description={description} image={image} name={name} />;
};

export { StaffMember };
