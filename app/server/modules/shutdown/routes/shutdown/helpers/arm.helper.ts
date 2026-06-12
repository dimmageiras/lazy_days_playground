import type { FastifyReply } from "fastify";

import type { ShutdownRouteOptions } from "@server/modules/shutdown/types/shutdown.type";

const armShutdownOnResponse = (
  reply: FastifyReply,
  handle: ShutdownRouteOptions["handle"],
): void => {
  let armed = false;

  const arm = (): void => {
    if (armed) {
      return;
    }

    armed = true;
    handle.close();
  };

  reply.raw.once("finish", arm);
  reply.raw.once("close", arm);
};

const ArmHelper = Object.freeze({
  armShutdownOnResponse,
} as const);

export { ArmHelper };
