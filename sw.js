const CACHE_NAME = 'dream17-cache-v2'; // 您可以隨時更改版本號以強制更新
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/line.png',
  '/manifest.json'
  // 注意：這裡只快取核心檔案，外部 CDN 資源會由瀏覽器自行快取
];

// 監聽 install 事件，快取核心資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 強制新的 Service Worker 立即啟用
  );
});

// 監聽 activate 事件，清理舊的快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 讓新的 SW 控制所有開啟的頁面
  );
});

// 監聽 fetch 事件，實現快取優先策略
self.addEventListener('fetch', event => {
  // 對於非 GET 請求，直接使用網路
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有，直接返回
        if (response) {
          return response;
        }
        // 如果快取中沒有，從網路獲取
        return fetch(event.request).then(
          networkResponse => {
            // 如果請求成功，將其存入快取並返回
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});

// 監聽從主頁面傳來的訊息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
