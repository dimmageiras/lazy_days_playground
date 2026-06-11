import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

const { normalizeError } = ErrorHelper;

const acceptHotReload = async (
  instance: AppInstance,
  hot: ImportMeta["hot"],
): Promise<void> => {
  if (!hot) {
    return;
  }

  const hotData: { instance?: AppInstance } = hot.data;

  if (hotData.instance) {
    try {
      await hotData.instance.close();
    } catch (rawError) {
      instance.log.error(
        normalizeError(rawError),
        "💥 Failed to close the previous instance during hot reload",
      );
    }
  }

  hotData.instance = instance;

  hot.accept();
};

const HotReloadHelper = Object.freeze({
  acceptHotReload,
} as const);

export { HotReloadHelper };
