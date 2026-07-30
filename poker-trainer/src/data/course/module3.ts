import type { CourseModule } from "@/domain/course";

export const MODULE_3: CourseModule = {
  id: "posflop",
  title: "Pós-flop: onde o dinheiro muda de mãos",
  level: "intermediário",
  description:
    "Texturas, c-bet, draws, sizing de valor e blefe. O pré-flop define quem chega; o pós-flop define quem leva.",
  lessons: [
    {
      slug: "texturas",
      title: "Texturas de board: lendo a mesa",
      minutes: 9,
      summary:
        "Seca, molhada, pareada, monotone — cada textura favorece uma range e pede uma estratégia diferente.",
      blocks: [
        {
          type: "p",
          text: "Antes de olhar para SUA mão, olhe para o BOARD. A textura determina de quem é a vantagem: qual range (a do agressor pré-flop ou a do defensor) conecta melhor com aquelas cartas. Essa leitura vem antes de qualquer decisão de aposta.",
        },
        { type: "h", text: "Os quatro tipos fundamentais" },
        {
          type: "board",
          board: ["Kh", "7s", "2c"],
          caption:
            "SECA (rainbow, desconexa): K72 sem draws possíveis. Favorece o agressor pré-flop — quem abriu tem mais Kx e overpairs. C-bet pequeno funciona com a range inteira.",
        },
        {
          type: "board",
          board: ["Jc", "Tc", "8s"],
          caption:
            "MOLHADA (conectada + flush draw): JT8 com duas de paus. Cheia de draws e duas holdings médias. O defensor do BB conecta muito aqui (T9, 98, QJ…) — apostas grandes ou check, sem meio-termo.",
        },
        {
          type: "board",
          board: ["Qd", "Qs", "5h"],
          caption:
            "PAREADA: QQ5. Menos combinações acertam (só 2 Q restantes). Quem tem a Q tem quase o pote garantido; o resto disputa com pares menores. Apostas pequenas e frequentes.",
        },
        {
          type: "board",
          board: ["Ah", "9h", "4h"],
          caption:
            "MONOTONE (3 do mesmo naipe): flush já é possível. Mãos sem carta de copas encolhem de valor; sizing baixo domina porque potes grandes só se justificam com o flush (ou draw do nut).",
        },
        { type: "h", text: "De quem é a vantagem?" },
        {
          type: "table",
          headers: ["Board", "Favorece", "Por quê"],
          rows: [
            ["A72r, K83r", "Agressor (quem abriu)", "Aberturas têm muito mais Ax/Kx forte"],
            ["765ss, T98", "Defensor (BB)", "BB defende conectores baixos que o agressor nem tem"],
            ["QJTs", "Dividido/agressor", "Broadways conectam nas duas ranges, agressor tem os overpairs"],
            ["227r", "Levemente agressor", "Ninguém acertou; overcards e pares do agressor valem mais"],
          ],
        },
        {
          type: "tip",
          tone: "info",
          text: "Pergunta-guia em todo flop: 'qual range tem mais mãos fortes AQUI?'. A resposta dita quem aposta, com que frequência e de que tamanho — antes mesmo de olhar suas cartas.",
        },
      ],
      quiz: [
        {
          q: "Flop K♦7♣2♠ (rainbow). Você abriu do BTN, BB pagou. Por que essa textura é ótima para c-bet?",
          options: [
            "Porque K é carta bonita",
            "Sua range de abertura tem muito mais Kx/overpairs que a defesa do BB, e não há draws para ele continuar",
            "Porque flops secos sempre se apostam grande",
            "Não é — deve-se sempre checar",
          ],
          correct: 1,
          explain:
            "Range advantage clara + ausência de draws = o BB tem que foldar quase tudo que não conectou. Aposta pequena (33%) com a range inteira imprime dinheiro nessa textura.",
        },
        {
          q: "Qual dessas texturas mais favorece a range do BB que defendeu contra open do BTN?",
          options: ["A♠K♦4♣", "8♥7♥6♠", "K♣K♦2♠", "A♦Q♠J♥"],
          correct: 1,
          explain:
            "876 com flush draw conecta em cheio com a defesa do BB (65s, 98s, T9s, 54s…) — mãos que o BTN quase não abre mas o BB defende. Boards baixos conectados são território do defensor.",
        },
        {
          q: "Num board monotone (3 cartas do mesmo naipe), por que os sizings tendem a ser pequenos?",
          options: [
            "Porque ninguém aposta em monotone",
            "O valor das mãos comprime: sem o flush, mãos fortes viram médias — potes grandes só se justificam com flushes, que são raros nas duas ranges",
            "Para economizar fichas",
            "Regra arbitrária dos solvers",
          ],
          correct: 1,
          explain:
            "Top pair em board monotone é bluff-catcher; sets temem o 4º naipe. Com valor comprimido nas duas ranges, apostar grande só polariza contra flushes — daí o padrão de bets pequenos.",
        },
        {
          q: "Board pareado Q♦Q♠5♥. Você defendeu o BB com 5♣4♣ (par de 5). Contra c-bet pequeno do BTN, sua situação é:",
          options: [
            "Desesperadora — fold direto",
            "Razoável: par de 5 ganha de todos os overcards que não têm Q, e o c-bet pequeno dá ótimo preço",
            "Ótima — raise de valor",
            "Irrelevante — a textura não muda nada",
          ],
          correct: 1,
          explain:
            "Em board pareado o vilão tem Q raramente (2 no baralho) e c-beta a range inteira. Seu par de 5 é 'melhor mão' contra a maioria — call barato correto. Contra apostas grandes em streets seguintes a história muda.",
        },
      ],
      practice: { label: "Drill em flops Ax secos", href: "/treino/postflop-srp-btn-vs-bb-axx" },
    },
    {
      slug: "cbet",
      title: "C-bet: a aposta de continuação",
      minutes: 9,
      summary:
        "Quando o agressor pré-flop segue apostando no flop — a jogada mais frequente do poker, e onde mais se acumula erro.",
      blocks: [
        {
          type: "p",
          text: "Você abriu pré-flop, o BB pagou, e o flop abre. A continuation bet (c-bet) é seguir contando a história: 'minha range é mais forte'. Só que a frequência e o tamanho certos dependem QUASE só da textura — não da sua mão específica.",
        },
        { type: "h", text: "As duas estratégias de c-bet" },
        {
          type: "list",
          items: [
            "RANGE BET (33% do pote, quase 100% das mãos): em boards secos que favorecem sua range (A72r, K83r). Barato, lucra com a frequência de folds, protege sua range inteira",
            "POLARIZADA (66-75%, mãos selecionadas): em boards molhados — aposta grande com valor forte + draws; check com o meio (pares médios, showdown value)",
          ],
        },
        {
          type: "board",
          board: ["Ad", "7s", "2h"],
          hero: ["Kc", "Qc"],
          caption:
            "A72 rainbow, você com KQ (nada). Range bet de 33% é correta MESMO sem acertar: sua range tem todos os Ax fortes, o BB folda 55%+ e você ainda pode fazer o melhor par no turn.",
        },
        {
          type: "board",
          board: ["9h", "8h", "6s"],
          hero: ["Ac", "Kd"],
          caption:
            "986 two-tone, você com AK (overcards). Aqui NÃO se aposta a range toda: o board acerta a defesa do BB em cheio. AK vira check — apostar só infla o pote para ser check-raisado sem equity.",
        },
        {
          type: "table",
          headers: ["Fator", "C-bet mais", "C-bet menos"],
          rows: [
            ["Textura", "Seca, alta (A/K high)", "Média conectada (T98, 876)"],
            ["Posição", "Em posição", "OOP"],
            ["Oponentes", "Heads-up", "Multiway (3+ jogadores)"],
            ["Range advantage", "Sua", "Do defensor"],
          ],
        },
        {
          type: "tip",
          tone: "warn",
          text: "O leak nº 1: c-betar 100% em QUALQUER textura. Em boards médios conectados, o check é a jogada forte — quem aposta tudo sempre vira alvo de check-raise e paga caro nos streets seguintes.",
        },
      ],
      quiz: [
        {
          q: "O que define se você deve c-betar range inteira ou polarizado?",
          options: [
            "Sua mão específica",
            "A textura do board e de quem é a range advantage",
            "O tamanho do seu stack apenas",
            "Sorte",
          ],
          correct: 1,
          explain:
            "Board seco a seu favor → range bet pequeno com tudo. Board molhado/neutro → polariza: forte e draws apostam grande, o meio checa. A mão específica só escolhe em qual balde você está.",
        },
        {
          q: "Você abriu BTN com A♠K♠, BB pagou. Flop: 8♦7♦6♣. Melhor linha padrão?",
          options: [
            "C-bet 75% — AK é mão premium",
            "Check: o board conecta com a defesa do BB, e AK sem equity direta prefere pot control",
            "C-bet 33% como sempre",
            "All-in",
          ],
          correct: 1,
          explain:
            "876 two-tone é dos piores boards para o agressor. AK aqui não aguenta 3 streets, não bloqueia continuações do BB e vira alvo de check-raise. Check atrás e reavalie — perder o mínimo também é lucro.",
        },
        {
          q: "Por que o c-bet de 33% funciona mesmo com mãos que erraram o flop?",
          options: [
            "Porque é barato demais para dar errado",
            "Preço: o vilão precisa defender ~70%+ da range para não ser explorado, e ninguém conecta tanto assim — os folds pagam a aposta",
            "Porque 33% assusta",
            "Não funciona — só se aposta com mão feita",
          ],
          correct: 1,
          explain:
            "Matemática do bluff barato: arriscando 33 para ganhar 100, você lucra se ele foldar mais que ~25% das vezes. Em boards secos ele folda 50%+. A frequência de fold banca as vezes em que você é pago.",
        },
        {
          q: "Em pote multiway (você + 2 oponentes), sua frequência de c-bet deve:",
          options: [
            "Subir — mais gente para pagar",
            "Cair bastante: com dois oponentes a chance de ALGUÉM ter conectado dobra, e bluffs perdem valor",
            "Ficar igual",
            "Virar 100% com qualquer par",
          ],
          correct: 1,
          explain:
            "Cada oponente extra multiplica a chance de alguém continuar. Multiway, aposte por valor real e blefe raramente — a fold equity que sustenta o c-bet evaporou.",
        },
      ],
      practice: { label: "Drill de c-bet em flops Kx", href: "/treino/postflop-srp-btn-vs-bb-kxx" },
    },
    {
      slug: "draws-semibluffs",
      title: "Draws e semi-bluffs: agressão com rede de proteção",
      minutes: 8,
      summary:
        "Por que apostar com um draw é melhor que pagar com ele — as duas formas de ganhar que fazem do semi-bluff a jogada mais rentável do pós-flop.",
      blocks: [
        {
          type: "p",
          text: "Um semi-bluff é apostar com uma mão que AINDA não é a melhor, mas pode virar. A mágica: você ganha de DOIS jeitos — o vilão folda agora (fold equity), ou você completa o draw e leva um pote inflado (equity real). Cada rota sozinha talvez não lucre; somadas, viram a jogada mais EV+ do pós-flop.",
        },
        {
          type: "board",
          board: ["Ks", "7s", "5h"],
          hero: ["As", "4s"],
          caption:
            "Nut flush draw em K75. Passivo: check/call e reza. Ativo: bet/raise — se ele folda K fraco, você ganha 100% do pote sem completar; se paga, você ainda tem ~36% + a chance de levar tudo quando a espada bate.",
        },
        { type: "h", text: "Qual draw joga de qual jeito" },
        {
          type: "table",
          headers: ["Draw", "Linha padrão", "Racional"],
          rows: [
            ["Combo draw (FD+OESD, 15 outs)", "Máxima agressão — bet/raise/all-in", ">50% de equity: favorito contra top pair"],
            ["Nut flush draw (9 outs)", "Bet/semi-bluff frequente", "Equity forte + ganha potes gigantes ao completar"],
            ["OESD (8 outs)", "Semi-bluff seletivo", "Boa equity; prefira quando há fold equity real"],
            ["Gutshot (4 outs)", "Bet só com bônus (overcards/backdoor)", "Equity fraca — precisa da fold equity para fechar a conta"],
            ["Draw dominável (flush baixo)", "Cautela — pot control", "Completar e perder para flush maior é o desastre caro"],
          ],
        },
        {
          type: "p",
          text: "A conta que junta tudo: EV do semi-bluff = (% de folds × pote) + (% de call × [equity × pote final − custo]). Fold equity alta compensa draw fraco; draw monstro compensa fold equity baixa. Os dois fracos ao mesmo tempo = check.",
        },
        {
          type: "tip",
          tone: "info",
          text: "Regra do agressor: draws jogam melhor COM a iniciativa. Check-raise de semi-bluff em board que favorece sua range é ainda mais poderoso que bet — o vilão que c-betou ar é obrigado a jogar fora na hora.",
        },
      ],
      quiz: [
        {
          q: "Quais são as duas formas de ganhar de um semi-bluff?",
          options: [
            "Sorte e posição",
            "O vilão folda agora, ou o draw completa e você ganha o showdown",
            "Kicker e blocker",
            "Não existem duas — semi-bluff é blefe puro",
          ],
          correct: 1,
          explain:
            "Fold equity (agora) + equity real (nas cartas que faltam). É a soma que torna lucrativas apostas que, como blefe puro OU como aposta de valor, perderiam dinheiro.",
        },
        {
          q: "Flop K♠7♠5♥, você com A♠4♠ (nut flush draw). Por que BET supera check/call?",
          options: [
            "Não supera — draws pagam barato",
            "Bet adiciona fold equity à sua equity de ~36%: você pode levar o pote sem completar, e infla o pote para quando completar",
            "Porque A é carta alta",
            "Para ver o turn mais rápido",
          ],
          correct: 1,
          explain:
            "Check/call só ganha completando (~36%). Bet ganha por fold OU completando — e quando o flush bate, o pote que você inflou paga o triplo. Agressão transforma draw bom em máquina de EV.",
        },
        {
          q: "Você tem 6♣5♣ (gutshot seco, 4 outs) num board A♦8♠7♥ contra aposta de 75% do pote. Melhor linha?",
          options: [
            "Raise semi-bluff — sempre agredir",
            "Call — draws pagam",
            "Fold: 4 outs ≈ 16% no flop contra preço de 30%, e raise tem pouca fold equity num board de A que acertou a range dele",
            "All-in",
          ],
          correct: 2,
          explain:
            "Gutshot é o draw que mais queima dinheiro quando tratado como flush draw. Sem odds para call, sem fold equity para raise (board de A favorece o apostador) → fold é a jogada forte.",
        },
        {
          q: "Combo draw (flush draw + OESD) no flop contra top pair. Quem é o favorito?",
          options: [
            "Top pair — mão feita ganha de draw",
            "O combo draw, com ~54% de equity",
            "Empate exato",
            "Impossível calcular",
          ],
          correct: 1,
          explain:
            "15 outs × 4 ≈ 54%. A 'mão feita' é o azarão! Por isso all-in com combo draw no flop é jogada de valor disfarçada — qualquer desfecho te agrada.",
        },
      ],
      practice: { label: "Drill de semi-bluffs e draws", href: "/treino/postflop-srp-btn-vs-bb-draws" },
    },
    {
      slug: "value-sizing",
      title: "Value bet e sizing: extraindo o máximo",
      minutes: 8,
      summary:
        "Apostar por valor é cobrar de mãos piores que pagam. O tamanho certo — do bet fino ao overbet — multiplica seu winrate.",
      blocks: [
        {
          type: "p",
          text: "Value bet: apostar esperando ser pago por mãos PIORES. A pergunta obrigatória antes de qualquer aposta de valor: 'quais mãos piores me pagam?'. Se a resposta é 'nenhuma', sua aposta só extrai de mãos melhores — isso tem nome: transformar a mão em blefe sem querer.",
        },
        { type: "h", text: "O que cada sizing comunica e cobra" },
        {
          type: "table",
          headers: ["Sizing", "Uso principal", "Exemplo"],
          rows: [
            ["25-33%", "Range bet em board seco; extrair de mãos fracas que foldam contra mais", "Top pair em A72r cobrando de pares menores"],
            ["50%", "Valor + proteção em texturas médias", "Overpair em T92 two-tone taxando draws"],
            ["66-75%", "Polarizado: valor forte e bluffs, boards molhados", "Set em JT8 cobrando caro dos draws"],
            ["Overbet (100%+)", "Polarização extrema: nuts ou nada, geralmente river", "Flush no river vs range capada em Kx"],
          ],
        },
        { type: "h", text: "Thin value: o dinheiro que os tímidos deixam na mesa" },
        {
          type: "board",
          board: ["Ks", "7d", "2c", "4h", "Td"],
          hero: ["Kh", "Qc"],
          caption:
            "KQ no river em K724T. Muitos checariam 'com medo'. Mas KJ, KT, K9, T9, pares médios — TODOS pagam uma aposta de 33-50%. Bet fino de valor: pequeno o bastante para ser pago, consistente o bastante para lucrar.",
        },
        {
          type: "list",
          items: [
            "Contra calling stations (pagam demais): aumente sizings de valor, corte bluffs",
            "Contra nits (foldam demais): valor menor e mais raro, bluffs maiores",
            "Draw completou no river? A mão média dele encolheu — reavalie antes do bet gordo",
          ],
        },
        {
          type: "tip",
          tone: "warn",
          text: "Proteção não justifica aposta com mão fraca: 'apostei pra proteger' com terceiro par só faz mãos piores foldarem (você já ganhava delas) e melhores pagarem. Proteção é bônus de mãos FORTES em boards com draws.",
        },
      ],
      quiz: [
        {
          q: "Qual pergunta define se uma aposta é 'de valor'?",
          options: [
            "'Minha mão é boa?'",
            "'Quais mãos PIORES que a minha pagam esta aposta?'",
            "'Quanto tenho de stack?'",
            "'O vilão parece fraco?'",
          ],
          correct: 1,
          explain:
            "Valor = ser pago por piores. Se só melhores pagam e piores foldam, a aposta perde dinheiro dos dois lados — o erro silencioso mais comum do pós-flop.",
        },
        {
          q: "River K♠7♦2♣4♥T♦, você com K♥Q♣ (top pair, kicker Q). Linha padrão?",
          options: [
            "Check — 'só pago se ele apostar'",
            "Bet 33-50%: KJ/KT/K9/T9/88 pagam — thin value consistente",
            "Overbet — máxima pressão",
            "Fold se ele apostar qualquer valor",
          ],
          correct: 1,
          explain:
            "TPGK no river com range dele cheia de Kx pior e pares médios = bet fino obrigatório. Overbet espantaria tudo que paga; check joga fora 2-3BB de média toda vez.",
        },
        {
          q: "Quando o OVERBET (mais que o pote) é a arma certa?",
          options: [
            "Sempre que tiver par",
            "Quando sua range é polarizada (nuts ou bluff) e a dele é capada — sem mãos fortes o bastante para re-raisar",
            "Contra iniciantes apenas",
            "Nunca — sizing máximo é pote",
          ],
          correct: 1,
          explain:
            "Overbet explora ranges capadas: se ele checou dois streets, não tem nuts — você cobra o máximo com os seus e pressiona os bluff-catchers dele com preço horrível. Nuts e bluffs, nada no meio.",
        },
        {
          q: "Contra um calling station (paga tudo), o ajuste correto é:",
          options: [
            "Blefar mais — hora do show",
            "Apostas de valor maiores e mais finas; bluffs quase zero",
            "Jogar menos mãos",
            "Só dar all-in",
          ],
          correct: 1,
          explain:
            "Quem não folda não pode ser blefado — mas paga suas apostas de valor com mãos absurdas. Aumente sizings, aposte pares médios por valor, e guarde os bluffs para quem folda.",
        },
      ],
      practice: { label: "Drill de decisões de river", href: "/treino/postflop-srp-btn-vs-bb-river" },
    },
    {
      slug: "bluffs-blockers",
      title: "Bluffs e blockers: a matemática de mentir",
      minutes: 9,
      summary:
        "Quanto o vilão precisa foldar para o bluff lucrar, quais mãos escolher para blefar e por que uma carta na sua mão muda tudo.",
      blocks: [
        {
          type: "p",
          text: "Bluff não é coragem — é aritmética. Apostando B para ganhar um pote P, você lucra se o vilão foldar mais que B/(B+P) das vezes. O resto é escolher AS MÃOS certas para blefar (não frequências aleatórias) e os MOMENTOS em que a história que você contou é crível.",
        },
        {
          type: "table",
          headers: ["Seu bluff (% do pote)", "% de folds necessária"],
          rows: [
            ["33%", "25%"],
            ["50%", "33%"],
            ["75%", "43%"],
            ["100% (pote)", "50%"],
            ["150% (overbet)", "60%"],
          ],
        },
        { type: "h", text: "Quais mãos blefam? As que não têm nada — mas têm ALGO" },
        {
          type: "list",
          items: [
            "Sem showdown value: par fraco prefere chegar de graça ao showdown; ar total só ganha blefando",
            "Com blockers às continuações dele: você segura cartas que cortam as mãos que pagariam",
            "Com equity reserva quando pago: overcards, backdoors — o 'plano B' do bluff",
          ],
        },
        { type: "h", text: "Blockers em ação" },
        {
          type: "board",
          board: ["Qh", "Jd", "4s", "6d", "9d"],
          hero: ["Ad", "Ks"],
          caption:
            "River completa o flush de ouros e você tem A♦K♠ — ar puro, zero showdown value. Mas repare no A♦: segurá-lo BLOQUEIA o nut flush do vilão. A mão que mais confortavelmente pagaria seu overbet não existe — está na sua mão. Bluff com o blocker-chave é ordem de grandeza melhor que bluff aleatório.",
        },
        {
          type: "p",
          text: "O mesmo raciocínio vale ao pagar: se o vilão overbeta o river de flush e VOCÊ segura o A do naipe, os bluffs dele incluem exatamente essa mão — que ele não tem, porque está na sua. Blockers funcionam nos dois sentidos: para blefar e para pescar bluffs.",
        },
        {
          type: "tip",
          tone: "warn",
          text: "Blefe conta uma história — ela precisa fechar. Check-check-check e overbet no river 'do nada' não representa valor nenhum: a linha inteira precisa ser consistente com a mão que você finge ter.",
        },
      ],
      quiz: [
        {
          q: "Você blefa 50% do pote no river. Quantas vezes o vilão precisa foldar para o bluff ser lucrativo?",
          options: ["50%", "25%", "Mais de 33%", "75%"],
          correct: 2,
          explain:
            "B/(B+P) = 0.5/1.5 = 33%. Foldando mais de 1 vez em 3, seu bluff imprime. Repare como o número é MENOR do que a intuição sugere — bluffs baratos precisam funcionar pouco.",
        },
        {
          q: "Por que blefar com A♦K♠ num river que completou flush de ouros é melhor que blefar com K♠Q♠?",
          options: [
            "Porque AK é mão mais bonita",
            "O A♦ bloqueia o nut flush — a principal mão que pagaria — tornando o fold do vilão mais provável",
            "KQ tem mais showdown value",
            "Não há diferença",
          ],
          correct: 1,
          explain:
            "Com o A♦ na SUA mão, o vilão não pode ter o nut flush; as combinações fortes de call dele despencam. Bluffs com blocker-chave têm % de sucesso estruturalmente maior.",
        },
        {
          q: "Qual mão NÃO deve virar bluff no river?",
          options: [
            "Ar total sem showdown value",
            "Par médio que ganha de todos os bluffs do vilão",
            "Draw que perdeu com blocker do nuts",
            "Ar com A do naipe do flush no board",
          ],
          correct: 1,
          explain:
            "Par médio com showdown value já GANHA das mãos que foldam contra seu bluff — apostar só faz melhores pagarem e piores foldarem. Check e realize o valor de showdown. Blefe com mãos que não ganham de outro jeito.",
        },
        {
          q: "Sua linha foi: check no flop, check no turn, e agora overbet no river. Qual o problema?",
          options: [
            "Nenhum — imprevisibilidade é bom",
            "A história não fecha: nenhuma mão forte joga assim, e vilões atentos pagam com bluff-catchers",
            "O sizing deveria ser 33%",
            "Deveria ter foldado antes",
          ],
          correct: 1,
          explain:
            "Mãos fortes constroem pote — dois checks dizem 'não tenho nada'. O overbet súbito contradiz a narrativa e vira alvo de hero call. Bluffs críveis nascem de linhas que uma mão de valor real também usaria.",
        },
      ],
      practice: { label: "Decisões de river com blockers", href: "/treino/postflop-srp-btn-vs-bb-river" },
    },
  ],
};
