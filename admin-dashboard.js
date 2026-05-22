import {
    onAuthChange,
    isAdmin,
    getAdminProfile,
    adminListStudents,
    adminCreateStudent,
    adminUpdateStudent,
    adminDeleteStudent,
    adminListAdmins,
    adminPromoteToAdmin,
    adminRemoveAdmin,
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

// Admins management
const adminsGrid = document.getElementById("adminsGrid");
const promoteModal = document.getElementById("promoteModal");
const promoteName = document.getElementById("promoteName");
const promoteCancel = document.getElementById("promoteCancel");
const promoteConfirm = document.getElementById("promoteConfirm");
const promoteMessage = document.getElementById("promoteMessage");

const demoteModal = document.getElementById("demoteModal");
const demoteName = document.getElementById("demoteName");
const demoteSelfWarn = document.getElementById("demoteSelfWarn");
const demoteCancel = document.getElementById("demoteCancel");
const demoteConfirm = document.getElementById("demoteConfirm");
const demoteMessage = document.getElementById("demoteMessage");

// ---------- State ----------
let allStudents = [];
let allAdmins = [];
let currentUserUid = null;
let editTargetUid = null;
let deleteTargetUid = null;
let promoteTarget = null; // student object
let demoteTarget = null; // admin object

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

    currentUserUid = user.uid;

    // Personalize the welcome line.
    const adminProfile = await getAdminProfile(user.uid);
    const adminName = adminProfile?.name || user.displayName || (user.email?.split("@")[0]) || "Admin";
    adminNameEl.textContent = adminName.split(" ")[0];

    // Load admins FIRST so the students table can filter them out on first render.
    await refreshAdmins();
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

function getStudentsOnly() {
    // Exclude any user that is currently an admin — they're shown in the
    // Administrators panel above instead.
    const adminUids = new Set(allAdmins.map(a => a.id));
    return allStudents.filter(s => !adminUids.has(s.id));
}

function updateStats() {
    const students = getStudentsOnly();
    statTotal.textContent = students.length;
    statPaid.textContent = students.filter(s => s.feeStatus === "Paid").length;
    statPending.textContent = students.filter(s => s.feeStatus === "Pending" || !s.feeStatus).length;
    statOverdue.textContent = students.filter(s => s.feeStatus === "Overdue").length;
}

function getFilteredStudents() {
    const term = searchInput.value.trim().toLowerCase();
    const cls = filterClass.value;
    const fee = filterFee.value;

    return getStudentsOnly().filter(s => {
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

    const adminUids = new Set(allAdmins.map(a => a.id));

    tbody.innerHTML = rows.map(s => {
        const isAlreadyAdmin = adminUids.has(s.id);
        const promoteBtn = isAlreadyAdmin
            ? `<span class="row-tag">Admin</span>`
            : `<button class="row-action row-action-accent" data-action="promote" data-uid="${escapeHtml(s.id)}" title="Make Admin">Make Admin</button>`;
        return `
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
                ${promoteBtn}
                <button class="row-action row-action-danger" data-action="delete" data-uid="${escapeHtml(s.id)}" title="Delete">Delete</button>
            </td>
        </tr>
    `;
    }).join("");
}

// ---------- Admin cards ----------
async function refreshAdmins() {
    try {
        allAdmins = await adminListAdmins();
    } catch (err) {
        console.error(err);
        allAdmins = [];
    }
    renderAdmins();
    // Re-render the students table so admins get filtered out and stats update.
    updateStats();
    renderTable();
}

function getInitials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "A";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderAdmins() {
    if (!adminsGrid) return;
    if (allAdmins.length === 0) {
        adminsGrid.innerHTML = `<div class="admin-empty">No administrators yet.</div>`;
        return;
    }
    adminsGrid.innerHTML = allAdmins.map(a => {
        const isMe = a.id === currentUserUid;
        return `
        <div class="admin-card ${isMe ? 'admin-card-me' : ''}">
            <div class="admin-card-avatar">${escapeHtml(getInitials(a.name))}</div>
            <div class="admin-card-info">
                <strong>${escapeHtml(a.name || "Administrator")}${isMe ? ' <span class="row-tag">You</span>' : ''}</strong>
                <small>${escapeHtml(a.email || "—")}</small>
                <small class="admin-card-role">${escapeHtml(a.role || "admin")}</small>
            </div>
            <button class="row-action row-action-danger admin-card-remove" data-admin-uid="${escapeHtml(a.id)}">Remove</button>
        </div>`;
    }).join("");
}

adminsGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-admin-uid]");
    if (!btn) return;
    const uid = btn.dataset.adminUid;
    const admin = allAdmins.find(a => a.id === uid);
    if (!admin) return;
    openDemoteModal(admin);
});

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
    if (action === "promote") openPromoteModal(student);
});

