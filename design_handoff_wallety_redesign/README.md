# Handoff: Wallety — Redesign visual (Direção A · refinada)

> ⚠️ **LEIA ANTES DE EDITAR QUALQUER ARQUIVO.** Este handoff é um **design system**, não uma lista de telas. A mudança não é "estilizar o dashboard"; é **adotar um sistema visual em todas as 14 páginas existentes do projeto**, mais qualquer página futura. Se você só editou alguns arquivos, o trabalho está incompleto.

---

## 🎯 Instruções obrigatórias para o agente implementador

**Você (Claude Code) DEVE seguir esta ordem. Não pule etapas.**

### Etapa 1 — Auditoria (NÃO edite código ainda)

Liste TODAS as páginas/rotas existentes no projeto. Compare com a lista de 14 rotas abaixo. Se houver páginas no projeto **que não estão nesta lista**, inclua-as na auditoria mesmo assim.

```bash
# Encontre todas as rotas
find . -path ./node_modules -prune -o -type f \( -name "page.tsx" -o -name "page.jsx" \) -print
# Identifique fontes em uso
grep -rE "font-family|fontFamily" --include="*.css" --include="*.tsx" --include="*.jsx" src/ app/ | head -50
# Identifique bibliotecas de ícones em uso
grep -rE "import .* from '(@?[a-z-]+/[a-z-]+|react-icons|@heroicons|@fortawesome|lucide-react|@mui|antd)'" src/ app/ | grep -i "icon\|lucide\|hero\|font-awesome" | head -50
```

Produza uma tabela: **rota | font-family atual | lib de ícones | status (já redesenhada / parcial / antiga)**.

### Etapa 2 — Tokens globais primeiro

Antes de mexer em qualquer página, configure os tokens (cores, fontes, raio, sombra) em **um único lugar**:
- Next.js + Tailwind: `tailwind.config.ts` + `app/globals.css`
- Next.js sem Tailwind: `app/globals.css` com CSS variables
- Vite/CRA: `src/index.css`

Importe a fonte **Geist** no layout raiz. Padronize em **uma única biblioteca de ícones** — recomendo `lucide-react`. **Remova** todas as outras libs de ícones do `package.json`.

### Etapa 3 — Componentes compartilhados

Crie em `components/` (ou equivalente):
- `Sidebar` — navegação lateral única para todas as rotas autenticadas
- `PageHeader` — título grande + subtítulo + ação primária à direita
- `Card` — container base com `bg-surface`, `border`, `rounded-card`, `padding`
- `KpiCard` — label uppercase + valor grande tabular
- `Button` — variantes `primary` (azul), `ghost`, `outline`, com `rounded-btn`
- `Pill` — badge arredondado para filtros/status
- `EmptyState` — placeholder com dashed border, ícone, texto, CTA
- `IconBadge` — quadrado 30×30 com ícone, usado em listas

### Etapa 4 — Refatorar TODAS as páginas

Para CADA página da auditoria (mesmo as que parecem prontas), aplique o checklist da seção "Per-Page Checklist" abaixo. **Marque cada item com ✅ ou ❌ no PR.**

### Etapa 5 — Auditoria final automática

Antes de declarar pronto, rode:

```bash
# Não pode haver font-family hardcoded fora do globals
grep -rE "font-family|fontFamily" --include="*.tsx" --include="*.jsx" src/ app/ | grep -v "globals\|layout"
# Não pode haver outras libs de ícones
grep -rE "react-icons|@heroicons|@fortawesome|@mui/icons" src/ app/
# Não pode haver hex hardcoded em páginas (devem vir dos tokens)
grep -rE "#[0-9a-fA-F]{6}" --include="*.tsx" --include="*.jsx" src/app src/pages
```

Cada um desses comandos deve retornar **0 resultados**. Se retornar algo, corrija.

---

## Sobre os arquivos de design

Os `.jsx` em `app/` e `Wallety Redesign.html` são **mocks de referência** — protótipos React standalone mostrando o look-and-feel pretendido. **Não copie literalmente.** Recrie os padrões na stack do projeto (Next.js + Tailwind, provavelmente).

**Fidelidade: alta.** Cores, tipografia, raios, espaçamentos são finais.

---

## Stack alvo recomendada

- Next.js 14+ (app router)
- TypeScript
- Tailwind CSS
- `lucide-react` (ícones — única lib permitida)
- `recharts` (gráficos)
- `next/font` para Geist (carrega no layout raiz)

