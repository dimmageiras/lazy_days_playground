import type { JSX } from "react";

import { ListRendererBase } from "./components/ListRendererBase";

/**
 * Props interface for the ListRenderer component
 * @template TItem - The type of items in the data array
 */
interface ListRendererProps<TItem> {
  /** Array of items to render */
  data: TItem[] | readonly TItem[];
  /** Optional key extraction function (falls back to UUID) */
  getKey?: ((item: TItem, index: number) => number | string) | undefined;
  /** Render function for each item */
  renderComponent: (props: { data: TItem; index: number }) => JSX.Element;
}

/**
 * A utility component for efficiently rendering lists with automatic key generation and error handling.
 * The component is optimized for performance using memoized list items and stable key generation to
 * prevent unnecessary re-renders when data hasn't changed.
 *
 * @example
 * ```tsx
 * import { ListRenderer } from '@client/components/ListRenderer';
 * import { MediaCard } from '@client/components/MediaCard';
 *
 * // Simple list rendering
 * const UserList = ({ users }) => (
 *   <ListRenderer<User>
 *     data={users}
 *     getKey={(user) => user.id}
 *     renderComponent={({ data: user, index }) => (
 *       <div>
 *         {index + 1}. {user.name}
 *       </div>
 *     )}
 *   />
 * );
 *
 * // Complex list with custom components
 * const ProductList = ({ products }) => (
 *   <ListRenderer<Product>
 *     data={products}
 *     getKey={(product) => product.sku}
 *     renderComponent={({ data: product }) => (
 *       <MediaCard
 *         description={product.description}
 *         image={product.image}
 *         name={product.name}
 *       />
 *     )}
 *   />
 * );
 * ```
 *
 * @template TItem - The type of items in the data array
 * @param props - The ListRenderer component props
 * @param props.data - Array of items to render (can be readonly)
 * @param props.getKey - Optional key extraction function (falls back to UUID for objects/arrays or stringified value)
 * @param props.renderComponent - Render function for each item that receives the item data and index
 * @returns JSX.Element - The rendered list container
 * @throws {Error} When the data prop is not an array
 */
const ListRenderer = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ListRendererProps<TItem>): JSX.Element => {
  if (!Array.isArray(data)) {
    throw new Error("ListRenderer: data prop must be an array");
  }

  return (
    <ListRendererBase
      data={data}
      getKey={getKey}
      renderComponent={renderComponent}
    />
  );
};

export { ListRenderer };
