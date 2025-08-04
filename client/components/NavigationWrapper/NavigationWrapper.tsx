import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

/**
 * Props interface for the NavigationWrapper component
 */
interface NavigationWrapperProps {
  /** Render function that receives navigation callback */
  children: (navigateTo: () => void) => JSX.Element;
  /** Replace current history entry (default: false) */
  shouldReplace?: boolean;
  /** Destination route */
  to: string;
}

/**
 * A render prop component that provides navigation functionality to child components,
 * useful for creating custom clickable elements.
 *
 * @example
 * ```tsx
 * <NavigationWrapper to="/settings" shouldReplace>
 *   {(navigateTo) => (
 *     <button onClick={navigateTo} className="custom-button">
 *       Go to Settings
 *     </button>
 *   )}
 * </NavigationWrapper>
 * ```
 *
 * @param props - The NavigationWrapper component props
 * @param props.children - Render function that receives navigation callback
 * @param props.to - Destination route
 * @param props.shouldReplace - Replace current history entry (default: false)
 * @returns JSX.Element - The rendered child component with navigation functionality
 */
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
