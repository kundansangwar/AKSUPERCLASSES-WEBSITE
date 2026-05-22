// Pull-to-refresh for touch devices.
// Pull down from the very top of the page to refresh. If the page defines
// window.__pullRefresh (an async function), it's called for a "soft" refresh;
// otherwise we fall back to a full page reload.
//
// The browser's own pull-to-refresh is already disabled via CSS
// (overscroll-behavior-y: none on body), so there's no gesture conflict.

(function () {
    const THRESHOLD = 70;   // px pulled before a refresh triggers
    const MAX_PULL = 90;    // px the indicator can travel

    let startY = 0;
    let pulling = false;
    let pull = 0;
    let refreshing = false;
    let indicator = null;

    function buildIndicator() {
        indicator = document.createElement("div");
        indicator.className = "ptr-indicator";
        indicator.innerHTML = '<div class="ptr-spinner"></div>';
        document.body.appendChild(indicator);
    }

    function atTop() {
        return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    }

    function setPull(dist) {
        pull = dist;
        if (!indicator) buildIndicator();
        indicator.style.transform = `translateX(-50%) translateY(${dist}px)`;
        indicator.style.opacity = dist > 6 ? "1" : "0";
        indicator.classList.toggle("ready", dist >= THRESHOLD);
        const spinner = indicator.firstChild;
        if (spinner) spinner.style.transform = `rotate(${dist * 4}deg)`;
    }

    async function doRefresh() {
        if (!indicator) buildIndicator();
        refreshing = true;
        indicator.classList.add("spinning");
        indicator.classList.remove("ready");
        indicator.style.transform = "translateX(-50%) translateY(58px)";
        indicator.style.opacity = "1";

        try {
            if (typeof window.__pullRefresh === "function") {
                await window.__pullRefresh();
            } else {
                window.location.reload();
                return;
            }
        } catch (_) { /* ignore */ }

        // brief moment so the spin is visible, then retract
        setTimeout(() => {
            indicator.classList.remove("spinning");
            setPull(0);
            refreshing = false;
        }, 500);
    }

    window.addEventListener("touchstart", (e) => {
        if (refreshing) return;
        if (!atTop()) { pulling = false; return; }
        startY = e.touches[0].clientY;
        pulling = true;
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (!pulling || refreshing) return;
        const dy = e.touches[0].clientY - startY;
        if (dy <= 0 || !atTop()) { setPull(0); pulling = false; return; }
        setPull(Math.min(dy * 0.5, MAX_PULL));
    }, { passive: true });

    window.addEventListener("touchend", () => {
        if (!pulling || refreshing) return;
        pulling = false;
        if (pull >= THRESHOLD) {
            doRefresh();
        } else {
            setPull(0);
        }
    });
})();
