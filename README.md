# Freshman Algebra Assignments

React/Tailwind Algebra I assignment app with Firebase Google Sign-In, automatic school-domain roles, and teacher class codes. The student and teacher worksheets still store worksheet submissions in the current browser for now, but no dashboard route mounts until Firebase Auth and Firestore account verification finish.

Live Firebase Hosting URL: `https://drrs-math.web.app/`

## Local setup

1. Copy `.env.example` to `.env` and fill in the Firebase web app config values.
2. Enable Google as a Firebase Authentication provider.
3. Deploy `firestore.rules` so school-domain users can create their own restricted account record.
4. Run `npm install` and `npm run dev`.

## School accounts

Use `apps/drrs-math/users/{uid}` as the canonical Firestore account path. Each assigned account must include:

```json
{
  "uid": "firebase-auth-uid",
  "email": "student@example.edu",
  "displayName": "Student Name",
  "role": "student",
  "active": true
}
```

Allowed roles are `student`, `teacher`, and `admin`. On first sign-in, an `@doralacademynv.org` account is created as a teacher and an `@student.doralacademynv.org` account is created as a student. Existing assigned accounts keep their explicit role, so an existing admin is not demoted. Other domains are denied.

Every teacher-domain account receives a persistent 6-character class code on the Teacher Dashboard, including staff members whose explicit role is admin. Students must enter that code before the assignment workspace opens. The class and code records live at `apps/drrs-math/classes/{classId}` and `apps/drrs-math/classJoinCodes/{code}`.

## Firebase Hosting

The app is configured as the `DRRS Algebra 1` web app inside the Firebase project `dragonmath-f6f56` and deploys to the hosting target `drrs-math`.

Deploy the app with:

```bash
npm run build
npx firebase-tools deploy --only hosting:drrs-math --project dragonmath-f6f56
```

## GitHub Pages

The older Pages workflow still builds the React app for `/Phone-app/`, but the primary live site is Firebase Hosting. If GitHub Pages is still used as a backup, add these repository secrets before the live login flow is expected to work:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Deploy `firestore.rules` with Firebase before using protected Firestore data. Those rules narrowly allow domain-based self-provisioning, teacher-owned class creation, and student enrollment by code; account administration and the default path remain admin-only.
