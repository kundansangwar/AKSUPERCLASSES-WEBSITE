import {
    onAuthChange,
    isAdmin,
    getAdminProfile,
    adminListStudents,
    adminCreateStudent,
    adminUpdateStudent,
    adminDeleteStudent,
    authErrorMessage
} from "./auth.js";

// ---------- DOM refs ----------
const loadingEl = document.getElementById("adminLoading");
const contentEl = document.getElementById("adminContent");
const adminNameEl = document.getElementById("adminName");

const statTotal = document.getElementById("statTotal");
const statPaid = document.getElementById("statPaid");
const statPending = document.getElementById("statPending");
const statOverdue = document.getElementById("statOverdue");

const searchInput = document.getElementById("searchInput");
const filterClass = document.getElementById("filterClass");
const filterFee = document.getElementById("filterFee");
const tbody = document.getElementById("studentsTbody");
const emptyEl = document.getElementById("adminEmpty");

const addStudentBtn = document.getElementById("addStudentBtn");
const addModal = document.getElementById("addModal");
const addForm = document.getElementById("addForm");
const addCancel = document.getElementById("addCancel");
const addSave = document.getElementById("addSave");
const addMessage = document.getElementById("addMessage");

const editModal = document.getElementById("editStudentModal");
const editForm = document.getElementById("editStudentForm");
const editName = document.getElementById("editStudentName");
const editEmail = document.getElementById("editStudentEmail");
const editMobile = document.getElementById("editStudentMobile");
const editClass = document.getElementById("editStudentClass");
const editSubject = document.getElementById("editStudentSubject");
const editFee = document.getElementById("editStudentFee");
const editCancel = document.getElementById("editStudentCancel");
const editSave = document.getElementById("editStudentSave");
const editMessage = document.getElementById("editStudentMessage");

const deleteModal = document.getElementById("deleteModal");
const deleteStudentName = document.getElementById("deleteStudentName");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const deleteMessage = document.getElementById("deleteMessage");

// ---------- State ----------
let allStudents = [];
let editTargetUid = null;
let deleteTargetUid = null;

const CLASS_LABEL = {
    "1": "Class 1st", "2": "Class 2nd", "3": "Class 3rd",
    "4": "Class 4th", "5": "Class 5th", "6": "Class 6th",
    "7": "Class 7th", "8": "Class 8th", "9": "Class 9th"
};

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function showMessage(el, text, type = "error") {
    el.textContent = text;
    el.className = `auth-message auth-message-${type}`;
    el.hidden = false;
}

// ---------- Auth check ----------
onAuthChange(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const admin = await isAdmin(user.uid);
    if (!admin) {
        // Not an admin: send them to the student dashboard.
        window.location.href = "dashboard.html";
        return;
    }

    // Personalize the welcome line.
    const adminProfile = await getAdminProfile(user.uid);
    const adminName = adminProfile?.name || user.displayName || (user.email?.split("@")[0]) || "Admin";
    adminNameEl.textContent = adminName.split(" ")[0];

    await refreshStudents();

    loadingEl.hidden = true;
    contentEl.hidden = false;
});

// ---------- Load + render students ----------
async function refreshStudents() {
    try {
        allStudents = await adminListStudents();
    } catch (err) {
        console.error(err);
        allStudents = [];
        loadingEl.textContent = "Could not load students: " + authErrorMessage(err);
        return;
    }
    updateStats();
    renderTable();
}

function updateStats() {
    statTotal.textContent = allStudents.length;
    statPaid.textContent = allStudents.filter(s => s.feeStatus === "Paid").length;
    statPending.textContent = allStudents.filter(s => s.feeStatus === "Pending" || !s.feeStatus).length;
    statOverdue.textContent = allStudents.filter(s => s.feeStatus === "Overdue").length;
}

function getFilteredStudents() {
    const term = searchInput.value.trim().toLowerCase();
    const cls = filterClass.value;
    const fee = filterFee.value;

    return allStudents.filter(s => {
        if (cls && String(s.class) !== cls) return false;
        if (fee && s.feeStatus !== fee) return false;
        if (term) {
            const hay = [s.name, s.email, s.mobile].filter(Boolean).join(" ").toLowerCase();
            if (!hay.includes(term)) return false;
        }
        return true;
    });
}

function feePill(status) {
    const s = status || "Pending";
    const map = {
        "Paid": "fee-paid",
        "Pending": "fee-pending",
        "Overdue": "fee-overdue",
        "N/A": "fee-na"
    };
    return `<span class="fee-pill ${map[s] || "fee-na"}">${escapeHtml(s)}</span>`;
}

