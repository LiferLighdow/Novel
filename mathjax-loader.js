(function () {
    const config = '?config=TeX-AMS-MML_HTMLorMML';
    const onlineScript = `https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js${config}`;
    const localScript = new URL(`./mathjax/MathJax.js${config}`, document.currentScript.src).href;

    function loadMathJax(src, timeout = 0) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            let timeoutId;

            const finish = (error) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                script.onload = null;
                script.onerror = null;
                if (error) {
                    script.remove();
                    reject(error);
                } else {
                    resolve();
                }
            };

            script.onload = () => {
                if (window.MathJax && window.MathJax.Hub) {
                    finish();
                } else {
                    finish(new Error(`MathJax 載入後未初始化：${src}`));
                }
            };
            script.onerror = () => finish(new Error(`MathJax 載入失敗：${src}`));

            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    finish(new Error(`MathJax 載入逾時：${src}`));
                }, timeout);
            }

            script.src = src;
            document.head.appendChild(script);
        });
    }

    const loadLocal = () => loadMathJax(localScript)
        .catch((error) => {
            throw new Error('線上與離線 MathJax 均載入失敗', { cause: error });
        });

    window.mathJaxReady = navigator.onLine
        ? loadMathJax(onlineScript, 8000).catch((error) => {
            console.warn('線上 MathJax 無法使用，改載入離線版本：', error);
            return loadLocal();
        })
        : loadLocal();

    window.mathJaxReady.catch((error) => {
        console.error('數學公式排版功能無法載入：', error);
    });
})();
