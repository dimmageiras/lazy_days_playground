import { createStore } from "zustand-x";

const initialState = {
  isRQDTOpen: false,
};

const devToolsStore = createStore(initialState, {
  devtools: true,
  name: "devTools",
});

export { devToolsStore };
