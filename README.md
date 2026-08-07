# Esteira de Elaboração — PPCP Patrimar

Painel ao vivo dos lotes em elaboração, no padrão dos demais apps de PPCP: página única, sem servidor, lendo direto do Google Sheets.

## Como funciona
- Lê a aba de **programação** publicada no **Google Sheets** (CSV via `gviz/tq`).
- A planilha traz **apenas a data da embalagem** (coluna `Data`). As datas das etapas anteriores (Corte → Furadeira → Coladeira/PU → Linha UV) são **estimadas** voltando 1 dia útil por etapa a partir da embalagem (ajustável em `LEAD`).
- Posiciona cada lote na **estação atual** por essas datas: Corte → Furadeira → Coladeira/PU → Linha UV → Embalagem.
- Mostra o **progresso** do lote (produzido / % ) a partir das colunas `PRODUZIDO` e `PERCENTUAL`.
- **Veredito do dia**: uma faixa colorida no cabeçalho com a resposta em uma frase. É o que se lê
  em dois segundos; o resto da tela é para quem quer investigar. Por ordem de gravidade:

  | cor | quando | frase |
  |---|---|---|
  | vermelho | lote passou da embalagem com volume pendente | `N lotes atrasados · X volumes pendentes` |
  | laranja | embalou e o ERP não reportou | `N lotes embalados sem reporte` |
  | azul-cinza | a embalagem **de hoje** ainda não fechou | `Faltam X volumes da embalagem de hoje` |
  | verde | nada atrasado e a embalagem do dia fechou | `Dia ok — embalagem de hoje fechada` |
  | cinza | sem nenhum apontamento | `situação não confirmada` |

  O estado azul-cinza existe porque **atraso só nasce no dia seguinte** (`atrasoDe` exige
  `ref > emb`): um lote que embala hoje e não produziu nada não é atraso. Antes disso a faixa
  dizia `Dia ok` com a embalagem inteira parada. Ele é deliberadamente sem alarme — de manhã o
  normal é estar assim, e uma tarja laranja todo dia às 8h ensina todo mundo a ignorá-la.
  Havendo atraso de ontem, o vermelho vence e o que falta de hoje entra na linha de apoio.
- **KPIs**: lotes ativos, volumes em elaboração, **volumes p/ embalar hoje** e volumes em atraso.
  O de atraso é o único que cobra ação, então vira caixa destacada — vermelha quando há
  pendência, verde quando está zerado.
- **Cinco abas**, não uma rolagem só. São perguntas diferentes e uma competia com a outra pela
  primeira dobra: o quadro de etapas responde *onde cada lote está*, a faixa de atraso responde
  *o que ficou para trás*, e empilhadas o atraso empurrava o quadro para fora da tela.

  | aba | o que tem | o contador conta |
  |---|---|---|
  | **Lotes em elaboração** | quadro das 5 estações | lotes ativos |
  | **Volumes pendentes** | Em atraso · Sem baixa | **volumes** em atraso |
  | **Peças em falta** | o que a Embalagem lançou, por lote interno · atrasados sem lançamento | **peças** a buscar |
  | **Programados** | tabela do que ainda não entrou no corte, quem entra antes primeiro | lotes |
  | **⚙ Configuração** | planilha e gids | — |

  O botão `⚙ Configurações` que ficava na barra de controles **saiu**: ele e a aba abriam a mesma
  tela, e o painel de configuração já mora dentro da aba. Duas portas para a mesma sala é uma
  porta a mais para manter — e uma linha de controles mais curta.

  Na aba de peças entra **todo lote com peça lançada, inclusive o que ainda não venceu a
  embalagem** — peça faltando é problema antes do atraso, não depois. Os atrasados **sem** nenhum
  lançamento ficam num bloco à parte: ninguém sabe por que estão parados, e cobrar o registro
  também é ação.

  Em elaboração conta **lote** (é o que se acompanha no quadro); em pendentes conta **volume**,
  que é a unidade da cobrança — `29 lotes` e `2.293 volumes` levam a prioridades diferentes. A aba
  escolhida fica salva: a tela fica ligada o dia todo.