---

## Design Tokens

### Tipografia

```css
/* app/globals.css ou layout raiz */
--font-display: "Geist", "Inter", system-ui, -apple-system, sans-serif;
--font-mono-nums: "Geist", system-ui; /* sempre use font-variant-numeric: tabular-nums em valores monetários */
```

```ts
// next/font no layout
import { Geist } from 'next/font/google';
const geist = Geist({ subsets: ['latin'], variable: '--font-display' });
// aplique <html className={geist.variable}>
```

**Escala:**

| Uso | Tamanho | Peso | Letter-spacing |
|---|---|---|---|
| Saldo gigante (hero) | 64px | 600 | -0.035em |
| Saldo médio | 44px | 600 | -0.035em |
| H1 (page title) | 28px | 600 | -0.03em |
| KPI value | 26px | 600 | -0.025em |
| H2 (card title) | 14–17px | 600 | -0.02em |
| Body | 13px | 400/500 | -0.005em |
| Subtitle / meta | 11–12px | 400 | normal |
| Eyebrow / label | 10–11px | 700 | 1.0–1.2px (uppercase) |

**Regra ferro:** todo valor monetário usa `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`).

### Cores (modo dark — primário)

```css
--bg: #0a0c10;
--surface: #11141a;
--surface-alt: #181c24;
--border: #1f242e;
--border-strong: #2a3142;
--text: #e6e9f0;
--text-dim: #aab2c0;
--text-mute: #6b7384;
--text-faint: #4a5160;

/* accents — DEFAULT azul */
--accent: #3b82f6;
--accent-deep: #2563eb;
--accent-soft: #60a5fa;
--accent-tint: #93c5fd;

/* sinal */
--income: #3b82f6;        /* mesmo accent — receitas em azul, não verde */
--expense-bar: #404a5c;   /* cinza-azulado neutro para barras de despesa */
--danger: #ef4444;
--success: #10b981;
--warning: #f59e0b;
```

### Cores (modo light)

```css
--bg: #f7f8fa;
--surface: #ffffff;
--surface-alt: #f0f2f6;
--border: #e5e8ee;
--border-strong: #d4d9e2;
--text: #0f1419;
--text-dim: #4a5160;
--text-mute: #6b7384;
```

### Espaço, raio, sombra

```css
--r-card: 14px;   /* cards principais */
--r-btn: 9px;     /* botões */
--r-input: 10px;  /* inputs */
--r-pill: 999px;  /* filtros, badges */

/* sombras — uso parcimonioso, dark mode quase não usa */
--shadow-card: 0 1px 2px rgba(0,0,0,0.04);
```

**Espaçamento:** múltiplos de 4. Padding interno padrão de card: `22px`. Gap entre cards: `14px`. Padding de página: `28px 36px` (modo confortável) ou `22px 28px` (compacto).

---

## Componentes — especificação

### Sidebar (rotas autenticadas)

- Largura fixa `220px`, fundo `--surface`, sem border-right (apenas separação por cor de fundo)
- Logo "Wallety" no topo (manter wordmark existente — não substituir)
- Seletor "Pessoal / Família" com dropdown discreto abaixo
- Itens de menu: ícone Lucide 18px + label 13px, padding `10px 14px`, gap `12px`
- Item ativo: fundo `--accent` com 22 de alpha, texto e ícone em `--accent`, sem border-left, sem deslocamento
- Hover: fundo `--surface-alt`
- Seção "CONFIGURAÇÕES" como eyebrow uppercase 10px, weight 700, letter-spacing 1.2, color `--text-mute`
- "Sair" no rodapé com ícone arrow-right

### PageHeader

```
┌─────────────────────────────────────────────────────────────┐
│ Título da página              [filtros à direita] [+ Ação]  │
│ subtítulo descritivo · meta                                  │
└─────────────────────────────────────────────────────────────┘
```

- Título: 28px, weight 600, letter-spacing -0.03em
- Subtítulo: 13px, color `--text-mute`, gap 6px do título
- Ação primária à direita: botão azul com ícone Lucide `Plus` 14px + label
- Filtros (mês/ano, abas) ficam na linha do título à direita, **não em uma segunda linha**
- Margin-bottom: 26px

### Card

