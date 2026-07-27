# Esteira de Elaboração — PPCP Patrimar

Painel ao vivo dos lotes em elaboração, no padrão dos demais apps de PPCP: página única, sem servidor, lendo direto do Google Sheets.

## Como funciona
- Lê a aba de **programação** publicada no **Google Sheets** (CSV via `gviz/tq`).
- A planilha traz **apenas a data da embalagem** (coluna `Data`). As datas das etapas anteriores (Corte → Furadeira → Coladeira/PU → Linha UV) são **estimadas** voltando 1 dia útil por etapa a partir da embalagem (ajustável em `LEAD`).
- Posiciona cada lote na **estação atual** por essas datas: Corte → Furadeira → Coladeira/PU → Linha UV → Embalagem.
- Mostra o **progresso** do lote (produzido / % ) a partir das colunas `PRODUZIDO` e `PERCENTUAL`.
- **KPIs**: lotes ativos, peças em elaboração e lotes que movimentam no dia.
- Faixas **Programados** (ainda não entraram), **Em atraso** (ver abaixo) e **Concluídos**.
- Navegação por **data de referência** (◀/▶/Hoje) para simular os próximos dias.
- Card expansível com os itens do lote (código, descrição, quantidade).
- **Impressão gerencial** e **envio por WhatsApp** (ver abaixo).
- Recarrega automaticamente a cada 5 minutos.

## Baixa: volumes embalados
A baixa real não está na planilha, está no ERP: relatório **Transação 3 – REPORTE, Tipo L –
VOLUMES**, que lista por dia o código do volume (`501.*`) e a quantidade reportada.

Crie na mesma planilha uma aba chamada **`BAIXA`** (aceita também `EMBALADOS` ou `BAIXAS`) e
jogue esse relatório lá. A aba é lida pelo **nome**, então não é preciso descobrir o `gid`.
Dois formatos servem:

- **Tabela**: colunas `DATA`, `CODIGO`, `QUANTIDADE` (descrição opcional).
- **Texto cru do relatório colado**: o painel acha as linhas `código … UN … 337,000` e pega a
  data do `Período:` — nunca do `Data:` do cabeçalho, que é a data de emissão.

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
Cabeçalhos reconhecidos (aceita variações): `Lote`, `Data` (= dia da embalagem), `Codigo`, `Descricao`, `Qtd_cx`, `PRODUZIDO`, `PERCENTUAL`, `STATUS`. Uma linha por produto; várias linhas do mesmo lote são agrupadas.
Se a planilha já tiver colunas próprias de `corte`/`furar`/`cola`/`uv`, elas são respeitadas (a estimativa só entra quando não existem).

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
O acesso externo à planilha funciona no servidor/Vercel (o preview local pode bloquear).
