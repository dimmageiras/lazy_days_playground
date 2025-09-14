import type { KeyAsString } from "type-fest";

import type { TEXT_INPUT_TYPES } from "@client/components/TextInput/constants/text-input.constant";

type TextInputTypeKeys = KeyAsString<typeof TEXT_INPUT_TYPES>;

type TextInputType = (typeof TEXT_INPUT_TYPES)[TextInputTypeKeys];

export type { TextInputType };
