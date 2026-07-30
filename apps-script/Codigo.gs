/* ============================================================================
   Gravação das faltas — Web App da planilha LOTES EM ELABORAÇÃO
   ----------------------------------------------------------------------------
   O painel só lê (CSV via gviz). Para o operador registrar o que falta é
   preciso um caminho de escrita: este script, publicado como app da web na
   própria planilha. Sem servidor e sem custo.

   A aba FALTAS é um log APPEND-ONLY: nunca reescreve linha existente. Dois
   celulares gravando ao mesmo tempo não se atropelam, e fica o histórico de
   quem lançou o quê e quando. O relatório usa o lançamento mais recente de
   cada (lote, volume, peça).

   COMO PUBLICAR (uma vez só):
     1. na planilha: Extensões → Apps Script
     2. apague o conteúdo do Codigo.gs e cole este arquivo
     3. Implantar → Nova implantação → tipo "App da Web"
        · Executar como:     Eu
        · Quem pode acessar: Qualquer pessoa
     4. copie a URL /exec e informe no painel (⚙ Configurações)

   Ao trocar o código depois, use Implantar → Gerenciar implantações → editar
   → Nova versão. Criar uma implantação nova gera outra URL.
   ========================================================================== */

var ABA      = 'FALTAS';
var CABECALHO = ['DATA_HORA','LOTE','COD_VOLUME','COD_PECA','QTD','OPERADOR','OBS'];

/* ---------- utilidades ---------- */

// código sem pontuação: 778.005.108 e 778005108 são a mesma peça.
// Mesma regra do painel (normCod), senão o relatório não casa os lançamentos.
function normCod_(v) {
  return String(v == null ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function abaFaltas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(CABECALHO);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
  }
  return sh;
}

function resposta_(obj, callback) {
  var txt = JSON.stringify(obj);
  // JSONP quando o cliente pede callback: o app da Embalagem já usa esse
  // caminho e ele atravessa qualquer política de CORS.
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + txt + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(txt)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- validação ----------
   Recusa aqui é barata; lixo na planilha custa caro depois, porque o
   relatório soma sem reclamar. */
function valida_(p) {
  if (!p || typeof p !== 'object') return 'payload ausente';
  if (!String(p.lote || '').trim())   return 'lote não informado';
  if (!String(p.volume || '').trim()) return 'volume não informado';
  if (!p.pecas || !p.pecas.length)    return 'nenhuma peça informada';

  for (var i = 0; i < p.pecas.length; i++) {
    var it  = p.pecas[i] || {};
    var cod = normCod_(it.cod);
    var qtd = Number(it.qtd);
    if (cod.length < 9)          return 'peça ' + (i + 1) + ': código inválido (' + (it.cod || 'vazio') + ')';
    if (!(qtd > 0))              return 'peça ' + (i + 1) + ' (' + cod + '): quantidade deve ser maior que zero';
    if (qtd !== Math.floor(qtd)) return 'peça ' + (i + 1) + ' (' + cod + '): quantidade deve ser inteira';
  }
  return '';
}

/* ---------- gravação ---------- */
function gravar_(p) {
  var erro = valida_(p);
  if (erro) return { ok: false, erro: erro };

  // trava curta: dois celulares enviando junto poderiam pegar a mesma linha
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    return { ok: false, erro: 'planilha ocupada, tente de novo' };
  }

  try {
    var sh    = abaFaltas_();
    var agora = new Date();
    var lote  = String(p.lote).trim();
    var vol   = String(p.volume).trim();
    var oper  = String(p.operador || '').trim();
    var obs   = String(p.obs || '').trim();

    var linhas = p.pecas.map(function (it) {
      return [agora, lote, vol, normCod_(it.cod), Number(it.qtd), oper, obs];
    });

    // uma escrita só, em bloco: mais rápido e atômico o bastante sob a trava
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, CABECALHO.length)
      .setValues(linhas);

    return { ok: true, gravadas: linhas.length, lote: lote, volume: vol };
  } catch (e) {
    return { ok: false, erro: String(e && e.message ? e.message : e) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- entradas ---------- */

/* POST com Content-Type text/plain: evita o preflight OPTIONS, que o Apps
   Script não responde. Enviar como application/json quebra no navegador. */
function doPost(e) {
  var cb = e && e.parameter ? e.parameter.callback : '';
  var p;
  try {
    p = JSON.parse(e.postData.contents);
  } catch (err) {
    return resposta_({ ok: false, erro: 'JSON inválido' }, cb);
  }
  return resposta_(gravar_(p), cb);
}

/* GET serve a dois propósitos:
   - sem parâmetro: abrir a URL no navegador confirma que a implantação está de pé
   - ?callback=cb&payload=<json>: gravação por JSONP, para o caso de o POST
     esbarrar em CORS no navegador do celular */
function doGet(e) {
  var par = (e && e.parameter) || {};
  var cb  = par.callback || '';

  if (!par.payload) {
    return resposta_({
      ok: true,
      servico: 'faltas',
      aba: ABA,
      linhas: Math.max(0, abaFaltas_().getLastRow() - 1)
    }, cb);
  }

  var p;
  try {
    p = JSON.parse(par.payload);
  } catch (err) {
    return resposta_({ ok: false, erro: 'payload inválido' }, cb);
  }
  return resposta_(gravar_(p), cb);
}

/* ---------- teste manual ----------
   Rode uma vez pelo editor (Executar → testar_) para criar a aba FALTAS e
   conferir a permissão de escrita antes de publicar. Grava uma linha de
   teste; apague-a depois. */
function testar_() {
  var r = gravar_({
    lote: '000000',
    volume: '501.000.000',
    operador: 'TESTE',
    obs: 'linha de teste — pode apagar',
    pecas: [{ cod: '778005108', qtd: 1 }]
  });
  Logger.log(r);
}
