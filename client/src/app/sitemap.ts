import { MetadataRoute } from "next";

const baseUrl = "https://queue-less-nu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/home`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/history`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/profile`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/settings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
    { url: `${baseUrl}/admin`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
    { url: `${baseUrl}/admin/queue`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
    { url: `${baseUrl}/admin/analytics`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
  ];
}
