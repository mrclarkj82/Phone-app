# Freshman Algebra Assignments

React/Tailwind Algebra I assignment app with Firebase Google Sign-In and a Firestore assigned-account gate. The student and teacher worksheets still store worksheet submissions in the current browser for now, but no dashboard route mounts until Firebase Auth and Firestore account verification finish.

Live GitHub Pages URL: `https://mrclarkj83.github.io/Phone-app/`

## Local setup

1. Copy `.env.example` to `.env` and fill in the Firebase web app config values.
2. Enable Google as a Firebase Authentication provider.
3. Create assigned Firestore user documents before anyone signs in.
4. Run `npm install` and `npm run dev`.

## Assigned users

Use `users/{uid}` as the canonical Firestore account path. Each assigned account must include:

```json
{
  "uid": "firebase-auth-uid",
  "email": "student@example.edu",
  "displayName": "Student Name",
  "role": "student",
  "active": true
}
```

Allowed roles are `student`, `teacher`, and `admin`. The app queries the `users` collection by the signed-in Google email and falls back to `users/{uid}`. It never writes a user document during sign-in; unassigned or inactive users are signed out and returned to the login page.

## GitHub Pages

The Pages workflow builds the React app for `/Phone-app/`. Add these repository secrets before the live login flow is expected to work:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Deploy `firestore.rules` with Firebase before using protected Firestore data. Those rules require an active assigned `users/{uid}` document for private reads and writes, limit user account management to admins, and keep the default path admin-only.
