const ICONIFY_ICON_QUERY_KEY = "iconify-icon" as const;

const ICONIFY_ICONS = Object.freeze({
  arrowLeft: "typcn:arrow-left-thick",
  arrowRight: "typcn:arrow-right-thick",
  check: "streamline-sharp:check-solid",
  checkCircle: "material-symbols:check-circle",
  database: "solar:database-linear",
  error: "material-symbols:error",
  home: "game-icons:flower-pot",
  info: "material-symbols:info",
  link: "material-symbols:link",
  schedule: "material-symbols:schedule",
  server: "solar:server-square-linear",
} as const);

export { ICONIFY_ICON_QUERY_KEY, ICONIFY_ICONS };
