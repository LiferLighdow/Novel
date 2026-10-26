const CACHE_NAME = 'novel-reader-v6';
const CACHE_PREFIX = 'novel-reader-';
const PRECACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './mathjax-loader.js',
    './font.ttf',
    './mathjax/precache.json',
    './pwa.js',
    './manifest.webmanifest',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './novels/初音之影.html',
    './novels/夜下浮影.html',
    './novels/夜影漫舞.html',
    './novels/彼岸之夢.html',
    './novels/影夜之謎.html',
    './novels/影夜聚一.html',
    './novels/影樂傳奇.html',
    './novels/我用迴紋針織出來，送給你的禮物錦繡.html',
    './novels/暗夜之影.html',
    './novels/月光下的秘密.html',
    './novels/無影之夜.html',
    './novels/無盡之夢.html',
    './novels/甜蜜之夢.html',
    './novels/破曉之夢.html',
    './novels/精神的長夜.html',
    './novels/終結之夢.html',
    './novels/背上鬼女兒的戀.html',
    './novels/覺醒之夢.html',
    './novels/輪迴之夢.html',
    './novels/錯位的愛恨.html',
    './novels/關於我那變成我妻子的義妹，其實本來就是我父母想結卻沒結成的緣分這檔事.html',
    './novels/cover/初音之影.webp',
    './novels/cover/夏曉.webp',
    './novels/cover/夜下浮影.webp',
    './novels/cover/夜影漫舞.webp',
    './novels/cover/影夜之謎.webp',
    './novels/cover/影夜聚一.webp',
    './novels/cover/影樂傳奇.webp',
    './novels/cover/彼岸之夢.webp',
    './novels/cover/我用迴紋針織出來，送給你的禮物錦繡.webp',
    './novels/cover/暗夜之影.webp',
    './novels/cover/月光下的秘密.webp',
    './novels/cover/無影之夜.webp',
    './novels/cover/無盡之夢.webp',
    './novels/cover/甜蜜之夢.webp',
    './novels/cover/破曉之夢.webp',
    './novels/cover/精神的長夜.webp',
    './novels/cover/終結之夢.webp',
    './novels/cover/背上鬼女兒的戀.webp',
    './novels/cover/覺醒之夢.webp',
    './novels/cover/輪迴之夢.webp',
    './novels/cover/錯位的愛恨.webp',
    './novels/cover/關於我那變成我妻子的義妹，其實本來就是我父母想結卻沒結成的緣分這檔事.webp'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then((cache) => caches.open(CACHE_NAME)
                .then((cache) => cache.match(new URL('./mathjax/precache.json', self.registration.scope)))
                .then((response) => {
                    if (!response) {
                        throw new Error('MathJax 離線資源清單不存在');
                    }
                    return response.json();
                })
                .then((assets) => {
                    if (!Array.isArray(assets) || assets.some((asset) => typeof asset !== 'string')) {
                        throw new Error('MathJax 離線資源清單格式無效');
                    }
                    let installAssets = Promise.resolve();
                    for (let index = 0; index < assets.length; index += 50) {
                        installAssets = installAssets.then(() => cache.addAll(assets.slice(index, index + 50)));
                    }
                    return installAssets;
                }))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    const appPath = new URL('./', self.registration.scope).pathname;
    if (
        event.request.method !== 'GET'
        || requestUrl.origin !== self.location.origin
        || !requestUrl.pathname.startsWith(appPath)
        || requestUrl.pathname.endsWith('/calligraphy.ttf')
    ) {
        return;
    }

    const mathJaxPath = new URL('./mathjax/', self.registration.scope).pathname;
    const isMathJaxRequest = requestUrl.pathname.startsWith(mathJaxPath);
    event.respondWith(
        caches.open(CACHE_NAME)
            .then((cache) => cache.match(event.request, { ignoreSearch: isMathJaxRequest }).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        event.waitUntil(
                            cache.put(event.request, response.clone())
                                .catch((error) => console.error('無法快取資源:', error))
                        );
                    }
                    return response;
                });
            }))
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.open(CACHE_NAME).then((cache) => cache.match('./index.html'));
                }
                return Response.error();
            })
    );
});
