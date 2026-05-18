import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadString,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQeaSzDm4UOm1XzW3uBWzG36C1v3XABhs",
  authDomain: "dragonmath-f6f56.firebaseapp.com",
  projectId: "dragonmath-f6f56",
  storageBucket: "dragonmath-f6f56.firebasestorage.app",
  messagingSenderId: "1011267897815",
  appId: "1:1011267897815:web:72409b23d79021f0f22392",
};

const LINEAR_ASSIGNMENT_ID = "linear-equations-doral-v1";
const assignments = [
  {
    id: LINEAR_ASSIGNMENT_ID,
    title: "Linear Equations",
    directions: "Solve for x",
    problemCount: 30,
    answerMode: "single",
    answerPlaceholder: "x =",
    generator: makeLinearProblem,
  },
  {
    id: "systems-equations-doral-v1",
    title: "Systems of Equations",
    directions: "Solve for x and y",
    problemCount: 15,
    answerMode: "pair",
    answerPlaceholder: "value",
    generator: makeSystemProblem,
  },
  {
    id: "slope-two-points-v1",
    title: "Slope from Two Points",
    directions: "Find the slope between the two points",
    problemCount: 30,
    answerMode: "slope",
    answerPlaceholder: "slope",
    generator: makeSlopeProblem,
  },
  {
    id: "slope-intercept-form-v1",
    title: "Slope Intercept Form",
    directions: "Identify the slope m and y-intercept b",
    problemCount: 30,
    answerMode: "slopeIntercept",
    answerPlaceholder: "value",
    generator: makeSlopeInterceptProblem,
  },
];
const PROGRESS_SAVE_DELAY = 650;

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const roster = [
  {
    id: "S1001",
    name: "Amaya Solbes",
    email: "amaya.solbes@student.doralacademynv.org",
  },
  {
    id: "S1002",
    name: "Austin Davis",
    email: "austin.davis@student.doralacademynv.org",
  },
  {
    id: "S1003",
    name: "Camila Lopez",
    email: "camila.lopez@student.doralacademynv.org",
  },
  {
    id: "S1004",
    name: "Tony Mkhitaryan",
    email: "tony.mkhitaryan@student.doralacademynv.org",
  },
  {
    id: "S1005",
    name: "Emme Nguyen",
    email: "emme.nguyen@student.doralacademynv.org",
  },
  {
    id: "S1006",
    name: "Brilynn Moates",
    email: "brilynn.moates@student.doralacademynv.org",
  },
  {
    id: "S1007",
    name: "Elias Terry",
    email: "elias.terry@student.doralacademynv.org",
  },
  {
    id: "S1008",
    name: "Raevyn Moore",
    email: "raevyn.moore@student.doralacademynv.org",
  },
  {
    id: "S1009",
    name: "Madison Osborn",
    email: "madison.osborn@student.doralacademynv.org",
  },
  {
    id: "S1010",
    name: "Antony Stoev",
    email: "antony.stoev@student.doralacademynv.org",
  },
  {
    id: "S1011",
    name: "Capri Vickers",
    email: "capri.vickers@student.doralacademynv.org",
  },
  {
    id: "S1012",
    name: "Joshua Hearne",
    email: "joshua.hearne@student.doralacademynv.org",
  },
  {
    id: "S1013",
    name: "Lillian Akers",
    email: "lillian.akers@student.doralacademynv.org",
  },
  {
    id: "S1014",
    name: "Zoe Tomlinson",
    email: "zoe.tomlinson@student.doralacademynv.org",
  },
  {
    id: "S1015",
    name: "Zaim Ishola",
    email: "zaim.ishola@student.doralacademynv.org",
  },
  {
    id: "S1016",
    name: "Presley Peterson",
    email: "presley.peterson@student.doralacademynv.org",
  },
  {
    id: "S1017",
    name: "Evan Hernandez",
    email: "evan.hernandez@student.doralacademynv.org",
  },
  {
    id: "S1018",
    name: "Mason Peraza",
    email: "mason.peraza@student.doralacademynv.org",
  },
  {
    id: "S1019",
    name: "Melia Mosley",
    email: "melia.mosley@student.doralacademynv.org",
  },
  {
    id: "S1020",
    name: "Rayden Canda",
    email: "rayden.canda@student.doralacademynv.org",
  },
  {
    id: "S1021",
    name: "Julian Pitura",
    email: "julian.pitura@student.doralacademynv.org",
  },
  {
    id: "S1022",
    name: "Elijan Rosas",
    email: "elijan.rosas@student.doralacademynv.org",
  },
  {
    id: "S1023",
    name: "Madyson Jezbera",
    email: "madyson.jezbera@student.doralacademynv.org",
  },
  {
    id: "S1024",
    name: "Naol Kassaya",
    email: "naol.kassaya@student.doralacademynv.org",
  },
  {
    id: "S1025",
    name: "Gabriella Novo",
    email: "gabriella.novo@student.doralacademynv.org",
  },
];

const rosterByEmail = new Map(roster.map((student) => [normalizeEmail(student.email), student]));
const ADMIN_EMAIL = "joseph.clark@doralacademynv.org";
const TEACHER_GROUP_ID = "teacher-group";
const ROLES = Object.freeze({
  ADMIN: "admin",
  STUDENT: "student",
  TEACHER: "teacher",
});

const state = {
  user: null,
  authReady: false,
  selectedAssignment: assignments[0],
  selectedStudent: roster[0],
  problems: [],
  answers: new Map(),
  isSubmitted: false,
  progress: {},
  submissions: {},
  dashboardUnsubscribes: [],
  teacherProfile: null,
  teachers: {},
  adminUnsubscribe: null,
  editingTeacherEmail: "",
  selectedWorkStudentId: "",
  saveTimer: null,
  isSaving: false,
};

const page = document.body.dataset.page;

const elements = {
  assignmentSelect: document.querySelector("#assignment-select"),
  dashboardAssignmentSelect: document.querySelector("#dashboard-assignment-select"),
  loadAssignment: document.querySelector("#load-assignment"),
  submitAssignment: document.querySelector("#submit-assignment"),
  problemList: document.querySelector("#problem-list"),
  assignmentDirections: document.querySelector("#assignment-directions"),
  assignmentTitle: document.querySelector("#assignment-title"),
  studentHeading: document.querySelector("#student-heading"),
  currentScore: document.querySelector("#current-score"),
  currentPercent: document.querySelector("#current-percent"),
  answeredCount: document.querySelector("#answered-count"),
  correctCount: document.querySelector("#correct-count"),
  submissionNote: document.querySelector("#submission-note"),
  saveState: document.querySelector("#save-state"),
  studentCloudNote: document.querySelector("#student-cloud-note"),
  dashboardBody: document.querySelector("#dashboard-body"),
  submittedCount: document.querySelector("#submitted-count"),
  classAverage: document.querySelector("#class-average"),
  highestScore: document.querySelector("#highest-score"),
  lastUpdate: document.querySelector("#last-update"),
  refreshDashboard: document.querySelector("#refresh-dashboard"),
  exportDashboard: document.querySelector("#export-dashboard"),
  resetDashboard: document.querySelector("#reset-dashboard"),
  teacherNote: document.querySelector("#teacher-note"),
  teacherHeading: document.querySelector("#teacher-heading"),
  studentWorkPanel: document.querySelector("#student-work-panel"),
  studentWorkTitle: document.querySelector("#student-work-title"),
  studentWorkMeta: document.querySelector("#student-work-meta"),
  studentWorkProblems: document.querySelector("#student-work-problems"),
  closeWorkPanel: document.querySelector("#close-work-panel"),
  headerProblemCount: document.querySelector("#header-problem-count"),
  headerStudentCount: document.querySelector("#header-student-count"),
  authDot: document.querySelector("#auth-dot"),
  authName: document.querySelector("#auth-name"),
  authEmail: document.querySelector("#auth-email"),
  signInButton: document.querySelector("#sign-in-button"),
  signOutButton: document.querySelector("#sign-out-button"),
  adminNote: document.querySelector("#admin-note"),
  adminTeacherCount: document.querySelector("#admin-teacher-count"),
  teacherNameInput: document.querySelector("#teacher-name"),
  teacherEmailInput: document.querySelector("#teacher-email"),
  teacherStudentList: document.querySelector("#teacher-student-list"),
  saveTeacherButton: document.querySelector("#save-teacher"),
  clearTeacherButton: document.querySelector("#clear-teacher-form"),
  teacherList: document.querySelector("#teacher-list"),
};

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}

function setDisabled(element, disabled) {
  if (element) {
    element.disabled = disabled;
  }
}

