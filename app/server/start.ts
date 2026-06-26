import { AppStartHelper } from "./helpers/app";
import { LoggerModule } from "./modules/logger";
import { ShutdownModule } from "./modules/shutdown";
import { StartupModule } from "./modules/startup";

const { start } = AppStartHelper;

await start(import.meta.env, import.meta.hot, {
  logger: LoggerModule,
  shutdown: ShutdownModule,
  startup: StartupModule,
});