// Filters
[searchInput, filterClass, filterFee].forEach(el => {
    el.addEventListener("input", renderTable);
    el.addEventListener("change", renderTable);
});

// ---------- Export (Excel / PDF) ----------
const EXPORT_HEADERS = ["Name", "Email", "Mobile", "Class", "Subject", "Fee Status", "Joined"];

function getExportRows() {
    return getFilteredStudents().map(s => [
        s.name || "",
        s.email || "",
        s.mobile || "",
        CLASS_LABEL[s.class] || s.class || "",
        s.subject || "",
        s.feeStatus || "Pending",
        formatDate(s.createdAt)
    ]);
}

function dateStamp() {
    return new Date().toISOString().slice(0, 10);
}

document.getElementById("exportExcelBtn").addEventListener("click", () => {
    const rows = getExportRows();
    if (!rows.length) { alert("No students to export with the current filters."); return; }
    if (!window.XLSX) { alert("Excel library failed to load. Check your connection and refresh."); return; }

    const aoa = [EXPORT_HEADERS, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `ak-super-classes-students-${dateStamp()}.xlsx`);
});

document.getElementById("exportPdfBtn").addEventListener("click", () => {
    const rows = getExportRows();
    if (!rows.length) { alert("No students to export with the current filters."); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("PDF library failed to load. Check your connection and refresh."); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AK SUPER CLASSES — Students", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Total: ${rows.length}`, 14, 25);

    doc.autoTable({
        startY: 30,
        head: [EXPORT_HEADERS],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [238, 124, 46], textColor: 255 },
        alternateRowStyles: { fillColor: [250, 242, 230] }
    });

    doc.save(`ak-super-classes-students-${dateStamp()}.pdf`);
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

// ---------- Promote to admin ----------
function openPromoteModal(student) {
    promoteTarget = student;
    promoteName.textContent = student.name || student.email || "this user";
    promoteMessage.hidden = true;
    promoteModal.hidden = false;
}

promoteCancel.addEventListener("click", () => { promoteModal.hidden = true; });
promoteModal.addEventListener("click", (e) => {
    if (e.target === promoteModal) promoteModal.hidden = true;
});

promoteConfirm.addEventListener("click", async () => {
    if (!promoteTarget) return;
    promoteMessage.hidden = true;
    promoteConfirm.disabled = true;
    promoteConfirm.textContent = "Promoting...";

    try {
        await adminPromoteToAdmin(promoteTarget.id, {
            name: promoteTarget.name,
            email: promoteTarget.email,
            role: "admin"
        });
        await Promise.all([refreshAdmins(), refreshStudents()]);
        renderTable();
        promoteModal.hidden = true;
    } catch (err) {
        showMessage(promoteMessage, authErrorMessage(err));
    } finally {
        promoteConfirm.disabled = false;
        promoteConfirm.textContent = "Yes, Promote";
    }
});

// ---------- Remove admin ----------
function openDemoteModal(admin) {
    demoteTarget = admin;
    demoteName.textContent = admin.name || admin.email || "this admin";
    demoteSelfWarn.hidden = admin.id !== currentUserUid;
    demoteMessage.hidden = true;
    demoteModal.hidden = false;
}

demoteCancel.addEventListener("click", () => { demoteModal.hidden = true; });
demoteModal.addEventListener("click", (e) => {
    if (e.target === demoteModal) demoteModal.hidden = true;
});

demoteConfirm.addEventListener("click", async () => {
    if (!demoteTarget) return;
    demoteMessage.hidden = true;
    demoteConfirm.disabled = true;
    demoteConfirm.textContent = "Removing...";

    try {
        await adminRemoveAdmin(demoteTarget.id);
        const removedSelf = demoteTarget.id === currentUserUid;
        await Promise.all([refreshAdmins(), refreshStudents()]);
        renderTable();
        demoteModal.hidden = true;
        if (removedSelf) {
            window.location.href = "dashboard.html";
        }
    } catch (err) {
        showMessage(demoteMessage, authErrorMessage(err));
    } finally {
        demoteConfirm.disabled = false;
        demoteConfirm.textContent = "Yes, Remove";
    }
});
