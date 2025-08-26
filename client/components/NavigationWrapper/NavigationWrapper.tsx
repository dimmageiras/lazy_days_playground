import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

/**
 * Props interface for the NavigationWrapper component
 */
interface NavigationWrapperProps {
  /**
   * Render function that receives a memoized navigation callback.
   * This function should return a clickable element that uses the callback.
   */
  children: (navigateTo: () => void) => JSX.Element;
  /** Whether to replace the current history entry instead of pushing a new one */
  shouldReplace?: boolean;
  /** Target route to navigate to */
  to: string;
}

/**
 * A render prop component that provides optimized navigation functionality to child components.
 * Uses memoization to prevent unnecessary re-renders and ensure consistent navigation behavior.
 * Useful for creating custom navigation elements without direct router dependencies.
 *
 * @example
 * ```tsx
 * // Basic button navigation
 * <NavigationWrapper to="/settings">
 *   {(navigateTo) => (
 *     <button onClick={navigateTo} type="button">
 *       Settings
 *     </button>
 *   )}
 * </NavigationWrapper>
 *
 * // Custom element with history replacement
 * <NavigationWrapper shouldReplace to="/profile">
 *   {(navigateTo) => (
 *     <div
 *       onClick={navigateTo}
 *       role="button"
 *       tabIndex={0}
 *     >
 *       Profile
 *     </div>
 *   )}
 * </NavigationWrapper>
 * ```
 *
 * @param props - The NavigationWrapper component props
 * @param props.children - Render function that receives a memoized navigation callback
 * @param props.shouldReplace - Whether to replace current history entry (default: false)
 * @param props.to - Target route to navigate to
 * @returns JSX.Element - The memoized child component with navigation functionality
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