- `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--r-card)`, `padding: 22px`
- Sem sombra no dark mode. No light, sombra suave apenas em cards "destacados"
- Cabeçalho de card: título 14px/600 + subtítulo 11px/`--text-mute`, com 16px de gap até o conteúdo

### KpiCard

```
LABEL UPPERCASE 11px/700/1.2ls/--text-mute
R$ 99,09          ← 26px/600/-0.025em/--text/tabular-nums
+ R$ 600 vs. mês  ← 11px/--accent ou --text-mute
```

### Button

| Variante | Background | Color | Border |
|---|---|---|---|
| `primary` | `--accent` | `#fff` | none |
| `ghost` | transparent | `--text-dim` | none, hover `--surface-alt` |
| `outline` | transparent | `--text-dim` | `1px solid --border` |
| `pill-filter (off)` | transparent | `--text-dim` | `1px solid --border`, `border-radius: 999px` |
| `pill-filter (on)` | `--accent` 22-alpha | `--accent` | `1px solid --accent` |

Padding: `10px 14px` (md), `7px 12px` (sm — usado em pills). Font-size 13/12. Weight 600.

### TransactionRow (lista)

```
[icon 30×30] [Descrição 13/500]                   [valor 13/600 tabular]
             [Categoria · Método 11/--text-mute]
```

- Icon: 30×30, raio 8px. Income: `--accent` 22-alpha bg + `--accent` border 44-alpha + seta `↓`. Expense: `--surface-alt` bg + `--border` + ícone Lucide da categoria.
- Linha: `padding: 11px 0`, `border-top: 1px solid --border` (exceto primeira)
- Valor income: cor `--accent`. Expense: `--text`.

### EmptyState

- Container com `border: 1.5px dashed --border`, `border-radius: --r-card`, padding 40px
- Centralizado: ícone 36×36 em círculo `--surface-alt`, texto 13/500/`--text-mute`, CTA opcional

### Modal (overlay)

- Backdrop: `rgba(0,0,0,0.55)` + `backdrop-filter: blur(6px)`
- Container: 440px max-width, `--surface`, border, raio 16px, padding 26px
- Animation: fade + slide-up 200ms

---

## Padrões de copy & layout

- **Header de toda página interna:** "Título grande" + "subtítulo descritivo · contexto contável (12 itens, 5 ativas, etc)"
- **Tabular nums em todo valor monetário.** Sem exceção.
- **Insight strip** (opcional, só em Dashboard): faixa horizontal com gradient sutil `--accent` 14-alpha → transparent, ícone sparkle, mensagem contextual de 1 frase
- **Filtros:** sempre como pills horizontais, never dropdowns
- **Datas:** input nativo com border + raio --r-input, ou exibição "08/05/2026" em tabular nums
- **Vazio:** sempre EmptyState com dashed, nunca tela branca

---

## 📋 Per-Page Checklist (14 rotas)

Para cada rota, marque ✅ quando confirmar visualmente. **Se uma rota não estiver aqui mas existir no projeto, aplique o sistema mesmo assim.**

### Comum a TODAS as 14 páginas (auditar antes do checklist específico):

- [ ] Fonte Geist aplicada via `next/font` no layout raiz, sem `font-family` em CSS de página
- [ ] Sidebar igual em todas (exceto `/login` que não tem sidebar)
- [ ] Header "data atual" no canto superior direito + toggle de tema
- [ ] Bibliteca de ícones única (`lucide-react`) — sem mistura
- [ ] Cores via tokens; zero hex hardcoded
- [ ] Cards com `--r-card`, padding 22px, border `--border`
- [ ] Valores monetários com `tabular-nums`
- [ ] Funciona em dark E light mode

### `/login` — Login
- [ ] Fundo full-bleed com gráfico de candles decorativo (manter o existente)
- [ ] Card central 400px max-width, `--surface`, raio 16px, padding 32px
- [ ] Título "Bem-vindo" 28px/600/-0.03em + subtítulo "Sua vida financeira, simplificada." 13px/`--text-mute`
- [ ] Inputs com label uppercase pequena acima
- [ ] Botão "Entrar" full-width, `--accent`
- [ ] Link "Cadastre-se" em `--accent`
- [ ] Footer "Termos de Uso · Privacidade" 11px/`--text-mute`

