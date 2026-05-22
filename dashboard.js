import { onAuthChange, logoutStudent, getStudentProfile, upsertStudentProfile, authErrorMessage, isAdmin } from "./auth.js";

const loadingEl = document.getElementById("dashboardLoading");
const contentEl = document.getElementById("dashboardContent");
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

logoutBtnLarge.addEventListener("click", handleLogout);

let currentUser = null;
let currentProfile = null;

function renderProfile(user, profile) {
    const data = profile || {};
    const name = data.name || user.displayName || "Student";
    const firstName = name.split(" ")[0];

    fields.title.textContent = firstName;
    fields.name.textContent = name;
    fields.email.textContent = data.email || user.email || "—";
    fields.mobile.textContent = data.mobile || "—";
    fields.class.textContent = CLASS_LABEL[data.class] || data.class || "—";
    fields.subject.textContent = data.subject || "—";

    // Member since: prefer Firestore createdAt, fall back to Firebase Auth signup time.
    const memberSince = data.createdAt || user.metadata?.creationTime;
    fields.created.textContent = formatDate(memberSince);
}

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Admins go to the admin dashboard instead.
    if (await isAdmin(user.uid)) {
        window.location.href = "admin-dashboard.html";
        return;
    }

    currentUser = user;

    try {
        currentProfile = await getStudentProfile(user.uid);
        renderProfile(user, currentProfile);

        loadingEl.hidden = true;
        contentEl.hidden = false;
    } catch (err) {
        loadingEl.textContent = "Could not load your profile: " + (err.message || err);
    }
});

// ---------- Pull-to-refresh hook ----------
window.__pullRefresh = async () => {
    if (!currentUser) return;
    currentProfile = await getStudentProfile(currentUser.uid);
    renderProfile(currentUser, currentProfile);
};

// ---------- Edit profile modal ----------
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editMobile = document.getElementById("editMobile");
const editClass = document.getElementById("editClass");
const editSubject = document.getElementById("editSubject");
const editMessage = document.getElementById("editMessage");
const editSave = document.getElementById("editSave");

document.getElementById("editProfileBtn").addEventListener("click", () => {
    editMobile.value = currentProfile?.mobile || "";
    editClass.value = currentProfile?.class || "";
    editSubject.value = currentProfile?.subject || "";
    editMessage.hidden = true;
    editModal.hidden = false;
});

document.getElementById("editCancel").addEventListener("click", () => {
    editModal.hidden = true;
});

editModal.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.hidden = true;
});

editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    editMessage.hidden = true;
    editSave.disabled = true;
    editSave.textContent = "Saving...";

    try {
        const updates = {
            name: currentProfile?.name || currentUser.displayName || "Student",
            email: currentProfile?.email || currentUser.email,
            mobile: editMobile.value.trim(),
            class: editClass.value,
            subject: editSubject.value
        };
        if (!currentProfile?.createdAt) {
            updates.createdAtFallback = true;
        }
        await upsertStudentProfile(currentUser.uid, updates);

        currentProfile = await getStudentProfile(currentUser.uid);
        renderProfile(currentUser, currentProfile);

        editMessage.textContent = "Profile updated!";
        editMessage.className = "auth-message auth-message-success";
        editMessage.hidden = false;

        setTimeout(() => { editModal.hidden = true; }, 800);
    } catch (err) {
        editMessage.textContent = authErrorMessage(err);
        editMessage.className = "auth-message auth-message-error";
        editMessage.hidden = false;
    } finally {
        editSave.disabled = false;
        editSave.textContent = "Save Changes";
    }
});
