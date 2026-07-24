# Esteira de Elaboração — PPCP Patrimar

Painel ao vivo dos lotes em elaboração, no padrão dos demais apps de PPCP: página única, sem servidor, lendo direto do Google Sheets.

## Como funciona
- Lê a aba de **programação** publicada no **Google Sheets** (CSV via `gviz/tq`).
- A planilha traz **apenas a data da embalagem** (coluna `Data`). As datas das etapas anteriores (Corte → Furadeira → Coladeira/PU → Linha UV) são **estimadas** voltando 1 dia útil por etapa a partir da embalagem (ajustável em `LEAD`).
- Posiciona cada lote na **estação atual** por essas datas: Corte → Furadeira → Coladeira/PU → Linha UV → Embalagem.
- Mostra o **progresso** do lote (produzido / % ) a partir das colunas `PRODUZIDO` e `PERCENTUAL`.
- **KPIs**: lotes ativos, peças em elaboração e lotes que movimentam no dia.
- Faixas **Programados** (ainda não entraram) e **Concluídos** (após embalagem).
- Navegação por **data de referência** (◀/▶/Hoje) para simular os próximos dias.
- Card expansível com os itens do lote (código, descrição, quantidade).
- Recarrega automaticamente a cada 5 minutos.
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
