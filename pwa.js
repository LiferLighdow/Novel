if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch((error) => {
                console.error('Service Worker 註冊失敗:', error);
            });
    });
}
