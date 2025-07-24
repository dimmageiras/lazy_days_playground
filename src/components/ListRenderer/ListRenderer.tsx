import type { ComponentType, JSX } from "react";
import { v4 as uuidv4 } from "uuid";

interface ListRendererProps<TItem> {
  data: TItem[] | readonly TItem[];
  getKey?: (item: TItem) => string | number;
  renderComponent: ComponentType<{
    data: TItem;
    index: number;
    key?: string | number;
  }>;
}

const ListRenderer = <TItem,>({
  data,
  getKey,
  renderComponent: RenderComponent,
}: ListRendererProps<TItem>): JSX.Element[] => {
  return data.map((item: TItem, index: number) => {
    const key = getKey ? getKey(item) : uuidv4();

    return <RenderComponent data={item} index={index} key={key} />;
  });
};

export { ListRenderer };
