import type { Route } from "./+types";
import { authFormSubmitAction } from "./actions/auth-form-submit.action";
import { Auth } from "./Auth";

const VALID_MODES = new Set(["signin", "signup"]);

const loader = ({ params }: Route.LoaderArgs): null => {
  if (params.mode !== undefined && !VALID_MODES.has(params.mode)) {
    throw new Response("Not Found", { status: 404 });
  }

  return null;
};

export { authFormSubmitAction as action, loader };
export default Auth;
