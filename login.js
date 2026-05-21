import { loginStudent, resetPassword, authErrorMessage, onAuthChange, isAdmin, logoutStudent } from "./auth.js";

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmit");
const messageEl = document.getElementById("loginMessage");
const titleEl = document.getElementById("loginTitle");
const subtitleEl = document.getElementById("loginSubtitle");

const forgotBtn = document.getElementById("forgotPasswordBtn");
const forgotModal = document.getElementById("forgotModal");
const forgotCancel = document.getElementById("forgotCancel");
const forgotSend = document.getElementById("forgotSend");
const resetEmailInput = document.getElementById("resetEmail");
const forgotMessage = document.getElementById("forgotMessage");

const tabs = document.querySelectorAll(".auth-tab");

let mode = "student"; // "student" | "admin"
let loggingIn = false; // suppress auto-redirect while we route by role

// ----- Tab switching -----
tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        if (tab.classList.contains("active")) return;
        tabs.forEach((t) => {
            t.classList.toggle("active", t === tab);
            t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        mode = tab.dataset.mode;
        applyModeText();
        messageEl.hidden = true;
    });
});

function applyModeText() {
    if (mode === "admin") {
        titleEl.textContent = "Admin Login";
        subtitleEl.textContent = "Sign in to manage students and registrations.";
        submitBtn.textContent = "Log In as Admin";
    } else {
        titleEl.textContent = "Welcome Back";
        subtitleEl.textContent = "Log in to continue your learning journey.";
        submitBtn.textContent = "Log In";
    }
}

// ----- Auto-redirect when already signed in (route by admin status) -----
onAuthChange(async (user) => {
    if (!user || loggingIn) return;
    try {
        const admin = await isAdmin(user.uid);
        window.location.href = admin ? "admin-dashboard.html" : "dashboard.html";
    } catch (_) {
        window.location.href = "dashboard.html";
    }
});

function showMessage(el, text, type = "error") {
    el.textContent = text;
    el.className = `auth-message auth-message-${type}`;
    el.hidden = false;
}

// ----- Login submission -----
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.hidden = true;

    const email = form.loginEmail.value.trim().toLowerCase();
    const password = form.loginPassword.value;

    submitBtn.disabled = true;
    submitBtn.textContent = mode === "admin" ? "Logging in..." : "Logging in...";
    loggingIn = true;

    try {
        const user = await loginStudent({ email, password });
        const admin = await isAdmin(user.uid);

        if (mode === "admin") {
            if (!admin) {
                // They tried to log in as admin but this account isn't one.
                await logoutStudent();
                throw new Error("This account does not have admin access. Please use the Student tab.");
            }
            showMessage(messageEl, "Welcome, admin! Redirecting...", "success");
            setTimeout(() => { window.location.href = "admin-dashboard.html"; }, 500);
        } else {
            // Student tab: admin accounts cannot log in here. They must use the Admin tab.
            if (admin) {
                await logoutStudent();
                throw new Error("This is an admin account. Please switch to the Admin tab to log in.");
            }
            showMessage(messageEl, "Logged in! Redirecting...", "success");
            setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
        }
    } catch (err) {
        loggingIn = false;
        showMessage(messageEl, authErrorMessage(err));
        submitBtn.disabled = false;
        submitBtn.textContent = mode === "admin" ? "Log In as Admin" : "Log In";
    }
});

// ----- Forgot password flow -----
forgotBtn.addEventListener("click", () => {
    resetEmailInput.value = form.loginEmail.value.trim();
    forgotMessage.hidden = true;
    forgotModal.hidden = false;
});

forgotCancel.addEventListener("click", () => {
    forgotModal.hidden = true;
});

forgotModal.addEventListener("click", (e) => {
    if (e.target === forgotModal) forgotModal.hidden = true;
});

forgotSend.addEventListener("click", async () => {
    const email = resetEmailInput.value.trim().toLowerCase();
    if (!email) {
        showMessage(forgotMessage, "Please enter your email address.");
        return;
    }
    forgotSend.disabled = true;
    forgotSend.textContent = "Sending...";

    try {
        await resetPassword(email);
        showMessage(forgotMessage, "Reset link sent! Check your inbox.", "success");
    } catch (err) {
        showMessage(forgotMessage, authErrorMessage(err));
    } finally {
        forgotSend.disabled = false;
        forgotSend.textContent = "Send Reset Link";
    }
});
