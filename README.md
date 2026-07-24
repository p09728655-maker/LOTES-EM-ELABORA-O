# Esteira de Elaboração — PPCP Patrimar

Painel ao vivo dos lotes em elaboração, no padrão dos demais apps de PPCP: página única, sem servidor, lendo direto do Google Sheets.

## Como funciona
- Lê a aba de elaboração publicada no **Google Sheets** (CSV via `gviz/tq`).
- Posiciona cada lote na **estação atual** pela data prevista de cada etapa: Corte → Furadeira → Coladeira/PU → Linha UV → Embalagem.
- **KPIs**: lotes ativos, peças em elaboração e lotes que movimentam no dia.
- Faixas **Programados** (ainda não entraram) e **Concluídos** (após embalagem).
- Navegação por **data de referência** (◀/▶/Hoje) para simular os próximos dias.
- Card expansível com os itens do lote (código, descrição, quantidade).
- Recarrega automaticamente a cada 5 minutos.
- Sem acesso à planilha, exibe **dados de exemplo**.

## Configuração
No topo do `<script>` em `index.html`:
- `SHEET_ID` — ID da planilha do Google Sheets.
- `GID` — aba (gid=0 é a primeira aba).

A planilha precisa estar compartilhada como **“qualquer pessoa com o link: leitor”**.
Cabeçalhos reconhecidos (aceita variações): `lote`, `cor`, `corte`, `furar`, `cola`, `uv`, `emb`, `cod`, `desc`, `qtd`.
Datas preenchidas apenas na 1ª linha de cada lote (uma linha por produto).

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
O acesso externo à planilha funciona no servidor/Vercel (o preview local pode bloquear).