- **Programados** era uma faixa no pé da aba de elaboração, abaixo da dobra, mostrando só o número
  do lote. Em aba própria cabe a tabela: interno, cor, itens, volumes, pontos, peso e o dia em que
  entra no corte, com os totais no rodapé — é com isso que se dimensiona a semana que vem. A ordem
  é por **quem entra antes**: a pergunta aqui é *o que vem agora*.

  Cada linha com `▸` **abre no clique** e mostra os produtos do lote — código, descrição, volumes,
  pontos e peso de cada um. Volume só dimensiona a carga; quem programa material, chapa e fita
  precisa saber *de quê* é o lote, e ia procurar isso lote a lote no quadro. Aberto/fechado
  sobrevive à recarga de 5 min, como na faixa de atraso.

  Cada produto é uma **linha de verdade da tabela**, não um bloco solto — assim a quantidade cai
  sob a coluna `Volumes`. Pelo mesmo motivo o **código ocupa a primeira coluna**, junto do número
  do lote: é o identificador da linha, e solto no fim da descrição ele começava num ponto
  diferente a cada produto, o que dá para ler mas não para conferir.

  O grupo **não** fecha com linha de total: a linha do lote, logo acima, já é essa soma. Chegou a
  ter uma, e um lote de três produtos abria repetindo os mesmos números duas vezes em quatro
  linhas. Note que a soma do lote ignora item **sem cadastro** — ele vale zero ponto e zero quilo,
  e aparece como `–` no detalhe. Um total que não bate com a conta das linhas costuma ser isso, e
  a linha de status diz quantos itens ficaram de fora.

  Ela substituiu a aba **Lotes elaborados**, que vivia vazia. O motivo é a planilha, não o código:
  a `PROGRAMACAO_CONCLUIDA` arquiva **linha a linha**, e o painel só dava um lote por concluído se
  ele ainda estivesse na `PROGRAMAÇÃO` com saldo zero — estado que dura os segundos entre a última
  linha zerar e o arquivador levá-la embora. Na prática, nunca. Fazer a aba ler o arquivo também
  não resolvia: dos 22 lotes com alguma linha arquivada, 20 continuavam em elaboração com saldo, e
  a aba repetiria lote que o quadro já mostra como atrasado.
- A faixa de atraso **abre com a lista completa**. O corte nos `LATE_TOP` maiores existia porque
  ela disputava espaço com o quadro; em aba própria, lote atrasado escondido atrás de um botão é
  lote que ninguém cobra. O botão continua para quem quiser encurtar. A lista **ordena por data de
  embalagem e, no mesmo dia, por lote** — é a ordem em que se percorre a lista cobrando lote a
  lote, e a mesma da planilha, então quem confere as duas lado a lado não fica pulando linha.

  Ela já ordenou por volume pendente, para o lote que concentra o volume não ficar embaixo das
  sobras de 5 a 20 volumes. Quem faz a cobrança pediu a ordem de leitura, e o volume não se perde:
  a tarja do topo acha o maior atraso **por varredura, não por posição** — mudar a ordem da lista
  não troca quem ela aponta.
- **Busca de lote** (atalho `/`): acha por OP (`25010`), lote interno (`139/26`) ou cor, e a
  pontuação não importa. Ela **esconde** o que não casa, **não recalcula nada** — os KPIs do topo e
  os contadores das abas continuam falando da fábrica inteira, porque número que muda quando se
  digita no campo de busca é número em que ninguém confia. Como o lote pode estar em qualquer aba,
  o resumo diz **onde ele está** e leva até lá; estação sem nenhum card do lote procurado sai da
  tela.
- Cada estação mostra a carga em **volume**, não só em lote, com barra relativa à etapa mais
  cheia: três lotes podem ser 300 ou 3.000 volumes e a coluna fica igual se só contar lote.
- Navegação por **data de referência** (◀/▶/Hoje) para simular os próximos dias. Quando a data
  não é hoje, entra uma **tarja laranja** avisando — numa tela compartilhada, um dia simulado
  esquecido na tela vira decisão errada.
- **Dado velho** (15 min sem conseguir ler a planilha, ou seja 3 recargas seguidas falhando) entra
  como tarja vermelha no cabeçalho e no rodapé do modo TV. Dado velho é pior que dado ausente: a
  tela continua com cara de tempo real.
