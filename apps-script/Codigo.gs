// ===========================================================================
// Gravacao das faltas - Web App da planilha LOTES EM ELABORACAO
// ===========================================================================
//
// PUBLIQUE COMO PROJETO SEPARADO. Nao cole dentro do script que ja existe na
// planilha: o Apps Script admite UM doGet e UM doPost por projeto, e juntar
// os dois faz um sobrescrever o outro em silencio.
//
// COMO PUBLICAR:
//   1. script.google.com/home/projects/create   (projeto novo, em branco)
//   2. no editor: Ctrl+A e Delete para esvaziar, depois cole este arquivo
//   3. Ctrl+S para salvar
//   4. no menu ao lado de Executar escolha DIAGNOSTICO -> Executar -> autorize
//   5. Implantar -> Nova implantacao -> App da Web
//        Executar como:     Eu
//        Quem pode acessar: Qualquer pessoa
//   6. copie a URL /exec e cole em engrenagem na tela falta.html
//
// AO ALTERAR DEPOIS: Implantar -> Gerenciar implantacoes -> editar -> Nova
// versao. Criar implantacao nova gera outra URL e a tela para de gravar.
//
// A aba FALTAS e append-only: nunca reescreve linha existente. Dois celulares
// gravando ao mesmo tempo nao se atropelam e fica o historico de quem lancou
// o que. O relatorio usa o lancamento mais recente de cada lote+volume+peca.
//
// Nomes prefixados com faltas_ para nunca colidirem com outro script. doGet e
// doPost sao nomes obrigatorios do Apps Script e nao podem ser prefixados - e
// por isso que o projeto precisa ser separado.
// ===========================================================================

// ID da planilha: o trecho entre /d/ e /edit na URL dela.
var FALTAS_SHEET_ID = '1W9bK_IoWknk8eKFbSWCMxILAQcaXuWD2gG7B0jcwFzg';

var FALTAS_ABA = 'FALTAS';

// So codigo nao se le: "479001001" nao diz a ninguem o que faltou, e quem
// abre a aba para cobrar a peca tem de ir consultar cada numero em outra
// planilha. A descricao vai junto no ato da gravacao - depois nao da, porque
// a estrutura muda e o que a peca era na epoca se perde.
var FALTAS_CABECALHO = ['DATA_HORA', 'LOTE', 'LOTE_INTERNO',
                        'COD_VOLUME', 'DESC_VOLUME',
                        'COD_PECA', 'DESC_PECA',
                        'QTD', 'OPERADOR', 'OBS', 'ENVIO_ID'];

// ENVIO_ID e a chave contra gravacao em dobro. O app manda um id por envio; se
// o mesmo id ja esta na aba, a gravacao e recusada em silencio e a resposta
// volta ok. Sem isso, um POST que grava mas falha na leitura da resposta faz o
// app tentar de novo por JSONP e a peca aparece duas vezes, com as duas linhas
// identicas - ninguem desconfia olhando a planilha.

// Layout anterior, sem lote interno e sem descricao. Quem ja estava gravando
// tem uma aba assim, com historico dentro: ela e migrada, nunca recriada.
var FALTAS_CABECALHO_V1 = ['DATA_HORA', 'LOTE', 'COD_VOLUME', 'COD_PECA', 'QTD', 'OPERADOR', 'OBS'];


// --- utilidades ------------------------------------------------------------

