import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

interface NavigationWrapperProps {
  children: (navigateTo: () => void) => JSX.Element;
  to: string;
}

const NavigationWrapper = ({
  children,
  to,
}: NavigationWrapperProps): JSX.Element => {
  const navigate = useNavigate();

  const navigateTo = useCallback((): void => {
    navigate(to);
  }, [navigate, to]);

  const memoizedChildren = useMemo(
    () => children(navigateTo),
    [children, navigateTo]
  );

  return <>{memoizedChildren}</>;
};

export { NavigationWrapper };
