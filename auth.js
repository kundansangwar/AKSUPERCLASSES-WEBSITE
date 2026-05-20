// Firebase initialization + auth helpers shared across pages.
// Uses the Firebase v10 modular SDK loaded from gstatic CDN.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
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

export { auth };
