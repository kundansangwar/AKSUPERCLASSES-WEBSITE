// Shared navbar auth widget.
// When a user is signed in, replace the .login-btn element on the page with
// a profile avatar + dropdown (My Dashboard / Logout). When signed out, leave
// the .login-btn alone.

import { onAuthChange, logoutStudent, getStudentProfile, isAdmin, getAdminProfile } from "./auth.js";

const CLASS_LABEL = {
    "1": "Class 1st", "2": "Class 2nd", "3": "Class 3rd",
    "4": "Class 4th", "5": "Class 5th", "6": "Class 6th",
    "7": "Class 7th", "8": "Class 8th", "9": "Class 9th"
};

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function getInitials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "S";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildWidget(user, profile, options = {}) {
    const { isAdminUser = false, adminProfile = null } = options;

    let name;
    let meta;

    if (isAdminUser) {
        name = adminProfile?.name || user.displayName || "Administrator";
        meta = user.email || "Administrator";
    } else {
        name = profile?.name || user.displayName || "Student";
        const classLabel = CLASS_LABEL[profile?.class] || profile?.class || "";
        const subject = profile?.subject || "";
        const metaParts = [classLabel, subject].filter(Boolean);
        meta = metaParts.length ? metaParts.join(" · ") : (user.email || "Student");
    }

    const initials = escapeHtml(getInitials(name));
    const dashboardHref = isAdminUser ? "admin-dashboard.html" : "dashboard.html";
    const dashboardLabel = isAdminUser ? "Admin Dashboard" : "My Dashboard";

    const wrap = document.createElement("div");
    wrap.className = "nav-profile";
    wrap.innerHTML = `
        <button type="button" class="nav-avatar-btn" id="navAvatarBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <span class="nav-avatar-initials">${initials}</span>
        </button>
        <div class="nav-profile-menu" id="navProfileMenu" hidden>
            <div class="nav-profile-header">
                <div class="nav-avatar-lg">${initials}</div>
                <div class="nav-profile-text">
                    <strong>${escapeHtml(name)}</strong>
                    <small>${escapeHtml(meta)}</small>
                </div>
            </div>
            <a href="${dashboardHref}" class="nav-profile-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="9"/>
                    <rect x="14" y="3" width="7" height="5"/>
                    <rect x="14" y="12" width="7" height="9"/>
                    <rect x="3" y="16" width="7" height="5"/>
                </svg>
                ${dashboardLabel}
            </a>
            <button type="button" class="nav-profile-link nav-profile-logout" id="navLogoutBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
            </button>
        </div>
    `;
    return wrap;
}

function attachWidget(loginBtn, user, profile, options = {}) {
    const widget = buildWidget(user, profile, options);
    loginBtn.replaceWith(widget);

    const avatarBtn = widget.querySelector("#navAvatarBtn");
    const menu = widget.querySelector("#navProfileMenu");
    const logoutBtn = widget.querySelector("#navLogoutBtn");

    avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !menu.hidden;
        menu.hidden = isOpen;
        avatarBtn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });

    document.addEventListener("click", (e) => {
        if (!widget.contains(e.target)) {
            menu.hidden = true;
            avatarBtn.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            menu.hidden = true;
            avatarBtn.setAttribute("aria-expanded", "false");
        }
    });

    logoutBtn.addEventListener("click", async () => {
        logoutBtn.disabled = true;
        try {
            await logoutStudent();
            window.location.href = "index.html";
        } catch (err) {
            alert("Could not log out: " + (err?.message || err));
            logoutBtn.disabled = false;
        }
    });
}

let alreadyMounted = false;

onAuthChange(async (user) => {
    if (alreadyMounted) return;
    if (!user) return;

    const loginBtn = document.querySelector(".login-btn");
    if (!loginBtn) return;

    alreadyMounted = true;

    // Detect role first — admin vs student — and load the appropriate profile.
    let isAdminUser = false;
    let adminProfile = null;
    let studentProfile = null;

    try {
        isAdminUser = await isAdmin(user.uid);
        if (isAdminUser) {
            adminProfile = await getAdminProfile(user.uid);
        } else {
            studentProfile = await getStudentProfile(user.uid);
        }
    } catch (err) {
        console.warn("nav-auth: could not load profile", err);
    }

    attachWidget(loginBtn, user, studentProfile, { isAdminUser, adminProfile });
});
