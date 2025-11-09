import { AppLayout } from "./AppLayout";
import { appLayoutLink } from "./links/app-layout.link";
import { appLayoutLoader } from "./loaders/app-layout.loader";
import { appLayoutMiddleware } from "./middlewares/app-layout.middleware";

const middleware = [appLayoutMiddleware];

export { appLayoutLink as links, appLayoutLoader as loader, middleware };
export default AppLayout;