function renderTable() {
    const rows = getFilteredStudents();
    if (rows.length === 0) {
        tbody.innerHTML = "";
        emptyEl.hidden = false;
        return;
    }
    emptyEl.hidden = true;

    tbody.innerHTML = rows.map(s => `
        <tr>
            <td><strong>${escapeHtml(s.name || "—")}</strong></td>
            <td>${escapeHtml(s.email || "—")}</td>
            <td>${escapeHtml(s.mobile || "—")}</td>
            <td>${escapeHtml(CLASS_LABEL[s.class] || s.class || "—")}</td>
            <td>${escapeHtml(s.subject || "—")}</td>
            <td>${feePill(s.feeStatus)}</td>
            <td>${formatDate(s.createdAt)}</td>
            <td class="actions-col">
                <button class="row-action" data-action="edit" data-uid="${escapeHtml(s.id)}" title="Edit">Edit</button>
                <button class="row-action row-action-danger" data-action="delete" data-uid="${escapeHtml(s.id)}" title="Delete">Delete</button>
            </td>
        </tr>
    `).join("");
}

// Action delegation on the table body
tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const uid = btn.dataset.uid;
    const action = btn.dataset.action;
    const student = allStudents.find(s => s.id === uid);
    if (!student) return;

    if (action === "edit") openEditModal(student);
    if (action === "delete") openDeleteModal(student);
});

// Filters
[searchInput, filterClass, filterFee].forEach(el => {
    el.addEventListener("input", renderTable);
    el.addEventListener("change", renderTable);
});

// ---------- Add student ----------
addStudentBtn.addEventListener("click", () => {
    addForm.reset();
    addMessage.hidden = true;
    addModal.hidden = false;
});

addCancel.addEventListener("click", () => { addModal.hidden = true; });
addModal.addEventListener("click", (e) => {
    if (e.target === addModal) addModal.hidden = true;
});

addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addMessage.hidden = true;

    const data = {
        name: document.getElementById("addName").value.trim(),
        email: document.getElementById("addEmail").value.trim().toLowerCase(),
        mobile: document.getElementById("addMobile").value.trim(),
        studentClass: document.getElementById("addClass").value,
        subject: document.getElementById("addSubject").value,
        password: document.getElementById("addPassword").value
    };

    if (data.password.length < 6) {
        showMessage(addMessage, "Password must be at least 6 characters.");
        return;
    }

    addSave.disabled = true;
    addSave.textContent = "Creating...";

    try {
        await adminCreateStudent(data);
        showMessage(addMessage, "Student created!", "success");
        await refreshStudents();
        setTimeout(() => { addModal.hidden = true; }, 700);
    } catch (err) {
        showMessage(addMessage, authErrorMessage(err));
    } finally {
        addSave.disabled = false;
        addSave.textContent = "Create Student";
    }
});

// ---------- Edit student ----------
function openEditModal(student) {
    editTargetUid = student.id;
    editName.textContent = student.name || "—";
    editEmail.textContent = student.email || "—";
    editMobile.value = student.mobile || "";
    editClass.value = student.class || "";
    editSubject.value = student.subject || "";
    editFee.value = student.feeStatus || "Pending";
    editMessage.hidden = true;
    editModal.hidden = false;
}

editCancel.addEventListener("click", () => { editModal.hidden = true; });
editModal.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.hidden = true;
});

editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!editTargetUid) return;
    editMessage.hidden = true;
    editSave.disabled = true;
    editSave.textContent = "Saving...";

    try {
        await adminUpdateStudent(editTargetUid, {
            mobile: editMobile.value.trim(),
            class: editClass.value,
            subject: editSubject.value,
            feeStatus: editFee.value
        });
        showMessage(editMessage, "Student updated!", "success");
        await refreshStudents();
        setTimeout(() => { editModal.hidden = true; }, 700);
    } catch (err) {
        showMessage(editMessage, authErrorMessage(err));
    } finally {
        editSave.disabled = false;
        editSave.textContent = "Save Changes";
    }
});

// ---------- Delete student ----------
function openDeleteModal(student) {
    deleteTargetUid = student.id;
    deleteStudentName.textContent = student.name || student.email || "this student";
    deleteMessage.hidden = true;
    deleteModal.hidden = false;
}

deleteCancel.addEventListener("click", () => { deleteModal.hidden = true; });
deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) deleteModal.hidden = true;
});

deleteConfirm.addEventListener("click", async () => {
    if (!deleteTargetUid) return;
    deleteMessage.hidden = true;
    deleteConfirm.disabled = true;
    deleteConfirm.textContent = "Deleting...";

    try {
        await adminDeleteStudent(deleteTargetUid);
        await refreshStudents();
        deleteModal.hidden = true;
    } catch (err) {
        showMessage(deleteMessage, authErrorMessage(err));
    } finally {
        deleteConfirm.disabled = false;
        deleteConfirm.textContent = "Yes, Delete";
    }
});
