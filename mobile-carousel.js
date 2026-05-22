// Turns each course grid into a swipeable carousel on mobile by adding
// position dots under it. The horizontal swipe itself is pure CSS
// (scroll-snap); this script only renders + syncs the dots.

(function () {
    function setupCarousel(grid) {
        const cards = grid.querySelectorAll(".course-card");
        if (cards.length < 2) return;
        // Avoid duplicating dots if this runs more than once.
        if (grid.nextElementSibling && grid.nextElementSibling.classList.contains("carousel-dots")) return;

        const dotsWrap = document.createElement("div");
        dotsWrap.className = "carousel-dots";
        cards.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = "carousel-dot" + (i === 0 ? " active" : "");
            dotsWrap.appendChild(dot);
        });
        grid.after(dotsWrap);

        const dots = dotsWrap.querySelectorAll(".carousel-dot");

        grid.addEventListener("scroll", () => {
            // Which card is most centered in the viewport of the scroller?
            const center = grid.scrollLeft + grid.clientWidth / 2;
            let idx = 0;
            let best = Infinity;
            cards.forEach((card, i) => {
                const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                const d = Math.abs(cardCenter - center);
                if (d < best) { best = d; idx = i; }
            });
            dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
        }, { passive: true });

        // Tapping a dot scrolls to that card.
        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                cards[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            });
        });
    }

    function init() {
        document.querySelectorAll(".courses-grid").forEach(setupCarousel);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