- Card expansível com os itens do lote (código, descrição, quantidade). Lotes seguidos da **mesma
  OP** mostram OP e cor só no primeiro card — repetir os chips três vezes gasta altura sem
  informar.
- **Impressão gerencial** e **envio por WhatsApp** (ver abaixo).
- Recarrega automaticamente a cada 5 minutos.

### Unidade
Tudo é **volume**. A coluna `Qtd_cx` da planilha, a baixa do ERP (`Tipo L – VOLUMES`) e o saldo
falam da mesma coisa, então a tela não usa mais a palavra "peças" — misturar peça, volume e lote
faz quem lê rápido somar o que não soma.

No card, o que falta produzir no dia é **`falta N vol.`**; **`pendente`/`atraso`** ficam
reservados para lote que já passou da embalagem. São números diferentes e não devem bater.

## Baixa: volumes embalados
A baixa real não está na planilha, está no ERP: relatório **Transação 3 – REPORTE, Tipo L –
VOLUMES**, que lista por dia o código do volume (`501.*`) e a quantidade reportada.

Esse relatório vai na aba **`BAIXA`** da mesma planilha (`GID_BAIXA`, hoje `1353172751`). Se a aba
for recriada e mudar de `gid`, o painel ainda a encontra pelo **nome** — `BAIXA`, `EMBALADOS` ou
`BAIXAS`. Dois formatos servem:

- **Tabela**: colunas `DATA`, `CODIGO`, `QUANTIDADE` (descrição opcional).
- **Texto cru do relatório colado**: o painel acha as linhas `código … UN … 337,000` e pega a
  data do `Período:` — nunca do `Data:` do cabeçalho, que é a data de emissão.

O código é comparado sem pontuação, então `501.096.004` e `501096004` são o mesmo produto — os
dois formatos convivem na planilha.

Cada lançamento é casado com o lote **pelo código do produto**, escolhendo o lote cuja embalagem
está mais perto da data do lançamento. Volume reportado no dia X nunca entra em lote que embala
**depois** de X (seria baixa de lote antigo); o que não acha lote aparece como `N sem lote` na
linha de status, junto com o que foi reportado acima do programado.

## Pontos e peso
Pontos e peso são atributos do **produto**, não do lote: moram na aba de **cadastro**
(`GID_CADASTRO`, hoje `905587643`), uma linha por código, com `P B` (peso bruto, **kg por
volume**) e `PONTOS` (por volume). O painel casa cada item do lote pelo **código**, do mesmo
jeito que a baixa — `501.041.001` e `501041001` são o mesmo produto.

Se a aba for recriada e mudar de `gid`, o painel tenta os gids conhecidos e depois os nomes
`CADASTRO`, `PRODUTOS`, `PONTOS`; vale a primeira que tiver `CODIGO` + `PONTOS`/`P B`. Dá para
fixar outro gid na aba ⚙ Configuração.

Onde aparecem: KPI de pontos e de peso no cabeçalho, carga por etapa junto do volume, e no card
de cada lote. No impresso entram como colunas no quadro de carga e no detalhamento por etapa.

Acima de 1.000 kg a unidade vira **t** — um lote de 850 volumes a 34 kg dá 29 t, e `28.900 kg`
não se lê de relance.

**Cobertura**: item cujo código não está no cadastro vale zero ponto e zero quilo. Um total baixo
por falta de cadastro é indistinguível de um total baixo de verdade, então a linha de status diz
quantos itens ficaram de fora — se o número parecer pequeno, é o primeiro lugar para olhar.

## Volumes pendentes / atraso
- **Volume pendente** = programado − baixa. Sem a aba de baixa, cai para a coluna `SALDO`/`FALTA`
  e, na falta dela, `Qtd_cx − PRODUZIDO`.
- Passou a embalagem e ainda falta volume → faixa vermelha **Em atraso**, com dias úteis de
  atraso, volumes pendentes e % feito. KPI **volumes em atraso** no topo.
- Passou a embalagem e a baixa **não cobre aquele dia** → faixa **Sem baixa**, em laranja. Não é
  atraso nem conclusão: é desconhecido. Serve para não pintar de vermelho lote que ninguém
  reportou, e para cobrar o reporte que falta.
