import { MomentCreator } from "@/components/community/moment-creator";
export const metadata={title:"Create Moment"};
export default function Page(){return <><header className="border-b border-white/[.07] p-5"><h1 className="text-xl font-semibold">New Moment</h1><p className="mt-1 text-xs text-muted">Visible for 24 hours unless saved to a Highlight.</p></header><MomentCreator/></>}