### `/dashboard` — Dashboard
- [ ] Insight strip no topo (gradient + ícone sparkle)
- [ ] Hero "Saldo total" gigante (44–64px) + delta vs. mês anterior
- [ ] 3–4 KpiCards na primeira linha (Receitas, Despesas, Sobrou ou similar)
- [ ] Linha secundária com Taxa de Poupança, Dias Restantes, Gasto Médio
- [ ] Gráfico "Receitas e despesas" 6 meses + legenda inline
- [ ] Donut "Onde foi o dinheiro" + lista de categorias com %
- [ ] Card "Últimas transações" com 5 itens + CTA "Ver todas"
- [ ] Botão olho ocular para ocultar valores (•••)

### `/lancamentos` — Lançamentos
- [ ] Header com CTAs "Exportar CSV" (outline) + "+ Novo Lançamento" (primary)
- [ ] Search bar full-width com ícone search
- [ ] Pills de filtro: Todos / Receitas / Despesas | Todos / Pagos / Pendentes
- [ ] Range de datas com inputs nativos + setas prev/next + "Limpar"
- [ ] 3 KpiCards horizontais: Receitas (verde-azulado), Despesas (vermelho-azulado), Saldo (verde-positivo) — **com fundo tinted**
- [ ] Tabela: DATA · DESCRIÇÃO · PARCELA · VALOR · PAGO · AÇÕES
- [ ] Ícone seta ↑/↓ na coluna descrição (income/expense)
- [ ] Status pago: círculo check verde / vazio
- [ ] Ações: lápis editar + lixeira deletar (Lucide)

### `/recorrencias` — Recorrências
- [ ] Header + CTA "+ Nova Recorrência"
- [ ] 3 KpiCards: Comprometido/mês, Ativas, Pausadas
- [ ] Tabela: DESCRIÇÃO · FREQUÊNCIA · INÍCIO · VALOR · AÇÕES
- [ ] "Mensal · dia X" como subtítulo
- [ ] "até DD/MM/AAAA" abaixo da data início quando houver fim
- [ ] Ações: pausar (pause) + editar + deletar

### `/calendario` — Calendário
- [ ] Header com mês/ano grande + setas prev/next à direita (do header)
- [ ] Grid 7 colunas (Dom–Sáb) com headers eyebrow uppercase
- [ ] Células com altura mínima 100px, número do dia 14/600 no canto sup. esquerdo
- [ ] Valores do dia: receitas em `--accent`/verde, despesas em vermelho, 11px tabular
- [ ] Dia atual: círculo `--accent` em volta do número
- [ ] Sidebar direita 320px: dia selecionado + "N lançamento(s)" + lista + saldo do dia
- [ ] Cards de lançamento na sidebar com nome + sub (categoria) + valor

### `/orcamentos` — Orçamentos
- [ ] Header + seletor mês/ano (sem CTA principal — orçamentos se definem por categoria)
- [ ] Card "Gasto total do mês" full-width com R$ XX,XX/de R$ Y + barra progresso + indicador "Disponível" e "Dentro do limite"
- [ ] Grid 2 colunas de cards de categoria
- [ ] Cada card: bullet colorido + nome categoria + R$ gasto + link "limite Definir" à direita
- [ ] Quando limite definido: barra de progresso, % usado, cor muda em >80% (warning) e >100% (danger)

### `/metas` — Metas de Poupança
- [ ] Header "Metas de Poupança" + subtítulo "Planeje e acompanhe suas conquistas financeiras" + CTA "+ Nova Meta"
- [ ] Estado vazio: card único centralizado com dashed border + ícone Plus + "Nova meta"
- [ ] Estado com metas: grid 2 colunas de cards
- [ ] Card de meta: ícone/emoji + nome + prazo + barra progresso + R$ atual / R$ alvo + % no canto sup. direito
- [ ] Meta concluída: badge "100%" em `--accent`, mensagem "Meta atingida!"

### `/limite-diario` — Limite Diário
- [ ] Header + seletor mês/ano
- [ ] Card hero **com fundo colorido** (verde se positivo, vermelho se déficit) — exceção à regra de cards neutros
- [ ] R$ XX,XX por dia (44px) + "N dias restantes"
- [ ] Linha "Inclui reserva de R$ X para [próximo mês]" com ícone calendar
- [ ] Card "Déficit/Superávit previsto" com ícone calendar + breakdown
- [ ] 4 KpiCards: Receitas / Despesas Fixas / Gastos Variáveis / Reserva p/ próx. mês
- [ ] Card "Como é calculado" com tabela de soma/subtração

