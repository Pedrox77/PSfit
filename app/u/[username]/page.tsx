import { ProfileHeader } from "@/components/community/profile-header";
import { ProfileGrid } from "@/components/community/profile-grid";
import { getFeed, getProfile } from "@/lib/community/feed";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getHighlights } from "@/lib/community/moments";
import { HighlightsRow } from "@/components/community/highlights-row";
import { ProfileTabs } from "@/components/community/profile-tabs";
type Props={params:Promise<{username:string}>};
export async function generateMetadata({params}:Props){const {username}=await params;return {title:`@${username}`}}
export default async function Page({params}:Props){const {username}=await params;const [profile,supabase]=await Promise.all([getProfile(username),createClient()]);if(!profile)notFound();const [{posts},{data:auth},highlights]=await Promise.all([getFeed("profile",undefined,profile.id),supabase.auth.getUser(),getHighlights(profile.id)]);const own=auth.user?.id===profile.id;return <><ProfileHeader profile={profile} own={own}/><HighlightsRow items={highlights} own={own}/><ProfileTabs/>{profile.is_private&&!own&&!posts.length?<div className="px-6 py-20 text-center"><h2 className="font-semibold">This account is private.</h2><p className="mt-2 text-sm text-muted">Request to follow to see shared moments.</p></div>:<ProfileGrid posts={posts} viewerId={auth.user?.id}/>}</>}
