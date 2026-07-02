"use client";
import type { SpotifyPreview } from "@/lib/spotify/oembed";
import { ExternalLink, Music2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SpotifyEmbed } from "./spotify-embed";
export function SpotifyTrackCard({music,onRemove}:{music:SpotifyPreview;onRemove?:()=>void}){const [expanded,setExpanded]=useState(false);return <div className="rounded-2xl border border-[#1ed760]/20 bg-[#1ed760]/5 p-3"><div className="flex items-center gap-3">{music.artworkUrl?<Image unoptimized src={music.artworkUrl} width={52} height={52} className="rounded-lg object-contain" alt="Spotify artwork"/>:<div className="grid h-12 w-12 place-items-center rounded-lg bg-[#1ed760]/10"><Music2/></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{music.title}</p><p className="text-xs text-muted">Spotify</p></div><button type="button" onClick={()=>setExpanded(!expanded)} className="text-xs text-[#1ed760]">{expanded?"Close":"Play"}</button><a href={music.url} target="_blank" rel="noreferrer" aria-label="Open on Spotify"><ExternalLink size={16}/></a>{onRemove&&<button type="button" onClick={onRemove}><X size={16}/></button>}</div>{expanded&&music.embedUrl&&<SpotifyEmbed url={music.embedUrl}/>}<p className="mt-2 text-[10px] text-muted">Content provided by Spotify</p></div>}
