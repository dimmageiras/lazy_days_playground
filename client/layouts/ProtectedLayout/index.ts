import { protectedLayoutMiddleware } from "./protected-layout.middleware";
import { ProtectedLayout } from "./ProtectedLayout";

export const middleware = [protectedLayoutMiddleware];
export default ProtectedLayout;

