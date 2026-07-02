# PSFIT Nutrition Tracking

## O que foi adicionado

- Fluxo Pro de configuração de calorias atuais, água diária e distribuição de macros.
- Cálculo de calorias-alvo, proteína, carboidratos, gorduras e água.
- Página diária de refeições com navegação entre datas.
- Criação e exclusão de refeições.
- Busca local paginada por alimentos, bebidas, doces e sobremesas.
- Adição e remoção de alimentos com recálculo por porção.
- Criação de alimentos personalizados.
- Registro rápido de água e desfazer último registro.
- RLS e bloqueio Pro no servidor em todas as rotas novas.

## Instalação

1. Copie os arquivos para o projeto.
2. No Supabase SQL Editor, execute:

   `supabase/migrations/016_nutrition_tracking.sql`

3. Confirme que a migration terminou sem erro.
4. Rode:

```powershell
npm install
npm run lint
npm run build
```

5. Publique novamente na Vercel.

## Rotas

- `/nutrition` direciona para configuração ou refeições.
- `/nutrition/setup` configura calorias, água e macros.
- `/nutrition/meals` registra refeições, alimentos e água.

## Observação sobre alimentos

O catálogo inicial contém alimentos brasileiros populares, bebidas, suplementos,
doces e sobremesas. Os valores do seed são marcados como estimativas não verificadas.
O usuário também pode criar alimentos próprios. Para cobertura global de marcas e
rótulos, conecte futuramente um provedor externo mantendo as chamadas no servidor.
