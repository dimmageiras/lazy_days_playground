import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { ClickOutsideHelper } from "./helpers/click-outside.helper";

const DEFAULT_EVENTS = ["mousedown", "touchstart"];

/**
 * useClickOutside – runs a callback when the user clicks or touches
 * anywhere outside the supplied element.
 *
 * @param callback - Callback invoked on outside interaction.
 * @param events - Events to listen for.
 * @param nodes - Nodes to check if the click is outside of.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 *
 * return <div ref={ref}>…</div>;
 * ```
 */
const useClickOutside = <TElement extends HTMLElement>(
  callback: (event: Event) => void,
  events?: string[] | null,
  nodes?: (HTMLElement | null)[],
): RefObject<TElement | null> => {
  const ref = useRef<TElement>(null);
  const eventsList = events || DEFAULT_EVENTS;

  const { getEventTarget, shouldIgnoreTarget } = ClickOutsideHelper;

  useEffect(() => {
    const listener = (event: Event) => {
      const target = getEventTarget(event);

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (Array.isArray(nodes)) {
        const shouldIgnore = shouldIgnoreTarget(target);
        const shouldTrigger = nodes.every(
          (node) => !!node && !event.composedPath().includes(node),
        );

        if (shouldTrigger && !shouldIgnore) {
          callback(event);
        }
      } else if (ref.current && !ref.current.contains(target)) {
        callback(event);
      }
    };

    eventsList.forEach((fn) => document.addEventListener(fn, listener));

    return () => {
      eventsList.forEach((fn) => document.removeEventListener(fn, listener));
    };
  }, [callback, eventsList, getEventTarget, nodes, shouldIgnoreTarget]);

  return ref;
};

export { useClickOutside };
