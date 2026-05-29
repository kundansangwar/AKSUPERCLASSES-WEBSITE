// Mobile bottom navigation bar — injected on every page, shown only on small
// screens (CSS controls visibility). The "Account" tab points to login when
// signed out, or the right dashboard when signed in.

import { onAuthChange, isAdmin } from "./auth.js";

const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    courses: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    about: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    contact: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    account: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

const ITEMS = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "courses", label: "Courses", href: "index.html#courses" },
    { key: "about", label: "About", href: "about.html" },
    { key: "contact", label: "Contact", href: "contact.html" },
    { key: "account", label: "Account", href: "login.html", id: "mnav-account" }
];

function currentPage() {
    const p = location.pathname.split("/").pop();
    return p && p.length ? p : "index.html";
}

function buildNav() {
    if (document.querySelector(".mobile-bottom-nav")) return;
    const page = currentPage();

    const nav = document.createElement("nav");
    nav.className = "mobile-bottom-nav";
    nav.setAttribute("aria-label", "Primary");
    nav.innerHTML = ITEMS.map((item) => {
        const base = item.href.split("#")[0];
        const isActive = base === page ||
            (item.key === "account" && (page === "dashboard.html" || page === "admin-dashboard.html"));
        return `
            <a href="${item.href}" class="mnav-link ${isActive ? "active" : ""}"${item.id ? ` id="${item.id}"` : ""}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[item.key]}</svg>
                <span>${item.label}</span>
            </a>`;
    }).join("");

    document.body.appendChild(nav);
}

// Fold "Book a Demo" into the hamburger menu on mobile. It's hidden on desktop
// via CSS (the standalone navbar button handles desktop there).
function injectDemoLink() {
    const menu = document.querySelector(".nav-menu");
    if (!menu) return;
    if (menu.querySelector(".mobile-demo-link")) return;
    const link = document.createElement("a");
    link.href = "demo.html";
    link.className = "nav-link mobile-demo-link";
    link.textContent = "Book Free Trial";
    menu.appendChild(link);
}

function initMobileNav() {
    buildNav();
    injectDemoLink();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNav);
} else {
    initMobileNav();
}

// Point "Account" at the right place based on auth state.
onAuthChange(async (user) => {
    const accountLink = document.getElementById("mnav-account");
    if (!accountLink) return;
    if (!user) {
        accountLink.setAttribute("href", "login.html");
        return;
    }
    try {
        accountLink.setAttribute("href", (await isAdmin(user.uid)) ? "admin-dashboard.html" : "dashboard.html");
    } catch (_) {
        accountLink.setAttribute("href", "dashboard.html");
    }
});
