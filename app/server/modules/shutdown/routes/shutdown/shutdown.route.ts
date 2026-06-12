import { ENDPOINTS } from "@server/modules/shutdown/constants/endpoints.constant";
import type { ShutdownRouteOptions } from "@server/modules/shutdown/types/shutdown.type";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { DateHelper } from "@shared/helpers/date.helper";

import { ArmHelper } from "./helpers/arm.helper";
import { AuthorizeHelper } from "./helpers/authorize.helper";

const { SHUTDOWN } = ENDPOINTS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const { armShutdownOnResponse } = ArmHelper;
const { isAuthorizedShutdownRequest } = AuthorizeHelper;
const { getCurrentISOTimestamp } = DateHelper;

const shutdownRoute = async (
  instance: AppInstance,
  { handle }: ShutdownRouteOptions,
): Promise<void> => {
  instance.post(`/${SHUTDOWN}`, (request, reply) => {
    if (!isAuthorizedShutdownRequest(request, instance.appEnv.shutdownToken)) {
      request.log.warn(
        { ip: request.ip },
        "🚧 Rejected an unauthorized shutdown request",
      );

      return reply
        .status(UNAUTHORIZED)
        .send({ accepted: false, timestamp: getCurrentISOTimestamp() });
    }

    armShutdownOnResponse(reply, handle);

    return reply
      .status(ACCEPTED)
      .send({ accepted: true, timestamp: getCurrentISOTimestamp() });
  });
};

export { shutdownRoute };
