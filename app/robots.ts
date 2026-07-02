import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/dashboard","/today","/settings"]},sitemap:"https://psfit.app/sitemap.xml"}}
