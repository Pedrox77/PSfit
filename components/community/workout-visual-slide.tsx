import type { WorkoutReceipt } from "@/types/database";
import { BodyImpactMap } from "./body-impact-map";
import { TrainingStatsPanel } from "./training-stats-panel";
export function WorkoutVisualSlide({receipt,type}:{receipt:WorkoutReceipt;type:"stats"|"impact"}){return type==="stats"?<TrainingStatsPanel receipt={receipt}/>:<BodyImpactMap receipt={receipt}/>}