function escapeHtml(value) {
  return `${value}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setBanner(element, message, tone = "neutral") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}

function getSelectedAssignment() {
  return state.selectedAssignment || assignments[0];
}

function getAssignmentById(assignmentId) {
  return assignments.find((assignment) => assignment.id === assignmentId) || assignments[0];
}

function renderHeaderCounts() {
  setText(elements.headerProblemCount, getSelectedAssignment().problemCount);
  setText(elements.headerStudentCount, getVisibleRoster().length);
}

function getStudentById(studentId) {
  return roster.find((student) => student.id === studentId) || null;
}

function getStudentsByIds(studentIds = []) {
  const allowed = new Set(studentIds);
  return roster.filter((student) => allowed.has(student.id));
}

function isAdminAccount() {
  return normalizeEmail(state.user?.email) === ADMIN_EMAIL;
}

function teacherDocId(email = "") {
  return normalizeEmail(email);
}

function teacherRef(email = state.user?.email || "") {
  return doc(db, "teachers", teacherDocId(email));
}

function roleRef(email = "") {
  return doc(db, "roles", teacherDocId(email));
}

function normalizeTeacher(data = {}, fallbackEmail = "") {
  const email = normalizeEmail(data.email || fallbackEmail);
  const studentIds = Array.isArray(data.studentIds)
    ? data.studentIds.filter((studentId) => Boolean(getStudentById(studentId)))
    : [];

  return {
    email,
    name: data.name || email || "Teacher",
    role: data.role || ROLES.TEACHER,
    assignmentGroupId: data.assignmentGroupId || TEACHER_GROUP_ID,
    studentIds,
    reportFiles: Array.isArray(data.reportFiles)
      ? data.reportFiles
      : studentIds.map((studentId) => `${studentId}.json`),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function getAdminTeacherProfile() {
  return {
    email: ADMIN_EMAIL,
    name: "Joseph Clark",
    role: ROLES.ADMIN,
    assignmentGroupId: TEACHER_GROUP_ID,
    studentIds: roster.map((student) => student.id),
    reportFiles: roster.map((student) => `${student.id}.json`),
  };
}

function getVisibleRoster() {
  if (page === "student") return roster;
  if (isAdminAccount()) return roster;
  if (state.teacherProfile?.studentIds?.length) {
    return getStudentsByIds(state.teacherProfile.studentIds);
  }
  return [];
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function integerBetween(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function nonZeroBetween(random, min, max) {
  let value = 0;
  while (value === 0) {
    value = integerBetween(random, min, max);
  }
  return value;
}

function formatTerm(coefficient, variable = "x") {
  if (coefficient === 1) return variable;
  if (coefficient === -1) return `-${variable}`;
  return `${coefficient}${variable}`;
}

function formatLinear(leftCoefficient, constant) {
  const variable = formatTerm(leftCoefficient);
  if (constant === 0) return variable;
  return `${variable} ${constant > 0 ? "+" : "-"} ${Math.abs(constant)}`;
}

function formatVariableTerm(coefficient, variable, isFirstTerm) {
  const absolute = Math.abs(coefficient);
  const term = absolute === 1 ? variable : `${absolute}${variable}`;

  if (isFirstTerm) {
    return coefficient < 0 ? `-${term}` : term;
  }

  return `${coefficient < 0 ? "-" : "+"} ${term}`;
}

function formatSystemEquation(xCoefficient, yCoefficient, right) {
  return `${formatVariableTerm(xCoefficient, "x", true)} ${formatVariableTerm(
    yCoefficient,
    "y",
    false,
  )} = ${right}`;
}

function makeTwoStep(random) {
  const solution = nonZeroBetween(random, -12, 12);
  const coefficient = nonZeroBetween(random, -9, 9);
  const constant = integerBetween(random, -18, 18);
  const right = coefficient * solution + constant;
  return {
    type: "Two-step equation",
    equation: `${formatLinear(coefficient, constant)} = ${right}`,
    answer: solution,
  };
}

function makeVariablesBothSides(random) {
  const solution = nonZeroBetween(random, -10, 10);
  const leftCoefficient = nonZeroBetween(random, -8, 8);
  let rightCoefficient = nonZeroBetween(random, -8, 8);
  while (rightCoefficient === leftCoefficient) {
    rightCoefficient = nonZeroBetween(random, -8, 8);
  }
  const leftConstant = integerBetween(random, -16, 16);
  const rightConstant = (leftCoefficient - rightCoefficient) * solution + leftConstant;
  return {
    type: "Variables on both sides",
    equation: `${formatLinear(leftCoefficient, leftConstant)} = ${formatLinear(
      rightCoefficient,
      rightConstant,
    )}`,
    answer: solution,
  };
}

function makeParentheses(random) {
  const solution = integerBetween(random, -12, 12);
  const coefficient = nonZeroBetween(random, -7, 7);
  const inside = integerBetween(random, -9, 9);
  const insideText = inside === 0 ? "x" : `x ${inside > 0 ? "+" : "-"} ${Math.abs(inside)}`;
  const right = coefficient * (solution + inside);
  return {
    type: "Parentheses",
    equation: `${coefficient}(${insideText}) = ${right}`,
    answer: solution,
  };
}

function makeDistributed(random) {
  const solution = nonZeroBetween(random, -9, 9);
  const coefficient = nonZeroBetween(random, -6, 6);
  const inside = integerBetween(random, -8, 8);
  const outside = integerBetween(random, -14, 14);
  const insideText = inside === 0 ? "x" : `x ${inside > 0 ? "+" : "-"} ${Math.abs(inside)}`;
  const right = coefficient * (solution + inside) + outside;
  return {
    type: "Distributed equation",
    equation: `${coefficient}(${insideText}) ${outside >= 0 ? "+" : "-"} ${Math.abs(
      outside,
    )} = ${right}`,
    answer: solution,
  };
}

function makeFraction(random) {
  const divisor = integerBetween(random, 2, 9);
  const quotient = nonZeroBetween(random, -10, 10);
  const solution = divisor * quotient;
  const constant = integerBetween(random, -12, 12);
  const right = quotient + constant;
  return {
    type: "Fraction equation",
    equation: `x / ${divisor} ${constant >= 0 ? "+" : "-"} ${Math.abs(constant)} = ${right}`,
    answer: solution,
  };
}

function makeLinearProblem(random) {
  const problemTypes = [
    makeTwoStep,
    makeVariablesBothSides,
    makeParentheses,
    makeDistributed,
    makeFraction,
  ];
  const typeIndex = integerBetween(random, 0, problemTypes.length - 1);
  return problemTypes[typeIndex](random);
}

function makeSystemProblem(random) {
  const x = integerBetween(random, -8, 8);
  const y = integerBetween(random, -8, 8);
  let xCoefficientA = nonZeroBetween(random, -6, 6);
  let yCoefficientA = nonZeroBetween(random, -6, 6);
  let xCoefficientB = nonZeroBetween(random, -6, 6);
  let yCoefficientB = nonZeroBetween(random, -6, 6);

  while (xCoefficientA * yCoefficientB - xCoefficientB * yCoefficientA === 0) {
    xCoefficientA = nonZeroBetween(random, -6, 6);
    yCoefficientA = nonZeroBetween(random, -6, 6);
    xCoefficientB = nonZeroBetween(random, -6, 6);
    yCoefficientB = nonZeroBetween(random, -6, 6);
  }

  return {
    type: "System of equations",
    equations: [
      formatSystemEquation(
        xCoefficientA,
        yCoefficientA,
        xCoefficientA * x + yCoefficientA * y,
      ),
      formatSystemEquation(
        xCoefficientB,
        yCoefficientB,
        xCoefficientB * x + yCoefficientB * y,
      ),
    ],
    answer: { x, y },
  };
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function reduceFraction(numerator, denominator) {
  if (denominator === 0) {
    return { numerator: 1, denominator: 0, undefined: true };
  }

  if (numerator === 0) {
    return { numerator: 0, denominator: 1, undefined: false };
  }

  const divisor = greatestCommonDivisor(numerator, denominator);
  let reducedNumerator = numerator / divisor;
  let reducedDenominator = denominator / divisor;

  if (reducedDenominator < 0) {
    reducedNumerator *= -1;
    reducedDenominator *= -1;
  }

  return {
    numerator: reducedNumerator,
    denominator: reducedDenominator,
    undefined: false,
  };
}

function formatFractionValue(fraction) {
  if (!fraction || fraction.undefined) return "undefined";
  if (fraction.denominator === 1) return `${fraction.numerator}`;
  return `${fraction.numerator}/${fraction.denominator}`;
}

function formatSlopeCoefficient(coefficient) {
  const fraction = reduceFraction(coefficient.numerator, coefficient.denominator);
  if (fraction.numerator === 1 && fraction.denominator === 1) return "x";
  if (fraction.numerator === -1 && fraction.denominator === 1) return "-x";
  return `${formatFractionValue(fraction)}x`;
}

function formatSlopeInterceptEquation(slope, intercept) {
  const slopeText = formatSlopeCoefficient(slope);
  if (intercept.numerator === 0) return `y = ${slopeText}`;
  const sign = intercept.numerator > 0 ? "+" : "-";
  return `y = ${slopeText} ${sign} ${formatFractionValue({
    numerator: Math.abs(intercept.numerator),
    denominator: intercept.denominator,
  })}`;
}

function parseFractionInput(value) {
  const rawValue = `${value ?? ""}`.trim();
  if (!rawValue) return null;

  const fractionMatch = rawValue.match(/^([+-]?\d+)\s*(?:\/\s*([+-]?\d+))?$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = fractionMatch[2] === undefined ? 1 : Number(fractionMatch[2]);
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
      return null;
    }
    return reduceFraction(numerator, denominator);
  }

  const decimal = Number(rawValue);
  if (!Number.isFinite(decimal)) return null;

  const decimalPlaces = rawValue.includes(".") ? rawValue.split(".").at(-1).length : 0;
  const denominator = 10 ** decimalPlaces;
  return reduceFraction(Math.round(decimal * denominator), denominator);
}

function fractionsEqual(left, right) {
  if (!left || !right || left.undefined || right.undefined) return false;
  const reducedLeft = reduceFraction(left.numerator, left.denominator);
  const reducedRight = reduceFraction(right.numerator, right.denominator);
  return (
    reducedLeft.numerator === reducedRight.numerator &&
    reducedLeft.denominator === reducedRight.denominator
  );
}

function makeSlopeProblem(random, problemNumber = 1) {
  const isPositive = problemNumber <= 10;
  const isNegative = problemNumber > 10 && problemNumber <= 20;
  const isZero = problemNumber > 20 && problemNumber <= 26;
  const isVertical = problemNumber >= 27;
  const x1 = integerBetween(random, -9, 9);
  const y1 = integerBetween(random, -9, 9);
  let x2 = x1;
  let y2 = y1;

  if (isVertical) {
    while (y2 === y1) {
      y2 = integerBetween(random, -9, 9);
    }
  } else if (isZero) {
    while (x2 === x1) {
      x2 = integerBetween(random, -9, 9);
    }
  } else {
    while (x2 === x1) {
      x2 = integerBetween(random, -9, 9);
    }

    const horizontalChange = x2 - x1;
    const minMagnitude = problemNumber <= 6 ? 1 : 2;
    const maxMagnitude = problemNumber <= 16 ? 7 : 12;
    let verticalChange = nonZeroBetween(random, minMagnitude, maxMagnitude);
    if (isNegative) {
      verticalChange *= -1;
    }
    if (horizontalChange < 0) {
      verticalChange *= -1;
    }
    y2 = y1 + verticalChange;
  }

  const run = x2 - x1;
  const rise = y2 - y1;
  const slope = reduceFraction(rise, run);

  return {
    type: isVertical
      ? "Challenge: vertical line"
      : isZero
        ? "Zero slope"
        : isNegative
          ? "Negative slope"
          : "Positive slope",
    equation: `Find the slope between (${x1}, ${y1}) and (${x2}, ${y2}).`,
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
    answer: slope.undefined ? { kind: "undefined" } : { kind: "number", ...slope },
  };
}

function makeSlopeInterceptProblem(random, problemNumber = 1) {
  const inSlopeInterceptForm = problemNumber <= 20;
  const scaledYForm = problemNumber > 20 && problemNumber <= 26;
  const standardForm = problemNumber >= 27;
  let equation = "";
  let slope = reduceFraction(nonZeroBetween(random, 1, 6), 1);
  let intercept = reduceFraction(integerBetween(random, 1, 9), 1);
  let type = "Slope-intercept form";

  if (inSlopeInterceptForm) {
    if (problemNumber > 10) {
      const makeNegativeSlope = problemNumber % 2 === 1;
      slope = reduceFraction(
        makeNegativeSlope ? -nonZeroBetween(random, 1, 7) : nonZeroBetween(random, 1, 7),
        1,
      );
      intercept = reduceFraction(
        makeNegativeSlope ? integerBetween(random, -9, 9) : -nonZeroBetween(random, 1, 9),
        1,
      );
    }

    equation = formatSlopeInterceptEquation(slope, intercept);
    type = problemNumber > 10 ? "Negative slope or intercept" : "Slope-intercept form";
  } else if (scaledYForm) {
    const yCoefficient = integerBetween(random, 2, 6);
    const xCoefficient = nonZeroBetween(random, -12, 12);
    const constant = integerBetween(random, -18, 18);
    slope = reduceFraction(xCoefficient, yCoefficient);
    intercept = reduceFraction(constant, yCoefficient);
    equation = `${yCoefficient}y = ${formatLinear(xCoefficient, constant)}`;
    type = "Solve for y";
  } else if (standardForm) {
    const xCoefficient = nonZeroBetween(random, -8, 8);
    const yCoefficient = nonZeroBetween(random, 2, 8);
    const constant = integerBetween(random, -24, 24);
    slope = reduceFraction(-xCoefficient, yCoefficient);
    intercept = reduceFraction(constant, yCoefficient);
    equation = `${formatLinear(xCoefficient, 0)} ${yCoefficient > 0 ? "+" : "-"} ${Math.abs(
      yCoefficient,
    )}y = ${constant}`;
    type = "Standard form";
  }

  return {
    type,
    equation,
    answer: {
      m: slope,
      b: intercept,
    },
  };
}

function makeProblem(student, problemNumber, attempt = 0, assignment = getSelectedAssignment()) {
  const seedText = `${assignment.id}:${student.id}:${student.name}:${problemNumber}:${attempt}`;
  const random = mulberry32(hashString(seedText));
  const problem = assignment.generator(random, problemNumber);
  return {
    ...problem,
    answerMode: assignment.answerMode,
    id: `${assignment.id}-${student.id}-${problemNumber}`,
    number: problemNumber,
  };
}

function getProblemSignature(problem) {
  return problem.equations ? problem.equations.join("|") : problem.equation;
}

function generateAssignment(student, assignment = getSelectedAssignment()) {
  const problems = [];
  const seen = new Set();

  for (let problemNumber = 1; problemNumber <= assignment.problemCount; problemNumber += 1) {
    let attempt = 0;
    let problem = makeProblem(student, problemNumber, attempt, assignment);
    while (seen.has(getProblemSignature(problem)) && attempt < 20) {
      attempt += 1;
      problem = makeProblem(student, problemNumber, attempt, assignment);
    }
    seen.add(getProblemSignature(problem));
    problems.push(problem);
  }

  return problems;
}

function getSignedInRosterStudent() {
  if (!state.user?.email) return null;
  return rosterByEmail.get(normalizeEmail(state.user.email)) || null;
}

function isTeacherAccount() {
  return isAdminAccount() || Boolean(state.teacherProfile);
}

function getSignedInRole() {
  if (isAdminAccount()) return ROLES.ADMIN;
  if (isTeacherAccount()) return ROLES.TEACHER;
  if (getSignedInRosterStudent()) return ROLES.STUDENT;
  return "";
}

function submissionRef(student) {
  return doc(db, "assignments", getSelectedAssignment().id, "submissions", student.id);
}

function progressRef(student) {
  return doc(db, "assignments", getSelectedAssignment().id, "progress", student.id);
}

function submissionsCollection() {
  return collection(db, "assignments", getSelectedAssignment().id, "submissions");
}

function progressCollection() {
  return collection(db, "assignments", getSelectedAssignment().id, "progress");
}

function teachersCollection() {
  return collection(db, "teachers");
}

async function loadTeacherProfile() {
  state.teacherProfile = null;

  if (!state.user) return null;

  if (isAdminAccount()) {
    state.teacherProfile = getAdminTeacherProfile();
    return state.teacherProfile;
  }

  try {
    const snapshot = await getDoc(teacherRef());
    state.teacherProfile = snapshot.exists() ? normalizeTeacher(snapshot.data(), state.user.email) : null;
    return state.teacherProfile;
  } catch (error) {
    state.teacherProfile = null;
    throw error;
  }
}

function renderAuth() {
  const signedIn = Boolean(state.user);
  const displayName = state.user?.displayName || "Google account";
  const email = state.user?.email || "Not signed in";

  setText(elements.authName, signedIn ? displayName : "Not signed in");
  setText(elements.authEmail, signedIn ? email : "Google authentication");
  setHidden(elements.signInButton, signedIn);
  setHidden(elements.signOutButton, !signedIn);
  elements.authDot?.classList.toggle("is-signed-in", signedIn);
}

function renderAssignmentOptions() {
  const options = assignments
    .map(
      (assignment) =>
        `<option value="${assignment.id}">${escapeHtml(assignment.title)} (${assignment.problemCount})</option>`,
    )
    .join("");

  if (elements.assignmentSelect) {
    elements.assignmentSelect.innerHTML = options;
    elements.assignmentSelect.value = getSelectedAssignment().id;
  }

  if (elements.dashboardAssignmentSelect) {
    elements.dashboardAssignmentSelect.innerHTML = options;
    elements.dashboardAssignmentSelect.value = getSelectedAssignment().id;
  }
}

function updateAssignmentDisplay() {
  const assignment = getSelectedAssignment();
  setText(elements.assignmentDirections, assignment.directions);
  setText(elements.teacherHeading, assignment.title);
  renderHeaderCounts();
}

function resetStudentWork() {
  state.problems = [];
  state.answers = new Map();
  state.isSubmitted = false;
  syncStudentFields();
  setText(elements.submissionNote, "");
  setSaveState("Not started");
  setDisabled(elements.submitAssignment, true);
  setText(elements.submitAssignment, "Submit Grade");
  renderProblems();
  updateStudentScore();
}

function selectAssignment(assignmentId, options = {}) {
  const previousAssignmentId = getSelectedAssignment().id;
  state.selectedAssignment = getAssignmentById(assignmentId);

  if (elements.assignmentSelect) {
    elements.assignmentSelect.value = state.selectedAssignment.id;
  }
  if (elements.dashboardAssignmentSelect) {
    elements.dashboardAssignmentSelect.value = state.selectedAssignment.id;
  }

  updateAssignmentDisplay();

  if (options.resetStudentWork) {
    resetStudentWork();
  }

  if (page === "teacher" && previousAssignmentId !== state.selectedAssignment.id) {
    state.progress = {};
    state.submissions = {};
    renderDashboard();
    subscribeDashboard();
  }
}

function renderStudentIdentity() {
  const signedInStudent = getSignedInRosterStudent();
  if (signedInStudent) {
    state.selectedStudent = signedInStudent;
  }

  setText(
    elements.studentHeading,
    signedInStudent ? signedInStudent.name : state.user ? "Roster account required" : "Your Assignment",
  );
  syncStudentFields();
}

function syncStudentFields() {
  const assignment = getSelectedAssignment();
  const signedInStudent = getSignedInRosterStudent();
  const emptyTitle = !state.user
    ? "Sign in to see your assignment"
    : signedInStudent
      ? "Load your assignment to begin"
      : "This Google account is not on the student roster";

  setText(
    elements.assignmentTitle,
    state.problems.length
      ? `${state.selectedStudent.name}'s ${assignment.problemCount} ${assignment.title.toLowerCase()} problems`
      : emptyTitle,
  );
}