- Só cai em **Concluídos** quem teve baixa e não deixou saldo.
- O card mostra `Pend N vol.` e, aberto, o que falta de cada produto. No **modo TV** entra uma
  tarja vermelha com o total pendente. **Impresso** e **WhatsApp** trazem o bloco de atraso com
  os produtos que faltam.
- Na faixa **Em atraso**, cada linha com `▸` **abre no clique** e mostra o que falta produto por
  produto — pendente e total de cada um. O agregado diz quanto; quem vai atrás do lote precisa
  saber de quê. A linha aberta continua aberta na recarga automática de 5 min.
- Uma linha de `STATUS` com "atrasado", "pendente", "parado" ou "falta" também marca o lote.

A baixa só responde pelos dias que ela cobre: um lote com embalagem fora do período carregado
nunca é acusado de atraso.

## Lançar faltas (`falta.html`)
Tela separada, feita para **celular no chão de fábrica**: registra o que falta para fechar
cada volume. Fluxo em toques — **lote interno → sublote → volume → peças** — e o operador
**não digita código**: marca numa lista e ajusta a quantidade no `−`/`+`.

A lista de cima é por **lote interno da fábrica** (`142/26`) — é por ele que o operador
reconhece o lote no carrinho e na etiqueta. Uma OP do ERP (`25010`) é um **sublote**: o mesmo
`142/26` costuma sair quebrado em várias OPs seguidas (`25010`, `25011`, `25012`), e numa lista
plana por OP o operador precisaria saber de cor quais números são os dele. Tocando no lote
interno aparecem os sublotes; **lote com um sublote só pula essa tela** e vai direto aos
volumes, com a OP visível ao lado do número interno. O interno vem da coluna `LOTE INTERNO`
da aba de programação, a mesma que o painel lê; sem ela preenchida o lote aparece pela OP,
como antes. A data e a cor do lote interno são as do pior sublote: havendo um vencido, vale o
atraso mais antigo — um sublote atrasado não se esconde atrás da folga do irmão.

A gravação na aba `FALTAS` grava a **OP do sublote** na coluna `LOTE` — é a chave que amarra o
lançamento à programação — e o interno vai junto em `LOTE_INTERNO`.

Com 45 lotes na esteira, achar o certo rolando a lista com o celular numa mão e a peça na outra
é onde se perde tempo — então tem um **campo de busca** acima da lista: filtra por número interno
(`139/26`), por OP de qualquer sublote (`25010`) ou por cor, e a pontuação não importa (`139 26`
e `139` chegam no mesmo lote). Sobrando um único lote, **Enter abre ele direto**.

O botão voltar **diz para onde volta** (`‹ Volumes`, `‹ 139/26`, `‹ Lotes`): com quatro níveis, um
`‹` sozinho faz o operador descobrir errando. E sair da tela de peças com algo marcado **pergunta
antes** — dez peças contadas com a mão suja não podem sumir num toque errado no canto da tela,
porque não ficaram gravadas em lugar nenhum.

### Lançar é corrigir, não anotar
O app **lê a aba `FALTAS`** e abre a tela de peças já mostrando o que está lançado — pelo turno
de quem está com o celular ou pelo outro. O contador vem preenchido, a peça lançada sobe para o
topo com `já lançado: N`, e o que muda dali em diante é o que vai para a planilha:

| na tela | o que grava |
|---|---|
| aumentar/diminuir uma peça lançada | corrige a quantidade |
| **✓ chegou** (zera o contador) | **remove** a peça da aba e arquiva em `FALTAS_HIST` |
| marcar peça sem lançamento | falta nova |
| não mexer em nada | **nada** — botão desabilitado |

Sem isso o app era cego e só de escrita: lançava por cima do que já existia, e a falta ficava na
planilha para sempre porque **não havia como dar baixa**. O `QTD 0` é o que resolve — o painel usa
o lançamento mais recente de cada `lote+volume+peça` e descarta zero, então a peça sai da lista de
faltas sem apagar histórico nenhum. Por isso o Apps Script passou a **aceitar quantidade 0**
(negativo e fracionário continuam recusados).

A aba `FALTAS` vale como **lista do que está em aberto**: a baixa **remove** as linhas daquela peça
em vez de empilhar um zero em cima. Assim quem faz relatório conta linha e acerta, sem precisar
saber da regra do "último lançamento vence" — que continua valendo para **correção de quantidade**,
essa sim empilhada de propósito.

