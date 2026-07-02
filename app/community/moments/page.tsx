import { MomentsRow } from "@/components/community/moments-row";
import { getMoments } from "@/lib/community/moments";
export const metadata={title:"Moments"};
export default async function Page(){const stories=await getMoments();return <><header className="border-b border-white/[.07] p-5"><h1 className="text-xl font-semibold">Moments</h1><p className="mt-1 text-xs text-muted">A 24-hour window into real fitness life.</p></header><MomentsRow stories={stories}/></>}
