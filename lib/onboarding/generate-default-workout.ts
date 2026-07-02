export interface TrainingInput {
  primary_goal:string;experience_level:string;training_location:string;
  equipment:string[];days_per_week:number;session_duration_minutes:number;
  focus_areas:string[];limitations:string[];coaching_style:string;
  preferred_days?:string[];preferred_time?:string;
  limitation_notes?:string;
}
export interface DefaultExercise {
  name:string;name_key:string;sets:number;repetitions:string;load_guidance:string;
}
export interface DefaultWorkout {
  name:string;name_key:string;focus:string[];focus_key:string;exercises:DefaultExercise[];
}

const workoutNames:Record<string,string>={
  full_body_a:"Full Body A",full_body_b:"Full Body B",upper:"Upper Body",
  lower:"Lower Body",full_body:"Full Body",upper_a:"Upper Body A",
  lower_a:"Lower Body A",upper_b:"Upper Body B",lower_b:"Lower Body B",
  push:"Push",pull:"Pull",legs:"Legs",push_a:"Push A",pull_a:"Pull A",
  legs_a:"Legs A",push_b:"Push B",pull_b:"Pull B",legs_b:"Legs B",
  mobility:"Mobility",conditioning:"Conditioning",
};
const split:Record<number,string[]>={
  2:["full_body_a","full_body_b"],
  3:["upper","lower","full_body"],
  4:["upper_a","lower_a","upper_b","lower_b"],
  5:["push","pull","legs","upper","lower"],
  6:["push_a","pull_a","legs_a","push_b","pull_b","legs_b"],
  7:["push","pull","legs","upper","lower","mobility","conditioning"],
};
const focusNames:Record<string,string[]>={
  chest_shoulders_triceps:["Chest","Shoulders","Triceps"],
  back_biceps:["Back","Biceps"],
  legs_glutes_core:["Legs","Glutes","Core"],
  chest_back_shoulders_arms:["Chest","Back","Shoulders","Arms"],
  mobility_core:["Mobility","Core"],
  cardio_full_body:["Cardio","Full Body"],
  full_body:["Full Body"],
};
const exerciseNames:Record<string,string>={
  push_up:"Push-up",machine_chest_press:"Machine Chest Press",
  resistance_band_row:"Resistance Band Row",seated_cable_row:"Seated Cable Row",
  dumbbell_lateral_raise:"Dumbbell Lateral Raise",bench_squat:"Bench Squat",
  leg_press:"Leg Press",hip_thrust:"Hip Thrust",bird_dog:"Bird Dog",
  dead_bug:"Dead Bug",controlled_mobility_flow:"Controlled Mobility Flow",
  hip_shoulder_mobility:"Hip and Shoulder Mobility",
  low_impact_interval_walk:"Low-impact Interval Walk",
  supported_lunge:"Supported Lunge",cable_band_accessory:"Cable or Band Accessory",
  light_conditioning:"Light Conditioning",
};

export function generateDefaultWorkoutPlan(input:TrainingInput):DefaultWorkout[]{
  const count=Math.max(2,Math.min(7,input.days_per_week));
  return (split[count]??split[3]).map(nameKey=>{
    const focusKey=focusFor(nameKey);
    return {name:workoutNames[nameKey],name_key:nameKey,focus:focusNames[focusKey],focus_key:focusKey,exercises:exercisesFor(focusKey,input)};
  });
}
function focusFor(key:string){
  if(key.startsWith("push"))return"chest_shoulders_triceps";
  if(key.startsWith("pull"))return"back_biceps";
  if(key==="lower"||key.startsWith("lower_")||key.startsWith("legs"))return"legs_glutes_core";
  if(key==="upper"||key.startsWith("upper_"))return"chest_back_shoulders_arms";
  if(key==="mobility")return"mobility_core";
  if(key==="conditioning")return"cardio_full_body";
  return"full_body";
}
function exercisesFor(focusKey:string,input:TrainingInput):DefaultExercise[]{
  const focus=focusNames[focusKey],limitations=new Set(input.limitations);
  const home=input.training_location==="home"&&!input.equipment.includes("full_gym");
  const keys:string[]=[];
  if(focus.includes("Chest")||focus.includes("Full Body"))keys.push(home?"push_up":"machine_chest_press");
  if(focus.includes("Back")||focus.includes("Full Body"))keys.push(home?"resistance_band_row":"seated_cable_row");
  if((focus.includes("Shoulders")||focus.includes("Full Body"))&&!limitations.has("shoulder_discomfort"))keys.push("dumbbell_lateral_raise");
  if((focus.includes("Legs")||focus.includes("Full Body"))&&!limitations.has("knee_discomfort"))keys.push(home?"bench_squat":"leg_press");
  if((focus.includes("Glutes")||focus.includes("Full Body"))&&!limitations.has("lower_back_discomfort"))keys.push("hip_thrust");
  if(focus.includes("Core")||focus.includes("Full Body"))keys.push(limitations.has("lower_back_discomfort")?"bird_dog":"dead_bug");
  if(focus.includes("Mobility"))keys.push("controlled_mobility_flow","hip_shoulder_mobility");
  if(focus.includes("Cardio"))keys.push("low_impact_interval_walk");
  if(keys.length<4)keys.push("supported_lunge","cable_band_accessory","light_conditioning");
  const sets=input.experience_level==="advanced"?4:3,limit=input.session_duration_minutes<=30?4:6;
  return keys.slice(0,limit).map(nameKey=>({name:exerciseNames[nameKey],name_key:nameKey,sets,repetitions:nameKey.includes("mobility")?"40 seconds":"8-12",load_guidance:"Keep 2–3 comfortable repetitions in reserve"}));
}
