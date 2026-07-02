-- PSFIT Pro nutrition setup, meals, food search, and water tracking.

alter table public.nutrition_preferences
  add column if not exists current_daily_calories integer,
  add column if not exists daily_water_ml integer,
  add column if not exists target_calories integer,
  add column if not exists protein_percentage integer not null default 30,
  add column if not exists carbs_percentage integer not null default 40,
  add column if not exists fat_percentage integer not null default 30,
  add column if not exists protein_target_grams numeric(8,2),
  add column if not exists carbs_target_grams numeric(8,2),
  add column if not exists fat_target_grams numeric(8,2),
  add column if not exists water_target_ml integer,
  add column if not exists nutrition_setup_completed boolean not null default false;

alter table public.nutrition_preferences
  drop constraint if exists nutrition_preferences_current_daily_calories_check,
  drop constraint if exists nutrition_preferences_daily_water_ml_check,
  drop constraint if exists nutrition_preferences_target_calories_check,
  drop constraint if exists nutrition_preferences_macro_distribution_check;

alter table public.nutrition_preferences
  add constraint nutrition_preferences_current_daily_calories_check
    check (current_daily_calories is null or current_daily_calories between 500 and 10000),
  add constraint nutrition_preferences_daily_water_ml_check
    check (daily_water_ml is null or daily_water_ml between 0 and 15000),
  add constraint nutrition_preferences_target_calories_check
    check (target_calories is null or target_calories between 500 and 10000),
  add constraint nutrition_preferences_macro_distribution_check
    check (
      protein_percentage between 0 and 100
      and carbs_percentage between 0 and 100
      and fat_percentage between 0 and 100
      and protein_percentage + carbs_percentage + fat_percentage = 100
    );