O que sai vai inteiro para a aba **`FALTAS_HIST`**, criada na primeira baixa, com duas colunas a
mais: `BAIXA_EM` e `BAIXA_POR`. Apagar de vez perderia quanto tempo a peça ficou faltando, que é o
único jeito de medir depois se a resposta está melhorando.

Para a planilha que já rodou no formato antigo (com zeros empilhados), rode **`LIMPAR`** uma vez
pelo menu ao lado de Executar: ele tira da aba as peças cujo lançamento mais recente é zero, junto
com as linhas anteriores delas. Rodar de novo não faz mal — na segunda vez não acha nada.

O envio manda **só a diferença**, não a tela inteira: menos linha na planilha e a intenção de quem
lançou fica legível. Depois de gravar, o app atualiza o estado em memória em vez de reler a
planilha — o `gviz` leva minutos para refletir a escrita, e reler mostraria o valor velho, como se
o envio não tivesse pegado. Peça lançada que **não está na estrutura** do volume aparece na lista
mesmo assim, com a descrição gravada no dia: falta invisível é o mesmo que falta inexistente para
quem está com o celular na mão. Lote, sublote e volume ganham um selo `N em falta`.

Sem a aba `FALTAS` configurada (gid em ⚙, padrão `711658815`), o app funciona exatamente como
antes — sem selo, sem baixa, marcando do zero.

A lista das peças vem da aba **`ESTRUTURA`** (lista técnica), uma linha por peça do volume:

| coluna | conteúdo | obrigatória |
|---|---|---|
| `CODIGO` | código do **volume** (`501.xxx.xxx`) | sim |
| `PECA` | código da peça | sim |
| `QTD` | quantas peças por **1 volume** | não (assume 1) |
| `DESCRICAO` | descrição da peça | não |

A aba é procurada pelo gid configurado e depois pelos nomes `ESTRUTURA`, `LISTA TECNICA`,
`BOM`, `COMPOSICAO`. A coluna `QTD` é opcional, mas **sem ela a tela não mostra "N por volume"** —
inventar 1 ali seria apresentar palpite como fato, e é nesse número que o operador se baseia
para pedir.

O catálogo completo passa de **28 mil linhas e 1,7 MB**. Baixar isso na rede da fábrica a cada
abertura, para o operador usar as 28 linhas de um volume, não escala — então a tela **consulta
só o volume aberto** (`gviz` aceita `tq=select * where …`). Na abertura vai um único pedido
curto, só para achar a aba e mapear as colunas; cada volume vira alguns KB, guardados para não
repetir. Se a consulta não for aceita, cai para baixar tudo uma vez: lento, mas funciona.

A resposta é conferida linha a linha contra o código pedido. A consulta já filtra no servidor,
mas se ela fosse ignorada a resposta viria com a planilha inteira — e o operador veria peças de
outro produto sem nada indicar erro.

### Converter o export do ERP (`estrutura.html`)
O ERP exporta o **Relatório Estrutura Nível**, feito para ler no papel: o pai numa linha solta,
os filhos abaixo, e o cabeçalho impresso desalinhado dos dados. `estrutura.html` recebe o
`.xlsx` arrastado e devolve a aba pronta — **roda inteiro no navegador**, o arquivo não sai da
máquina. Lê `.xlsx` sem biblioteca externa: um `.xlsx` é um ZIP com XML, e o navegador já
descompacta (`DecompressionStream`) e já lê XML (`DOMParser`).

A tela lista os grupos encontrados com a quantidade típica de cada um e deixa desmarcar os que
o operador não deve ver. Vêm desmarcados **`600` (chapa HDF)** e **`611` (cola)**: entram
fracionados — 0,3845 e 0,04 por volume — porque são consumo medido, não peça contada, e ninguém
reporta "falta 0,04 de cola" para fechar um lote. Embalagem (`607`) e acessórios (`603`)
**ficam**: caixa ou corrediça faltando trava o volume igual.

`converter-estrutura.py` faz o mesmo pela linha de comando, para quando o arquivo for grande
demais para o navegador.

### Busca por descrição (aba `SEMIACABADO`)
Volume que não está na estrutura **não trava a tela**: o operador procura a peça pela descrição
("tampo 680") numa aba de catálogo — `CODIGO` + `DESCRICAO`, uma linha por peça — e toca no
resultado. Travar seria pior: o lote continua parado e ninguém registra nada.

