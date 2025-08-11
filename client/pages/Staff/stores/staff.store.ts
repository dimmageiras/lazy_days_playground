import { createStore } from "zustand-x";

import type { TreatmentNames } from "@client/types/staff.types";

const initialState: {
  selectedTreatment: TreatmentNames;
} = {
  selectedTreatment: "all",
};

const staffStore = createStore(initialState, {
  devtools: true,
  name: "staff",
});

export { staffStore };
