import type { JSX } from "react";

import { Card } from "~/components/Card";

interface TreatmentProps {
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

const Treatment = ({
  treatmentData: { description, image, name },
}: TreatmentProps): JSX.Element => {
  return (
    <Card
      description={description}
      descriptionAlign="left"
      image={image}
      name={name}
    />
  );
};

export { Treatment };
