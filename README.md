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
- `LEAD` — dias úteis que cada etapa fica antes da embalagem (padrão 1 por etapa).

A planilha precisa estar compartilhada como **“qualquer pessoa com o link: leitor”**.
Cabeçalhos reconhecidos (aceita variações): `Lote`, `Data` (= dia da embalagem), `Codigo`, `Descricao`, `Qtd_cx`, `PRODUZIDO`, `SALDO`, `PERCENTUAL`, `STATUS`, `COR GPS`. Uma linha por produto; várias linhas do mesmo lote são agrupadas.
A cor aceita `COR`, `COR GPS`, `COR DO GPS` ou qualquer cabeçalho com "gps", e pode estar em qualquer linha do lote — a primeira preenchida vale para o lote todo.
Se a planilha já tiver colunas próprias de `corte`/`furar`/`cola`/`uv`, elas são respeitadas (a estimativa só entra quando não existem).

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
O acesso externo à planilha funciona no servidor/Vercel (o preview local pode bloquear).
