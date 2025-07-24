import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

interface NavigationWrapperProps {
  children: (navigateTo: () => void) => JSX.Element;
  shouldReplace?: boolean;
  to: string;
}

const NavigationWrapper = ({
  children,
  shouldReplace = false,
  to,
}: NavigationWrapperProps): JSX.Element => {
  const navigate = useNavigate();

  const navigateTo = useCallback((): void => {
    navigate(to, { replace: shouldReplace });
  }, [navigate, shouldReplace, to]);

  const memoizedChildren = useMemo(
    () => children(navigateTo),
    [children, navigateTo]
  );

  return <>{memoizedChildren}</>;
};

export { NavigationWrapper };
