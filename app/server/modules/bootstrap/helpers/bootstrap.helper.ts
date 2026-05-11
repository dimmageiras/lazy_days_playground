import { ShutdownRoute } from "../routes/shutdown.route";
import { CloseHelper } from "./close.helper";
import { KillHelper } from "./kill.helper";
import { ListenHelper } from "./listen.helper";
import { ShutdownRequestHelper } from "./shutdown-request.helper";

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
