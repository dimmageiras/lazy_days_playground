import type { TEXT_INPUT_TYPES } from "@client/components/TextInput/constants/text-input.constants";

type TextInputType = (typeof TEXT_INPUT_TYPES)[keyof typeof TEXT_INPUT_TYPES];

export type { TextInputType };
