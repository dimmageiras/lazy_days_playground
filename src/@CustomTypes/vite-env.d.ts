/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HAS_REACT_QUERY_DEV_TOOLS: "true" | "false";
  readonly VITE_HAS_REACT_ROUTER_DEV_TOOLS: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
