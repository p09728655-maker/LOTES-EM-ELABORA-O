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
- Faixas **Em atraso** e **Sem baixa** vêm **antes** do quadro de estações — as duas cobram ação
  de alguém e não podem depender de rolagem. **Programados** e **Concluídos** ficam no rodapé.
- A faixa de atraso mostra os **5 maiores por volume pendente** (`LATE_TOP`) e resume o resto em
  `+ mais N lotes · X volumes`, que abre no clique. Duas razões: com 18 lotes atrasados a faixa
  tomava a tela inteira e empurrava o quadro para fora da primeira dobra; e a lista **ordena por
  volume, não por idade** — metade dos atrasos costuma ser sobra de 5 a 20 volumes em lote 96%
  feito, que ordenada por dia ocupa o topo e esconde o lote que concentra o volume.
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
fixar outro gid em Configurações (⚙).

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
- Uma linha de `STATUS` com "atrasado", "pendente", "parado" ou "falta" também marca o lote.

A baixa só responde pelos dias que ela cobre: um lote com embalagem fora do período carregado
nunca é acusado de atraso.

## Lançar faltas (`falta.html`)
Tela separada, feita para **celular no chão de fábrica**: registra o que falta para fechar
cada volume. Fluxo em três toques — **lote → volume → peças** — e o operador **não digita
código**: marca numa lista e ajusta a quantidade no `−`/`+`.

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
DATA_HORA | LOTE | COD_VOLUME | COD_PECA | QTD | OPERADOR | OBS
```

`QTD` é **quantas peças faltam de fato**, não multiplicador por volume — há lote com 2 volumes
pendentes e `QT=1`, e outro com 3 volumes e `QT=14`. É o número que a pessoa sabe de cabeça.

### Configurar um celular
Digitar uma URL de 100 caracteres num campo de celular, uma vez por aparelho, é o tipo de passo
que faz a ferramenta não ser adotada. Então o PCP manda **um link pronto** no WhatsApp e o
aparelho se configura sozinho no primeiro acesso:

```
falta.html?url=<URL /exec do Apps Script>&op=NOME
```

Aceita ainda `est=` (gid da estrutura), `sheet=` e `gid=`. O que não vier no link fica como
estava — dá para mandar só `?op=JOAO` para trocar o nome sem mexer no resto. Depois de aplicar,
a página **limpa os parâmetros da barra de endereço**: se ficassem ali, o operador compartilharia
o endereço de gravação sem perceber.

Pelo mesmo motivo a URL **não está fixa no código** — este repositório é público, e ela é a única
coisa entre o endpoint de gravação e a internet. Quem preferir configurar na mão usa o **⚙**.

A página é autossuficiente como o painel: nenhum arquivo `.js` externo, porque um script que
falhe ao carregar derrubaria a tela inteira.

## Impressão / WhatsApp
Dois botões na barra de controles, sempre referentes à **data de referência** selecionada:

- **🖨 Imprimir / PDF** — monta um relatório gerencial em A4 retrato, fundo branco: cabeçalho com
  logo e KPIs, quadro de **carga por etapa** (lotes, peças e distribuição), **movimentação do dia**
  (o que muda de setor na data), detalhamento por etapa com a situação de cada lote e as faixas de
  programados/concluídos. Em "Imprimir → Salvar como PDF" sai o arquivo para mandar no grupo.
  `Ctrl+P` direto do navegador também gera o relatório.
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

Trocar os ícones exige subir `CACHE` no `sw.js` (hoje `esteira-v2`), senão quem já instalou
continua com o ícone antigo em cache.

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
O acesso externo à planilha funciona no servidor/Vercel (o preview local pode bloquear).
