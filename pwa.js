// PWA bootstrap: injects the manifest + mobile meta tags into <head> (so we
// don't have to repeat them in every HTML file) and registers the service
// worker. Include this once per page with: <script src="pwa.js"></script>

(function () {
    function addOnce(selector, create) {
        if (!document.querySelector(selector)) {
            document.head.appendChild(create());
        }
    }

    // Web app manifest
    addOnce('link[rel="manifest"]', () => {
        const l = document.createElement("link");
        l.rel = "manifest";
        l.href = "manifest.json";
        return l;
    });

    // Theme color (address bar / status bar tint)
    addOnce('meta[name="theme-color"]', () => {
        const m = document.createElement("meta");
        m.name = "theme-color";
        m.content = "#ee7c2e";
        return m;
    });

    // iOS: enable standalone web-app mode + home screen icon + title
    addOnce('meta[name="apple-mobile-web-app-capable"]', () => {
        const m = document.createElement("meta");
        m.name = "apple-mobile-web-app-capable";
        m.content = "yes";
        return m;
    });
    addOnce('meta[name="apple-mobile-web-app-status-bar-style"]', () => {
        const m = document.createElement("meta");
        m.name = "apple-mobile-web-app-status-bar-style";
        m.content = "default";
        return m;
    });
    addOnce('meta[name="apple-mobile-web-app-title"]', () => {
        const m = document.createElement("meta");
        m.name = "apple-mobile-web-app-title";
        m.content = "AK SUPER CLASSES";
        return m;
    });
    addOnce('link[rel="apple-touch-icon"]', () => {
        const l = document.createElement("link");
        l.rel = "apple-touch-icon";
        l.href = "icons/apple-touch-icon.png";
        return l;
    });

    // Register the service worker
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js").catch((err) => {
                console.warn("Service worker registration failed:", err);
            });
        });
    }
})();
