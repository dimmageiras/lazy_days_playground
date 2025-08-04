import type { JSX } from "react";

import { MediaCard } from "@Client/components/MediaCard";

interface CardProps {
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

const Card = ({
  staffMemberData: { image, name, treatmentNames },
}: CardProps): JSX.Element => {
  const description = treatmentNames.join(", ");

  return <MediaCard description={description} image={image} name={name} />;
};

export { Card };
