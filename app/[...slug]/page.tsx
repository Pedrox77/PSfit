import RoutePage from "@/components/route-page";
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;return <RoutePage slug={slug}/>}
