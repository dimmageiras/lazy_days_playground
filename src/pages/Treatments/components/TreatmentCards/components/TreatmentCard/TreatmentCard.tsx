import type { JSX } from "react";

import { MediaCard } from "~/components/MediaCard";

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
    <MediaCard
      description={description}
      descriptionAlign="left"
      image={image}
      name={name}
    />
  );
};

export { TreatmentCard };
