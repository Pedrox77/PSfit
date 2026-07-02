alter table public.workouts
  add column if not exists name_key text,
  add column if not exists focus_key text;

alter table public.exercises
  add column if not exists name_key text;

update public.workouts w
set name_key = case w.name
  when 'Corpo inteiro A' then 'full_body_a'
  when 'Corpo inteiro B' then 'full_body_b'
  when 'Superior' then 'upper'
  when 'Inferior' then 'lower'
  when 'Superior A' then 'upper_a'
  when 'Superior B' then 'upper_b'
  when 'Inferior A' then 'lower_a'
  when 'Inferior B' then 'lower_b'
  when 'Corpo inteiro' then 'full_body'
  when 'Empurrar' then 'push'
  when 'Puxar' then 'pull'
  when 'Pernas' then 'legs'
  when 'Empurrar A' then 'push_a'
  when 'Puxar A' then 'pull_a'
  when 'Pernas A' then 'legs_a'
  when 'Empurrar B' then 'push_b'
  when 'Puxar B' then 'pull_b'
  when 'Pernas B' then 'legs_b'
  when 'Mobilidade' then 'mobility'
  when 'Condicionamento' then 'conditioning'
end
from public.workout_plans p
where w.plan_id = p.id
  and p.source = 'onboarding'
  and w.name_key is null
  and w.name in ('Corpo inteiro A','Corpo inteiro B','Superior','Inferior','Superior A','Superior B','Inferior A','Inferior B','Corpo inteiro','Empurrar','Puxar','Pernas','Empurrar A','Puxar A','Pernas A','Empurrar B','Puxar B','Pernas B','Mobilidade','Condicionamento');

update public.workouts w
set focus_key = case w.focus
  when 'Peito,Ombros,Tríceps' then 'chest_shoulders_triceps'
  when 'Peito, Ombros, Tríceps' then 'chest_shoulders_triceps'
  when 'Costas,Bíceps' then 'back_biceps'
  when 'Costas, Bíceps' then 'back_biceps'
  when 'Peito,Costas,Ombros,Braços' then 'chest_back_shoulders_arms'
  when 'Peito, Costas, Ombros, Braços' then 'chest_back_shoulders_arms'
  when 'Pernas,Glúteos,Core' then 'legs_glutes_core'
  when 'Pernas, Glúteos, Core' then 'legs_glutes_core'
  when 'Corpo inteiro' then 'full_body'
  when 'Mobilidade,Core' then 'mobility_core'
  when 'Mobilidade, Core' then 'mobility_core'
  when 'Cardio,Corpo inteiro' then 'cardio_full_body'
  when 'Cardio, Corpo inteiro' then 'cardio_full_body'
end
from public.workout_plans p
where w.plan_id = p.id
  and p.source = 'onboarding'
  and w.focus_key is null;

update public.exercises e
set name_key = case e.name
  when 'Flexão' then 'push_up'
  when 'Supino na máquina' then 'machine_chest_press'
  when 'Remada com elástico' then 'resistance_band_row'
  when 'Remada baixa no cabo' then 'seated_cable_row'
  when 'Elevação lateral com halteres' then 'dumbbell_lateral_raise'
  when 'Agachamento no banco' then 'bench_squat'
  when 'Leg press' then 'leg_press'
  when 'Elevação pélvica' then 'hip_thrust'
  when 'Bird dog' then 'bird_dog'
  when 'Dead bug' then 'dead_bug'
  when 'Fluxo de mobilidade controlada' then 'controlled_mobility_flow'
  when 'Mobilidade de quadril e ombros' then 'hip_shoulder_mobility'
  when 'Caminhada intervalada de baixo impacto' then 'low_impact_interval_walk'
  when 'Afundo com apoio' then 'supported_lunge'
  when 'Acessório no cabo ou elástico' then 'cable_band_accessory'
  when 'Condicionamento leve' then 'light_conditioning'
end
from public.workouts w
join public.workout_plans p on p.id = w.plan_id
where e.workout_id = w.id
  and p.source = 'onboarding'
  and e.name_key is null
  and e.name in ('Flexão','Supino na máquina','Remada com elástico','Remada baixa no cabo','Elevação lateral com halteres','Agachamento no banco','Leg press','Elevação pélvica','Bird dog','Dead bug','Fluxo de mobilidade controlada','Mobilidade de quadril e ombros','Caminhada intervalada de baixo impacto','Afundo com apoio','Acessório no cabo ou elástico','Condicionamento leve');