O catálogo tem ~4.400 peças e uns 200 KB, então é carregado **sob demanda, na primeira busca**.
Baixar isso na rede da fábrica a cada abertura, para na maioria das vezes não usar, é desperdício
que se paga em tela parada. A busca exige que **todos** os termos batam: "tampo 680" acha
`TAMPO 680X302X15`, não tudo que tem "tampo" — com 4.400 peças, busca frouxa devolve lista
grande demais para rolar no celular.

Sem o catálogo disponível, resta digitar o código de 9 dígitos e apertar Enter. Some a busca,
some a rede de segurança, mas não some a possibilidade de registrar.

`ESTRUTURA_SEMENTE.csv` e `SEMIACABADO.csv` no repositório são os dois pontos de partida,
extraídos da pasta `LOTES_ELABORACAO_2026`. A semente cobre 37 dos 131 códigos da programação
(28%) e **não é lista técnica**: são as peças que já faltaram naquele volume, sem quantidade por
unidade. Serve até o ERP exportar a estrutura de verdade.

A gravação vai para a aba **`FALTAS`** por um **Apps Script** publicado na própria planilha
(`apps-script/Codigo.gs`, com o passo a passo no cabeçalho do arquivo). O painel só lê; sem
esse Web App não há como escrever. A `FALTAS` é **append-only**: nunca reescreve linha, então
dois celulares gravando juntos não se atropelam e fica o histórico de quem lançou o quê.

```
DATA_HORA | LOTE | LOTE_INTERNO | COD_VOLUME | DESC_VOLUME | COD_PECA | DESC_PECA | QTD | OPERADOR | OBS
```

`QTD` é **quantas peças faltam de fato**, não multiplicador por volume — há lote com 2 volumes
pendentes e `QT=1`, e outro com 3 volumes e `QT=14`. É o número que a pessoa sabe de cabeça.

Cada envio leva um **`ENVIO_ID`** e o Apps Script recusa, em silêncio, um id que já esteja na aba
— respondendo `ok`, porque para quem mandou gravou mesmo, só não foi agora. Sem isso a falta saía
em dobro: o POST para o `/exec` grava e **mesmo assim** pode falhar na leitura da resposta (ela vem
por redirecionamento), o app cai no fallback por JSONP e escreve de novo. As duas linhas ficavam
idênticas e ninguém desconfiava olhando a planilha. A conferência acontece **dentro da trava**, então
duas chamadas do mesmo envio nunca passam as duas.

Com essa proteção no lugar, o app pode **cortar o POST em 8s** e cair para o JSONP sem medo —
abortar não desfaz o que o servidor já gravou, mas a segunda tentativa leva o mesmo id e é
reconhecida. Antes, um POST pendurado deixava o operador esperando sem fim, e foi por isso que a
falta acabou lançada duas vezes: a tela parada parecia travada. O botão agora **conta os segundos**
(`Enviando… 3s`) enquanto espera.

Do lado do Apps Script, o cabeçalho da aba é lido **uma vez por execução** e guardado em memória.
O caminho da gravação pedia a linha 1 quatro vezes — migração, complemento, montagem da linha e
busca do `ENVIO_ID` — e cada `getValues()` é uma ida ao servidor de planilhas com o operador
esperando de pé. São 3 idas por gravação, contra 6 ou mais.

O painel, de todo modo, usa o **último lançamento** de cada `lote+volume+peça` — nunca a soma — então
duplicata que já esteja gravada não vira falta dobrada no relatório.

As **descrições vão gravadas junto com os códigos**: só `479001001` não diz a ninguém o que
faltou, e quem abre a aba para cobrar a peça tinha de procurar cada número em outra planilha.
Gravar na hora também congela o que a peça **era naquele dia** — a estrutura muda, e uma
consulta feita depois responderia outra coisa. Aba `FALTAS` antiga (7 colunas) é **migrada
automaticamente** na primeira gravação: as colunas novas são inseridas no lugar certo e os
lançamentos já feitos ficam onde estão, com as novas em branco. Se alguém reorganizou as
colunas da aba, o script **não adivinha**: grava cada valor embaixo do título que encontrar
pelo nome e ignora os que não existirem.