function renderProblems() {
  if (!elements.problemList) return;

  if (!state.user) {
    elements.problemList.innerHTML = `<div class="empty-state">Sign in with Google to start.</div>`;
    return;
  }

  if (!getSignedInRosterStudent()) {
    elements.problemList.innerHTML = `<div class="empty-state">Use your roster Google account to open your assignment.</div>`;
    return;
  }

  if (!state.problems.length) {
    elements.problemList.innerHTML = `<div class="empty-state">Load the assignment when ready.</div>`;
    return;
  }

  elements.problemList.innerHTML = state.problems
    .map(
      (problem) => `
        <article class="problem-card" data-problem-id="${problem.id}">
          <span class="problem-number">${problem.number}</span>
          <div>
            <div class="problem-type">${escapeHtml(problem.type)}</div>
            <div class="equation">${renderProblemPrompt(problem)}</div>
          </div>
          <div class="answer-row ${getAnswerRowClass(problem)}">
            ${renderAnswerInputs(problem)}
            <span class="feedback" data-feedback="${problem.id}">Not answered</span>
          </div>
        </article>
      `,
    )
    .join("");

  elements.problemList.querySelectorAll("[data-answer-input]").forEach((input) => {
    const savedAnswer = state.answers.get(input.dataset.answerInput);
    const answerKey = input.dataset.answerKey || "x";
    const savedValue =
      savedAnswer && typeof savedAnswer === "object"
        ? savedAnswer[answerKey] || ""
        : savedAnswer || "";
    input.value = input.tagName === "SELECT" && !savedValue ? "number" : savedValue;
    input.disabled = state.isSubmitted;
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", handleAnswerInput);
  });

  state.problems.forEach((problem) => updateProblemFeedback(problem.id));
}