// Codigo sem pontuacao: 778.005.108 e 778005108 sao a mesma peca.
// Mesma regra do painel; divergir aqui faz o relatorio nao casar.
function faltas_normCod_(v) {
  return String(v == null ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// Funciona em projeto separado (openById) e tambem vinculado a planilha.
// A mensagem e explicita porque a excecao crua nao diz o que fazer.
function faltas_planilha_() {
  if (FALTAS_SHEET_ID) {
    try {
      return SpreadsheetApp.openById(FALTAS_SHEET_ID);
    } catch (e) {
      throw new Error('nao abri a planilha ' + FALTAS_SHEET_ID +
        ' - confira o FALTAS_SHEET_ID no topo e se esta conta tem acesso. (' +
        (e && e.message ? e.message : e) + ')');
    }
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('defina FALTAS_SHEET_ID no topo do script');
  return ss;
}

// Cria a aba na primeira chamada. O insertSheet pode falhar por autorizacao
// ainda nao concedida ou porque outra execucao criou a aba no mesmo instante:
// nos dois casos vale reconsultar pelo nome antes de desistir.
//
// O cabecalho e conferido SEMPRE, inclusive quando a aba ja existia - que e o
// caso normal. Sair mais cedo aqui deixava a migracao inalcancavel: a unica
// planilha que ganharia as colunas novas seria uma que ainda nem tinha a aba.
function faltas_aba_() {
  var ss = faltas_planilha_();
  var sh = ss.getSheetByName(FALTAS_ABA);

  if (!sh) {
    try {
      sh = ss.insertSheet(FALTAS_ABA);
    } catch (e) {
      sh = ss.getSheetByName(FALTAS_ABA);
      if (!sh) {
        throw new Error('nao consegui criar a aba ' + FALTAS_ABA + ' em "' + ss.getName() +
          '". Rode DIAGNOSTICO pelo editor para conceder a autorizacao. (' +
          (e && e.message ? e.message : e) + ')');
      }
    }
  }

  // aba vazia ganha o cabecalho; aba com historico e migrada se for a antiga
  if (sh.getLastRow() === 0) {
    sh.appendRow(FALTAS_CABECALHO);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, FALTAS_CABECALHO.length).setFontWeight('bold');
  } else {
    faltas_migraCabecalho_(sh);
    faltas_completaCabecalho_(sh);
  }
  return sh;
}

// Coluna nova do FALTAS_CABECALHO que a aba ainda nao tem entra no fim, sem
// mexer em nada. Encadear uma migracao posicional por versao nao escala; a
// linha e montada pelo NOME da coluna, entao a ordem no fim nao importa.
function faltas_completaCabecalho_(sh) {
  var cab = faltas_cabecalhoAtual_(sh);
  var faltando = FALTAS_CABECALHO.filter(function (n) { return cab.indexOf(n) < 0; });
  if (!faltando.length) return false;
  sh.getRange(1, cab.length + 1, 1, faltando.length)
    .setValues([faltando]).setFontWeight('bold');
  FALTAS_CAB_CACHE = cab.concat(faltando);
  return true;
}

// Cabecalho antigo virando o novo sem tocar no que ja esta gravado:
// insertColumnAfter empurra os valores para a direita, entao cada lancamento
// antigo continua com o dado dele embaixo do titulo certo e as colunas novas
// nascem vazias - que e a verdade, aquelas linhas nunca tiveram descricao.
//
// So mexe quando o cabecalho e EXATAMENTE o antigo. Aba que alguem ja
// reorganizou, ou que ja foi migrada, fica como esta: adivinhar o layout de
// uma planilha alheia e o tipo de erro que so aparece depois de estragar.
function faltas_migraCabecalho_(sh) {
  var atual = faltas_cabecalhoAtual_(sh);
  if (atual.length !== FALTAS_CABECALHO_V1.length) return false;
  for (var i = 0; i < atual.length; i++) {
    if (atual[i] !== FALTAS_CABECALHO_V1[i]) return false;
  }

  sh.insertColumnAfter(2);   // LOTE_INTERNO, depois de LOTE
  sh.insertColumnAfter(4);   // DESC_VOLUME,  depois de COD_VOLUME
  sh.insertColumnAfter(6);   // DESC_PECA,    depois de COD_PECA
  sh.getRange(1, 1, 1, FALTAS_CABECALHO.length)
    .setValues([FALTAS_CABECALHO]).setFontWeight('bold');
  sh.setFrozenRows(1);
  FALTAS_CAB_CACHE = FALTAS_CABECALHO.slice();   // mudou: o cache seguiria velho
  return true;
}

/* O cabecalho que a aba tem de verdade, em maiuscula e sem espaco em volta.
   Guardado em memoria pelo tempo da execucao: cada getValues() e uma ida ao
   servidor de planilhas, e o caminho da gravacao pedia o cabecalho quatro
   vezes - uma na migracao, uma na completa, uma para montar a linha e uma para
   achar o ENVIO_ID. Sao quatro idas para ler sempre a mesma linha 1, e o
   operador esperando de pe na fabrica. */
var FALTAS_CAB_CACHE = null;

function faltas_cabecalhoAtual_(sh) {
  if (FALTAS_CAB_CACHE) return FALTAS_CAB_CACHE;
  var larg = sh.getLastColumn();
  FALTAS_CAB_CACHE = larg < 1 ? FALTAS_CABECALHO.slice()
    : sh.getRange(1, 1, 1, larg).getValues()[0].map(function (v) {
        return String(v == null ? '' : v).trim().toUpperCase();
      });
  return FALTAS_CAB_CACHE;
}

// Esse envio ja foi gravado? Procura de tras para frente: uma repeticao chega
// segundos depois da original, nunca no meio do historico. Olha so as ultimas
// linhas para nao ficar mais lento conforme a aba cresce - retentativa que
// demorasse mais que isso ja teria estourado o timeout do app.
var FALTAS_JANELA_ID = 150;

function faltas_jaGravado_(sh, cab, id) {
  if (!id) return false;
  var c = cab.indexOf('ENVIO_ID');
  if (c < 0) return false;
  var ultima = sh.getLastRow();
  if (ultima < 2) return false;
  var inicio = Math.max(2, ultima - FALTAS_JANELA_ID + 1);
  var vals = sh.getRange(inicio, c + 1, ultima - inicio + 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).trim() === id) return true;
  }
  return false;
}

