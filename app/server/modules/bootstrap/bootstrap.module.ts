import { ClaimPortHelper } from "./helpers/claim-port.helper";
import { CloseHelper } from "./helpers/close.helper";
import { shutdownRoute } from "./routes/shutdown.route";
import type { BootstrapConfig } from "./types";

const { claimPort } = ClaimPortHelper;
const { setupCloseListeners } = CloseHelper;

const bootstrapServer = async ({
  app,
  port,
  token,
}: BootstrapConfig): Promise<void> => {
  const closeListeners = await setupCloseListeners(app);

  await app.register(shutdownRoute, { closeListeners, token });
  await claimPort({ app, port, token });
};

export { bootstrapServer };
