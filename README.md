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

## Volumes pendentes / atraso
Antes, quando a data da embalagem passava o lote ia para **Concluídos** mesmo sem ter sido
produzido — o que ficou para trás sumia do painel. Agora:

- **Volume pendente** de cada produto = coluna `SALDO`/`FALTA` da planilha; quando ela não existe,
  `Qtd_cx − PRODUZIDO`. O pendente do lote é a soma dos produtos.
- Um lote só cai em **Concluídos** se não sobrou volume. Se passou da embalagem e ainda falta
  algo, ele vai para a faixa vermelha **Em atraso**, com dias úteis de atraso, volumes pendentes
  e % feito. O KPI **volumes em atraso** fica no topo.
- O card do lote mostra `Pend N vol.` e, ao abrir, o que falta de cada produto.
- No **modo TV** entra uma tarja vermelha com o total pendente e os lotes atrasados; o card
  mostra `falta N vol.`.
- O atraso também sai no **impresso** (bloco vermelho no topo, com os produtos que faltam) e no
  **texto do WhatsApp**.
- Uma linha de `STATUS` com "atrasado", "pendente", "parado" ou "falta" também marca o lote.

Sem nenhum apontamento na planilha (nada em `PRODUZIDO` nem em `SALDO`) não dá para afirmar
atraso — nesse caso o painel se guia só pelas datas, como antes, e o KPI fica oculto. Em
compensação, um lote que passou da embalagem **sem nenhum apontamento** conta como 100% pendente:
ou a produção não saiu, ou o apontamento não foi feito — os dois casos merecem aparecer.

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