// JSONP quando o cliente pede callback: atravessa qualquer politica de CORS.
function faltas_resposta_(obj, callback) {
  var txt = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + txt + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(txt)
    .setMimeType(ContentService.MimeType.JSON);
}


// --- validacao -------------------------------------------------------------
// Recusar aqui e barato; lixo na planilha custa caro depois, porque o
// relatorio soma sem reclamar.

function faltas_valida_(p) {
  if (!p || typeof p !== 'object')    return 'payload ausente';
  if (!String(p.lote   || '').trim()) return 'lote nao informado';
  if (!String(p.volume || '').trim()) return 'volume nao informado';
  if (!p.pecas || !p.pecas.length)    return 'nenhuma peca informada';

  for (var i = 0; i < p.pecas.length; i++) {
    var it  = p.pecas[i] || {};
    var cod = faltas_normCod_(it.cod);
    var qtd = Number(it.qtd);
    if (cod.length < 9)          return 'peca ' + (i + 1) + ': codigo invalido (' + (it.cod || 'vazio') + ')';
    /* Zero e permitido de proposito: e a BAIXA - a peca chegou. O painel usa o
       lancamento mais recente de cada lote+volume+peca e descarta qtd 0, entao
       gravar zero tira a peca da lista de faltas sem apagar historico nenhum.
       Negativo e fracionario continuam recusados. */
    if (!(qtd >= 0))             return 'peca ' + (i + 1) + ' (' + cod + '): quantidade nao pode ser negativa';
    if (qtd !== Math.floor(qtd)) return 'peca ' + (i + 1) + ' (' + cod + '): quantidade deve ser inteira';
  }
  return '';
}


// --- gravacao --------------------------------------------------------------

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
    var intn  = String(p.interno || '').trim();
    var vol   = String(p.volume).trim();
    var volD  = String(p.volumeDesc || '').trim();
    var oper  = String(p.operador || '').trim();
    var obs   = String(p.obs || '').trim();

    /* A linha e montada pelo NOME da coluna, nao pela posicao. Aba migrada,
       aba antiga que ficou como estava e aba com uma coluna a mais: nos tres
       casos o dado cai embaixo do titulo certo, em vez de escrever tudo
       deslocado uma casa. Titulo que a aba nao tem simplesmente nao e
       gravado - o lancamento passa, so sem aquele campo. */
    var cab = faltas_cabecalhoAtual_(sh);
    var envio = String(p.envioId || '').trim();

    /* Dentro da trava: entre conferir e escrever nao entra outra execucao,
       entao duas chamadas do mesmo envio nunca passam as duas. Responde ok
       porque, para quem mandou, gravou mesmo - so nao foi agora. */
    if (faltas_jaGravado_(sh, cab, envio)) {
      return { ok: true, gravadas: p.pecas.length, lote: lote, volume: vol, repetido: true };
    }

    var linhas = p.pecas.map(function (it) {
      var v = {
        DATA_HORA:    agora,
        LOTE:         lote,
        LOTE_INTERNO: intn,
        COD_VOLUME:   vol,
        DESC_VOLUME:  volD,
        COD_PECA:     faltas_normCod_(it.cod),
        DESC_PECA:    String(it.desc || '').trim(),
        QTD:          Number(it.qtd),
        OPERADOR:     oper,
        /* Um "0" solto na coluna QTD nao se le: quem abre a aba nao sabe se
           foi engano, campo vazio ou a peca que chegou. A OBS diz. So preenche
           quando ninguem escreveu nada ali. */
        OBS:          obs || (Number(it.qtd) === 0 ? 'BAIXA - peca chegou' : ''),
        ENVIO_ID:     envio
      };
      return cab.map(function (nome) {
        return Object.prototype.hasOwnProperty.call(v, nome) ? v[nome] : '';
      });
    });

    // uma escrita so, em bloco: mais rapido e atomico o bastante sob a trava
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, cab.length)
      .setValues(linhas);

    return { ok: true, gravadas: linhas.length, lote: lote, volume: vol };
  } catch (e) {
    return { ok: false, erro: String(e && e.message ? e.message : e) };
  } finally {
    lock.releaseLock();
  }
}


