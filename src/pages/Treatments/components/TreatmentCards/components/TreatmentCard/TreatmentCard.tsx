import type { JSX } from "react";

import { Card } from "~/components/Card";

interface TreatmentCardProps {
  treatmentData: {
    description: string;
    image: {
      authorLink: string;
      authorName: string;
      fileName: string;
      platformLink: string;
      platformName: string;
    };
    name: string;
  };
}

const TreatmentCard = ({
  treatmentData: { description, image, name },
}: TreatmentCardProps): JSX.Element => {
  return (
    <Card
      description={description}
      descriptionAlign="left"
      image={image}
      name={name}
    />
  );
};

export { TreatmentCard };
