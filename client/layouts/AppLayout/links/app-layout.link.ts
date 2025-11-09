import type { LinkDescriptor } from "react-router";

const appLayoutLink = (): LinkDescriptor[] => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Forum&family=Lato&display=swap",
  },
];

export { appLayoutLink };