function getAnswerRowClass(problem) {
  if (problem.answerMode === "pair") return "is-pair";
  if (problem.answerMode === "slope") return "is-slope";
  if (problem.answerMode === "slopeIntercept") return "is-slope-intercept";
  return "";
}

function renderProblemPrompt(problem) {
  if (problem.equations) {
    return `<div class="system-equations">${problem.equations
      .map((equation) => `<span>${escapeHtml(equation)}</span>`)
      .join("")}</div>`;
  }

  return escapeHtml(problem.equation);
}

function renderAnswerInputs(problem) {
  if (problem.answerMode === "pair") {
    return `
      <label class="answer-field">
        <span>x</span>
        <input
          type="text"
          inputmode="decimal"
          aria-label="x value for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="x"
          placeholder="x"
        />
      </label>
      <label class="answer-field">
        <span>y</span>
        <input
          type="text"
          inputmode="decimal"
          aria-label="y value for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="y"
          placeholder="y"
        />
      </label>
    `;
  }

  if (problem.answerMode === "slope") {
    return `
      <label class="answer-field slope-kind-field">
        <span>Type</span>
        <select
          aria-label="Slope type for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="kind"
        >
          <option value="number">Number</option>
          <option value="undefined">Undefined</option>
        </select>
      </label>
      <label class="answer-field">
        <span>Num.</span>
        <input
          type="text"
          inputmode="numeric"
          aria-label="Slope numerator for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="numerator"
          placeholder="rise"
        />
      </label>
      <label class="answer-field">
        <span>Den.</span>
        <input
          type="text"
          inputmode="numeric"
          aria-label="Slope denominator for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="denominator"
          placeholder="run"
        />
      </label>
    `;
  }

  if (problem.answerMode === "slopeIntercept") {
    return `
      <label class="answer-field">
        <span>m</span>
        <input
          type="text"
          inputmode="text"
          aria-label="Slope m for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="m"
          placeholder="m"
        />
      </label>
      <label class="answer-field">
        <span>b</span>
        <input
          type="text"
          inputmode="text"
          aria-label="Y-intercept b for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="b"
          placeholder="b"
        />
      </label>
    `;
  }

  return `
    <input
      type="text"
      inputmode="decimal"
      aria-label="Answer for problem ${problem.number}"
      data-answer-input="${problem.id}"
      data-answer-key="x"
      placeholder="${getSelectedAssignment().answerPlaceholder}"
    />
  `;
}

function handleAnswerInput(event) {
  if (state.isSubmitted) return;

  const input = event.currentTarget;
  const problemId = input.dataset.answerInput;
  const answerKey = input.dataset.answerKey || "x";
  const answer = state.answers.get(problemId);
  const nextAnswer = answer && typeof answer === "object" ? { ...answer } : {};
  nextAnswer[answerKey] = input.value.trim();
  state.answers.set(problemId, nextAnswer);
  updateProblemFeedback(problemId);
  updateStudentScore();
  queueProgressSave();
}

function isBlank(value) {
  return value === undefined || value === "";
}

function hasAnswerForProblem(problem, answers = state.answers) {
  const answer = answers.get(problem.id);

  if (problem.answerMode === "pair") {
    const xValue = answer && typeof answer === "object" ? answer.x : "";
    const yValue = answer && typeof answer === "object" ? answer.y : "";
    return !isBlank(xValue) || !isBlank(yValue);
  }

  if (problem.answerMode === "slope") {
    const kind = answer && typeof answer === "object" ? answer.kind : "";
    const numerator = answer && typeof answer === "object" ? answer.numerator : "";
    const denominator = answer && typeof answer === "object" ? answer.denominator : "";
    return kind === "undefined" || !isBlank(numerator) || !isBlank(denominator);
  }

  if (problem.answerMode === "slopeIntercept") {
    const mValue = answer && typeof answer === "object" ? answer.m : "";
    const bValue = answer && typeof answer === "object" ? answer.b : "";
    return !isBlank(mValue) || !isBlank(bValue);
  }

  const rawAnswer = answer && typeof answer === "object" ? answer.x : answer;
  return !isBlank(rawAnswer);
}

function isCloseEnough(actual, expected) {
  return Math.abs(actual - expected) < 0.0001;
}

function getProblemResult(problem, answers = state.answers) {
  const answer = answers.get(problem.id);

  if (problem.answerMode === "pair") {
    const xValue = answer && typeof answer === "object" ? answer.x : "";
    const yValue = answer && typeof answer === "object" ? answer.y : "";
    if (isBlank(xValue) && isBlank(yValue)) {
      return "blank";
    }

    const x = Number(xValue);
    const y = Number(yValue);
    if (isBlank(xValue) || isBlank(yValue) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return "wrong";
    }

    return isCloseEnough(x, problem.answer.x) && isCloseEnough(y, problem.answer.y)
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "slope") {
    const kind = answer && typeof answer === "object" ? answer.kind || "number" : "number";
    const numeratorValue = answer && typeof answer === "object" ? answer.numerator : "";
    const denominatorValue = answer && typeof answer === "object" ? answer.denominator : "";

    if (kind === "undefined") {
      return problem.answer.kind === "undefined" ? "correct" : "wrong";
    }

    if (isBlank(numeratorValue) && isBlank(denominatorValue)) {
      return "blank";
    }

    const numerator = Number(numeratorValue);
    const denominator = Number(denominatorValue);
    if (
      isBlank(numeratorValue) ||
      isBlank(denominatorValue) ||
      !Number.isInteger(numerator) ||
      !Number.isInteger(denominator) ||
      denominator === 0
    ) {
      return "wrong";
    }

    if (problem.answer.kind === "undefined") {
      return "wrong";
    }

    const reduced = reduceFraction(numerator, denominator);
    return reduced.numerator === problem.answer.numerator &&
      reduced.denominator === problem.answer.denominator
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "slopeIntercept") {
    const mValue = answer && typeof answer === "object" ? answer.m : "";
    const bValue = answer && typeof answer === "object" ? answer.b : "";
    if (isBlank(mValue) && isBlank(bValue)) {
      return "blank";
    }

    const mAnswer = parseFractionInput(mValue);
    const bAnswer = parseFractionInput(bValue);
    if (isBlank(mValue) || isBlank(bValue) || !mAnswer || !bAnswer) {
      return "wrong";
    }

    return fractionsEqual(mAnswer, problem.answer.m) && fractionsEqual(bAnswer, problem.answer.b)
      ? "correct"
      : "wrong";
  }

  const rawAnswer = answer && typeof answer === "object" ? answer.x : answer;
  if (isBlank(rawAnswer)) {
    return "blank";
  }

  const numericAnswer = Number(rawAnswer);
  if (!Number.isFinite(numericAnswer)) {
    return "wrong";
  }

  return isCloseEnough(numericAnswer, problem.answer) ? "correct" : "wrong";
}

function updateProblemFeedback(problemId) {
  if (!elements.problemList) return;

  const problem = state.problems.find((item) => item.id === problemId);
  const card = elements.problemList.querySelector(`[data-problem-id="${problemId}"]`);
  const feedback = elements.problemList.querySelector(`[data-feedback="${problemId}"]`);
  if (!problem || !card || !feedback) return;

  const result = getProblemResult(problem);
  const shouldRevealGrade = state.isSubmitted;
  card.classList.toggle("is-correct", shouldRevealGrade && result === "correct");
  card.classList.toggle("is-wrong", shouldRevealGrade && result === "wrong");

  if (!shouldRevealGrade) {
    feedback.textContent = hasAnswerForProblem(problem) ? "Saved" : "Not answered";
    return;
  }

  if (result === "correct") {
    feedback.textContent = "Correct";
  } else if (result === "wrong") {
    feedback.textContent = "Incorrect";
  } else {
    feedback.textContent = "Blank";
  }
}

function calculateScore() {
  const assignment = getSelectedAssignment();
  const answered = state.problems.filter((problem) => hasAnswerForProblem(problem)).length;
  const correct = state.problems.filter((problem) => getProblemResult(problem) === "correct").length;
  return {
    answered,
    correct,
    percent: Math.round((correct / assignment.problemCount) * 100),
  };
}

