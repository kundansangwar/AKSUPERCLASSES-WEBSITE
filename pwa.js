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

    // ----- Install prompt banner -----
    let deferredPrompt = null;
    const DISMISS_KEY = "aksc-install-dismissed";

    function buildInstallBanner() {
        if (document.getElementById("installBanner")) return;
        const banner = document.createElement("div");
        banner.id = "installBanner";
        banner.className = "install-banner";
        banner.innerHTML =
            '<div class="install-banner-icon">AK</div>' +
            '<div class="install-banner-text">' +
                '<strong>Install AK SUPER CLASSES</strong>' +
                '<small>Add the app to your home screen for quick access.</small>' +
            '</div>' +
            '<button type="button" class="install-banner-btn" id="installBannerBtn">Install</button>' +
            '<button type="button" class="install-banner-close" id="installBannerClose" aria-label="Dismiss">&times;</button>';
        document.body.appendChild(banner);

        document.getElementById("installBannerBtn").addEventListener("click", async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            try { await deferredPrompt.userChoice; } catch (_) {}
            deferredPrompt = null;
            banner.remove();
        });
        document.getElementById("installBannerClose").addEventListener("click", () => {
            banner.remove();
            try { localStorage.setItem(DISMISS_KEY, "1"); } catch (_) {}
        });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        let dismissed = false;
        try { dismissed = localStorage.getItem(DISMISS_KEY) === "1"; } catch (_) {}
        if (dismissed) return;
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", buildInstallBanner);
        } else {
            buildInstallBanner();
        }
    });

    window.addEventListener("appinstalled", () => {
        const banner = document.getElementById("installBanner");
        if (banner) banner.remove();
        deferredPrompt = null;
    });
})();
