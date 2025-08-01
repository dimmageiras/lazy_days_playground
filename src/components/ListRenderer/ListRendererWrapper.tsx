import type { JSX } from "react";

import { ListRenderer } from "./ListRenderer";

/**
 * Props interface for the ListRenderer component
 * @template TItem - The type of items in the data array
 */
export interface ListRendererProps<TItem> {
  /** Array of items to render */
  data: TItem[] | readonly TItem[];
  /** Optional key extraction function (falls back to UUID) */
  getKey?: (item: TItem) => number | string;
  /** Render function for each item */
  renderComponent: (props: { data: TItem; index: number }) => JSX.Element;
}

/**
 * A utility component for efficiently rendering lists with automatic key generation and error handling.
 * Optimized to prevent unnecessary re-renders of individual list items when data hasn't changed.
 *
 * @example
 * ```tsx
 * // Simple list rendering
 * <ListRenderer
 *   data={users}
 *   renderComponent={({ data: user, index }) => (
 *     <div key={user.id}>
 *       {index + 1}. {user.name}
 *     </div>
 *   )}
 *   getKey={(user) => user.id}
 * />
 *
 * // Complex list with custom components
 * <ListRenderer
 *   data={products}
 *   renderComponent={({ data: product }) => (
 *     <MediaCard
 *       name={product.name}
 *       description={product.description}
 *       image={product.image}
 *     />
 *   )}
 *   getKey={(product) => product.sku}
 * />
 * ```
 *
 * @template TItem - The type of items in the data array
 * @param props - The ListRenderer component props
 * @param props.data - Array of items to render
 * @param props.getKey - Optional key extraction function (falls back to UUID)
 * @param props.renderComponent - Render function for each item that receives data and index
 * @returns JSX.Element[] - Array of rendered JSX elements
 * @performance Uses memoized list items and stable keys to minimize re-renders
 */
const ListRendererWrapper = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ListRendererProps<TItem>): JSX.Element | null => {
  if (!Array.isArray(data)) {
    throw new Error("ListRenderer: data prop must be an array");
  }

  return (
    <ListRenderer
      data={data}
      getKey={getKey}
      renderComponent={renderComponent}
    />
  );
};

export { ListRendererWrapper };
