import { Dumbbell } from "lucide-react";

export type PsfitLoaderProps = {
  fullScreen?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const dimensions = {
  sm: { frame: "h-7 w-7", icon: 14, orbit: "h-5 w-5" },
  md: { frame: "h-20 w-20", icon: 28, orbit: "h-16 w-16" },
  lg: { frame: "h-28 w-28", icon: 38, orbit: "h-24 w-24" },
};

export function PsfitLoader({
  fullScreen = false,
  label = "Preparing your workout...",
  size = "md",
}: PsfitLoaderProps) {
  const current = dimensions[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={fullScreen
        ? "fixed inset-0 z-[100] grid min-h-dvh place-items-center bg-black px-5"
        : "inline-flex items-center justify-center gap-3"}
    >
      <div className={fullScreen ? "text-center" : "inline-flex items-center gap-3"}>
        <div className={`psfit-loader relative mx-auto grid place-items-center ${current.frame}`}>
          <span className="psfit-loader-glow absolute inset-[20%] rounded-full bg-acid/10 blur-md"/>
          <Dumbbell
            size={current.icon}
            strokeWidth={1.8}
            className="psfit-loader-dumbbell relative z-10 text-acid drop-shadow-[0_0_8px_rgba(168,255,42,.35)]"
            aria-hidden="true"
          />
          <span className={`psfit-loader-orbit absolute left-1/2 top-1/2 ${current.orbit}`} aria-hidden="true">
            <svg className="psfit-loader-item psfit-loader-plate" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
            </svg>
            <svg className="psfit-loader-item psfit-loader-bottle" viewBox="0 0 16 16">
              <path d="M6 2h4v2l1 2v7H5V6l1-2V2Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 8h5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <svg className="psfit-loader-item psfit-loader-kettlebell" viewBox="0 0 16 16">
              <path d="M5.5 6a2.5 2.5 0 0 1 5 0" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 8c0-2 8-2 8 0l1 5H3l1-5Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
        </div>
        {label && <p className={`${fullScreen ? "mt-5" : ""} text-sm font-medium tracking-wide text-white/75`}>{label}</p>}
      </div>
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}
