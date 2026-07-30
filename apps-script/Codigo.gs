/* ============================================================================
   Gravação das faltas — Web App da planilha LOTES EM ELABORAÇÃO
   ----------------------------------------------------------------------------
   O painel só lê (CSV via gviz). Para o operador registrar o que falta é
   preciso um caminho de escrita: este script.

   >>> PUBLIQUE COMO PROJETO SEPARADO. NÃO cole dentro do script que já existe
   >>> na planilha.
   >>>
   >>> Um projeto Apps Script admite UM doGet e UM doPost. Se o script atual já
   >>> tiver esses — e ele tem, é o que responde ao seu app hoje — juntar os
   >>> dois faz um sobrescrever o outro EM SILÊNCIO: sem erro, sem aviso, e o
   >>> app que está rodando simplesmente para de responder.
   >>>
   >>> Projeto separado tem URL própria e implantação própria. Nada do que está
   >>> no ar é tocado.

   COMO PUBLICAR (uma vez só):
     1. abra  https://script.google.com/home/projects/create
        (NÃO use Extensões → Apps Script da planilha: aquilo abre o projeto
         que já existe)
     2. dê um nome ao projeto — ex.: "FALTAS — lotes em elaboração"
     3. apague o conteúdo do Codigo.gs NOVO e cole este arquivo
     4. confira o SHEET_ID abaixo se a planilha não for a de sempre
     5. Executar → escolha  faltas_testar_  → autorize quando pedir
        (cria a aba FALTAS e prova que a escrita funciona)
     6. Implantar → Nova implantação → tipo "App da Web"
          · Executar como:     Eu
          · Quem pode acessar: Qualquer pessoa
     7. copie a URL /exec e cole em ⚙ na tela falta.html
     8. apague a linha de teste (lote 000000) da aba FALTAS

   AO ALTERAR ESTE CÓDIGO DEPOIS:
     Implantar → Gerenciar implantações → editar (lápis) → Nova versão.
     Criar uma implantação nova gera outra URL e a tela para de gravar sem
     avisar.

   A aba FALTAS é APPEND-ONLY: nunca reescreve linha existente. Dois celulares
   gravando ao mesmo tempo não se atropelam e fica o histórico de quem lançou
   o quê. O relatório usa o lançamento mais recente de cada (lote, volume,
   peça).

   Os nomes daqui são prefixados com faltas_ / FALTAS_ para nunca colidirem
   com outro script, caso um dia este código seja mesclado a outro projeto.
   ========================================================================== */

/* ID da planilha (o trecho entre /d/ e /edit na URL).
   Projeto separado não tem planilha "ativa", então precisa abrir pelo ID. */
var FALTAS_SHEET_ID = '1W9bK_IoWknk8eKFbSWCMxILAQcaXuWD2gG7B0jcwFzg';

var FALTAS_ABA       = 'FALTAS';
var FALTAS_CABECALHO = ['DATA_HORA','LOTE','COD_VOLUME','COD_PECA','QTD','OPERADOR','OBS'];

/* ---------- utilidades ---------- */