function updateStudentScore() {
  if (
    !elements.currentScore ||
    !elements.currentPercent ||
    !elements.answeredCount ||
    !elements.correctCount
  ) {
    return;
  }

  const assignment = getSelectedAssignment();
  const score = state.problems.length ? calculateScore() : { answered: 0, correct: 0, percent: 0 };
  elements.currentScore.textContent = state.isSubmitted ? `${score.correct} / ${assignment.problemCount}` : "--";
  elements.currentPercent.textContent = state.isSubmitted ? `${score.percent}%` : "After submit";
  elements.answeredCount.textContent = `${score.answered} answered`;
  elements.correctCount.textContent = state.isSubmitted ? `${score.correct} correct` : "Grade hidden";
}

function answersObject() {
  return Object.fromEntries(state.answers.entries());
}

function localProgressKey(student = state.selectedStudent, assignment = getSelectedAssignment()) {
  return `dragonmath:${assignment.id}:${student.id}:progress`;
}

function buildLocalProgressPayload(score, options = {}) {
  const assignment = getSelectedAssignment();
  const payload = {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    studentId: state.selectedStudent.id,
    studentName: state.selectedStudent.name,
    studentEmail: state.selectedStudent.email,
    answers: answersObject(),
    answered: score.answered,
    total: assignment.problemCount,
    graded: Boolean(options.includeGrade),
    submitted: Boolean(options.includeGrade),
    updatedAtLocal: new Date().toISOString(),
  };

  if (options.includeGrade) {
    payload.correct = score.correct;
    payload.percent = score.percent;
    payload.submittedAtLocal = new Date().toISOString();
  }

  return payload;
}

function saveLocalProgress(options = {}) {
  if (!state.selectedStudent || !state.problems.length) return;

  const score = calculateScore();
  const payload = buildLocalProgressPayload(score, options);
  localStorage.setItem(localProgressKey(), JSON.stringify(payload));
}

function readLocalProgress(student = state.selectedStudent) {
  try {
    const raw = localStorage.getItem(localProgressKey(student));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildProgressPayload(score, options = {}) {
  const assignment = getSelectedAssignment();
  const payload = {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    studentId: state.selectedStudent.id,
    studentName: state.selectedStudent.name,
    studentEmail: state.selectedStudent.email,
    role: getSignedInRole(),
    uid: state.user.uid,
    authEmail: state.user.email || "",
    authName: state.user.displayName || "",
    answers: answersObject(),
    answered: score.answered,
    total: assignment.problemCount,
    graded: Boolean(options.includeGrade),
    updatedAt: serverTimestamp(),
  };

  if (options.includeGrade) {
    payload.correct = score.correct;
    payload.percent = score.percent;
  }

  return payload;
}

function setSaveState(message) {
  setText(elements.saveState, message);
}

function queueProgressSave() {
  if (!state.user || !state.problems.length) return;

  saveLocalProgress();
  window.clearTimeout(state.saveTimer);
  setSaveState("Saving...");
  state.saveTimer = window.setTimeout(saveProgress, PROGRESS_SAVE_DELAY);
}

async function saveProgress() {
  if (!state.user || !state.problems.length || state.isSaving) return;

  state.isSaving = true;
  try {
    const score = calculateScore();
    saveLocalProgress();
    await setDoc(progressRef(state.selectedStudent), buildProgressPayload(score), { merge: true });
    setSaveState(`Saved ${formatShortTime(new Date())}`);
  } catch (error) {
    setSaveState("Save blocked");
    setBanner(elements.studentCloudNote, readableFirebaseError(error), "danger");
  } finally {
    state.isSaving = false;
  }
}

async function loadSelectedStudent() {
  if (!state.user) {
    setBanner(elements.studentCloudNote, "Sign in with Google to load an assignment.", "warning");
    return;
  }

  const selectedStudent = getSignedInRosterStudent();
  if (!selectedStudent) {
    setBanner(
      elements.studentCloudNote,
      "This Google account is not on the student roster. Use the student email assigned to this class.",
      "danger",
    );
    return;
  }

  state.selectedStudent = selectedStudent;
  state.problems = generateAssignment(selectedStudent);
  state.answers = new Map();
  state.isSubmitted = false;

  syncStudentFields();
  renderProblems();
  updateStudentScore();
  setSaveState("Loading cloud work...");
  setDisabled(elements.submitAssignment, true);
  setText(elements.submitAssignment, "Submit Grade");
  setBanner(elements.studentCloudNote, `Loading ${selectedStudent.name}'s assignment.`, "neutral");

  await hydrateStudentWork(selectedStudent);

  setDisabled(elements.submitAssignment, state.isSubmitted);
  setText(elements.submitAssignment, state.isSubmitted ? "Submitted" : "Submit Grade");
  setSaveState(state.isSubmitted ? "Submitted" : "Ready");
  setBanner(
    elements.studentCloudNote,
    state.isSubmitted
      ? `${selectedStudent.name}'s submitted grade is shown below.`
      : `${selectedStudent.name}'s assignment is ready.`,
    "success",
  );
}

async function hydrateStudentWork(student) {
  const localWork = readLocalProgress(student);

  try {
    const [progressSnapshot, submissionSnapshot] = await Promise.all([
      getDoc(progressRef(student)),
      getDoc(submissionRef(student)),
    ]);

    const savedWork = submissionSnapshot.exists()
      ? submissionSnapshot.data()
      : progressSnapshot.exists()
        ? progressSnapshot.data()
        : localWork;

    if (savedWork?.answers && typeof savedWork.answers === "object") {
      state.answers = new Map(Object.entries(savedWork.answers));
      state.isSubmitted = submissionSnapshot.exists() || savedWork.graded === true || savedWork.submitted === true;
      renderProblems();
      updateStudentScore();
      setSaveState(state.isSubmitted ? "Submitted" : savedWork === localWork ? "Restored locally" : "Restored");
    }

    if (submissionSnapshot.exists() || savedWork?.graded === true || savedWork?.submitted === true) {
      const submission = submissionSnapshot.exists() ? submissionSnapshot.data() : savedWork;
      state.isSubmitted = true;
      renderProblems();
      updateStudentScore();
      setText(
        elements.submissionNote,
        `Submitted: ${submission.correct} out of ${submission.total} (${submission.percent}%).`,
      );
    } else {
      setText(elements.submissionNote, "");
    }
  } catch (error) {
    if (localWork?.answers && typeof localWork.answers === "object") {
      state.answers = new Map(Object.entries(localWork.answers));
      state.isSubmitted = localWork.graded === true || localWork.submitted === true;
      renderProblems();
      updateStudentScore();
      setSaveState(state.isSubmitted ? "Submitted locally" : "Restored locally");
      setText(
        elements.submissionNote,
        state.isSubmitted
          ? `Submitted locally: ${localWork.correct} out of ${localWork.total} (${localWork.percent}%).`
          : "",
      );
      setBanner(
        elements.studentCloudNote,
        `${readableFirebaseError(error)} Your work was restored from this device.`,
        "warning",
      );
      return;
    }

    setBanner(elements.studentCloudNote, readableFirebaseError(error), "danger");
    setSaveState("Cloud unavailable");
  }
}

function buildSubmissionReport(score) {
  const assignment = getSelectedAssignment();
  return {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    student: {
      id: state.selectedStudent.id,
      name: state.selectedStudent.name,
      email: state.selectedStudent.email,
    },
    submittedBy: {
      uid: state.user.uid,
      name: state.user.displayName || "",
      email: state.user.email || "",
    },
    score: {
      correct: score.correct,
      total: assignment.problemCount,
      answered: score.answered,
      percent: score.percent,
    },
    problems: state.problems.map((problem) => ({
      number: problem.number,
      type: problem.type,
      equation: problem.equation || problem.equations,
      studentAnswer: state.answers.get(problem.id) || "",
      correctAnswer: problem.answer,
      result: getProblemResult(problem),
    })),
    createdAt: new Date().toISOString(),
  };
}

async function uploadSubmissionReport(report) {
  const reportPath = `assignments/${getSelectedAssignment().id}/submissions/${
    state.selectedStudent.id
  }.json`;
  const fileRef = storageRef(storage, reportPath);
  await uploadString(fileRef, JSON.stringify(report, null, 2), "raw", {
    contentType: "application/json",
  });
  const reportUrl = await getDownloadURL(fileRef);
  return { reportPath, reportUrl };
}

async function submitAssignment() {
  if (!state.user || !state.selectedStudent || !state.problems.length) return;

  window.clearTimeout(state.saveTimer);
  setDisabled(elements.submitAssignment, true);
  setSaveState("Submitting...");

  const score = calculateScore();
  const report = buildSubmissionReport(score);
  let reportInfo = {};
  saveLocalProgress({ includeGrade: true });

  try {
    await saveProgress();
    saveLocalProgress({ includeGrade: true });
    reportInfo = await uploadSubmissionReport(report);
  } catch (error) {
    reportInfo = {
      reportError: readableFirebaseError(error),
    };
  }

  try {
    await setDoc(
      submissionRef(state.selectedStudent),
      {
        ...buildProgressPayload(score, { includeGrade: true }),
        submittedAt: serverTimestamp(),
        reportPath: reportInfo.reportPath || "",
        reportUrl: reportInfo.reportUrl || "",
        reportError: reportInfo.reportError || "",
      },
      { merge: true },
    );

    const assignment = getSelectedAssignment();
    const storageProblem = Boolean(reportInfo.reportError);
    state.isSubmitted = true;
    renderProblems();
    updateStudentScore();
    setSaveState("Submitted");
    setText(elements.submitAssignment, "Submitted");
    setDisabled(elements.submitAssignment, true);
    setBanner(
      elements.studentCloudNote,
      storageProblem
        ? "Grade submitted. The Storage report was blocked by Firebase rules."
        : "Grade submitted to the teacher dashboard.",
      storageProblem ? "warning" : "success",
    );
    setText(
      elements.submissionNote,
      `Submitted: ${score.correct} out of ${assignment.problemCount} (${score.percent}%).`,
    );
  } catch (error) {
    const assignment = getSelectedAssignment();
    state.isSubmitted = true;
    saveLocalProgress({ includeGrade: true });
    renderProblems();
    updateStudentScore();
    setSaveState("Submitted locally");
    setText(elements.submitAssignment, "Submitted");
    setDisabled(elements.submitAssignment, true);
    setBanner(
      elements.studentCloudNote,
      `${readableFirebaseError(error)} Grade is saved on this device until Firebase rules are deployed.`,
      "warning",
    );
    setText(
      elements.submissionNote,
      `Submitted locally: ${score.correct} out of ${assignment.problemCount} (${score.percent}%).`,
    );
  } finally {
    setDisabled(elements.submitAssignment, state.isSubmitted);
  }
}

function normalizeSubmission(data = {}) {
  const hasGrade = data.graded === true || Boolean(data.submittedAt);
  return {
    studentId: data.studentId || "",
    studentName: data.studentName || data.name || "",
    studentEmail: data.studentEmail || "",
    role: data.role || ROLES.STUDENT,
    answers: data.answers && typeof data.answers === "object" ? data.answers : {},
    graded: hasGrade,
    correct: hasGrade ? Number(data.correct || 0) : 0,
    total: Number(data.total || getSelectedAssignment().problemCount),
    percent: hasGrade ? Number(data.percent || 0) : 0,
    answered: Number(data.answered || 0),
    submittedAt: data.submittedAt || null,
    updatedAt: data.updatedAt || null,
    reportUrl: data.reportUrl || "",
    reportPath: data.reportPath || "",
    reportError: data.reportError || "",
  };
}

function formatTimestamp(value) {
  if (!value) return "--";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatShortTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDashboardWork(student) {
  const progress = state.progress[student.id];
  const submission = state.submissions[student.id];

  if (submission) {
    return {
      ...progress,
      ...submission,
      isSubmitted: true,
      workStatus: "Submitted",
    };
  }

  if (progress) {
    return {
      ...progress,
      isSubmitted: false,
      workStatus: "In progress",
    };
  }

  return null;
}

function getWorkStatusClass(work) {
  if (work?.isSubmitted) return "is-submitted";
  if (work) return "is-progress";
  return "";
}

function answersMapFromWork(work) {
  return new Map(Object.entries(work?.answers || {}));
}

function formatAnswerValue(value) {
  if (value && typeof value === "object") {
    if ("m" in value || "b" in value) {
      const mValue =
        value.m && typeof value.m === "object" ? formatFractionValue(value.m) : value.m || "?";
      const bValue =
        value.b && typeof value.b === "object" ? formatFractionValue(value.b) : value.b || "?";
      return `m = ${mValue}, b = ${bValue}`;
    }

    if (value.kind === "undefined") {
      return "Undefined";
    }

    if ("numerator" in value || "denominator" in value) {
      const numerator = value.numerator === undefined || value.numerator === "" ? "?" : value.numerator;
      const denominator =
        value.denominator === undefined || value.denominator === "" ? "?" : value.denominator;
      return `${numerator}/${denominator}`;
    }

    const parts = ["x", "y"]
      .map((key) => (value[key] === undefined || value[key] === "" ? "" : `${key} = ${value[key]}`))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "Blank";
  }

  return value === undefined || value === null || value === "" ? "Blank" : `${value}`;
}

function getResultLabel(result) {
  if (result === "correct") return "Correct";
  if (result === "wrong") return "Needs review";
  if (result === "pending") return "Pending";
  return "Blank";
}

function getResultClass(result) {
  if (result === "correct") return "is-correct";
  if (result === "wrong") return "is-wrong";
  if (result === "pending") return "is-pending";
  return "is-blank";
}

function renderStudentWorkPanel() {
  if (!elements.studentWorkPanel || !elements.studentWorkProblems) return;

  if (!state.user || !isTeacherAccount()) {
    setText(elements.studentWorkTitle, "Teacher access required");
    setText(elements.studentWorkMeta, "Sign in with the teacher account to inspect student work.");
    setHidden(elements.closeWorkPanel, true);
    elements.studentWorkProblems.innerHTML = `<div class="empty-state">Teacher sign-in required.</div>`;
    return;
  }

  const student = getVisibleRoster().find((item) => item.id === state.selectedWorkStudentId);
  if (!student) {
    setText(elements.studentWorkTitle, "Choose a student");
    setText(
      elements.studentWorkMeta,
      "Use View Work in the roster to inspect a student's generated problems and saved answers.",
    );
    setHidden(elements.closeWorkPanel, true);
    elements.studentWorkProblems.innerHTML = `<div class="empty-state">No student selected.</div>`;
    return;
  }

  const assignment = getSelectedAssignment();
  const problems = generateAssignment(student, assignment);
  const work = getDashboardWork(student);
  const answers = answersMapFromWork(work);
  const status = work?.workStatus || "Not started";
  const answered = work?.answered ?? 0;
  const total = work?.total ?? assignment.problemCount;
  const revealGrade = Boolean(work?.isSubmitted);
  const scoreText = revealGrade
    ? `${work.correct}/${total} correct - ${work.percent}%`
    : "grade pending";

  setText(elements.studentWorkTitle, `${student.name}'s Problems`);
  setText(
    elements.studentWorkMeta,
    `${assignment.title} - ${status} - ${answered}/${total} answered - ${scoreText}`,
  );
  setHidden(elements.closeWorkPanel, false);

  elements.studentWorkProblems.innerHTML = problems
    .map((problem) => {
      const result = revealGrade
        ? getProblemResult(problem, answers)
        : hasAnswerForProblem(problem, answers)
          ? "pending"
          : "blank";
      return `
        <article class="review-card ${getResultClass(result)}">
          <div class="review-card-header">
            <span class="problem-number">${problem.number}</span>
            <div>
              <div class="problem-type">${escapeHtml(problem.type)}</div>
              <div class="equation">${renderProblemPrompt(problem)}</div>
            </div>
            <span class="review-status">${getResultLabel(result)}</span>
          </div>
          <div class="review-answer-grid">
            <div>
              <span>Student answer</span>
              <strong>${escapeHtml(formatAnswerValue(answers.get(problem.id)))}</strong>
            </div>
            <div>
              <span>Correct answer</span>
              <strong>${escapeHtml(revealGrade ? formatAnswerValue(problem.answer) : "Available after submit")}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function focusStudentWorkPanel() {
  if (!elements.studentWorkPanel) return;

  elements.studentWorkPanel.classList.remove("is-attention");
  window.requestAnimationFrame(() => {
    elements.studentWorkPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.studentWorkPanel.focus({ preventScroll: true });
    elements.studentWorkPanel.classList.add("is-attention");
    window.setTimeout(() => {
      elements.studentWorkPanel?.classList.remove("is-attention");
    }, 1400);
  });
}

function bindViewWorkButtons() {
  if (!elements.dashboardBody) return;

  elements.dashboardBody.querySelectorAll("[data-view-work]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedWorkStudentId = button.dataset.viewWork;
      const student = getVisibleRoster().find((item) => item.id === state.selectedWorkStudentId);
      renderDashboard({ focusWorkPanel: true });
      if (student) {
        setBanner(elements.teacherNote, `Viewing ${student.name}'s generated problems.`, "success");
      }
    });
  });
}

