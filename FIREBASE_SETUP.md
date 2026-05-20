# Firebase Setup Guide

Follow these steps once to make the registration, login, and dashboard pages actually work.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** and follow the prompts (Google Analytics is optional).

## 2. Enable Email/Password authentication

1. In the left sidebar, open **Build → Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, click **Email/Password**, toggle it **Enabled**, and **Save**.

## 3. Create the Firestore database

1. In the left sidebar, open **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (we will paste rules in the next step).
4. Pick a region close to your users (for India: `asia-south1`).

## 4. Paste the Firestore security rules

1. Inside Firestore, open the **Rules** tab.
2. Replace the contents with the rules from [`firestore.rules`](firestore.rules) in this repo.
3. Click **Publish**.

These rules ensure each student can only read and write their own profile document.

## 5. Register a web app and copy the config

1. In Firebase Console, click the **gear icon → Project settings**.
2. Scroll to **Your apps** and click the **`</>`** (web) icon.
3. Register the app with any nickname (e.g. `aksuperclasses-web`). You do NOT need Firebase Hosting.
4. Copy the `firebaseConfig` object that Firebase shows you.

## 6. Paste the config into `firebase-config.js`

Open [`firebase-config.js`](firebase-config.js) and replace every placeholder value with the matching value from the config object Firebase gave you.

> Note: It is safe to keep these values in client-side code. Firebase's web config is designed to be public — the Firestore rules above are what actually protect data.

## 7. Authorize your domains

1. Back in **Authentication → Settings → Authorized domains**, make sure both `localhost` and your GitHub Pages domain (e.g. `kundansangwar.github.io`) are listed.
2. If you later add a custom domain, add it here too.

## 8. Test it locally

Because the auth scripts use ES modules, you cannot just double-click the HTML files — your browser will block module imports from `file://` URLs. Instead, run a tiny local server in the project folder:

```
# Python (built into most systems)
python -m http.server 8000

# OR Node
npx serve .
```

Then open http://localhost:8000/register.html.

## 9. Verify the flow

1. Open `register.html`, fill in the form, submit.
2. You should be redirected to `dashboard.html` with your profile shown.
3. Open Firebase Console → Authentication → Users — your account should be there.
4. Open Firebase Console → Firestore → `students` collection — your profile document should be there.
5. Click **Logout**, then go to `login.html` and log back in.
6. Try **Forgot password?** to confirm reset emails arrive.

## Common errors

| Error | What to do |
|-------|-----------|
| `auth/operation-not-allowed` | You forgot to enable Email/Password in Authentication → Sign-in method. |
| `auth/configuration-not-found` | Your `firebase-config.js` still has placeholders. Re-check step 6. |
| `Missing or insufficient permissions` | Firestore rules aren't published yet, or they were changed. Re-paste `firestore.rules`. |
| `auth/unauthorized-domain` | Add your domain in Authentication → Settings → Authorized domains. |
