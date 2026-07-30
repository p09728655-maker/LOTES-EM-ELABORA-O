/* Service worker do painel Esteira de Elaboração (PWA).
   - Cacheia o "shell" do app (HTML, ícones) para abrir offline.
   - NUNCA cacheia a planilha do Google Sheets: os dados são sempre buscados
     da rede (o painel precisa estar online para atualizar os lotes).
   - Estratégia network-first no mesmo domínio: online pega sempre a versão
     nova; offline cai para o cache. */
const CACHE = 'esteira-v3';   // subiu ao entrar a tela de lançamento de faltas
const SHELL = [
  './', './index.html', './falta.html',
  './manifest.webmanifest',
  './icon-192.png', './icon-512.png',
  './icon-192-maskable.png', './icon-512-maskable.png',
  './apple-touch-icon.png', './favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Dados ao vivo (Google Sheets / fontes externas): deixa ir direto pra rede.
  if (url.origin !== location.origin) return;

  // App shell: tenta rede primeiro, cai pro cache se estiver offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