function renderDashboard(options = {}) {
  if (!elements.dashboardBody) return;

  const canViewWork = Boolean(state.user && isTeacherAccount());
  const visibleRoster = getVisibleRoster();
  const visibleStudentIds = new Set(visibleRoster.map((student) => student.id));
  const rows = visibleRoster.map((student) => {
    const work = getDashboardWork(student);
    const submission = state.submissions[student.id];
    const scoreText = work?.isSubmitted ? `${work.correct} / ${work.total}` : "--";
    const gradeText = work?.isSubmitted ? `${work.percent}%` : "--";
    const reportLink = submission?.reportUrl
      ? `<a class="table-link" href="${escapeHtml(submission.reportUrl)}" target="_blank" rel="noreferrer">Open</a>`
      : submission?.reportError
        ? `<span class="muted-cell">Storage error</span>`
        : "--";

    return `
      <tr class="${state.selectedWorkStudentId === student.id ? "is-selected-work" : ""}">
        <td>
          <strong>${escapeHtml(student.name)}</strong>
          <small>${escapeHtml(student.email)}</small>
        </td>
        <td>${student.id}</td>
        <td>
          <span class="status-pill ${getWorkStatusClass(work)}">
            ${work?.workStatus || "Waiting"}
          </span>
        </td>
        <td>${scoreText}</td>
        <td>${gradeText}</td>
        <td>${work ? `${work.answered} / ${work.total}` : "--"}</td>
        <td>${submission ? formatTimestamp(submission.submittedAt) : "--"}</td>
        <td>
          <button
            class="secondary-button table-button"
            type="button"
            data-view-work="${student.id}"
            ${canViewWork ? "" : "disabled"}
            aria-pressed="${state.selectedWorkStudentId === student.id ? "true" : "false"}"
          >
            View Work
          </button>
        </td>
        <td>${reportLink}</td>
      </tr>
    `;
  });

  elements.dashboardBody.innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="9" class="muted-cell">No students are assigned to this dashboard.</td></tr>`;
  bindViewWorkButtons();
  renderStudentWorkPanel();
  if (options.focusWorkPanel && state.selectedWorkStudentId) {
    focusStudentWorkPanel();
  }

  const submissions = Object.values(state.submissions).filter((submission) =>
    visibleStudentIds.has(submission.studentId),
  );
  const submittedCount = submissions.length;
  const average = submittedCount
    ? Math.round(submissions.reduce((sum, item) => sum + item.percent, 0) / submittedCount)
    : null;
  const highest = submittedCount ? Math.max(...submissions.map((item) => item.percent)) : null;
  const lastTimestamp = submissions
    .map((item) => item.submittedAt)
    .filter(Boolean)
    .sort(compareTimestamps)
    .at(-1);

  setText(elements.submittedCount, `${submittedCount} / ${visibleRoster.length}`);
  setText(elements.classAverage, average === null ? "--" : `${average}%`);
  setText(elements.highestScore, highest === null ? "--" : `${highest}%`);
  setText(elements.lastUpdate, lastTimestamp ? formatTimestamp(lastTimestamp) : "--");
}

function compareTimestamps(a, b) {
  const left = typeof a?.toMillis === "function" ? a.toMillis() : new Date(a).getTime();
  const right = typeof b?.toMillis === "function" ? b.toMillis() : new Date(b).getTime();
  return left - right;
}

function setDashboardControls(enabled) {
  setDisabled(elements.dashboardAssignmentSelect, !enabled);
  setDisabled(elements.refreshDashboard, !enabled);
  setDisabled(elements.exportDashboard, !enabled);
  setDisabled(elements.resetDashboard, !enabled || !isAdminAccount());
}

function clearDashboardSubscriptions() {
  state.dashboardUnsubscribes.forEach((unsubscribe) => unsubscribe());
  state.dashboardUnsubscribes = [];
}

function setDashboardDocState(kind, studentId, snapshot) {
  const target = kind === "submission" ? state.submissions : state.progress;
  if (snapshot.exists()) {
    target[studentId] = normalizeSubmission(snapshot.data());
  } else {
    delete target[studentId];
  }
  renderDashboard();
}

function subscribeAssignedDashboardDocs() {
  getVisibleRoster().forEach((student) => {
    state.dashboardUnsubscribes.push(
      onSnapshot(
        submissionRef(student),
        (snapshot) => setDashboardDocState("submission", student.id, snapshot),
        (error) => {
          setDashboardControls(false);
          setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
        },
      ),
    );

    state.dashboardUnsubscribes.push(
      onSnapshot(
        progressRef(student),
        (snapshot) => setDashboardDocState("progress", student.id, snapshot),
        (error) => {
          setDashboardControls(false);
          setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
        },
      ),
    );
  });
}

function subscribeDashboardCollections() {
  state.dashboardUnsubscribes.push(
    onSnapshot(
      submissionsCollection(),
      (snapshot) => {
        const submissions = {};
        snapshot.forEach((submissionDoc) => {
          submissions[submissionDoc.id] = normalizeSubmission(submissionDoc.data());
        });
        state.submissions = submissions;
        renderDashboard();
      },
      (error) => {
        setDashboardControls(false);
        setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
      },
    ),
  );

  state.dashboardUnsubscribes.push(
    onSnapshot(
      progressCollection(),
      (snapshot) => {
        const progress = {};
        snapshot.forEach((progressDoc) => {
          progress[progressDoc.id] = normalizeSubmission(progressDoc.data());
        });
        state.progress = progress;
        renderDashboard();
      },
      (error) => {
        setDashboardControls(false);
        setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
      },
    ),
  );
}

function subscribeDashboard() {
  if (!elements.dashboardBody) return;

  clearDashboardSubscriptions();

  if (!state.user) {
    state.progress = {};
    state.submissions = {};
    state.teacherProfile = null;
    state.selectedWorkStudentId = "";
    renderHeaderCounts();
    renderDashboard();
    setDashboardControls(false);
    setBanner(elements.teacherNote, "Sign in with Google to view live grades.", "warning");
    return;
  }

  if (!isTeacherAccount()) {
    state.progress = {};
    state.submissions = {};
    state.selectedWorkStudentId = "";
    renderHeaderCounts();
    renderDashboard();
    setDashboardControls(false);
    setBanner(
      elements.teacherNote,
      "This dashboard is only available to assigned teachers.",
      "danger",
    );
    return;
  }

  setDashboardControls(true);
  state.progress = {};
  state.submissions = {};
  renderHeaderCounts();
  renderDashboard();
  setBanner(
    elements.teacherNote,
    isAdminAccount()
      ? "Connected as admin. You can see every rostered student."
      : `Connected as ${state.teacherProfile.name}. Showing assigned students.`,
    "success",
  );

  if (isAdminAccount()) {
    subscribeDashboardCollections();
  } else {
    subscribeAssignedDashboardDocs();
  }
}

async function refreshDashboard() {
  if (!state.user || !isTeacherAccount()) return;

  try {
    const submissions = {};
    const progress = {};

    if (isAdminAccount()) {
      const [snapshot, progressSnapshot] = await Promise.all([
        getDocs(submissionsCollection()),
        getDocs(progressCollection()),
      ]);
      snapshot.forEach((submissionDoc) => {
        submissions[submissionDoc.id] = normalizeSubmission(submissionDoc.data());
      });
      progressSnapshot.forEach((progressDoc) => {
        progress[progressDoc.id] = normalizeSubmission(progressDoc.data());
      });
    } else {
      await Promise.all(
        getVisibleRoster().flatMap((student) => [
          getDoc(submissionRef(student)).then((snapshot) => {
            if (snapshot.exists()) submissions[student.id] = normalizeSubmission(snapshot.data());
          }),
          getDoc(progressRef(student)).then((snapshot) => {
            if (snapshot.exists()) progress[student.id] = normalizeSubmission(snapshot.data());
          }),
        ]),
      );
    }

    state.progress = progress;
    state.submissions = submissions;
    renderDashboard();
    setBanner(elements.teacherNote, "Dashboard refreshed from Firebase.", "success");
  } catch (error) {
    setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
  }
}

async function resetDashboard() {
  if (!state.user || !isAdminAccount()) return;

  const confirmed = window.confirm("Clear every saved grade and in-progress answer for this assignment?");
  if (!confirmed) return;

  setDashboardControls(false);
  try {
    const [snapshot, progressSnapshot] = await Promise.all([
      getDocs(submissionsCollection()),
      getDocs(progressCollection()),
    ]);
    await Promise.all(
      [
        ...snapshot.docs.map(async (submissionDoc) => {
          const submission = normalizeSubmission(submissionDoc.data());
          await deleteDoc(submissionDoc.ref);
          if (submission.reportPath) {
            await deleteObject(storageRef(storage, submission.reportPath)).catch(() => {});
          }
        }),
        ...progressSnapshot.docs.map((progressDoc) => deleteDoc(progressDoc.ref)),
      ],
    );
    state.progress = {};
    state.submissions = {};
    renderDashboard();
    setBanner(elements.teacherNote, "All saved work was cleared.", "success");
  } catch (error) {
    setBanner(elements.teacherNote, readableFirebaseError(error), "danger");
  } finally {
    setDashboardControls(true);
  }
}

function exportDashboard() {
  const headers = [
    "Student",
    "Email",
    "ID",
    "Status",
    "Score",
    "Grade",
    "Answered",
    "Submitted",
    "Report URL",
  ];
  const rows = getVisibleRoster().map((student) => {
    const work = getDashboardWork(student);
    const submission = state.submissions[student.id];
    return [
      student.name,
      student.email,
      student.id,
      work?.workStatus || "Waiting",
      work?.isSubmitted ? `${work.correct}/${work.total}` : "",
      work?.isSubmitted ? `${work.percent}%` : "",
      work ? `${work.answered}/${work.total}` : "",
      submission ? formatTimestamp(submission.submittedAt) : "",
      submission?.reportUrl || "",
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${`${cell}`.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dragonmath-linear-equations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderTeacherStudentOptions(selectedStudentIds = []) {
  if (!elements.teacherStudentList) return;

  const selected = new Set(selectedStudentIds);
  elements.teacherStudentList.innerHTML = roster
    .map(
      (student) => `
        <label class="student-check">
          <input
            type="checkbox"
            value="${student.id}"
            ${selected.has(student.id) ? "checked" : ""}
          />
          <span>
            <strong>${escapeHtml(student.name)}</strong>
            <small>${escapeHtml(student.email)}</small>
          </span>
        </label>
      `,
    )
    .join("");
}

function selectedAdminStudentIds() {
  if (!elements.teacherStudentList) return [];
  return [...elements.teacherStudentList.querySelectorAll('input[type="checkbox"]:checked')].map(
    (input) => input.value,
  );
}

function clearTeacherForm() {
  state.editingTeacherEmail = "";
  if (elements.teacherNameInput) elements.teacherNameInput.value = "";
  if (elements.teacherEmailInput) {
    elements.teacherEmailInput.value = "";
    elements.teacherEmailInput.disabled = false;
  }
  renderTeacherStudentOptions();
  setText(elements.saveTeacherButton, "Save Teacher");
}

function editTeacher(email) {
  const teacher = state.teachers[normalizeEmail(email)];
  if (!teacher) return;

  state.editingTeacherEmail = teacher.email;
  if (elements.teacherNameInput) elements.teacherNameInput.value = teacher.name;
  if (elements.teacherEmailInput) {
    elements.teacherEmailInput.value = teacher.email;
    elements.teacherEmailInput.disabled = true;
  }
  renderTeacherStudentOptions(teacher.studentIds);
  setText(elements.saveTeacherButton, "Update Teacher");
  setBanner(elements.adminNote, `Editing ${teacher.name}.`, "neutral");
}

function setAdminControls(enabled) {
  setDisabled(elements.teacherNameInput, !enabled);
  setDisabled(elements.teacherEmailInput, !enabled || Boolean(state.editingTeacherEmail));
  setDisabled(elements.saveTeacherButton, !enabled);
  setDisabled(elements.clearTeacherButton, !enabled);
  elements.teacherStudentList
    ?.querySelectorAll("input")
    .forEach((input) => {
      input.disabled = !enabled;
    });
}

async function saveTeacher() {
  if (!isAdminAccount()) return;

  const name = elements.teacherNameInput?.value.trim() || "";
  const email = normalizeEmail(elements.teacherEmailInput?.value || state.editingTeacherEmail);
  const studentIds = selectedAdminStudentIds();

  if (!name || !email) {
    setBanner(elements.adminNote, "Enter a teacher name and email.", "warning");
    return;
  }

  if (!studentIds.length) {
    setBanner(elements.adminNote, "Assign at least one student to this teacher.", "warning");
    return;
  }

  const payload = {
    name,
    email,
    role: ROLES.TEACHER,
    assignmentGroupId: TEACHER_GROUP_ID,
    studentIds,
    reportFiles: studentIds.map((studentId) => `${studentId}.json`),
    updatedAt: serverTimestamp(),
  };

  if (!state.editingTeacherEmail) {
    payload.createdAt = serverTimestamp();
  }

  setAdminControls(false);
  try {
    await Promise.all([
      setDoc(teacherRef(email), payload, { merge: true }),
      setDoc(
        roleRef(email),
        {
          email,
          role: ROLES.TEACHER,
          assignmentGroupId: TEACHER_GROUP_ID,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
    setBanner(elements.adminNote, `${name} saved with ${studentIds.length} assigned students.`, "success");
    clearTeacherForm();
  } catch (error) {
    setBanner(elements.adminNote, readableFirebaseError(error), "danger");
  } finally {
    setAdminControls(true);
  }
}

async function deleteTeacher(email) {
  if (!isAdminAccount()) return;

  const teacher = state.teachers[normalizeEmail(email)];
  if (!teacher) return;

  const confirmed = window.confirm(`Remove ${teacher.name} as a DragonMath teacher?`);
  if (!confirmed) return;

  try {
    await Promise.all([deleteDoc(teacherRef(teacher.email)), deleteDoc(roleRef(teacher.email))]);
    if (state.editingTeacherEmail === teacher.email) {
      clearTeacherForm();
    }
    setBanner(elements.adminNote, `${teacher.name} was removed.`, "success");
  } catch (error) {
    setBanner(elements.adminNote, readableFirebaseError(error), "danger");
  }
}

function renderTeacherList() {
  if (!elements.teacherList) return;

  const teachers = Object.values(state.teachers).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  setText(elements.adminTeacherCount, teachers.length);

  if (!teachers.length) {
    elements.teacherList.innerHTML = `<div class="empty-state">No teachers have been created yet.</div>`;
    return;
  }

  elements.teacherList.innerHTML = teachers
    .map((teacher) => {
      const assignedStudents = getStudentsByIds(teacher.studentIds);
      return `
        <article class="teacher-card">
          <div>
            <p class="eyebrow">${escapeHtml(teacher.assignmentGroupId)}</p>
            <h3>${escapeHtml(teacher.name)}</h3>
            <p>${escapeHtml(teacher.email)}</p>
          </div>
          <div class="teacher-card-meta">
            <span>${assignedStudents.length} students</span>
            <span>${assignments.length} assignments</span>
          </div>
          <p class="teacher-student-summary">
            ${escapeHtml(assignedStudents.map((student) => student.name).join(", ") || "No students assigned")}
          </p>
          <div class="teacher-card-actions">
            <button class="secondary-button table-button" type="button" data-edit-teacher="${escapeHtml(
              teacher.email,
            )}">Edit</button>
            <button class="danger-button table-button" type="button" data-delete-teacher="${escapeHtml(
              teacher.email,
            )}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.teacherList.querySelectorAll("[data-edit-teacher]").forEach((button) => {
    button.addEventListener("click", () => editTeacher(button.dataset.editTeacher));
  });
  elements.teacherList.querySelectorAll("[data-delete-teacher]").forEach((button) => {
    button.addEventListener("click", () => deleteTeacher(button.dataset.deleteTeacher));
  });
}

