import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const DEFAULT_EVENTS = ["mousedown", "touchstart"];

const useClickOutside = <T extends HTMLElement>(
  callback: () => void,
  events?: string[] | null,
  nodes?: (HTMLElement | null)[]
): RefObject<T | null> => {
  const ref = useRef<T>(null);
  const eventsList = events || DEFAULT_EVENTS;

  useEffect(() => {
    const listener = (event: Event) => {
      const { target } = event ?? {};

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (Array.isArray(nodes)) {
        const shouldIgnore =
          !document.body.contains(target) && target.tagName !== "HTML";
        const shouldTrigger = nodes.every(
          (node) => !!node && !event.composedPath().includes(node)
        );

        if (shouldTrigger && !shouldIgnore) {
          callback();
        }
      } else if (ref.current && !ref.current.contains(target)) {
        callback();
      }
    };

    eventsList.forEach((fn) => document.addEventListener(fn, listener));

    return () => {
      eventsList.forEach((fn) => document.removeEventListener(fn, listener));
    };
  }, [callback, eventsList, nodes]);

  return ref;
};

export { useClickOutside };
