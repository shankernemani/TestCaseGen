import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pathfinder",
    short_name: "Pathfinder",
    description:
      "A private AI mentorship app for Sarvagna — Grade 8 to University",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F3E7",
    theme_color: "#116466",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
