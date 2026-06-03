import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QueueLess — Smart Queue & Appointment System",
    short_name: "QueueLess",
    description: "Join queues remotely and track your turn in real-time.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    orientation: "portrait-primary",
    icons: [
      { src: "/webcon.png", sizes: "192x192", type: "image/png" },
      { src: "/webcon.png", sizes: "512x512", type: "image/png" },
      {
        src: "/webcon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
  };
}
