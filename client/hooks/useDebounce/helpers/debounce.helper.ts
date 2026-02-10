/**
 * Safely applies a callback function with the provided arguments.
 * Checks if the callback is a function before attempting to call it.
 *
 * @param callback - The callback function to apply
 * @param args - Arguments to pass to the callback
 */
const safeApplyCallback = <TArgs extends unknown[]>(
  callback: ((...args: TArgs) => void | Promise<void>) | undefined,
  args: TArgs,
): void => {
  if (typeof callback === "function") {
    Reflect.apply(callback, undefined, args);
  }
};

export const DebounceHelper = {
  safeApplyCallback,
};
