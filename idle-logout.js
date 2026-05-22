// Automatic logout after a period of inactivity.
// - Students: 30 minutes idle
// - Admins:   15 minutes idle
// A warning popup appears 60 seconds before logout with a "Stay logged in" button.

import { onAuthChange, logoutStudent, isAdmin } from "./auth.js";

const STUDENT_IDLE_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_IDLE_MS = 15 * 60 * 1000;   // 15 minutes
const WARNING_MS = 60 * 1000;           // show warning 60s before logout
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

let idleLimit = STUDENT_IDLE_MS;
let loggedIn = false;
let idleTimer = null;
let warningTimer = null;
let countdownInterval = null;
let activityThrottle = null;

// ---------- Warning popup ----------
let overlay = null;
let countdownEl = null;

function buildWarning() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "idle-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="idle-box" role="alertdialog" aria-live="assertive" aria-label="Inactivity warning">
            <h3 class="idle-title">Are you still there?</h3>
            <p class="idle-text">You&rsquo;ve been inactive for a while. For your security you&rsquo;ll be logged out in
                <strong id="idleCountdown">60</strong> seconds.</p>
            <div class="idle-actions">
                <button type="button" class="idle-logout-btn" id="idleLogoutNow">Log out now</button>
                <button type="button" class="idle-stay-btn" id="idleStay">Stay logged in</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    countdownEl = overlay.querySelector("#idleCountdown");

    overlay.querySelector("#idleStay").addEventListener("click", () => {
        hideWarning();
        resetTimers();
    });
    overlay.querySelector("#idleLogoutNow").addEventListener("click", doLogout);
}

function showWarning() {
    buildWarning();
    let remaining = Math.round(WARNING_MS / 1000);
    countdownEl.textContent = remaining;
    overlay.hidden = false;

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        remaining -= 1;
        if (countdownEl) countdownEl.textContent = Math.max(remaining, 0);
        if (remaining <= 0) clearInterval(countdownInterval);
    }, 1000);
}

function hideWarning() {
    if (overlay) overlay.hidden = true;
    clearInterval(countdownInterval);
}

// ---------- Timer control ----------
function resetTimers() {
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    hideWarning();
    if (!loggedIn) return;
    warningTimer = setTimeout(showWarning, idleLimit - WARNING_MS);
    idleTimer = setTimeout(doLogout, idleLimit);
}

async function doLogout() {
    teardown();
    try { await logoutStudent(); } catch (_) {}
    window.location.href = "login.html?reason=idle";
}

function onActivity() {
    // Throttle so we don't reset on every single mousemove event.
    if (activityThrottle) return;
    activityThrottle = setTimeout(() => { activityThrottle = null; }, 1000);
    // Don't treat activity as "active" while the warning is showing — the user
    // must explicitly click "Stay logged in".
    if (overlay && !overlay.hidden) return;
    resetTimers();
}

function startTracking() {
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
    resetTimers();
}

function teardown() {
    ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, onActivity));
    clearTimeout(idleTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);
    hideWarning();
}

// ---------- Wire to auth state ----------
onAuthChange(async (user) => {
    loggedIn = !!user;
    if (!loggedIn) {
        teardown();
        return;
    }
    // Admins get a shorter idle window.
    try {
        idleLimit = (await isAdmin(user.uid)) ? ADMIN_IDLE_MS : STUDENT_IDLE_MS;
    } catch (_) {
        idleLimit = STUDENT_IDLE_MS;
    }
    startTracking();
});
