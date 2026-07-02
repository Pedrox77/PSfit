# PSFit — Fitness, Nutrição e Evolução

O **PSFit** é uma plataforma completa de saúde e desempenho físico que reúne treinos personalizados, acompanhamento nutricional, recuperação, progresso e comunidade em uma única experiência.

O objetivo do projeto é ajudar cada usuário a criar uma rotina consistente, acompanhar sua evolução e receber orientações personalizadas de acordo com seus objetivos.

## Funcionalidades

### Treinos personalizados

- Plano de treino baseado no objetivo do usuário
- Exercícios organizados por grupos musculares
- Séries, repetições, carga e tempo de descanso
- Registro de treinos concluídos
- Histórico de sessões
- Visualização das áreas musculares trabalhadas
- Criação e personalização de treinos
- Instruções para execução dos exercícios

### Nutrição

- Registro diário de alimentação
- Controle de calorias
- Acompanhamento de proteínas, carboidratos e gorduras
- Metas nutricionais personalizadas
- Histórico alimentar
- Sugestões de refeições
- Recursos exclusivos para usuários PSFit Pro

### Inteligência artificial

- Integração com Google Gemini
- Sugestões personalizadas de treino
- Orientações nutricionais
- Análise do desempenho do usuário
- Recomendações baseadas em objetivo, nível e rotina
- Assistente para dúvidas sobre treino, alimentação e recuperação

> As recomendações geradas pela inteligência artificial não substituem o acompanhamento de médicos, nutricionistas ou profissionais de educação física.

### Progresso

- Registro de peso e medidas
- Fotos de evolução
- Histórico de desempenho
- Comparação de resultados
- Metas pessoais
- Sequência de dias ativos
- Indicadores de consistência

### Recuperação

- Check-in diário
- Registro da qualidade do sono
- Nível de energia
- Dores musculares
- Análise de prontidão para o treino
- Recomendações de descanso

### Comunidade

- Feed de publicações
- Compartilhamento de treinos concluídos
- Curtidas e comentários
- Sistema de seguidores
- Perfis de usuários
- Compartilhamento de conquistas
- Visualização das áreas musculares trabalhadas

### Plano PSFit Pro

- Recursos premium
- Conteúdos exclusivos
- Planos personalizados
- Funcionalidades avançadas de inteligência artificial
- Controle de acesso por assinatura

## Tecnologias utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Google Gemini
- Stripe
- Spotify API
- Lucide React

## Estrutura do projeto

```text
psfit-nutricao-completa/
├── app/
│   ├── api/
│   ├── auth/
│   ├── community/
│   ├── dashboard/
│   ├── login/
│   ├── momentum/
│   ├── nutrition/
│   ├── onboarding/
│   ├── pricing/
│   ├── progress/
│   ├── recovery/
│   ├── settings/
│   ├── signup/
│   ├── training/
│   └── workouts/
├── components/
│   ├── billing/
│   ├── community/
│   ├── nutrition/
│   ├── training/
│   └── ui/
├── lib/
├── messages/
├── public/
├── supabase/
│   └── migrations/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/psfit.git
```

### 2. Entre na pasta

```bash
cd psfit
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

Preencha as variáveis com as credenciais dos serviços utilizados no projeto.

> Nunca envie o arquivo `.env.local` para o GitHub.

### 5. Configure o Supabase

Crie um projeto no Supabase e execute os arquivos SQL disponíveis em:

```text
supabase/migrations
```

As migrações são responsáveis por criar as tabelas e recursos utilizados pelo sistema.

### 6. Inicie o projeto

```bash
npm run dev
```

Acesse no navegador:

```text
http://localhost:3000
```

## Scripts disponíveis

### Desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

### Executar em produção

```bash
npm run start
```

### Verificar o código

```bash
npm run lint
```

## Configuração do Stripe

Para testar webhooks localmente, utilize a Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o segredo exibido no terminal e adicione ao `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

## Segurança

O projeto utiliza recursos de segurança como:

- Autenticação de usuários
- Row Level Security no Supabase
- Validação de dados no servidor
- Separação entre chaves públicas e privadas
- Verificação de webhooks
- Controle de acesso aos recursos premium
- Proteção de dados pessoais

## Responsividade

O PSFit foi desenvolvido para funcionar em:

- Smartphones
- Tablets
- Notebooks
- Computadores

A interface prioriza uma boa experiência no celular, principalmente durante a execução dos treinos.

## Roadmap

- [x] Autenticação
- [x] Onboarding
- [x] Sistema de treinos
- [x] Registro de sessões
- [x] Acompanhamento de progresso
- [x] Controle de recuperação
- [x] Comunidade
- [x] Integração com Gemini
- [x] Integração com Stripe
- [ ] Geração avançada de planos alimentares
- [ ] Sistema de desafios
- [ ] Ranking da comunidade
- [ ] Notificações
- [ ] Aplicativo mobile
- [ ] Integração com dispositivos inteligentes
- [ ] Relatórios avançados de desempenho

## Desenvolvedor

<div align="center">

### Pedro Samuel

Estudante de Engenharia de Software e desenvolvedor responsável pela criação, arquitetura, interface e implementação do **PSFit**.

[![GitHub](https://img.shields.io/badge/GitHub-Pedrox77-181717?style=for-the-badge&logo=github)](https://github.com/Pedrox77)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Pedro%20Samuel-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pedro-samuel-2a8939213/)

</div>

## Licença

Este projeto é de uso privado.

Não é permitida a cópia, distribuição, comercialização ou modificação sem autorização do autor.

---

<p align="center">
  <strong>PSFit — Seu treino. Sua evolução. Seu ritmo.</strong>
</p>
