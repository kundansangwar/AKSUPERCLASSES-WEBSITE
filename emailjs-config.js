// EmailJS configuration for sending demo-booking emails from the static site.
// These values are PUBLIC (client-side) and safe to commit, like the Firebase config.
//
// To activate emails, sign up free at https://www.emailjs.com and fill these in:
//   1. Add an Email Service (e.g., Gmail) -> copy its Service ID
//   2. Create two Email Templates (Admin notification + Visitor confirmation)
//      -> copy each Template ID
//   3. Account -> General -> copy your Public Key
//   4. Set adminEmail to where booking notifications should go
//
// Until the placeholders below are replaced, bookings still save to Firestore
// and appear in the admin dashboard — only the emails are skipped.

export const EMAILJS_CONFIG = {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    adminTemplateId: "YOUR_ADMIN_TEMPLATE_ID",
    visitorTemplateId: "YOUR_VISITOR_TEMPLATE_ID",
    adminEmail: "artikumari1605@gmail.com"
};

export function emailjsReady() {
    return typeof window !== "undefined"
        && window.emailjs
        && EMAILJS_CONFIG.publicKey
        && !EMAILJS_CONFIG.publicKey.startsWith("YOUR_");
}
