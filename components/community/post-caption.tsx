import Link from "next/link";
export function PostCaption({username,caption}:{username:string;caption:string}){return <p className="px-4 pb-4 text-sm leading-6"><Link href={`/u/${username}`} className="mr-2 font-semibold">@{username}</Link>{caption}</p>}
