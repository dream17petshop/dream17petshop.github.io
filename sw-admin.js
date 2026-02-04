const CACHE_NAME = 'dream17-admin-cache-v1.2'; // 更新時請修改此版本號
const ASSETS_TO_CACHE = [
    '/admin.html',
    '/logo.png',
    '/manifest-admin.json'
];

// 安裝階段：將核心檔案存入快取
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 激活階段：清理舊版本的快取資料
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 攔截網路請求：採「網路優先」策略，確保後台數據即時性
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// 監聽來自頁面的指令
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting(); // 強制結束等待，準備重整頁面
    }
});