function subscribeAdmin() {
  if (!elements.teacherList) return;

  if (state.adminUnsubscribe) {
    state.adminUnsubscribe();
    state.adminUnsubscribe = null;
  }

  if (!state.user) {
    state.teachers = {};
    renderTeacherList();
    setAdminControls(false);
    setBanner(elements.adminNote, "Sign in with the admin Google account.", "warning");
    return;
  }

  if (!isAdminAccount()) {
    state.teachers = {};
    renderTeacherList();
    setAdminControls(false);
    setBanner(elements.adminNote, "Only joseph.clark@doralacademynv.org can use this admin page.", "danger");
    return;
  }

  renderTeacherStudentOptions();
  setAdminControls(true);
  setBanner(elements.adminNote, "Admin connected. Create teachers and assign students here.", "success");

  state.adminUnsubscribe = onSnapshot(
    teachersCollection(),
    (snapshot) => {
      const teachers = {};
      snapshot.forEach((teacherDoc) => {
        const teacher = normalizeTeacher(teacherDoc.data(), teacherDoc.id);
        teachers[teacher.email] = teacher;
      });
      state.teachers = teachers;
      renderTeacherList();
    },
    (error) => {
      setAdminControls(false);
      setBanner(elements.adminNote, readableFirebaseError(error), "danger");
    },
  );
}

