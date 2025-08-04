import type { JSX } from "react";

import { MediaCard } from "@Client/components/MediaCard";

interface CardProps {
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

const Card = ({
  treatmentData: { description, image, name },
}: CardProps): JSX.Element => {
  return (
    <MediaCard
      description={description}
      descriptionAlign="left"
      image={image}
      name={name}
    />
  );
};

export { Card };
