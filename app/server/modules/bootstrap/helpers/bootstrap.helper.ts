import { CloseHelper } from "./close.helper";
import { KillHelper } from "./kill.helper";
import { ListenHelper } from "./listen.helper";
import { ShutdownRequestHelper } from "./shutdown-request.helper";

const { setupCloseListeners } = CloseHelper;
const { killPortOwner } = KillHelper;
const { tryListen, tryListenUntil } = ListenHelper;
const { requestCooperativeShutdown } = ShutdownRequestHelper;

const BootstrapHelper = Object.freeze({
  killPortOwner,
  requestCooperativeShutdown,
  setupCloseListeners,
  tryListen,
  tryListenUntil,
} as const);

export { BootstrapHelper };