// código sem pontuação: 778.005.108 e 778005108 são a mesma peça.
// Mesma regra do painel (normCod); divergir aqui faz o relatório não casar.
function faltas_normCod_(v) {
  return String(v == null ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// funciona tanto em projeto separado (openById) quanto vinculado à planilha
function faltas_planilha_() {
  if (FALTAS_SHEET_ID) return SpreadsheetApp.openById(FALTAS_SHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('defina FALTAS_SHEET_ID no topo do script');
  return ss;
}

function faltas_aba_() {
  var ss = faltas_planilha_();
  var sh = ss.getSheetByName(FALTAS_ABA);
  if (!sh) {
    sh = ss.insertSheet(FALTAS_ABA);
    sh.appendRow(FALTAS_CABECALHO);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, FALTAS_CABECALHO.length).setFontWeight('bold');
  }
  return sh;
}

function faltas_resposta_(obj, callback) {
  var txt = JSON.stringify(obj);
  // JSONP quando o cliente pede callback: atravessa qualquer política de CORS
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + txt + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(txt)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- validação ----------
   Recusar aqui é barato; lixo na planilha custa caro depois, porque o
   relatório soma sem reclamar. */
function faltas_valida_(p) {
  if (!p || typeof p !== 'object')    return 'payload ausente';
  if (!String(p.lote   || '').trim()) return 'lote não informado';
  if (!String(p.volume || '').trim()) return 'volume não informado';
  if (!p.pecas || !p.pecas.length)    return 'nenhuma peça informada';

  for (var i = 0; i < p.pecas.length; i++) {
    var it  = p.pecas[i] || {};
    var cod = faltas_normCod_(it.cod);
    var qtd = Number(it.qtd);
    if (cod.length < 9)          return 'peça ' + (i + 1) + ': código inválido (' + (it.cod || 'vazio') + ')';
    if (!(qtd > 0))              return 'peça ' + (i + 1) + ' (' + cod + '): quantidade deve ser maior que zero';
    if (qtd !== Math.floor(qtd)) return 'peça ' + (i + 1) + ' (' + cod + '): quantidade deve ser inteira';
  }
  return '';
}

/* ---------- gravação ---------- */
function faltas_gravar_(p) {
  var erro = faltas_valida_(p);
  if (erro) return { ok: false, erro: erro };

  // trava curta: dois celulares enviando junto poderiam mirar a mesma linha
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    return { ok: false, erro: 'planilha ocupada, tente de novo' };
  }

  try {
    var sh    = faltas_aba_();
    var agora = new Date();
    var lote  = String(p.lote).trim();
    var vol   = String(p.volume).trim();
    var oper  = String(p.operador || '').trim();
    var obs   = String(p.obs || '').trim();

    var linhas = p.pecas.map(function (it) {
      return [agora, lote, vol, faltas_normCod_(it.cod), Number(it.qtd), oper, obs];
    });

    // uma escrita só, em bloco: mais rápido e atômico o bastante sob a trava
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, FALTAS_CABECALHO.length)
      .setValues(linhas);

    return { ok: true, gravadas: linhas.length, lote: lote, volume: vol };
  } catch (e) {
    return { ok: false, erro: String(e && e.message ? e.message : e) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- entradas ----------
   doPost e doGet são nomes obrigatórios do Apps Script e por isso NÃO podem
   ser prefixados. É exatamente por isso que este código pede projeto
   separado: num projeto compartilhado eles colidiriam com os do outro app. */

/* POST com Content-Type text/plain: evita o preflight OPTIONS, que o Apps
   Script não responde. Enviar como application/json quebra no navegador. */
function doPost(e) {
  var cb = (e && e.parameter) ? e.parameter.callback : '';
  var p;
  try {
    p = JSON.parse(e.postData.contents);
  } catch (err) {
    return faltas_resposta_({ ok: false, erro: 'JSON inválido' }, cb);
  }
  return faltas_resposta_(faltas_gravar_(p), cb);
}

/* GET serve a dois propósitos:
   - sem parâmetro: abrir a URL no navegador confirma que a implantação subiu
   - ?callback=cb&payload=<json>: gravação por JSONP, caso o POST esbarre em
     CORS no navegador do celular */
function doGet(e) {
  var par = (e && e.parameter) || {};
  var cb  = par.callback || '';

  if (!par.payload) {
    return faltas_resposta_({
      ok: true,
      servico: 'faltas',
      aba: FALTAS_ABA,
      linhas: Math.max(0, faltas_aba_().getLastRow() - 1)
    }, cb);
  }

  var p;
  try {
    p = JSON.parse(par.payload);
  } catch (err) {
    return faltas_resposta_({ ok: false, erro: 'payload inválido' }, cb);
  }
  return faltas_resposta_(faltas_gravar_(p), cb);
}

/* ---------- teste manual ----------
   Rode pelo editor ANTES de publicar: cria a aba FALTAS, dispara o pedido de
   autorização e prova que a escrita funciona. Se falhar aqui, falharia na
   tela também — melhor descobrir agora. Apague a linha depois. */
function faltas_testar_() {
  var r = faltas_gravar_({
    lote: '000000',
    volume: '501.000.000',
    operador: 'TESTE',
    obs: 'linha de teste — pode apagar',
    pecas: [{ cod: '778005108', qtd: 1 }]
  });
  Logger.log(r);
  return r;
}
