// Service worker mínimo: habilita a instalação do PWA (Android/Chrome exigem
// um SW com handler de fetch) SEM cachear nada — evita o app ficar "preso" numa
// versão antiga após deploy. As requisições seguem normalmente pela rede.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // no-op: sem respondWith, o navegador trata a requisição normalmente (network).
});
