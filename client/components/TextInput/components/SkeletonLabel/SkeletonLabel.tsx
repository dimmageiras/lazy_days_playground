import type { JSX } from "react";
import { memo } from "react";
import ContentLoader from "react-content-loader";

interface SkeletonLabelProps {
  className: string;
  id: string;
}

const SkeletonLabel = memo(
  ({ className, id }: SkeletonLabelProps): JSX.Element => {
    return (
      <ContentLoader
        backgroundColor="#f3f3f3"
        className={className}
        foregroundColor="#ecebeb"
        speed={2}
        uniqueKey={id}
      >
        <rect x="0" y="0.375rem" rx="3" ry="3" height="100%" width="100%" />
      </ContentLoader>
    );
  }
);

SkeletonLabel.displayName = "SkeletonLabel";

export { SkeletonLabel };