### Configurar um celular
Digitar uma URL de 100 caracteres num campo de celular, uma vez por aparelho, é o tipo de passo
que faz a ferramenta não ser adotada. Então o PCP manda **um link pronto** no WhatsApp e o
aparelho se configura sozinho no primeiro acesso:

```
falta.html?url=<URL /exec do Apps Script>&op=NOME
```

Aceita ainda `est=` (gid da estrutura), `fal=` (gid das faltas), `sheet=` e `gid=`. O que não vier no link fica como
estava — dá para mandar só `?op=JOAO` para trocar o nome sem mexer no resto. Depois de aplicar,
a página **limpa os parâmetros da barra de endereço**: se ficassem ali, o operador compartilharia
o endereço de gravação sem perceber.

Pelo mesmo motivo a URL **não está fixa no código** — este repositório é público, e ela é a única
coisa entre o endpoint de gravação e a internet. Quem preferir configurar na mão usa o **⚙**.

A página é autossuficiente como o painel: nenhum arquivo `.js` externo, porque um script que
falhe ao carregar derrubaria a tela inteira.

## Impressão / WhatsApp
Três folhas, sempre referentes à **data de referência** selecionada. Duas saem da barra de
controles; a de programados sai de dentro da própria aba — imprimir o que vem é coisa que se faz
olhando o que vem, e a barra já carrega três botões.

- **🖨 Imprimir / PDF** — monta um relatório gerencial em **A4 deitado**, fundo branco: cabeçalho com
  logo e KPIs, **detalhamento por etapa** com a situação de cada lote, quadro de **carga por
  etapa** (lotes, volumes, pontos, peso e distribuição), bloco de **atraso** (com a peça que trava
  cada lote) e as faixas de sem baixa/concluídos. **Faixa vazia não é impressa** — três
  caixas dizendo "nenhum" empurravam uma folha inteira só para elas. Em "Imprimir → Salvar como PDF" sai o arquivo para mandar
  no grupo. `Ctrl+P` direto do navegador também gera o relatório.

  Cada etapa **fecha com um traço** e abre com um respiro de 17pt. Com 9pt e mais nada, o fim dos
  itens de um setor encostava no título do seguinte e as duas etapas liam-se como uma só — quem
  bate o olho precisa ver onde um bloco acaba antes de ler o que tem dentro.

- **Imprimir folha**, no alto da aba **Programados** — folha do que ainda vai entrar, **A4 deitado**,
  **um bloco por dia de corte**. O gerencial responde pelo dia de hoje; esta responde pela semana
  que vem, e quem lê decide compra de chapa, fita e sequência de corte, então vai com os produtos
  de cada lote. Agrupar por dia é o ponto: uma lista corrida de 18 lotes não diz quanto entra na
  segunda e quanto entra na quarta, que é a única pergunta que se faz aqui. Cada bloco traz lotes,
  volumes, pontos e peso do dia; lote sem data de corte cai num grupo próprio no fim, porque sumir
  da folha seria pior.

  Programados **saiu do gerencial**, onde era uma caixinha com o número do lote e nada mais.

  Deitado porque são 8 colunas de tabela: em pé, `Feito` ficava espremido enquanto sobrava um vão
  de 3 cm entre `Embalagem` e `Atraso`. As larguras do bloco de atraso vêm de um `<colgroup>` — em
  `table-layout:fixed` valem as larguras da **primeira** linha, e a primeira ali é o título com
  `colspan`, então largura em `<th>` o navegador ignora. A orientação é trocada por
  `montarImpresso` numa tag `<style>` própria: `@page` nomeado resolveria sem JS, mas o suporte é
  irregular e folha que sai na orientação errada é PDF que ninguém manda.

  Não há mais bloco de "movimentação do dia": era a mesma lista do detalhamento por etapa logo
  abaixo, só que resumida — o lote que muda de setor já vem marcado lá. Duas listas do mesmo dado
  gastavam meia folha e faziam quem lê conferir uma contra a outra.
- **Enviar no WhatsApp** — monta o mesmo resumo em texto, já na formatação do WhatsApp
  (`*negrito*`), copia para a área de transferência e abre o WhatsApp (`wa.me`, ou o menu de
  compartilhar no celular).

