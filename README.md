# Lotes em Elaboração — PCP

Painel de controle de lotes em produção, no padrão dos demais apps de PCP: página única, sem servidor, dados salvos no próprio navegador.

## Recursos
- **Indicadores** (KPIs): total de lotes, em elaboração, atrasados e concluídos.
- **Cadastro de lotes**: nº, produto, quantidade, setor, datas de início e prazo, status, progresso e observações.
- **Sinalização de atraso** automática (prazo vencido e lote não concluído).
- **Busca e filtro** por status.
- **Exportar / Importar** os dados em JSON (backup e transferência entre máquinas).
- Persistência local (`localStorage`).

## Uso
Abra o `index.html` no navegador — não precisa instalar nada.

## Publicar
Deploy estático (ex.: Vercel): basta apontar para este repositório; não há build.