function handleStudentAuthState() {
  const signedInStudent = getSignedInRosterStudent();
  const previousStudentId = state.selectedStudent?.id;

  if (signedInStudent) {
    state.selectedStudent = signedInStudent;
    if (previousStudentId && previousStudentId !== signedInStudent.id) {
      state.problems = [];
      state.answers = new Map();
      state.isSubmitted = false;
      setText(elements.submissionNote, "");
      setSaveState("Not started");
    }
  } else if (state.user) {
    state.problems = [];
    state.answers = new Map();
    state.isSubmitted = false;
    setText(elements.submissionNote, "");
    setSaveState("Not started");
  }

  renderStudentIdentity();
  setDisabled(elements.assignmentSelect, !signedInStudent);
  setDisabled(elements.loadAssignment, !signedInStudent);
  setDisabled(elements.submitAssignment, !signedInStudent || !state.problems.length);

  if (!state.user) {
    state.problems = [];
    state.answers = new Map();
    state.isSubmitted = false;
    renderProblems();
    updateStudentScore();
    setSaveState("Not started");
    setText(elements.submissionNote, "");
    setBanner(elements.studentCloudNote, "Sign in with Google to begin.", "warning");
    return;
  }

  if (signedInStudent) {
    setBanner(
      elements.studentCloudNote,
      `Signed in as ${signedInStudent.name}.`,
      "success",
    );
  } else {
    setBanner(
      elements.studentCloudNote,
      "This Google account is not on the student roster. Use the student email assigned to this class.",
      "danger",
    );
  }

  renderProblems();
  updateStudentScore();
}

function readableFirebaseError(error) {
  const code = error?.code || "";
  if (code.includes("unauthorized-domain")) {
    return "Firebase Auth blocked this domain. Add mrclarkj83.github.io in Firebase Authentication authorized domains.";
  }
  if (code.includes("permission-denied")) {
    return "Firebase denied this action. Check Firestore and Storage rules for signed-in users.";
  }
  if (code.includes("popup-closed")) {
    return "Google sign-in was closed before it finished.";
  }
  if (code.includes("network-request-failed") || code.includes("unavailable")) {
    return "Firebase is temporarily unavailable. Check the connection and try again.";
  }
  return error?.message || "Firebase could not finish the request.";
}

async function signIn() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const target =
      page === "teacher"
        ? elements.teacherNote
        : page === "admin"
          ? elements.adminNote
          : elements.studentCloudNote;
    setBanner(target, readableFirebaseError(error), "danger");
  }
}

async function signOutCurrentUser() {
  await signOut(auth);
}

function bindEvents() {
  elements.signInButton?.addEventListener("click", signIn);
  elements.signOutButton?.addEventListener("click", signOutCurrentUser);

  elements.assignmentSelect?.addEventListener("change", () => {
    selectAssignment(elements.assignmentSelect.value, { resetStudentWork: true });
  });

  elements.dashboardAssignmentSelect?.addEventListener("change", () => {
    selectAssignment(elements.dashboardAssignmentSelect.value);
  });

  elements.loadAssignment?.addEventListener("click", loadSelectedStudent);
  elements.submitAssignment?.addEventListener("click", submitAssignment);
  elements.refreshDashboard?.addEventListener("click", refreshDashboard);
  elements.resetDashboard?.addEventListener("click", resetDashboard);
  elements.exportDashboard?.addEventListener("click", exportDashboard);
  elements.closeWorkPanel?.addEventListener("click", () => {
    state.selectedWorkStudentId = "";
    renderDashboard();
  });
  elements.saveTeacherButton?.addEventListener("click", saveTeacher);
  elements.clearTeacherButton?.addEventListener("click", clearTeacherForm);
}

function initAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    state.authReady = true;
    renderAuth();

    if (page === "teacher" || page === "admin") {
      try {
        await loadTeacherProfile();
      } catch (error) {
        const target = page === "admin" ? elements.adminNote : elements.teacherNote;
        setBanner(target, readableFirebaseError(error), "danger");
      }
    }

    if (page === "student") {
      handleStudentAuthState();
    }

    if (page === "teacher") {
      subscribeDashboard();
    }

    if (page === "admin") {
      subscribeAdmin();
    }
  });
}

function init() {
  renderAssignmentOptions();
  renderHeaderCounts();
  updateAssignmentDisplay();
  renderAuth();
  renderStudentIdentity();
  renderTeacherStudentOptions();
  renderProblems();
  updateStudentScore();
  renderDashboard();
  renderTeacherList();
  bindEvents();
  initAuthListener();
}

init();