### `/relatorios` — Relatórios
- [ ] Header "Relatórios" + "Análise do histórico financeiro"
- [ ] Pills: Receitas / Despesas + range de datas + dropdown "Por Categoria"
- [ ] Card hero `--accent` ou `--accent` 14-alpha "Total de Despesas/Receitas" R$ XXX,XX + "N categorias"
- [ ] Card "Fixos vs Variáveis" com barra horizontal split + 2 valores abaixo com bullets coloridos
- [ ] Card "Despesas por Categoria" com pills de sub-filtro (Todos/Fixos/Variáveis) + lista expansível por categoria com barra de progresso

### `/categorias` — Categorias
- [ ] Header + CTA "+ Nova Categoria"
- [ ] Grid 2 colunas: card "Receitas · N" (header em verde tintado) + card "Despesas · N" (header em vermelho tintado)
- [ ] Cada card lista categorias com IconBadge colorido + nome + "Padrão" sub + lápis edit
- [ ] Cor do IconBadge **vem da categoria** (cada uma tem sua cor — preservar mapeamento existente)

### `/formas-pagamento` — Formas de Pagamento
- [ ] Header "Formas de Pagamento" + "Gerencie contas, cartões e formas de pagamento" + CTA "+ Nova Forma"
- [ ] Lista (não grid) de cards horizontais
- [ ] Cada item: IconBadge azul (cartão) + nome + sub (tipo · detalhe) + badge "Padrão" + lápis edit
- [ ] Customizadas têm também ícone lixeira

### `/bancos` — Bancos
- [ ] Header "Bancos" + "Gerencie seus bancos e instituições financeiras" + CTA "+ Novo Banco"
- [ ] Lista de cards horizontais
- [ ] IconBadge **com cor da marca do banco** (Nubank roxo, Itaú laranja, BB amarelo, Bradesco vermelho, etc — manter mapeamento existente)
- [ ] Nome banco + "Cód. NNN" sub + badge "Padrão" + lápis edit

### `/grupos` — Grupos
- [ ] Header "Grupos" + "Compartilhe finanças com família ou parceiros" + CTA "+ Novo Grupo"
- [ ] Eyebrow "MEUS GRUPOS"
- [ ] Card de grupo: IconBadge users + nome + "Dono"/"Membro" sub
- [ ] Largura do card: ~360px, não full-width

### `/perfil` — Meu Perfil
- [ ] Header "Meu Perfil" + "Gerencie suas informações pessoais" — **sem CTA**
- [ ] Card principal: avatar circular grande (60×60, inicial do nome) + nome 18/600 + email 13/`--text-mute`
- [ ] Form: Nome completo (input), E-mail (input disabled com nota "O e-mail não pode ser alterado")
- [ ] Botão "Salvar alterações" full-width primary
- [ ] Card "Legal" com 2 itens (Termos de Uso, Política de Privacidade) + chevron-right
- [ ] Card "Zona de Perigo" com border `--danger` 33-alpha, "Excluir minha conta" + botão danger

---

## Arquivos neste handoff

- `Wallety Redesign.html` — protótipo completo standalone (abrir no navegador)
- `app/data.jsx` — tokens, dados mock, paletas
- `app/shared.jsx` — Sidebar, PageHeader, ícones SVG inline
- `app/dashboard.jsx` — Dashboard completo
- `app/screens.jsx` — Transações, Metas, Relatórios, Configurações, Modal
- `tweaks-panel.jsx` — não é produção, ignorar

**Importante:** os mocks cobrem só ~5 telas. As outras 9 (Login, Recorrências, Calendário, Orçamentos, Limite Diário, Categorias, Formas de Pagamento, Bancos, Grupos, Perfil) **não têm mock JSX** — use o checklist + descrição textual desta seção como única fonte de verdade.

---

## Definition of Done

- [ ] Todos os 3 grep da Etapa 5 retornam 0 resultados
- [ ] Cada uma das 14 rotas passou no checklist (não apenas as 5 com mock)
- [ ] Toggle dark/light funciona em TODAS as rotas
- [ ] Ícones consistentes (apenas `lucide-react`) em TODAS as rotas
- [ ] Fonte Geist em TODOS os textos visíveis (sem fallback acidental)
- [ ] Acentos azul (`#3b82f6`) em CTAs primários e elementos ativos em TODAS as rotas

Se algum item ficar ❌, **não declare pronto** — termine ou reporte exatamente o bloqueio.
