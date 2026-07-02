import type { Client } from "gel";

import type { AppInstance } from "@server/types/instance.type";

type DbClient = Client;

type SetupDbFunction = (instance: AppInstance) => void;

export type { DbClient, SetupDbFunction };
