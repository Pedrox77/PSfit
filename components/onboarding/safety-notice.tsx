import { ShieldCheck } from "lucide-react";
export function SafetyNotice({children}:{children:React.ReactNode}){return <div className="flex gap-3 rounded-2xl border border-aqua/20 bg-aqua/[.05] p-4 text-sm leading-6 text-muted"><ShieldCheck className="mt-0.5 shrink-0 text-aqua" size={19}/><p>{children}</p></div>}
