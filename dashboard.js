import { onAuthChange, logoutStudent, getStudentProfile } from "./auth.js";

const loadingEl = document.getElementById("dashboardLoading");
const contentEl = document.getElementById("dashboardContent");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtnLarge = document.getElementById("logoutBtnLarge");

const fields = {
    title: document.getElementById("studentNameTitle"),
    name: document.getElementById("profileName"),
    email: document.getElementById("profileEmail"),
    mobile: document.getElementById("profileMobile"),
    class: document.getElementById("profileClass"),
    subject: document.getElementById("profileSubject"),
    created: document.getElementById("profileCreated")
};

const CLASS_LABEL = {
    "1": "Class 1st", "2": "Class 2nd", "3": "Class 3rd",
    "4": "Class 4th", "5": "Class 5th", "6": "Class 6th",
    "7": "Class 7th", "8": "Class 8th", "9": "Class 9th"
};

function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

async function handleLogout() {
    try {
        await logoutStudent();
        window.location.href = "login.html";
    } catch (err) {
        alert("Could not log out: " + (err.message || err));
    }
}

logoutBtn.addEventListener("click", handleLogout);
logoutBtnLarge.addEventListener("click", handleLogout);

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const profile = await getStudentProfile(user.uid);
        const data = profile || {
            name: user.displayName || "Student",
            email: user.email,
            mobile: "—",
            class: "—",
            subject: "—",
            createdAt: null
        };

        const firstName = (data.name || "Student").split(" ")[0];
        fields.title.textContent = firstName;
        fields.name.textContent = data.name || "—";
        fields.email.textContent = data.email || user.email || "—";
        fields.mobile.textContent = data.mobile || "—";
        fields.class.textContent = CLASS_LABEL[data.class] || data.class || "—";
        fields.subject.textContent = data.subject || "—";
        fields.created.textContent = formatDate(data.createdAt);

        loadingEl.hidden = true;
        contentEl.hidden = false;
    } catch (err) {
        loadingEl.textContent = "Could not load your profile: " + (err.message || err);
    }
});
