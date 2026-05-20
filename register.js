import { registerStudent, authErrorMessage, onAuthChange } from "./auth.js";

const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("registerSubmit");
const messageEl = document.getElementById("registerMessage");

// While we are mid-registration, ignore the auth listener so it does not
// redirect to dashboard before our Firestore write completes.
let registering = false;

// If a user is already signed in (and not currently registering), send them
// to the dashboard.
onAuthChange((user) => {
    if (user && !registering) window.location.href = "dashboard.html";
});

function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.className = `auth-message auth-message-${type}`;
    messageEl.hidden = false;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.hidden = true;

    const data = {
        name: form.regName.value.trim(),
        email: form.regEmail.value.trim().toLowerCase(),
        mobile: form.regMobile.value.trim(),
        studentClass: form.regClass.value,
        subject: form.regSubject.value,
        password: form.regPassword.value,
        passwordConfirm: form.regPasswordConfirm.value
    };

    if (data.password !== data.passwordConfirm) {
        showMessage("Passwords do not match. Please try again.");
        return;
    }
    if (data.password.length < 6) {
        showMessage("Password should be at least 6 characters.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";
    registering = true;

    try {
        await registerStudent(data);
        showMessage("Account created! Redirecting to your dashboard...", "success");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
    } catch (err) {
        registering = false;
        showMessage(authErrorMessage(err));
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
    }
});
