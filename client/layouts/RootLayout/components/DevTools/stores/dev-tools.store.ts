import { createStore } from "zustand-x";

const initialState = {
  isDevToolsMenuOpen: false,
  isRQDTOpen: false,
  isRRDTOpen: false,
};

const devToolsStore = createStore(initialState, {
  devtools: true,
  name: "devTools",
});

export { devToolsStore };
