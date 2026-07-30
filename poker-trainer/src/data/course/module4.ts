import type { CourseModule } from "@/domain/course";

export const MODULE_4: CourseModule = {
  id: "avancado",
  title: "Avançado: leitura, teoria e torneios",
  level: "avançado",
  description:
    "Leitura de mãos combinatória, o equilíbrio GTO vs exploração, e a matemática de ICM que muda tudo em torneios.",
  lessons: [
    {
      slug: "leitura-de-maos",
      title: "Leitura de mãos: o funil street a street",
      minutes: 10,
      summary:
        "Ninguém 'adivinha' a mão do vilão — bons jogadores estreitam a range dele a cada ação até restar um punhado de combos.",
      blocks: [
        {
          type: "p",
          text: "Leitura de mãos é um funil: a range do vilão começa larga no pré-flop e cada ação dele DESCARTA pedaços. No river, o que era '300 combos possíveis' virou '18 combos: 12 de valor, 6 de bluff' — e aí a decisão é aritmética, não intuição.",
        },
        { type: "h", text: "O processo em 4 passos" },
        {
          type: "list",
          items: [
            "1. Ponto de partida: a posição e ação pré-flop definem a range inicial (open de CO ≈ top 27%)",
            "2. Cada street filtra: call no flop de K72 → tem Kx, par, gutshot ou float; sem conexão = fold já teria acontecido",
            "3. Sizing informa: aposta grande polariza (forte ou blefe); pequena é range ampla/média",
            "4. No river, conte combos: quantas combinações de valor sobraram? Quantos bluffs a linha dele comporta?",
          ],
        },
        { type: "h", text: "Exemplo guiado" },
        {
          type: "board",
          board: ["Kd", "8s", "3c", "7h", "2d"],
          caption:
            "CO abre, você paga no BB. Ele c-beta flop K83 (33%), aposta turn 7 (66%), e overbeta o river 2. Funil: pré-flop top 27% → c-bet pequeno mantém quase tudo → turn 66% descarta ar e pares fracos (sobra KQ+, sets, alguns draws que viraram nada) → overbet river polariza: KK/88/33/77/AK de valor... e os draws falhados (QJ, JT, T9 de ouros) como bluff. Sua decisão com K♥Q♠ virou uma conta de combos — não um chute.",
        },
        {
          type: "p",
          text: "Conte na prática: valor = KK(1), 88(3), 33(3), 77(3), AK(6~8) ≈ 18 combos. Bluffs plausíveis (draws de ouros que não completaram + QJ/JT com equity zero) ≈ 10-14 combos. Contra overbet você precisa de ~40% — 12 bluffs em 30 combos = 40%. Call EXATAMENTE no limite: qualquer leitura extra (esse vilão blefa river?) decide.",
        },
        {
          type: "tip",
          tone: "info",
          text: "Comece simples: em cada showdown que você VIR (mesmo sem estar na mão), volte o filme e pergunte 'a linha dele fazia sentido com essa mão?'. Leitura de mãos é músculo — showdowns são o gabarito de graça.",
        },
      ],
      quiz: [
        {
          q: "Qual é a lógica central da leitura de mãos?",
          options: [
            "Intuição treinada por experiência",
            "Cada ação do vilão FILTRA a range dele — no final restam poucos combos, contáveis",
            "Observar tells físicos",
            "Decorar as mãos que ele mostrou antes",
          ],
          correct: 1,
          explain:
            "É um processo de eliminação combinatória, não adivinhação. Posição define o início; cada call, bet e sizing descarta pedaços; no river a range virou uma lista finita.",
        },
        {
          q: "O vilão pagou seu c-bet num flop K♠8♦3♣. Qual mão ele quase certamente NÃO tem?",
          options: ["K♥T♥", "8♣7♣", "5♦5♥", "A♠Q♦ (sem par)"],
          correct: 3,
          explain:
            "AQ sem conexão e sem draw num board seco quase sempre folda contra c-bet (float ocasional existe, mas é a menor fatia). Kx, pares médios e 8x são as continuações naturais — é isso que 'filtrar' significa.",
        },
        {
          q: "Aposta pequena (33%) versus overbet (130%): o que cada uma tende a dizer sobre a range?",
          options: [
            "Pequena = fraca; overbet = forte, sempre",
            "Pequena = range ampla (valor médio + tudo); overbet = polarizada (muito forte OU blefe, nada no meio)",
            "Nada — sizing é aleatório",
            "Overbet = draw sempre",
          ],
          correct: 1,
          explain:
            "Sizing é linguagem: bets pequenos acomodam a range inteira; overbets só fazem sentido com o topo absoluto (extrair máximo) ou com nada (pressão máxima). Mãos médias não overbetam — não há mãos piores pagando nem melhores foldando.",
        },
        {
          q: "No river você conta: 20 combos de valor e 10 de bluff na range do vilão, que apostou pote (você precisa de 33%). Call ou fold com seu bluff-catcher?",
          options: [
            "Fold — ele tem valor 2x mais vezes",
            "Call: você ganha 10 de 30 = 33%, exatamente o preço — indiferente pela conta, qualquer info extra decide",
            "Call sempre com qualquer par",
            "Raise",
          ],
          correct: 1,
          explain:
            "10/30 = 33% de bluffs = exatamente sua equity necessária. GTO chamaria 'indiferente'. Na prática: contra quem sub-blefa river (maioria dos humanos), fold; contra agressivo, call. A conta te diz QUE a decisão é fina — a leitura desempata.",
        },
      ],
      practice: { label: "Analise mãos reais no analisador", href: "/analisar" },
    },
    {
      slug: "gto-exploit",
      title: "GTO vs Exploitative: os dois motores da estratégia",
      minutes: 9,
      summary:
        "O que 'equilíbrio' realmente significa, quando abandoná-lo de propósito, e como usar as duas escolas sem se perder.",
      blocks: [
        {
          type: "p",
          text: "GTO (Game Theory Optimal) é a estratégia em equilíbrio: frequências de valor e blefe calibradas para que NENHUM desvio do oponente lucre contra você. Não é 'o jeito certo de jogar' — é o jeito INEXPLORÁVEL. Exploitative é o oposto: identificar o leak do vilão e desviar do equilíbrio para puni-lo ao máximo.",
        },
        { type: "h", text: "A ideia-chave do GTO: indiferença" },
        {
          type: "p",
          text: "No river, uma range GTO de aposta carrega valor e bluff na proporção exata das pot odds oferecidas: bet de pote → 2 valores : 1 bluff. Resultado: o bluff-catcher do vilão ganha EXATAMENTE 0 pagando ou foldando — ele é indiferente. Não existe decisão boa contra você. Essa é a defesa; o preço é não maximizar contra ninguém específico.",
        },
        { type: "h", text: "Exploração: onde o dinheiro real está" },
        {
          type: "table",
          headers: ["Leak do vilão", "Seu desvio máximo"],
          rows: [
            ["Folda demais a 3-bet", "3-bete o dobro de bluffs"],
            ["Paga demais (station)", "Zero bluffs; thin value agressivo"],
            ["C-beta 100% sempre", "Check-raise leve e float constante"],
            ["Nunca blefa river", "Fold todos os bluff-catchers contra aposta dele"],
            ["Overfolda BB", "Abra qualquer coisa do BTN/SB"],
          ],
        },
        {
          type: "p",
          text: "O paradoxo que organiza tudo: explorar te EXPÕE. Se você corta os bluffs contra a station, um observador atento nota que suas apostas são só valor e te folda tudo. Contra fracos, desvie sem medo — eles não ajustam. Contra fortes, ancore no equilíbrio e desvie pouco.",
        },
        {
          type: "tip",
          tone: "info",
          text: "Ordem de estudo correta: aprenda o baseline GTO primeiro (as ranges deste app são isso) para RECONHECER desvios — seus e deles. Sem saber o equilíbrio, você não sabe nem em qual direção o vilão erra, nem quando você mesmo virou o peixe.",
        },
      ],
      quiz: [
        {
          q: "O que uma estratégia GTO garante?",
          options: [
            "Lucro máximo contra qualquer oponente",
            "Que nenhuma estratégia do oponente consegue lucrar sistematicamente contra você",
            "Vitória em todos os torneios",
            "Que você nunca será blefado",
          ],
          correct: 1,
          explain:
            "GTO é defesa perfeita, não ataque máximo: torna-te inexplorável, mas deixa dinheiro na mesa contra oponentes com leaks — que é onde a exploração entra.",
        },
        {
          q: "Vilão folda para 3-bet 75% das vezes (leak gigante). Ajuste correto?",
          options: [
            "Manter frequências GTO — equilíbrio acima de tudo",
            "3-betar muito mais bluffs: cada 3-bet imprime os folds dele",
            "Parar de 3-betar",
            "Só 3-betar AA",
          ],
          correct: 1,
          explain:
            "Contra 75% de folds, um 3-bet de 9BB lucra IMEDIATAMENTE mesmo com 72o (precisa ~65% de folds pra bluff puro). GTO é o ponto de partida; leak identificado = desvio máximo na direção que pune.",
        },
        {
          q: "Por que a proporção valor:bluff de uma range GTO de river depende do sizing?",
          options: [
            "Tradição",
            "Porque as pot odds do vilão mudam com o sizing — a % de bluffs calibra para deixar o call dele com EV zero",
            "Não depende — é sempre 2:1",
            "Para confundir",
          ],
          correct: 1,
          explain:
            "Bet de pote dá 33% de odds → 33% de bluffs na sua range torna o call dele indiferente. Overbet permite MAIS bluffs; bet pequeno, menos. A matemática do sizing e do bluff é a mesma moeda.",
        },
        {
          q: "Contra um profissional atento versus um recreativo distraído, sua estratégia deve:",
          options: [
            "GTO contra os dois",
            "Explorar os dois igualmente",
            "Ancorar perto do GTO contra o pro (ele pune desvios) e explorar sem vergonha o recreativo (ele não ajusta)",
            "Jogar tight contra ambos",
          ],
          correct: 2,
          explain:
            "Exploração é troca: você abre a guarda para punir um leak. O pro percebe e contra-explora; o recreativo nunca vai notar. A resposta certa depende de QUEM está olhando.",
        },
      ],
      practice: { label: "Jogue contra o bot GTO no modo pós-mão", href: "/jogar" },
    },
    {
      slug: "icm",
      title: "ICM: quando fichas deixam de ser dinheiro",
      minutes: 10,
      summary:
        "Em torneio, dobrar a stack NÃO dobra seu prêmio esperado — e essa assimetria reescreve todas as ranges perto do dinheiro.",
      blocks: [
        {
          type: "p",
          text: "Em cash game, 100 fichas valem 100 reais — linear. Em torneio, não: o prêmio é dividido em posições, e o ICM (Independent Chip Model) converte stacks em valor monetário real. A consequência brutal: as fichas que você PERDE valem mais do que as que você GANHA. Dobrar a stack aumenta seu $EV em menos de 2x; bustar zera tudo.",
        },
        { type: "h", text: "Exemplo que muda tudo" },
        {
          type: "p",
          text: "Bolha de torneio: 10 jogadores, 9 pagam. Você tem stack médio e o chip leader te coloca all-in. Você tem AQs e estima 55% de equity contra a range dele — em chipEV, call fácil. Mas: se perder, sai com ZERO; se ganhar, suas fichas extras valem menos por ICM. O call de '55%' pode custar dinheiro real. AQs vira FOLD correto — algo impensável em cash.",
        },
        {
          type: "table",
          headers: ["Situação", "Pressão ICM", "Ajuste nas ranges"],
          rows: [
            ["Início de torneio", "Quase zero", "Jogue ~chipEV normal"],
            ["Bolha (próximo do dinheiro)", "Máxima", "Stacks médios apertam MUITO; chip leader ataca"],
            ["Pós-bolha", "Alivia", "Volta a agredir — próximo salto está longe"],
            ["Mesa final", "Alta e crescente", "Cada eliminação é um salto de prêmio: fold vira arma"],
            ["Heads-up final", "Zero de novo", "Só há 1º e 2º — chipEV puro"],
          ],
        },
        { type: "h", text: "Os dois lados da pressão" },
        {
          type: "list",
          items: [
            "Stack médio na bolha: o refém — não pode pagar jams nem disputar potes grandes; sobrevivência vale prêmio",
            "Chip leader na bolha: o predador — jama e abre sem oposição, porque NINGUÉM pode pagar; é a licença para roubar",
            "Short stack: paradoxalmente mais livre que o médio — já está desesperado, fold equity ainda existe",
          ],
        },
        {
          type: "tip",
          tone: "warn",
          text: "Erro clássico: aplicar ranges de chipEV na bolha 'porque a mão era boa'. As ranges Nash deste app marcadas como ICM (bolha, mesa final) já embutem esses ajustes — compare-as com as de chipEV e veja o tamanho do aperto.",
        },
      ],
      quiz: [
        {
          q: "Por que dobrar a stack num torneio NÃO dobra seu valor esperado em dinheiro?",
          options: [
            "Porque as fichas perdem valor com o tempo",
            "Porque o prêmio é dividido em posições: parte do valor de qualquer stack é a chance de os OUTROS bustarem antes — fichas extras têm retorno decrescente",
            "Por causa do rake",
            "Dobra sim — fichas são dinheiro",
          ],
          correct: 1,
          explain:
            "Com o dobro de fichas você não pode ganhar 'dois primeiros lugares'. O valor marginal de cada ficha cai — e o da última ficha (sua vida no torneio) é o maior de todos. Essa curvatura é o ICM.",
        },
        {
          q: "Na bolha, quem mais aperta a range — e quem mais abre?",
          options: [
            "Todos apertam igual",
            "Stacks médios apertam ao máximo (têm tudo a perder); o chip leader abre ao máximo (ninguém pode pagá-lo)",
            "O chip leader aperta; os curtos abrem",
            "ICM não muda ranges",
          ],
          correct: 1,
          explain:
            "A assimetria é o coração do ICM: o médio não pode arriscar o torneio numa disputa que o curto sobreviveria e o líder nem sentiria. O líder transforma essa paralisia em roubo sistemático de blinds.",
        },
        {
          q: "Bolha: você (stack médio) tem A♠Q♠ e estima 55% contra o jam do chip leader. Em chipEV é call. E por ICM?",
          options: [
            "Call — 55% é 55%",
            "Frequentemente FOLD: o risco de bustar sem prêmio vale mais que as fichas extras dos 55%",
            "Call e rezar",
            "Depende só do tamanho do pote",
          ],
          correct: 1,
          explain:
            "$EV ≠ chipEV: perder te tira TODO o valor acumulado (o prêmio quase garantido); ganhar rende fichas desvalorizadas. A equity de call por ICM sobe para 60%+ em bolhas apertadas — AQs vira fold disciplinado.",
        },
        {
          q: "Quando a pressão de ICM finalmente desaparece?",
          options: [
            "Nunca",
            "Na mesa final",
            "No heads-up final — só existem 1º e 2º, a diferença já está travada, e cada ficha vale o mesmo de novo",
            "Depois da bolha",
          ],
          correct: 2,
          explain:
            "HU final: o 2º lugar já está garantido para ambos; disputa-se apenas a diferença para o 1º — proporcional às fichas. O jogo volta a ser chipEV puro, e as ranges se soltam completamente.",
        },
      ],
      practice: { label: "Drill de bolha com ranges ICM", href: "/treino/icm-bubble-sb-jam-15bb" },
    },
  ],
};
