import { ShutdownRoute } from "../routes/shutdown.route.ts";
import { CloseHelper } from "./close.helper.ts";
import { KillHelper } from "./kill.helper.ts";
import { ListenHelper } from "./listen.helper.ts";
import { ShutdownRequestHelper } from "./shutdown-request.helper.ts";

const { setupCloseListeners } = CloseHelper;
const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownRequestHelper;
const { createShutdownRoute } = ShutdownRoute;

export const BootstrapHelper = {
  createShutdownRoute,
  killPortOwner,
  requestCooperativeShutdown,
  setupCloseListeners,
  tryListen,
  tryListenUntil,
};
