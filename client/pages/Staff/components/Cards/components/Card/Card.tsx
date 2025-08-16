import type { JSX } from "react";
import { useTrackedStore } from "zustand-x";

import { MediaCard } from "@client/components/MediaCard";
import { staffStore } from "@client/pages/Staff/stores/staff.store";

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
  const { selectedTreatment } = useTrackedStore(staffStore);

  const description = treatmentNames.join(", ");

  return (
    <MediaCard
      description={description}
      image={image}
      isHidden={
        selectedTreatment !== "all"
          ? !treatmentNames.includes(selectedTreatment)
          : false
      }
      name={name}
    />
  );
};

export { Card };
