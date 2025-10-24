import { createStore } from "zustand-x";

const initialState: {
  identityId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} = {
  identityId: null,
  isAuthenticated: false,
  isLoading: false,
};

const authStore = createStore(initialState, {
  devtools: true,
  name: "auth",
});

export { authStore };
