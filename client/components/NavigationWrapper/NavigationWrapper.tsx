import type { JSX } from "react";
import { useMemo } from "react";
import type { NavigateFunction } from "react-router";
import { useNavigate } from "react-router";

/**
 * Props interface for the NavigationWrapper component
 */
interface NavigationWrapperProps {
  /** Render function that receives the navigate function from React Router */
  children: (navigate: NavigateFunction) => JSX.Element;
}

/**
 * A render prop component that provides React Router's navigate function to child components.
 * This component enables custom clickable elements or components to access navigation
 * functionality without directly using the useNavigate hook themselves.
 *
 * @example
 * ```tsx
 * import { NavigationWrapper } from '@client/components/NavigationWrapper';
 *
 * // Create a custom clickable card with navigation
 * const NavigableCard = () => (
 *   <NavigationWrapper>
 *     {(navigate) => (
 *       <div
 *         className="card"
 *         onClick={() => navigate('/dashboard')}
 *         role="button"
 *       >
 *         Click to go to Dashboard
 *       </div>
 *     )}
 *   </NavigationWrapper>
 * );
 *
 * // Navigate with options (replace history)
 * const SettingsButton = () => (
 *   <NavigationWrapper>
 *     {(navigate) => (
 *       <button
 *         onClick={() => navigate('/settings', { replace: true })}
 *       >
 *         Go to Settings
 *       </button>
 *     )}
 *   </NavigationWrapper>
 * );
 *
 * // Navigate with state
 * const ProductCard = ({ product }) => (
 *   <NavigationWrapper>
 *     {(navigate) => (
 *       <article
 *         className="product-card"
 *         onClick={() => navigate(`/product/${product.id}`, {
 *           state: { from: 'catalog' }
 *         })}
 *       >
 *         <h3>{product.name}</h3>
 *         <p>{product.description}</p>
 *       </article>
 *     )}
 *   </NavigationWrapper>
 * );
 * ```
 *
 * @param props - The NavigationWrapper component props
 * @param props.children - Render function that receives the navigate function and returns JSX
 * @returns JSX.Element - The rendered result of the children function
 */
const NavigationWrapper = ({
  children,
}: NavigationWrapperProps): JSX.Element => {
  const navigate = useNavigate();

  const memoizedChildren = useMemo(() => {
    return children(navigate);
  }, [children, navigate]);

  return <>{memoizedChildren}</>;
};

export { NavigationWrapper };
