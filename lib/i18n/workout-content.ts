type Translator=(key:string)=>string;

const workoutKeys=new Set(["full_body_a","full_body_b","upper","lower","full_body","upper_a","lower_a","upper_b","lower_b","push","pull","legs","push_a","pull_a","legs_a","push_b","pull_b","legs_b","mobility","conditioning"]);
const focusKeys=new Set(["chest_shoulders_triceps","back_biceps","legs_glutes_core","chest_back_shoulders_arms","mobility_core","cardio_full_body","full_body"]);
const exerciseKeys=new Set(["push_up","machine_chest_press","resistance_band_row","seated_cable_row","dumbbell_lateral_raise","bench_squat","leg_press","hip_thrust","bird_dog","dead_bug","controlled_mobility_flow","hip_shoulder_mobility","low_impact_interval_walk","supported_lunge","cable_band_accessory","light_conditioning"]);

function translated(t:Translator,namespace:string,key:string|null|undefined,fallback:string){
  if(!key)return fallback;
  const allowed=namespace==="workouts"?workoutKeys:namespace==="focus"?focusKeys:exerciseKeys;
  return allowed.has(key)?t(`${namespace}.${key}`):fallback;
}
export const workoutName=(t:Translator,key:string|null|undefined,fallback:string)=>translated(t,"workouts",key,fallback);
export const workoutFocus=(t:Translator,key:string|null|undefined,fallback:string)=>translated(t,"focus",key,fallback);
export const exerciseName=(t:Translator,key:string|null|undefined,fallback:string)=>translated(t,"exercises",key,fallback);
