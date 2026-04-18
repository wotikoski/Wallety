# Wallety — Guia de Instalação e Deploy

## Pré-requisitos

- Node.js 20+ e npm
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)
- Conta no [Cloudflare](https://cloudflare.com) (para deploy)
- Conta no GitHub (para CI/CD)

---

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Configurar o banco de dados (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um novo projeto → anote a **connection string**
3. Crie o arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/wallety?sslmode=require
JWT_SECRET=gere-com-openssl-rand-hex-32
REFRESH_TOKEN_SECRET=gere-outro-com-openssl-rand-hex-32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Para gerar os secrets:
> ```bash
> openssl rand -hex 32
> ```

---

## 3. Criar as tabelas no banco

```bash
# Opção A: executar o SQL diretamente no painel do Neon (recomendado para primeiro setup)
# Cole o conteúdo de: drizzle/migrations/0001_initial.sql

# Opção B: usar Drizzle Kit
npm run db:push
```

---

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 5. Deploy no Cloudflare Pages

### 5.1 Criar projeto no Cloudflare Pages

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Conecte ao seu repositório GitHub
3. Configure:
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`

### 5.2 Configurar variáveis de ambiente no Cloudflare

No painel do Cloudflare Pages → Settings → Environment variables:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Sua connection string do Neon |
| `JWT_SECRET` | Secret de 32 bytes |
| `REFRESH_TOKEN_SECRET` | Outro secret de 32 bytes |
| `NEXT_PUBLIC_APP_URL` | Ex: `https://wallety.pages.dev` |

### 5.3 Configurar CI/CD via GitHub Actions

No repositório GitHub → Settings → Secrets and variables → Actions:

| Secret | Valor |
|---|---|
| `CF_API_TOKEN` | Token da API do Cloudflare (com permissão Pages) |
| `DATABASE_URL` | Connection string do Neon |
| `JWT_SECRET` | Seu JWT secret |
| `REFRESH_TOKEN_SECRET` | Seu refresh token secret |
| `NEXT_PUBLIC_APP_URL` | URL do app em produção |

> Para criar o `CF_API_TOKEN`: Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template

---

## 6. Domínio personalizado (DigitalPlat Domain)

1. No Cloudflare Pages → seu projeto → **Custom domains**
2. Adicione seu domínio (ex: `wallety.seudominio.com.br`)
3. Configure os DNS no DigitalPlat apontando para o Cloudflare Pages:
   - Tipo: `CNAME`
   - Nome: `wallety` (ou `@` para raiz)
   - Valor: `wallety.pages.dev`

---

## Arquitetura resumida

```
wallety/
├── src/
│   ├── app/
│   │   ├── (auth)/         ← Login e Cadastro
│   │   ├── (dashboard)/    ← Área autenticada
│   │   └── api/            ← API Routes (backend)
│   ├── components/         ← Componentes React
│   ├── lib/
│   │   ├── db/             ← Schema Drizzle + conexão Neon
│   │   ├── auth/           ← JWT + bcrypt
│   │   ├── hooks/          ← React Query hooks
│   │   └── utils/          ← Formatação, cálculos
│   └── types/              ← TypeScript types
├── drizzle/migrations/     ← SQL de migração
└── .github/workflows/      ← CI/CD Cloudflare
```

## Stack tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | PostgreSQL via Neon |
| ORM | Drizzle ORM |
| Auth | JWT (jose) + bcrypt |
| Estado | TanStack Query |
| Gráficos | Recharts |
| Deploy | Cloudflare Pages |
