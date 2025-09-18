import type { JSX } from "react";
import { memo } from "react";
import ContentLoader from "react-content-loader";

interface SkeletonInputProps {
  className: string;
  id: string;
}

const SkeletonInput = memo(
  ({ className, id }: SkeletonInputProps): JSX.Element => {
    return (
      <ContentLoader
        backgroundColor="#f3f3f3"
        className={className}
        foregroundColor="#ecebeb"
        speed={2}
        uniqueKey={id}
      >
        <rect x="0" y="0" rx="6" ry="6" height="100%" width="100%" />
      </ContentLoader>
    );
  }
);

SkeletonInput.displayName = "SkeletonInput";

export { SkeletonInput };
