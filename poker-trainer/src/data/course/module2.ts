import type { CourseModule } from "@/domain/course";

export const MODULE_2: CourseModule = {
  id: "preflop",
  title: "Pré-flop: a fundação de cada mão",
  level: "básico",
  description:
    "Ranges, aberturas, defesa e o jogo de stack curto. Erros pré-flop se multiplicam nos streets seguintes — aqui é onde se ganha consistência.",
  lessons: [
    {
      slug: "ranges",
      title: "Pensando em ranges, não em mãos",
      minutes: 8,
      summary:
        "A mudança mental que separa amador de estudado: você nunca joga contra duas cartas — joga contra o conjunto de TODAS as mãos possíveis do vilão.",
      blocks: [
        {
          type: "p",
          text: "Você nunca sabe as cartas exatas do oponente — e não precisa. Cada ação dele filtra o conjunto de mãos com que ele agiria daquele jeito. Esse conjunto é a RANGE. Pensar 'ele tem AK' é chute; pensar 'a range dele aqui é pares altos, broadways e suited connectors' é análise.",
        },
        { type: "h", text: "A notação: 169 mãos" },
        {
          type: "list",
          items: [
            "Pares: AA, KK … 22 (13 mãos)",
            "Suited (mesmo naipe): AKs, T9s… — o 's' de suited (78 mãos)",
            "Offsuit (naipes diferentes): AKo, T9o… (78 mãos)",
            "'A5s+' = A5s e melhores da família (A5s, A6s… AKs). '22+' = todos os pares",
          ],
        },
        {
          type: "table",
          headers: ["Tipo", "Combos por mão", "Exemplo"],
          rows: [
            ["Par", "6", "AA = A♠A♥, A♠A♦, A♠A♣, A♥A♦, A♥A♣, A♦A♣"],
            ["Suited", "4", "AKs = um por naipe"],
            ["Offsuit", "12", "AKo = 16 combos de AK no total, 12 são offsuit"],
          ],
        },
        {
          type: "p",
          text: "Combos importam porque mudam probabilidades: numa range com AA e AKo, o vilão tem AK duas vezes mais frequentemente que AA (12 vs 6 combos). E quando você segura um A, você BLOQUEIA metade dos combos de AA dele — isso é o efeito blocker, que aparecerá nas lições avançadas.",
        },
        {
          type: "cards",
          rows: [
            { cards: ["Ad", "Kd"], caption: "AKs — 4 combos, entra em qualquer range de abertura" },
            { cards: ["Ah", "Kc"], caption: "AKo — 12 combos, mesma força pré-flop, menos potencial de flush" },
            { cards: ["9s", "8s"], caption: "98s — suited connector: faz sequências e flushes disfarçados" },
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "O visualizador de ranges da plataforma mostra as 169 mãos em uma matriz 13×13: pares na diagonal, suited acima, offsuit abaixo. Passe um tempo lá — reconhecer o formato visual das ranges acelera tudo.",
        },
      ],
      quiz: [
        {
          q: "Quantos combos existem de uma mão de par (ex.: QQ)?",
          options: ["4", "6", "12", "16"],
          correct: 1,
          explain: "Um par tem 6 combinações de naipes (4 escolhe 2 = 6). Suited tem 4, offsuit tem 12, e a mão 'AK' completa tem 16.",
        },
        {
          q: "O que significa 'A9s+' numa range?",
          options: [
            "A9 suited apenas",
            "A9 em qualquer naipe e mãos maiores",
            "A9s, ATs, AJs, AQs, AKs",
            "Todos os Ases",
          ],
          correct: 2,
          explain: "O '+' sobe o kicker dentro da família suited: A9s, ATs, AJs, AQs, AKs. Offsuit seria notado separadamente (A9o+).",
        },
        {
          q: "Você segura A♠K♠. Quantos combos de AA restam para o vilão?",
          options: ["6", "4", "3", "1"],
          correct: 2,
          explain:
            "AA tem 6 combos, mas seu A♠ elimina os 3 que o usam (A♠A♥, A♠A♦, A♠A♣). Restam 3. É assim que blockers reduzem a probabilidade de mãos específicas na range do vilão.",
        },
        {
          q: "Vilão dá raise UTG (range tight ~15%). Qual mão MENOS provável na range dele?",
          options: ["A♥K♦", "Q♠Q♥", "8♦7♦", "A♣Q♣"],
          correct: 2,
          explain:
            "87s raramente entra numa range de 15% de UTG (fica em aberturas de CO/BTN). AK, QQ e AQs são núcleo de qualquer range tight. Ler ação → filtrar range: é esse o hábito.",
        },
      ],
      practice: { label: "Explore as ranges na matriz 13×13", href: "/ranges" },
    },
    {
      slug: "abertura",
      title: "Abertura (RFI): com o que entrar no pote",
      minutes: 8,
      summary:
        "Raise ou fold — por que limpar é queimar dinheiro, qual sizing usar e como a range abre conforme a posição avança.",
      blocks: [
        {
          type: "p",
          text: "Quando ninguém entrou no pote, você tem duas opções sérias: RAISE ou FOLD. Entrar de limp (só pagar o BB) é o erro clássico do recreativo: não pressiona os blinds, não constrói pote com suas mãos boas, e anuncia fraqueza — você joga um pote grande sem iniciativa.",
        },
        { type: "h", text: "Por que raise?" },
        {
          type: "list",
          items: [
            "Fold equity: todos podem foldar e você leva os blinds sem ver flop",
            "Iniciativa: quem raisou pré-flop 'conta a história' e c-beta com credibilidade",
            "Valor: mãos fortes querem pote crescendo desde já",
            "Isolamento: raise expulsa mãos especulativas que veriam flop barato",
          ],
        },
        { type: "h", text: "Sizing padrão (MTT)" },
        {
          type: "table",
          headers: ["Stack efetivo", "Open size", "Observação"],
          rows: [
            ["40BB+", "2.2–2.5BB", "Padrão moderno, pressão barata"],
            ["25–40BB", "2.2BB", "Stack médio, preserva flexibilidade"],
            ["15–25BB", "2.0–2.2BB", "Min-raise domina — risco mínimo"],
            ["≤ 14BB", "jam ou fold", "Sem espaço para raise/fold — lição de push/fold"],
          ],
        },
        {
          type: "p",
          text: "As ranges por posição você já viu na lição de posições (~15% UTG até ~45% BTN). O princípio unificador: quanto menos jogadores por agir e melhor sua posição futura, mais mãos entram. Suited connectors e Ax suited entram cedo nas posições tardias; offsuit fraco entra por último ou nunca.",
        },
        {
          type: "tip",
          tone: "warn",
          text: "Consistência de sizing importa: se você abre 3x com mãos fortes e 2x com especulativas, jogadores atentos leem sua mão de graça. Mesmo tamanho para a range inteira.",
        },
      ],
      quiz: [
        {
          q: "Por que open-limp (só pagar o BB) é considerado erro na maioria dos casos?",
          options: [
            "É contra as regras em torneios",
            "Não gera fold equity, não constrói pote com iniciativa e convida multiway com mãos dominadas",
            "Porque paga menos blinds",
            "Não é erro — é padrão GTO",
          ],
          correct: 1,
          explain:
            "O limp abre mão das duas formas de ganhar (todos foldarem / pote grande com sua mão forte) e deixa os blinds verem flop de graça ou barato contra você sem iniciativa.",
        },
        {
          q: "Com 30BB no CO, todos foldaram. Qual o open size padrão?",
          options: ["4BB — mostrar força", "2.2BB", "1BB (limp)", "All-in"],
          correct: 1,
          explain:
            "Entre 25-40BB o padrão moderno é ~2.2BB: pressiona os blinds pelo menor custo e mantém stack para o pós-flop. Sizings grandes só contra mesas que pagam demais (ajuste exploitative).",
        },
        {
          q: "Qual dessas mãos abre no BTN mas folda no UTG (6-max, 40BB)?",
          options: ["A♠K♠", "T♣T♦", "K♦8♦", "A♥Q♣"],
          correct: 2,
          explain:
            "K8s está na casa dos 30-45% — entra no BTN, longe do top 15% do UTG. AKs, TT e AQo abrem de qualquer posição.",
        },
        {
          q: "Você abre 2.2BB no HJ com A♦J♦ e todos foldam. O que você ganhou?",
          options: [
            "Nada — ninguém pagou",
            "1.5BB (SB + BB) sem ver flop",
            "2.2BB",
            "Apenas o SB",
          ],
          correct: 1,
          explain:
            "Os blinds (0.5 + 1) vão para você. Parece pouco, mas ganhar 1.5BB 'de graça' várias vezes por hora é uma fatia enorme do winrate — é por isso que roubo de blinds sustenta as ranges largas do BTN/SB.",
        },
      ],
      practice: { label: "Drill de abertura por posição", href: "/treino/open-btn-25bb" },
    },
    {
      slug: "defesa-3bet",
      title: "Defendendo o BB e a arte do 3-bet",
      minutes: 9,
      summary:
        "O desconto do big blind, quando pagar vs quando re-raisar, e por que 3-bets de bluff usam mãos específicas (não aleatórias).",
      blocks: [
        {
          type: "p",
          text: "Você postou 1BB obrigatório no big blind. Quando alguém abre 2.2BB, pagar custa só 1.2BB para um pote de ~4BB — cerca de 30% de pot odds ANTES de considerar que você fecha a ação. Esse desconto é o motivo de o BB defender muito mais largo do que abriria.",
        },
        { type: "h", text: "As três respostas a um open" },
        {
          type: "list",
          items: [
            "FOLD: mãos sem playability nem equity (offsuit desconexo fraco)",
            "CALL: mãos com potencial que não querem pote gigante OOP — pares baixos, suited connectors, broadways médios, Ax suited",
            "3-BET (re-raise): topo da range POR VALOR (QQ+, AK) + bluffs SELECIONADOS",
          ],
        },
        { type: "h", text: "Por que 3-betar de bluff — e com quais mãos" },
        {
          type: "p",
          text: "Se você só 3-beta com monstros, oponentes foldam tudo contra seu 3-bet e suas mãos grandes não recebem ação. Os bluffs equilibram. As melhores mãos de bluff são tipo A5s: o A bloqueia AA/AK do vilão (menos combos de força contra você), a mão faz flush/wheel quando pago, e é boa demais para foldar mas fraca demais para call confortável.",
        },
        {
          type: "table",
          headers: ["Situação", "Sizing de 3-bet"],
          rows: [
            ["Em posição (ex.: BTN vs CO)", "~3x o open"],
            ["Fora de posição (ex.: BB vs BTN)", "~3.6–4x o open"],
            ["Vs open + call (squeeze)", "~4x + 1x por caller"],
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "OOP o 3-bet é maior porque você jogará sem posição: quer decidir mais coisas ainda no pré-flop e dar menos flops baratos ao agressor.",
        },
      ],
      quiz: [
        {
          q: "BTN abre 2.2BB. Você no BB. Quanto custa defender e qual o preço em %?",
          options: [
            "2.2BB — cerca de 50%",
            "1.2BB para pote final de ~4.9BB — cerca de 25%",
            "1BB — 20%",
            "3.2BB — 40%",
          ],
          correct: 1,
          explain:
            "Você já postou 1BB; completar custa 1.2BB. Pote final ≈ 2.2 + 1 + 0.5 + 1.2 = 4.9BB → 1.2/4.9 ≈ 25%. Esse desconto justifica defender ~40-60% das mãos vs BTN.",
        },
        {
          q: "Por que A5s é melhor mão de 3-bet bluff que Q9o?",
          options: [
            "Porque A5s ganha mais no showdown",
            "Blocker de A (corta AA/AK do vilão) + playability (flush/wheel) quando pago; Q9o não tem nem um nem outro",
            "Q9o é melhor por surpreender",
            "Tanto faz — bluff é bluff",
          ],
          correct: 1,
          explain:
            "Bluffs bons têm razões estruturais: bloquear as mãos que continuam contra você e ter como ganhar quando o bluff é pago. Q9o dominada e sem naipe só acumula prejuízo.",
        },
        {
          q: "Você 3-beta do BB e o agressor original dá 4-bet. Você tem 7♠7♥. Regra geral?",
          options: [
            "Call sempre — par é par",
            "Fold na maioria dos casos: pares baixos jogam mal contra range de 4-bet",
            "5-bet all-in",
            "Depende do naipe do 7",
          ],
          correct: 1,
          explain:
            "Range de 4-bet é estreitíssima (QQ+/AK e raros bluffs). 77 fica dominado ou coinflip caro, e set mining com preço alto raramente compensa. Fold e siga em frente.",
        },
        {
          q: "Qual o sizing padrão de 3-bet do BB contra open de 2.2BB do BTN?",
          options: ["4.4BB (2x)", "~8-9BB (3.6-4x)", "All-in sempre", "6.6BB fixo (3x) em qualquer posição"],
          correct: 1,
          explain:
            "OOP usa-se 3.6-4x (~8-9BB): você jogará sem posição, então cobra caro pelo flop e define o pote cedo. Em posição, 3x basta.",
        },
      ],
      practice: { label: "Drill de defesa do BB vs BTN", href: "/treino/def-bb-vs-btn-25bb" },
    },
    {
      slug: "push-fold",
      title: "Stack curto: o regime push/fold",
      minutes: 8,
      summary:
        "Abaixo de ~14BB o jogo muda de natureza: só existem duas jogadas, e as tabelas de Nash dizem exatamente quais mãos empurrar.",
      blocks: [
        {
          type: "p",
          text: "Com stack curto, um open normal cria um problema sem solução: você abre 2.2BB, alguém 3-beta, e foldar joga fora 15% da sua stack enquanto pagar te compromete com mão fraca. A solução matemática: elimine o meio-termo. All-in ou fold — o regime push/fold.",
        },
        { type: "h", text: "Por que o jam é lucrativo" },
        {
          type: "list",
          items: [
            "Fold equity máxima: o vilão precisa de mão real para pagar 12BB — não pode 'jogar poker' contra você",
            "Realização total de equity: all-in vê as 5 cartas sempre; sem ser blefado no flop",
            "Sem decisões pós-flop OOP com stack ruim",
          ],
        },
        {
          type: "table",
          headers: ["Stack (SB vs BB)", "Range de jam Nash (aprox.)", "% das mãos"],
          rows: [
            ["7BB", "qualquer par, A2+, K2s+, K5o+, Q5s+, muitos conectores", "~60%"],
            ["10BB", "pares, A2+, K3s+, K8o+, Q7s+, J8s+, T8s+", "~50%"],
            ["15BB", "pares, A2s+, A7o+, K9s+, KTo+, QTs+", "~35%"],
            ["20BB", "range aperta mais — jam vira exceção, open volta", "~25%"],
          ],
        },
        {
          type: "p",
          text: "Repare no padrão: quanto MENOR o stack, mais LARGA a range de jam. Com 7BB os blinds representam fatia enorme da sua stack — esperar mão premium te deixa no talo. As ranges Nash são equilíbrio matemático: mesmo que o vilão jogue perfeitamente, ele não lucra contra elas.",
        },
        {
          type: "tip",
          tone: "warn",
          text: "Quem chama um jam precisa de range MUITO mais apertada que quem empurra — o caller não tem fold equity, só showdown. Jam 10BB do SB: ~50% das mãos. Call do BB contra esse jam: ~25%.",
        },
      ],
      quiz: [
        {
          q: "Por que com 10BB não se faz open raise de 2.2BB?",
          options: [
            "Porque é pouco dinheiro",
            "Porque um 3-bet te obriga a jogar fora 22% da stack ou pagar comprometido — jam elimina esse dilema e maximiza fold equity",
            "Porque as regras de torneio proíbem",
            "Faz sim — raise pequeno é sempre certo",
          ],
          correct: 1,
          explain:
            "Raise/fold com stack curto é sangria; raise/call é compromisso com mão fraca. O jam transforma sua stack inteira em pressão e vê as 5 cartas quando pago.",
        },
        {
          q: "Com qual stack a range de jam do SB é MAIS larga?",
          options: ["20BB", "15BB", "10BB", "7BB"],
          correct: 3,
          explain:
            "Quanto menor o stack, mais larga a range: com 7BB os blinds te consomem em poucas órbitas — quase 60% das mãos empurram com lucro. A urgência é matemática, não desespero.",
        },
        {
          q: "SB jama 12BB. Você no BB com A♣8♣. Por que a decisão de CALL é mais apertada que a de jam seria?",
          options: [
            "Não é — call e jam usam a mesma range",
            "Porque o caller não tem fold equity: só ganha no showdown, então precisa de mais equity bruta",
            "Porque o BB paga mais caro",
            "Porque A8s é sempre fold",
          ],
          correct: 1,
          explain:
            "Quem jama ganha de dois jeitos (fold do vilão OU showdown). Quem paga só ganha no showdown. Sem a metade 'fold equity' da equação, a range de call encolhe — A8s, aliás, é call padrão vs jam de 12BB do SB.",
        },
        {
          q: "O que torna uma range de jam 'Nash'?",
          options: [
            "Foi criada por um jogador famoso",
            "É a mais agressiva possível",
            "É o equilíbrio matemático: nem o jammer nem o caller conseguem lucrar desviando dela",
            "Muda conforme o humor da mesa",
          ],
          correct: 2,
          explain:
            "Equilíbrio de Nash: se você jama essa range exata, NENHUMA estratégia de call do vilão te explora — e vice-versa. É o alicerce teórico; desvios exploitáveis vêm depois, contra oponentes com leaks conhecidos.",
        },
      ],
      practice: { label: "Drill push/fold 10BB SB vs BB", href: "/treino/pf-sb-vs-bb-10bb" },
    },
  ],
};
