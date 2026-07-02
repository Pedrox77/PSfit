import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const base="https://psfit.app"; return ["","/pricing","/privacy","/terms","/login","/signup","/twin"].map(route=>({url:base+route,lastModified:new Date(),changeFrequency:route===""?"weekly":"monthly",priority:route===""?1:.7}));
}
