import type { JSX } from "react";
import { cloneElement, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

interface LocationWrapperProps {
  children: JSX.Element;
  to: string;
}

const LocationWrapper = ({
  children,
  to,
}: LocationWrapperProps): JSX.Element => {
  const navigate = useNavigate();

  const navigateTo = useCallback((): void => {
    navigate(to);
  }, [navigate, to]);

  const memoizedChildren = useMemo(
    () => cloneElement(children, { navigateTo }),
    [children, navigateTo]
  );

  return <>{memoizedChildren}</>;
};

export { LocationWrapper };
