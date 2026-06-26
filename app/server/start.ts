import { AppHelper } from "./helpers/app.helper";
import { LoggerModule } from "./modules/logger";
import { ShutdownModule } from "./modules/shutdown";
import { StartupModule } from "./modules/startup";

const { start } = AppHelper;

await start(import.meta.env, import.meta.hot, {
  logger: LoggerModule,
  shutdown: ShutdownModule,
  startup: StartupModule,
});
