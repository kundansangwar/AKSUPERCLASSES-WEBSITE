import { saveDemoBooking } from "./auth.js";
import { EMAILJS_CONFIG, emailjsReady } from "./emailjs-config.js";

const form = document.getElementById("demoForm");
const successEl = document.getElementById("demoSuccess");
const submitBtn = form.querySelector(".demo-submit");

const classSelect = document.getElementById("demoClass");
const subjectSelect = document.getElementById("demoSubject");

const CLASS_LABEL = {
    "1": "Class 1st", "2": "Class 2nd", "3": "Class 3rd",
    "4": "Class 4th", "5": "Class 5th", "6": "Class 6th",
    "7": "Class 7th", "8": "Class 8th", "9": "Class 9th"
};

// ---------- Prefill Class & Subject if routed from a course page ----------
const params = new URLSearchParams(window.location.search);
const subjectParam = (params.get("subject") || "").toLowerCase();
const classParam = params.get("class") || "";
let routedFromCourses = false;

if (classParam && CLASS_LABEL[classParam]) {
    classSelect.value = classParam;
    routedFromCourses = true;
}
if (subjectParam) {
    const cap = subjectParam.charAt(0).toUpperCase() + subjectParam.slice(1);
    const match = Array.from(subjectSelect.options).find(o => o.value.toLowerCase() === subjectParam);
    if (match) { subjectSelect.value = match.value; routedFromCourses = true; }
}

function showMessage(text, isError = false) {
    successEl.textContent = text;
    successEl.style.color = isError ? "#b32d18" : "";
    successEl.hidden = false;
}

// ---------- Send confirmation emails via EmailJS (no-op if not configured) ----------
async function sendEmails(data) {
    if (!emailjsReady()) {
        console.info("EmailJS not configured — skipping emails (booking still saved).");
        return;
    }
    try {
        window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
        const shared = {
            student_name: data.studentName,
            student_email: data.email,
            phone: `${data.countryCode} ${data.phone}`,
            class: CLASS_LABEL[data.class] || data.class,
            subject: data.subject,
            source: data.source || "Not specified",
            booked_from: data.routedFrom
        };
        // Email to Super Admin
        await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.adminTemplateId, {
            ...shared,
            to_email: EMAILJS_CONFIG.adminEmail
        });
        // Confirmation email to the visitor
        await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.visitorTemplateId, {
            ...shared,
            to_email: data.email
        });
    } catch (err) {
        console.warn("EmailJS send failed:", err);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    successEl.hidden = true;

    const data = {
        email: document.getElementById("demoEmail").value.trim().toLowerCase(),
        studentName: document.getElementById("demoStudent").value.trim(),
        class: classSelect.value,
        subject: subjectSelect.value,
        source: document.getElementById("demoSource").value.trim(),
        countryCode: document.getElementById("demoCountry").value,
        phone: document.getElementById("demoPhone").value.trim(),
        routedFrom: routedFromCourses ? "Courses page" : "Website (top menu)"
    };

    if (!data.email || !data.studentName || !data.class || !data.subject || !data.phone) {
        showMessage("Please fill in all required fields.", true);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        await saveDemoBooking(data);
        await sendEmails(data);
        showMessage("Thanks! Your demo is booked. We've emailed you a confirmation and our team will reach out shortly.");
        form.reset();
        // Re-apply prefill in case the form is reused
        if (classParam && CLASS_LABEL[classParam]) classSelect.value = classParam;
        if (subjectParam) {
            const m = Array.from(subjectSelect.options).find(o => o.value.toLowerCase() === subjectParam);
            if (m) subjectSelect.value = m.value;
        }
    } catch (err) {
        showMessage("Something went wrong saving your request. Please try again. (" + (err?.message || err) + ")", true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
    }
});
