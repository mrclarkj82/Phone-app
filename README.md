# DragonMath Linear Equations

Firebase-backed Algebra I assignment app for the Doral roster.

## Pages

- `index.html` is the student assignment page.
- `teacher.html` is the live teacher dashboard.
- `admin.html` is the admin dashboard for creating teachers and assigning students.

## Features

- Google sign-in through Firebase Authentication.
- Assignment selector with 30 linear-equation problems, a 15-problem systems set, a 30-problem slope-from-two-points set, a 30-problem slope-intercept form set, and a 30-problem linear inequalities set.
- Different problem sets for each rostered student and assignment.
- Student answers save while they work; correctness and grade appear only after submission.
- Slope assignments save local progress in the browser and accept equivalent reduced fractions.
- Slope-intercept assignments ask for `m` and `b` from equations in multiple forms.
- Linear inequalities ask for the boundary number and inequality symbol, including sign-flip cases.
- Coordinate grid line problems draw SVG graphs from -10 to 10 and ask for slope, y-intercept, points on the line, and equations from graphs.
- Teachers can reset a selected assignment, which clears saved grades and changes the problem seed.
- Teachers can return one student's submitted assignment, which removes that student's grade and reopens the same saved work for editing.
- Firestore progress saves and submitted grades.
- Firebase Storage JSON report for each submitted assignment.
- Teacher dashboard with live class metrics, assigned roster status, report links, and CSV export.
- Admin-managed teacher records that use the shared `teacher-group` assignment set.

## Firebase

The app uses project `dragonmath-f6f56`.

Firestore paths:

- `teachers/{teacherEmail}`
- `roles/{teacherEmail}`
- `assignments/{assignmentId}/progress/{studentId}`
- `assignments/{assignmentId}/submissions/{studentId}`

Storage path:

- `assignments/{assignmentId}/submissions/{studentId}.json`

For GitHub Pages auth, add `mrclarkj83.github.io` to Firebase Authentication authorized domains.

Rule templates are included in `firestore.rules` and `storage.rules`. Deploy them with the Firebase CLI when ready:

```bash
firebase deploy --only firestore:rules,storage
```

## Local Test

Because the app uses browser modules, test from a local server:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173/index.html`, `http://localhost:5173/teacher.html`, or
`http://localhost:5173/admin.html`.