create table if not exists public.food_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  brand text,
  category text not null,
  serving_description text not null,
  serving_size numeric(10,2) not null check (serving_size > 0),
  serving_unit text not null,
  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(10,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  fiber_g numeric(10,2),
  sugar_g numeric(10,2),
  sodium_mg numeric(10,2),
  source text not null default 'PSFIT seed - estimated values',
  external_id text,
  image_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists food_catalog_external_id_unique
  on public.food_catalog(external_id);
create index if not exists food_catalog_normalized_name_idx
  on public.food_catalog(normalized_name);
create index if not exists food_catalog_category_idx
  on public.food_catalog(category);

create table if not exists public.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null default current_date,
  meal_type text not null check (meal_type in (
    'breakfast','morning_snack','lunch','afternoon_snack',
    'dinner','supper','custom'
  )),
  custom_name text,
  meal_time time,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nutrition_meals_user_date_idx
  on public.nutrition_meals(user_id, meal_date, created_at);

create table if not exists public.nutrition_meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.nutrition_meals(id) on delete cascade,
  food_id uuid,
  food_source text not null default 'catalog' check (food_source in ('catalog','custom')),
  food_name_snapshot text not null,
  serving_description_snapshot text,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit text not null,
  serving_multiplier numeric(10,4) not null default 1 check (serving_multiplier > 0),
  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(10,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nutrition_meal_items_meal_idx
  on public.nutrition_meal_items(meal_id, created_at);
create index if not exists nutrition_meal_items_user_idx
  on public.nutrition_meal_items(user_id, created_at desc);

create table if not exists public.user_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  brand text,
  category text not null default 'custom',
  serving_description text not null,
  serving_size numeric(10,2) not null check (serving_size > 0),
  serving_unit text not null,
  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(10,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_foods_user_name_idx
  on public.user_foods(user_id, normalized_name);

create table if not exists public.user_food_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null,
  food_source text not null check (food_source in ('catalog','custom')),
  created_at timestamptz not null default now(),
  primary key(user_id, food_id, food_source)
);

create table if not exists public.water_intake_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  amount_ml integer not null check (amount_ml between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists water_intake_logs_user_date_idx
  on public.water_intake_logs(user_id, log_date, created_at);

-- Updated-at triggers reuse the project's existing public.set_updated_at function.
drop trigger if exists food_catalog_updated_at on public.food_catalog;
create trigger food_catalog_updated_at
before update on public.food_catalog
for each row execute function public.set_updated_at();

drop trigger if exists nutrition_meals_updated_at on public.nutrition_meals;
create trigger nutrition_meals_updated_at
before update on public.nutrition_meals
for each row execute function public.set_updated_at();

drop trigger if exists nutrition_meal_items_updated_at on public.nutrition_meal_items;
create trigger nutrition_meal_items_updated_at
before update on public.nutrition_meal_items
for each row execute function public.set_updated_at();

drop trigger if exists user_foods_updated_at on public.user_foods;
create trigger user_foods_updated_at
before update on public.user_foods
for each row execute function public.set_updated_at();

alter table public.food_catalog enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.nutrition_meal_items enable row level security;
alter table public.user_foods enable row level security;
alter table public.user_food_favorites enable row level security;
alter table public.water_intake_logs enable row level security;

drop policy if exists "authenticated users read food catalog" on public.food_catalog;
create policy "authenticated users read food catalog"
on public.food_catalog for select to authenticated
using (true);

drop policy if exists "users manage own nutrition meals" on public.nutrition_meals;
create policy "users manage own nutrition meals"
on public.nutrition_meals for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own nutrition meal items" on public.nutrition_meal_items;
create policy "users manage own nutrition meal items"
on public.nutrition_meal_items for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own custom foods" on public.user_foods;
create policy "users manage own custom foods"
on public.user_foods for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own food favorites" on public.user_food_favorites;
create policy "users manage own food favorites"
on public.user_food_favorites for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own water logs" on public.water_intake_logs;
create policy "users manage own water logs"
on public.water_intake_logs for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Initial Brazilian-friendly catalog. Values are estimates per listed serving,
-- intentionally marked unverified and should not replace a product label or professional database.
insert into public.food_catalog (
  name, normalized_name, category, serving_description, serving_size,
  serving_unit, calories, protein_g, carbs_g, fat_g, source, external_id, verified
) values
('Arroz branco cozido','arroz branco cozido','grains','100 g',100,'g',130,2.7,28.2,0.3,'PSFIT seed - estimated','seed:arroz-branco',false),
('Arroz integral cozido','arroz integral cozido','grains','100 g',100,'g',124,2.6,25.8,1.0,'PSFIT seed - estimated','seed:arroz-integral',false),
('Feijão carioca cozido','feijao carioca cozido','beans','100 g',100,'g',76,4.8,13.6,0.5,'PSFIT seed - estimated','seed:feijao-carioca',false),
('Feijão preto cozido','feijao preto cozido','beans','100 g',100,'g',77,4.5,14.0,0.5,'PSFIT seed - estimated','seed:feijao-preto',false),
('Macarrão cozido','macarrao cozido','pasta','100 g',100,'g',157,5.8,30.9,0.9,'PSFIT seed - estimated','seed:macarrao',false),
('Pão francês','pao frances','breads','1 unidade (50 g)',50,'unit',135,4.5,28.0,1.5,'PSFIT seed - estimated','seed:pao-frances',false),
('Pão integral','pao integral','breads','2 fatias (50 g)',50,'slice',124,5.0,22.0,2.0,'PSFIT seed - estimated','seed:pao-integral',false),
('Tapioca pronta','tapioca pronta','breads','1 unidade (80 g)',80,'unit',190,0.2,46.0,0.1,'PSFIT seed - estimated','seed:tapioca',false),
('Cuscuz de milho cozido','cuscuz de milho cozido','grains','100 g',100,'g',112,2.2,25.3,0.7,'PSFIT seed - estimated','seed:cuscuz',false),
('Aveia em flocos','aveia em flocos','grains','40 g',40,'g',152,5.2,27.0,2.8,'PSFIT seed - estimated','seed:aveia',false),
('Batata inglesa cozida','batata inglesa cozida','vegetables','100 g',100,'g',87,1.9,20.1,0.1,'PSFIT seed - estimated','seed:batata',false),
('Batata-doce cozida','batata doce cozida','vegetables','100 g',100,'g',86,1.6,20.1,0.1,'PSFIT seed - estimated','seed:batata-doce',false),
('Mandioca cozida','mandioca cozida','vegetables','100 g',100,'g',125,0.6,30.1,0.3,'PSFIT seed - estimated','seed:mandioca',false),
('Peito de frango grelhado','peito de frango grelhado','proteins','100 g',100,'g',165,31.0,0,3.6,'PSFIT seed - estimated','seed:frango',false),
('Carne moída magra','carne moida magra','proteins','100 g',100,'g',212,26.0,0,11.0,'PSFIT seed - estimated','seed:carne-moida',false),
('Patinho grelhado','patinho grelhado','proteins','100 g',100,'g',219,35.9,0,7.3,'PSFIT seed - estimated','seed:patinho',false),
('Ovo cozido','ovo cozido','proteins','1 unidade (50 g)',50,'unit',78,6.3,0.6,5.3,'PSFIT seed - estimated','seed:ovo',false),
('Atum em água','atum em agua','proteins','100 g',100,'g',116,25.5,0,0.8,'PSFIT seed - estimated','seed:atum',false),
('Sardinha','sardinha','proteins','100 g',100,'g',208,24.6,0,11.5,'PSFIT seed - estimated','seed:sardinha',false),
('Tilápia grelhada','tilapia grelhada','proteins','100 g',100,'g',128,26.2,0,2.7,'PSFIT seed - estimated','seed:tilapia',false),
('Leite integral','leite integral','dairy','200 ml',200,'ml',122,6.4,9.4,6.6,'PSFIT seed - estimated','seed:leite-integral',false),
('Leite desnatado','leite desnatado','dairy','200 ml',200,'ml',70,6.8,10.0,0.2,'PSFIT seed - estimated','seed:leite-desnatado',false),
('Iogurte natural','iogurte natural','dairy','170 g',170,'g',104,6.0,8.0,5.0,'PSFIT seed - estimated','seed:iogurte',false),
('Queijo muçarela','queijo mucarela','dairy','1 fatia (30 g)',30,'slice',90,6.7,0.7,6.8,'PSFIT seed - estimated','seed:queijo-mucarela',false),
('Whey protein','whey protein','supplements','1 scoop (30 g)',30,'scoop',120,23.0,3.0,2.0,'PSFIT seed - estimated','seed:whey',false),
('Banana prata','banana prata','fruits','1 unidade (80 g)',80,'unit',72,0.9,18.6,0.2,'PSFIT seed - estimated','seed:banana',false),
('Maçã','maca','fruits','1 unidade (130 g)',130,'unit',68,0.3,18.0,0.2,'PSFIT seed - estimated','seed:maca',false),
('Mamão','mamao','fruits','100 g',100,'g',43,0.5,10.8,0.3,'PSFIT seed - estimated','seed:mamao',false),
('Laranja','laranja','fruits','1 unidade (140 g)',140,'unit',66,1.3,16.5,0.2,'PSFIT seed - estimated','seed:laranja',false),
('Morango','morango','fruits','100 g',100,'g',32,0.7,7.7,0.3,'PSFIT seed - estimated','seed:morango',false),
('Abacate','abacate','fruits','100 g',100,'g',160,2.0,8.5,14.7,'PSFIT seed - estimated','seed:abacate',false),
('Tomate','tomate','vegetables','100 g',100,'g',18,0.9,3.9,0.2,'PSFIT seed - estimated','seed:tomate',false),
('Cenoura cozida','cenoura cozida','vegetables','100 g',100,'g',35,0.8,8.2,0.2,'PSFIT seed - estimated','seed:cenoura',false),
('Brócolis cozido','brocolis cozido','vegetables','100 g',100,'g',35,2.4,7.2,0.4,'PSFIT seed - estimated','seed:brocolis',false),
('Café sem açúcar','cafe sem acucar','beverages','200 ml',200,'ml',4,0.2,0,0,'PSFIT seed - estimated','seed:cafe',false),
('Suco de laranja','suco de laranja','beverages','200 ml',200,'ml',90,1.4,20.8,0.4,'PSFIT seed - estimated','seed:suco-laranja',false),
('Refrigerante comum','refrigerante comum','beverages','350 ml',350,'ml',147,0,37.0,0,'PSFIT seed - estimated','seed:refrigerante',false),
('Açaí com xarope','acai com xarope','desserts','200 g',200,'g',220,2.0,45.0,4.0,'PSFIT seed - estimated','seed:acai',false),
('Chocolate ao leite','chocolate ao leite','sweets','25 g',25,'g',134,1.9,14.8,7.5,'PSFIT seed - estimated','seed:chocolate-leite',false),
('Chocolate amargo 70%','chocolate amargo 70','sweets','25 g',25,'g',150,2.0,11.5,10.8,'PSFIT seed - estimated','seed:chocolate-amargo',false),
('Brigadeiro','brigadeiro','sweets','1 unidade (30 g)',30,'unit',105,1.2,17.0,3.8,'PSFIT seed - estimated','seed:brigadeiro',false),
('Beijinho','beijinho','sweets','1 unidade (30 g)',30,'unit',110,1.0,16.5,4.8,'PSFIT seed - estimated','seed:beijinho',false),
('Paçoca','pacoca','sweets','1 unidade (22 g)',22,'unit',110,3.0,10.0,6.5,'PSFIT seed - estimated','seed:pacoca',false),
('Pé de moleque','pe de moleque','sweets','1 unidade (25 g)',25,'unit',120,3.5,14.0,6.0,'PSFIT seed - estimated','seed:pe-moleque',false),
('Doce de leite','doce de leite','sweets','1 colher (20 g)',20,'tbsp',63,1.2,11.0,1.6,'PSFIT seed - estimated','seed:doce-leite',false),
('Bolo de chocolate','bolo de chocolate','desserts','1 fatia (80 g)',80,'slice',290,4.0,42.0,12.0,'PSFIT seed - estimated','seed:bolo-chocolate',false),
('Bolo de cenoura','bolo de cenoura','desserts','1 fatia (80 g)',80,'slice',270,3.5,39.0,11.0,'PSFIT seed - estimated','seed:bolo-cenoura',false),
('Brownie','brownie','desserts','1 unidade (60 g)',60,'unit',250,3.5,35.0,11.0,'PSFIT seed - estimated','seed:brownie',false),
('Cookie com chocolate','cookie com chocolate','sweets','1 unidade (40 g)',40,'unit',190,2.5,25.0,9.0,'PSFIT seed - estimated','seed:cookie',false),
('Biscoito recheado','biscoito recheado','sweets','3 unidades (30 g)',30,'unit',145,1.7,21.0,6.0,'PSFIT seed - estimated','seed:biscoito-recheado',false),
('Sorvete de creme','sorvete de creme','desserts','2 bolas (100 g)',100,'g',207,3.5,24.0,11.0,'PSFIT seed - estimated','seed:sorvete',false),
('Pudim de leite','pudim de leite','desserts','1 fatia (100 g)',100,'slice',230,5.0,35.0,8.0,'PSFIT seed - estimated','seed:pudim',false),
('Mousse de chocolate','mousse de chocolate','desserts','100 g',100,'g',225,4.0,28.0,11.0,'PSFIT seed - estimated','seed:mousse',false),
('Churros','churros','desserts','1 unidade (80 g)',80,'unit',260,4.0,38.0,10.0,'PSFIT seed - estimated','seed:churros',false),
('Cocada','cocada','sweets','1 unidade (40 g)',40,'unit',160,1.2,25.0,6.5,'PSFIT seed - estimated','seed:cocada',false),
('Bombom de chocolate','bombom de chocolate','sweets','1 unidade (20 g)',20,'unit',100,1.2,12.0,5.5,'PSFIT seed - estimated','seed:bombom',false),
('Gelatina pronta','gelatina pronta','desserts','100 g',100,'g',62,1.2,14.0,0,'PSFIT seed - estimated','seed:gelatina',false)
on conflict (external_id) do update set
  name = excluded.name,
  normalized_name = excluded.normalized_name,
  category = excluded.category,
  serving_description = excluded.serving_description,
  serving_size = excluded.serving_size,
  serving_unit = excluded.serving_unit,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  source = excluded.source,
  verified = excluded.verified,
  updated_at = now();

notify pgrst, 'reload schema';
