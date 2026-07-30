import type { CourseModule } from "@/domain/course";

export const MODULE_1: CourseModule = {
  id: "fundamentos",
  title: "Fundamentos do jogo",
  level: "básico",
  description:
    "As regras, o ranking de mãos, as posições e a matemática essencial. A base que sustenta todo o resto.",
  lessons: [
    {
      slug: "regras-e-ranking",
      title: "Como o jogo funciona + ranking de mãos",
      minutes: 8,
      summary:
        "O fluxo de uma mão de Texas Hold'em e a hierarquia completa das mãos — com os erros clássicos de leitura.",
      blocks: [
        {
          type: "p",
          text: "No Texas Hold'em No-Limit, cada jogador recebe 2 cartas privadas (hole cards). Ao longo da mão, 5 cartas comunitárias abrem na mesa. Sua mão final é a MELHOR combinação de 5 cartas usando qualquer mistura das suas 2 com as 5 da mesa.",
        },
        {
          type: "list",
          items: [
            "Pré-flop: você recebe 2 cartas → 1ª rodada de apostas",
            "Flop: abrem 3 cartas comunitárias → 2ª rodada",
            "Turn: abre a 4ª carta → 3ª rodada",
            "River: abre a 5ª carta → última rodada → showdown (quem tem a melhor mão leva o pote)",
          ],
        },
        { type: "h", text: "O ranking de mãos (da mais forte para a mais fraca)" },
        { type: "handrank" },
        { type: "h", text: "O detalhe que iniciantes erram: o kicker" },
        {
          type: "cards",
          rows: [
            { cards: ["Ah", "Kd"], caption: "Jogador A — par de A com kicker K" },
            { cards: ["Ac", "8s"], caption: "Jogador B — par de A com kicker 8" },
          ],
        },
        {
          type: "board",
          board: ["As", "Th", "7c", "4d", "2s"],
          caption:
            "Ambos têm par de Ases, mas o Jogador A vence: A-A-K-T-7 contra A-A-T-8-7 do Jogador B. A carta de desempate (kicker) decide potes enormes.",
        },
        {
          type: "tip",
          tone: "warn",
          text: "A mão são SEMPRE as melhores 5 cartas. Se o board é A-A-K-K-Q e você tem 7-2, sua mão é A-A-K-K-Q (dois pares com Q) — suas cartas não entram. Isso se chama 'jogar o board' e o pote é dividido com quem também não melhora.",
        },
      ],
      quiz: [
        {
          q: "Showdown! Você (Jogador A) tem K♥Q♦; o oponente mostra 9♣9♦. Quem vence?",
          scene: {
            board: ["Ks", "9h", "5d", "2c", "8s"],
            hero: ["Kh", "Qd"],
            villain: ["9c", "9d"],
            heroLabel: "Jogador A (você)",
            villainLabel: "Jogador B",
          },
          options: [
            "Jogador A — par de K é o par mais alto",
            "Jogador B — trinca de 9 vence par de K",
            "Empate — os dois têm par",
            "Jogador A — a Q de kicker decide",
          ],
          correct: 1,
          explain:
            "B tem 9♣9♦ + o 9♥ do board = TRINCA de 9. Trinca vence qualquer par, mesmo par de K. Sempre confira o que suas cartas formam COM o board.",
        },
        {
          q: "Qual mão é mais forte: sequência (8-7-6-5-4) ou flush (K-T-8-5-2 do mesmo naipe)?",
          options: [
            "Sequência",
            "Flush",
            "Depende da carta mais alta",
            "Empatam",
          ],
          correct: 1,
          explain:
            "Flush > sequência, sempre. A ordem é: straight flush > quadra > full house > flush > sequência > trinca > dois pares > par > carta alta.",
        },
        {
          q: "Qual é a sua mão final?",
          scene: {
            board: ["As", "Kd", "Kc", "7s", "2h"],
            hero: ["Ah", "3h"],
          },
          options: [
            "Par de Ases",
            "Dois pares (A e K) com kicker 7",
            "Dois pares (A e K) com kicker 3",
            "Full house",
          ],
          correct: 1,
          explain:
            "Suas 5 melhores cartas: A-A-K-K-7. O par de K vem do board, e o kicker é o 7 do board — melhor que o seu 3. Suas duas cartas não são obrigatórias.",
        },
        {
          q: "Showdown, sem flush possível. Você (A) tem A♣2♦; o oponente (B) mostra 7♥7♠. Quem leva?",
          scene: {
            board: ["Qc", "Jd", "Th", "9s", "8d"],
            hero: ["Ac", "2d"],
            villain: ["7h", "7s"],
            heroLabel: "Jogador A (você)",
            villainLabel: "Jogador B",
          },
          options: [
            "A — carta alta A",
            "B — par de 7",
            "Empate: os dois jogam a sequência do board (Q-J-T-9-8)",
            "A — o A completa sequência maior",
          ],
          correct: 2,
          explain:
            "O board já É uma sequência Q-J-T-9-8. O A de A não conecta (precisaria de K pra fazer A-K-Q-J-T… não tem K). O par de 7 de B é pior que a sequência do board. Os dois jogam o board → pote dividido.",
        },
      ],
      practice: {
        label: "Jogue contra o bot com coach ao vivo para ver rankings em ação",
        href: "/jogar",
      },
    },
    {
      slug: "posicoes",
      title: "Posições: a vantagem invisível",
      minutes: 7,
      summary:
        "Por que ONDE você senta importa mais que as cartas que recebe — e por que o Button é o melhor lugar da mesa.",
      blocks: [
        {
          type: "p",
          text: "Posição é a ordem em que você age. Quem age DEPOIS vê o que os outros fizeram antes de decidir — informação de graça em cada rodada. Essa vantagem é tão grande que a mesma mão é lucrativa numa posição e prejuízo em outra.",
        },
        { type: "positions" },
        {
          type: "list",
          items: [
            "UTG (under the gun): primeiro a agir pré-flop — pior posição, range mais tight",
            "HJ e CO: posições intermediárias/tardias — ranges vão abrindo",
            "BTN (button): age por ÚLTIMO em todos os streets pós-flop — melhor posição do poker",
            "SB: posta blind forçado e age PRIMEIRO pós-flop — pior posição pós-flop",
            "BB: posta o blind cheio, age por último pré-flop (tem 'desconto' para defender)",
          ],
        },
        { type: "h", text: "O efeito prático" },
        {
          type: "table",
          headers: ["Posição", "% de mãos que abre (aprox.)", "Por quê"],
          rows: [
            ["UTG", "~15%", "5 jogadores ainda por agir — risco alto"],
            ["HJ", "~20%", "Menos gente atrás"],
            ["CO", "~27%", "Só 3 atrás, geralmente pega posição"],
            ["BTN", "~45%", "Garante posição no pós-flop inteiro"],
            ["SB", "~40%", "Só o BB atrás, mas jogará OOP"],
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "Em posição (IP) você realiza mais equity: pode dar check atrás e ver cartas de graça, blefar quando o oponente mostra fraqueza e extrair valor fino. Fora de posição (OOP) você joga no escuro — por isso as ranges OOP são mais apertadas.",
        },
      ],
      quiz: [
        {
          q: "Quem age por último no flop, turn e river?",
          options: ["O BB", "O primeiro que apostou", "O jogador no Button (ou o mais próximo dele)", "O UTG"],
          correct: 2,
          explain:
            "Pós-flop a ação sempre começa no primeiro jogador ativo à esquerda do button e termina nele. Por isso o BTN é a posição mais lucrativa do poker.",
        },
        {
          q: "Por que o UTG abre só ~15% das mãos e o BTN ~45%?",
          options: [
            "Porque o UTG recebe cartas piores",
            "Porque quanto mais jogadores ainda por agir, maior o risco de alguém ter mão forte — e o UTG jogará OOP",
            "Tradição do jogo",
            "Porque o BTN paga blind",
          ],
          correct: 1,
          explain:
            "Com 5 jogadores por agir, a chance de alguém ter mão premium é maior, e o UTG raramente terá posição pós-flop. O BTN só tem os blinds atrás e garante posição — pode abrir muito mais largo com lucro.",
        },
        {
          q: "Você está no SB e o flop acabou de abrir. Quem age primeiro?",
          options: ["Você (SB)", "O BB", "O BTN", "Quem apostou mais pré-flop"],
          correct: 0,
          explain:
            "O SB é o primeiro a agir em TODOS os streets pós-flop — a pior situação informacional do jogo. Por isso jogar potes grandes OOP exige mãos mais fortes.",
        },
        {
          q: "Mesma mão, K♦T♦. Em qual cenário ela é claramente um open raise?",
          scene: { hero: ["Kd", "Td"] },
          options: [
            "UTG numa mesa de 6 jogadores",
            "No BTN, todos foldaram",
            "É sempre fold",
            "É sempre raise",
          ],
          correct: 1,
          explain:
            "KTs está fora do top ~15% (range de UTG), mas confortavelmente dentro do top ~45% do BTN. A MESMA mão muda de valor conforme a posição — esse é o ponto central da lição.",
        },
      ],
      practice: { label: "Treine aberturas por posição", href: "/treino/open-btn-25bb" },
    },
    {
      slug: "pot-odds",
      title: "Pot odds: o preço de cada decisão",
      minutes: 8,
      summary:
        "A conta de 10 segundos que transforma 'acho que pago' em decisão matemática: quanto o pote está pagando pelo seu call.",
      blocks: [
        {
          type: "p",
          text: "Pot odds respondem UMA pergunta: 'que fração das vezes eu preciso ganhar para este call não perder dinheiro?'. A fórmula: equity necessária = valor do call ÷ (pote final incluindo seu call).",
        },
        { type: "h", text: "Exemplo completo" },
        {
          type: "p",
          text: "Pote tem 10BB. O oponente aposta 5BB → pote agora 15BB e você precisa pagar 5BB. Equity necessária = 5 ÷ (15 + 5) = 5/20 = 25%. Se sua mão ganha mais de 25% das vezes, o call é lucrativo no longo prazo. Menos que isso, fold.",
        },
        {
          type: "table",
          headers: ["Aposta do vilão", "Equity necessária p/ call"],
          rows: [
            ["33% do pote", "20%"],
            ["50% do pote", "25%"],
            ["75% do pote", "30%"],
            ["Pote completo (100%)", "33%"],
            ["2x pote (overbet)", "40%"],
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "Memorize essa tabela — ela cobre 95% das situações. Repare: mesmo contra aposta de pote inteiro você só precisa ganhar 1 vez em 3. É por isso que foldar demais contra apostas é um dos leaks mais caros que existem.",
        },
        {
          type: "tip",
          tone: "warn",
          text: "Pot odds sozinhas decidem calls no RIVER (não há mais cartas). No flop e turn, combine com a equity dos seus draws — próxima lição.",
        },
      ],
      quiz: [
        {
          q: "O vilão aposta 6BB num pote de 12BB (metade do pote). Quanta equity você precisa para o call?",
          scene: { potBB: 12, betBB: 6 },
          options: ["50%", "33%", "25%", "20%"],
          correct: 2,
          explain: "Call de 6 para um pote final de 24 (12 + 6 + 6). 6/24 = 25%. Aposta de meio pote SEMPRE exige 25%.",
        },
        {
          q: "River: vilão aposta o pote completo (10BB em pote de 10BB). Você estima que sua mão ganha 40% das vezes. Qual a jogada?",
          scene: { potBB: 10, betBB: 10 },
          options: [
            "Fold — 40% é menos da metade",
            "Call — precisa de 33% e você tem 40%",
            "Raise sempre",
            "Impossível saber",
          ],
          correct: 1,
          explain:
            "Aposta de pote exige 33% de equity. Com 40%, o call gera lucro no longo prazo — mesmo perdendo 60% das vezes! Pot odds são sobre preço, não sobre ganhar a maioria.",
        },
        {
          q: "Por que apostas pequenas (33% do pote) são difíceis de foldar?",
          options: [
            "Porque irritam o oponente",
            "Porque exigem só 20% de equity — quase qualquer par ou draw atinge isso",
            "Porque sinalizam blefe",
            "Não são — deve-se foldar igual",
          ],
          correct: 1,
          explain:
            "Contra 33% de pote você só precisa ganhar 1 vez em 5. Praticamente qualquer pedaço do board ou draw razoável justifica continuar. Por isso o c-bet pequeno funciona com range ampla — e por isso você deve defender largo contra ele.",
        },
        {
          q: "Pote 8BB, vilão all-in de 16BB (2x pote). Sua equity estimada: 35%. Call ou fold?",
          scene: { potBB: 8, betBB: 16 },
          options: [
            "Call — 35% é bastante",
            "Fold — overbet de 2x pote exige 40%",
            "Call — all-in sempre paga",
            "Fold — nunca pague overbets",
          ],
          correct: 1,
          explain:
            "Call de 16 para pote final de 40 → 16/40 = 40% necessários. Com 35%, fold disciplinado. Overbets mudam o preço drasticamente — a mesma mão que pagava meio pote com folga aqui vira fold.",
        },
      ],
      practice: { label: "Veja o bot calcular pot odds em cada decisão", href: "/jogar" },
    },
    {
      slug: "equity-outs",
      title: "Equity, outs e a regra do 4 e 2",
      minutes: 9,
      summary:
        "Como estimar em segundos a chance do seu draw completar — e cruzar com pot odds para decidir na hora.",
      blocks: [
        {
          type: "p",
          text: "Equity é a sua fatia do pote no longo prazo: com 60% de equity num pote de 100, 'seus' são 60. Outs são as cartas que transformam sua mão perdedora em vencedora. Contar outs → estimar equity → comparar com pot odds. Esse é o motor de toda decisão com draw.",
        },
        { type: "h", text: "Contando outs na prática" },
        {
          type: "board",
          board: ["Kh", "9h", "4c"],
          hero: ["Ah", "7h"],
          caption:
            "Você tem 4 copas (A♥7♥ + K♥9♥ do board). Faltam 9 copas no baralho → 9 outs para o nut flush. Bônus: os 3 Ases restantes também podem te dar o melhor par → até 12 outs 'sujos'.",
        },
        { type: "h", text: "A regra do 4 e 2 (estimativa instantânea)" },
        {
          type: "list",
          items: [
            "No FLOP (faltam 2 cartas): equity ≈ outs × 4. Ex.: 9 outs × 4 = ~36%",
            "No TURN (falta 1 carta): equity ≈ outs × 2. Ex.: 9 outs × 2 = ~18%",
          ],
        },
        {
          type: "table",
          headers: ["Draw", "Outs", "Equity no flop (~)", "Equity no turn (~)"],
          rows: [
            ["Gutshot (sequência por dentro)", "4", "16%", "8%"],
            ["OESD (sequência aberta)", "8", "32%", "16%"],
            ["Flush draw", "9", "36%", "18%"],
            ["Flush draw + gutshot", "12", "45%", "24%"],
            ["Flush draw + OESD (combo)", "15", "54%", "30%"],
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "Repare na última linha: um combo draw tem MAIS de 50% de equity contra top pair — é favorito mesmo sem ter nada ainda! Por isso combo draws jogam agressivo (all-in no flop é matematicamente correto).",
        },
        {
          type: "tip",
          tone: "warn",
          text: "Cuidado com outs sujos: se o seu flush draw é 7-high e o vilão pode ter flush draw maior, ou se o par que te salva também melhora a mão dele, desconte 1-2 outs da conta.",
        },
      ],
      quiz: [
        {
          q: "Flush draw no flop (9 outs). Qual sua equity aproximada até o river?",
          scene: { board: ["Ks", "5s", "2d"], hero: ["8s", "7s"] },
          options: ["~18%", "~36%", "~50%", "~9%"],
          correct: 1,
          explain: "Regra do 4: no flop, 9 outs × 4 = 36%. (O valor exato é 35% — a regra é uma aproximação excelente.)",
        },
        {
          q: "Turn. Você tem OESD (8 outs). Vilão aposta metade do pote. Call correto?",
          scene: {
            board: ["9c", "8d", "2s", "Kh"],
            hero: ["Jh", "Th"],
            potBB: 8,
            betBB: 4,
          },
          options: [
            "Sim — draws sempre pagam",
            "Não — 8 outs × 2 = 16% de equity, e meio pote exige 25%",
            "Sim — 8 outs × 4 = 32% supera 25%",
            "Depende do naipe",
          ],
          correct: 1,
          explain:
            "No TURN usa-se ×2 (só falta 1 carta): 16%. Meio pote exige 25% → fold pela conta direta. (Implied odds — o que você ganha a mais quando completa — podem justificar em stacks fundos, mas a base matemática é fold.)",
        },
        {
          q: "Quantos outs tem um flush draw + OESD combinados (sem sobreposição)?",
          options: ["9", "12", "15", "17"],
          correct: 2,
          explain:
            "9 do flush + 8 da sequência − 2 que contam duas vezes (as duas cartas que completam ambos) = 15 outs. No flop: 15 × 4 = ~54% — favorito contra top pair!",
        },
        {
          q: "Flop. Você tem gutshot (4 outs — só o 7 completa). Vilão aposta 33% do pote. A conta fecha?",
          scene: {
            board: ["Kd", "8c", "6s"],
            hero: ["Th", "9h"],
            potBB: 9,
            betBB: 3,
          },
          options: [
            "Não — gutshot nunca paga",
            "Sim — 4 × 4 = 16%… não, 16% < 20%, fold apertado",
            "Sim, com folga — 16% ganha de qualquer aposta",
            "Fold — gutshot exige aposta grátis",
          ],
          correct: 1,
          explain:
            "16% de equity contra 20% necessários: fold pela conta pura, mas é apertado — posição, implied odds ou overcards viram o call. O importante é saber que a margem é essa, não chutar.",
        },
      ],
      practice: { label: "Treine semi-bluffs com draws nos drills", href: "/treino/postflop-srp-btn-vs-bb-draws" },
    },
  ],
};
