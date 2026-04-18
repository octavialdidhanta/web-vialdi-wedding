import { createFileRoute } from "@tanstack/react-router";
import { OurServicesPage } from "@/service/OurServicesPage";

export const Route = createFileRoute("/service")({
  head: () => ({
    meta: [
      { title: "Service — vialdi.id" },
      {
        name: "description",
        content:
          "Solusi digital end-to-end untuk kembangkan bisnis Anda: End to End Agency, Creative & Social Media, Ads/Campaign, Website, dan Marketplace.",
      },
      { property: "og:title", content: "Service — vialdi.id" },
      { property: "og:description", content: "Layanan digital end-to-end dari vialdi.id." },
    ],
  }),
  component: OurServicesPage,
});
