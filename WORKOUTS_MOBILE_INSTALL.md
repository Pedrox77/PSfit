# PSFIT — nova tela de Treinos

## Instalação rápida

1. Faça backup do projeto atual.
2. Copie os arquivos do ZIP de patch mantendo a mesma estrutura de pastas.
3. Rode:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm install
npm run lint
npm run build
npm run dev
```

## O que mudou

- Cabeçalho mobile com pesquisa, sequência e configurações.
- Calendário semanal clicável.
- Métricas em anéis: calorias, volume, séries e repetições.
- Cards de treino com exercícios e acesso à sessão.
- Botão tracejado para criar treino.
- Botão flutuante de criação.
- Navegação inferior mobile.
- Busca por nome de treino ou exercício.
- Layout desktop preservado e adaptado.
- Traduções PT, EN e ES.

Nenhuma migration nova é necessária para esta alteração visual.
