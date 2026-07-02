export const muscleGroups = [
  "chest",
  "upper_chest",
  "back",
  "lats",
  "traps",
  "lower_back",
  "shoulders",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "abs",
  "obliques",
  "glutes",
  "quadriceps",
  "hamstrings",
  "adductors",
  "calves",
  "hip_flexors",
  "full_body",
  "cardio",
  "mobility",
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];

const aliases: Record<string, MuscleGroup> = {
  peito: "chest",
  chest: "chest",
  pectoral: "chest",
  pectorals: "chest",
  pectorales: "chest",
  "peito superior": "upper_chest",
  "upper chest": "upper_chest",
  costas: "back",
  back: "back",
  espalda: "back",
  dorsal: "lats",
  dorsais: "lats",
  lats: "lats",
  latissimus: "lats",
  trapezio: "traps",
  trapezius: "traps",
  trapecio: "traps",
  traps: "traps",
  lombar: "lower_back",
  "lower back": "lower_back",
  "espalda baja": "lower_back",
  ombro: "shoulders",
  ombros: "shoulders",
  shoulder: "shoulders",
  shoulders: "shoulders",
  hombro: "shoulders",
  hombros: "shoulders",
  deltoid: "shoulders",
  deltoide: "shoulders",
  "deltoide anterior": "front_delts",
  "front delts": "front_delts",
  "deltoide lateral": "side_delts",
  "side delts": "side_delts",
  "deltoide posterior": "rear_delts",
  "rear delts": "rear_delts",
  biceps: "biceps",
  triceps: "triceps",
  antebraco: "forearms",
  antebracos: "forearms",
  forearm: "forearms",
  forearms: "forearms",
  antebrazo: "forearms",
  antebrazos: "forearms",
  abdomen: "abs",
  abdominal: "abs",
  abdominals: "abs",
  abdominales: "abs",
  abs: "abs",
  core: "core",
  obliquos: "obliques",
  obliques: "obliques",
  glute: "glutes",
  glutes: "glutes",
  gluteo: "glutes",
  gluteos: "glutes",
  quadriceps: "quadriceps",
  quads: "quadriceps",
  cuadriceps: "quadriceps",
  perna: "quadriceps",
  pernas: "quadriceps",
  leg: "quadriceps",
  legs: "quadriceps",
  pierna: "quadriceps",
  piernas: "quadriceps",
  hamstrings: "hamstrings",
  posteriores: "hamstrings",
  "posterior de coxa": "hamstrings",
  isquiotibiais: "hamstrings",
  isquiotibiales: "hamstrings",
  adutores: "adductors",
  adductors: "adductors",
  aductores: "adductors",
  calves: "calves",
  calf: "calves",
  panturrilha: "calves",
  panturrilhas: "calves",
  gemelos: "calves",
  "flexores do quadril": "hip_flexors",
  "hip flexors": "hip_flexors",
  "flexores de cadera": "hip_flexors",
  "corpo inteiro": "full_body",
  "full body": "full_body",
  "cuerpo completo": "full_body",
  cardio: "cardio",
  mobilidade: "mobility",
  mobility: "mobility",
  movilidad: "mobility",
  alongamento: "mobility",
  stretching: "mobility",
  estiramiento: "mobility",
};

function cleanMuscle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMuscle(
  value: string | null | undefined,
): MuscleGroup | null {
  if (!value) return null;
  return aliases[cleanMuscle(value)] ?? null;
}

export function normalizeMuscles(
  values: Array<string | null | undefined>,
): MuscleGroup[] {
  return [
    ...new Set(
      values
        .map(normalizeMuscle)
        .filter((muscle): muscle is MuscleGroup => muscle !== null),
    ),
  ];
}