// --- entradas --------------------------------------------------------------

// POST com Content-Type text/plain: evita o preflight OPTIONS, que o Apps
// Script nao responde. Enviar como application/json quebra no navegador.
function doPost(e) {
  var cb = (e && e.parameter) ? e.parameter.callback : '';
  var p;
  try {
    p = JSON.parse(e.postData.contents);
  } catch (err) {
    return faltas_resposta_({ ok: false, erro: 'JSON invalido' }, cb);
  }
  return faltas_resposta_(faltas_gravar_(p), cb);
}

// GET serve a dois propositos:
//   sem parametro ................ abrir a URL confirma que a implantacao subiu
//   callback=cb&payload=<json> ... gravacao por JSONP, se o POST esbarrar em CORS
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
    return faltas_resposta_({ ok: false, erro: 'payload invalido' }, cb);
  }
  return faltas_resposta_(faltas_gravar_(p), cb);
}


// --- diagnostico -----------------------------------------------------------
// Rode pelo editor quando algo falhar: diz em qual etapa parou, com nome, em
// vez de apontar um numero de linha. Tambem dispara o pedido de autorizacao.

function faltas_diagnostico_() {
  var passos = [];
  try {
    passos.push('ID configurado: ' + (FALTAS_SHEET_ID || '(vazio)'));
    var ss = faltas_planilha_();
    passos.push('abriu a planilha: "' + ss.getName() + '"');
    var nomes = ss.getSheets().map(function (s) { return s.getName(); });
    passos.push('abas (' + nomes.length + '): ' + nomes.join(', '));
    passos.push('aba ' + FALTAS_ABA + ' ja existe? ' + (ss.getSheetByName(FALTAS_ABA) ? 'sim' : 'nao'));
    var sh = faltas_aba_();
    passos.push('aba pronta, lancamentos hoje: ' + Math.max(0, sh.getLastRow() - 1));
    passos.push('OK - escrita liberada');
  } catch (e) {
    passos.push('FALHOU: ' + (e && e.message ? e.message : e));
  }
  var txt = passos.join('\n');
  Logger.log(txt);
  return txt;
}

// Grava uma linha de teste (lote 000000). Apague-a da aba depois.
function faltas_testar_() {
  var r = faltas_gravar_({
    envioId: 'teste-' + new Date().getTime(),
    lote: '000000',
    interno: '000/00',
    volume: '501.000.000',
    volumeDesc: 'VOLUME DE TESTE',
    operador: 'TESTE',
    obs: 'linha de teste - pode apagar',
    pecas: [{ cod: '778005108', qtd: 1, desc: 'PECA DE TESTE' }]
  });
  Logger.log(r);
  return r;
}


// --- atalhos para o menu Executar do editor --------------------------------
// O Apps Script trata nome terminado em _ como privado e nao o lista no menu
// ao lado de Executar. Estes dois existem so para aparecerem la.

function DIAGNOSTICO() { return faltas_diagnostico_(); }
function TESTAR()      { return faltas_testar_(); }
