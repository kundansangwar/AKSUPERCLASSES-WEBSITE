import { loginStudent, resetPassword, authErrorMessage, onAuthChange } from "./auth.js";

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmit");
const messageEl = document.getElementById("loginMessage");

const forgotBtn = document.getElementById("forgotPasswordBtn");
const forgotModal = document.getElementById("forgotModal");
const forgotCancel = document.getElementById("forgotCancel");
const forgotSend = document.getElementById("forgotSend");
const resetEmailInput = document.getElementById("resetEmail");
const forgotMessage = document.getElementById("forgotMessage");

// If a user is already signed in, send them to the dashboard.
onAuthChange((user) => {
    if (user) window.location.href = "dashboard.html";
});

function showMessage(el, text, type = "error") {
    el.textContent = text;
    el.className = `auth-message auth-message-${type}`;
    el.hidden = false;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.hidden = true;

    const email = form.loginEmail.value.trim().toLowerCase();
    const password = form.loginPassword.value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
        await loginStudent({ email, password });
        showMessage(messageEl, "Logged in! Redirecting...", "success");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
    } catch (err) {
        showMessage(messageEl, authErrorMessage(err));
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
    }
});

// Forgot password flow
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