A caixa **produtos** (marcada por padrão) inclui a lista de itens de cada lote — código, descrição e
quantidade — nas duas saídas. Desmarque para o resumo curto, só com os lotes.
- Sem acesso à planilha, exibe **dados de exemplo**.

## Configuração
No topo do `<script>` em `index.html`:
- `SHEET_ID` — ID da planilha do Google Sheets (atual: `MODELO_HORA_A_HORA`).
- `GID` — aba (a de programação, `gid=1540822534`).
- `GID_CADASTRO` — aba de pontos e peso por produto (`gid=905587643`).
- `LEAD` — dias úteis que cada etapa fica antes da embalagem (padrão 1 por etapa).

A planilha precisa estar compartilhada como **“qualquer pessoa com o link: leitor”**.
Cabeçalhos reconhecidos (aceita variações): `Lote`, `Data` (= dia da embalagem), `Codigo`, `Descricao`, `Qtd_cx`, `PRODUZIDO`, `SALDO`, `PERCENTUAL`, `STATUS`, `COR GPS`. Uma linha por produto; várias linhas do mesmo lote são agrupadas.
A cor aceita `COR`, `COR GPS`, `COR DO GPS` ou qualquer cabeçalho com "gps", e pode estar em qualquer linha do lote — a primeira preenchida vale para o lote todo.
Se a planilha já tiver colunas próprias de `corte`/`furar`/`cola`/`uv`, elas são respeitadas (a estimativa só entra quando não existem).

## Ícone (PWA)
A marca é a **estrela do logotipo Patrimar** (`#d9b412`), recortada do próprio `logo-patrimar.png`,
sobre o preto do painel (`#121418`). O centro óptico da estrela fica em **56,2% / 46,1%** do quadro
— o rabo puxa a massa para baixo e para a direita, então centralizar pela caixa delimitadora
deixa o ícone visivelmente torto.

Um arquivo por finalidade, porque cada sistema recorta de um jeito:

| arquivo | conteúdo | por quê |
|---|---|---|
| `icon-192/512.png` | sangra até a borda | o sistema arredonda; desenhar o próprio canto arredondado dá borda dupla |
| `icon-192/512-maskable.png` | conteúdo a 72% | o Android recorta um círculo de 80% — o que passa disso some |
| `apple-touch-icon.png` | conteúdo a 92% | o iOS só arredonda os cantos |
| `favicon-32.png` | conteúdo a 108% | a 32px precisa de massa para não virar borrão |

Trocar os ícones exige subir a versão no `sw.js` (ver abaixo), senão quem já instalou continua com
o ícone antigo em cache.

## Versão e aviso de atualização
A versão mora em **uma linha só**, o `VERSAO` do `sw.js` (hoje `v9`); o nome do cache sai dela
(`esteira-v9`). O painel não tem número próprio: pergunta ao service worker por `postMessage` e
mostra o que vier, no pé da tela (`painel v9`). Dois lugares para bumpar viram um lugar
desatualizado.

**Subir essa linha a cada deploy** é o que dispara o aviso. Sem ele, um deploy só chega a quem
abre a tela do zero — e a tela fica ligada dias seguidos num monitor da fábrica, onde ninguém
fecha e ninguém recarrega. Quando o service worker novo assume, aparece a barra
`Versão nova publicada v10 — recarregue para usar`, com **Atualizar agora** e **depois**. Ela fica
até clicarem: um toast de três segundos passaria batido. No **modo TV** não há quem clique, então
lá a tela se recarrega sozinha em 8 s.

O navegador só procura versão nova de tempos em tempos, e o caso aqui é a aba que nunca é
reaberta — por isso o painel pede `registration.update()` de meia em meia hora.

A primeira instalação **não** dispara o aviso: a troca de controlador ali é de nenhum para o
primeiro, não é atualização. Esse estado é uma variável viva, não uma foto tirada no
carregamento — na primeira visita ainda não há controlador quando o script roda, e congelar a
marca faria a atualização do dia seguinte passar calada, que é justo o caso que o aviso resolve.

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
O acesso externo à planilha funciona no servidor/Vercel (o preview local pode bloquear).
**Antes de publicar, suba o `VERSAO` do `sw.js`** — é o que avisa quem está com a tela aberta.
