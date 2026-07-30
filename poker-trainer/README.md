# Poker Trainer

Trainer de poker MTT (Texas Hold'em No-Limit) com drills guiados por tópico.
Ranges Nash de push/fold + ranges de open por posição + spots pós-flop pré-resolvidos.

App standalone — **não compartilha código com o painel de mentoria** que vive no diretório pai.

## Como rodar

```bash
cd poker-trainer
npm install
npm run dev          # http://localhost:3001
```

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript 5
- Tailwind CSS 4
- Persistência: localStorage (sem backend)

## Estrutura

- `src/domain/` — tipos puros do domínio (cartas, ranges, spots, tópicos).
- `src/engine/` — engine de drill (sampling, scoring, conversão de cartas para HandCode).
- `src/data/` — JSON de ranges, tópicos e spots pós-flop.
- `src/storage/` — wrapper do localStorage (chave `ptr:v1:<topicId>`).
- `src/components/` — componentes React (cartas SVG, mesa, range grid, feedback).
- `src/app/` — rotas Next App Router.

## Roadmap

Ver `/root/.claude/plans/quero-construir-solver-de-pure-ritchie.md` (arquivo de plano da sessão).

- **Fase 1 (atual):** 1 tópico ponta a ponta — Push/Fold 10BB SB vs BB.
- **Fase 2:** demais tópicos pré-flop + `RangeGrid` heatmap + `SizingSlider`.
- **Fase 3:** seed de spots pós-flop.
- **Fase 4:** dashboard `/progresso`.
- **Fase 5:** atalhos, modo sessão, polimento mobile.
