import type { CloseWithGraceReturn } from "../../modules/bootstrap/types/bootstrap.type";

declare global {
  namespace globalThis {
    var __closeListeners: CloseWithGraceReturn | undefined;
  }
}
