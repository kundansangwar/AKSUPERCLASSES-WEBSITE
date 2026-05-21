// Firebase initialization + auth helpers shared across pages.
// Uses the Firebase v10 modular SDK loaded from gstatic CDN.

import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Registration ----------
export async function registerStudent({ name, email, mobile, studentClass, subject, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, "students", user.uid), {
        uid: user.uid,
        name,
        email,
        mobile,
        class: studentClass,
        subject,
        feeStatus: "Pending",
        createdAt: serverTimestamp()
    });

    return user;
}

// ---------- Login ----------
export async function loginStudent({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

// ---------- Logout ----------
export async function logoutStudent() {
    return signOut(auth);
}

// ---------- Password reset ----------
export async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
}

// ---------- Get student profile from Firestore ----------
export async function getStudentProfile(uid) {
    const snap = await getDoc(doc(db, "students", uid));
    return snap.exists() ? snap.data() : null;
}

// ---------- Save / update student profile in Firestore ----------
export async function upsertStudentProfile(uid, data) {
    await setDoc(doc(db, "students", uid), {
        uid,
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// ---------- Auth state listener ----------
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ---------- Human-friendly error mapper ----------
export function authErrorMessage(error) {
    const code = error?.code || "";
    const map = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
        "auth/network-request-failed": "Network error. Please check your connection."
    };
    return map[code] || error?.message || "Something went wrong. Please try again.";
}

// ============================================================
// Admin functions
// ============================================================

// ---------- Check if a user is an admin ----------
export async function isAdmin(uid) {
    if (!uid) return false;
    try {
        const snap = await getDoc(doc(db, "admins", uid));
        return snap.exists();
    } catch (err) {
        return false;
    }
}

// ---------- Get the current admin's profile (from /admins/{uid}) ----------
export async function getAdminProfile(uid) {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists() ? snap.data() : null;
}

// ---------- List all students (admin-only; will fail for non-admins) ----------
export async function adminListStudents() {
    const q = query(collection(db, "students"), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- Delete a student's Firestore profile (admin-only) ----------
// Note: this removes the Firestore profile document. The Firebase Auth account
// itself stays — fully removing it requires Cloud Functions or the Firebase
// Console. The student can no longer access their profile data.
export async function adminDeleteStudent(uid) {
    await deleteDoc(doc(db, "students", uid));
}

// ---------- Update a student's profile (admin-only; e.g., fee status) ----------
export async function adminUpdateStudent(uid, data) {
    await setDoc(doc(db, "students", uid), {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// ---------- Create a new student from the admin panel ----------
// Uses a SECONDARY Firebase app instance so creating the new user does NOT
// sign the admin out of the main app. The Firestore write still goes through
// the main db (so the admin's auth is used — which is allowed by the rules).
export async function adminCreateStudent({ name, email, mobile, studentClass, subject, password }) {
    const secondaryAppName = "secondary-" + Date.now();
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = cred.user;

        await updateProfile(newUser, { displayName: name });

        // Save the profile via the MAIN db (admin's auth context allowed by rules).
        await setDoc(doc(db, "students", newUser.uid), {
            uid: newUser.uid,
            name,
            email,
            mobile,
            class: studentClass,
            subject,
            feeStatus: "Pending",
            createdAt: serverTimestamp()
        });

        await signOut(secondaryAuth);
        return newUser;
    } finally {
        try { await deleteApp(secondaryApp); } catch (_) {}
    }
}

export { auth };
