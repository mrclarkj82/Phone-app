import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, firebaseConfigured } from "./src/lib/firebase";

const LINEAR_ASSIGNMENT_ID = "linear-equations-doral-v1";
const STORAGE_KEY = "freshman-algebra-linear-dashboard-doral-v3";
const LEGACY_STORAGE_KEYS = [
  "freshman-algebra-linear-dashboard-doral-v2",
  "freshman-algebra-linear-dashboard-doral-v1",
];
const ANSWER_TOLERANCE = 0.0001;
const ACCESS_HASH_SALT = "freshman-algebra-doral-id-v1";
const DASHBOARD_REFRESH_INTERVAL_MS = 3000;

const assignments = [
  {
    id: LINEAR_ASSIGNMENT_ID,
    title: "Linear Equations",
    assignmentUnit: "linear-equations",
    assignmentUnitLabel: "Linear Equations",
    directions: "Solve for x",
    problemCount: 30,
    answerMode: "single",
    answerPlaceholder: "x =",
    generator: makeLinearProblem,
  },
  {
    id: "systems-equations-doral-v1",
    title: "Systems of Equations",
    assignmentUnit: "systems-equations-inequalities",
    assignmentUnitLabel: "Systems of Equations and Inequalities",
    directions: "Solve for x and y",
    problemCount: 15,
    answerMode: "pair",
    answerPlaceholder: "value",
    generator: makeSystemProblem,
  },
  {
    id: "slope-two-points-v1",
    title: "Slope from Two Points",
    assignmentUnit: "intro-functions",
    assignmentUnitLabel: "Introduction to Functions",
    directions: "Find the slope between the two points",
    problemCount: 30,
    answerMode: "slope",
    answerPlaceholder: "slope",
    generator: makeSlopeProblem,
  },
  {
    id: "slope-intercept-form-v1",
    title: "Slope-Intercept Form",
    assignmentUnit: "linear-equations",
    assignmentUnitLabel: "Linear Equations",
    directions: "Identify the slope m and y-intercept b",
    problemCount: 30,
    answerMode: "slopeIntercept",
    answerPlaceholder: "value",
    generator: makeSlopeInterceptProblem,
  },
  {
    id: "linear-inequalities-html-v1",
    title: "Linear Inequalities",
    assignmentUnit: "linear-inequalities",
    assignmentUnitLabel: "Linear Inequalities",
    directions: "Solve each inequality for x",
    problemCount: 30,
    answerMode: "inequality",
    answerPlaceholder: "boundary",
    generator: makeLinearInequalityProblem,
  },
  {
    id: "coordinate-grid-lines-v1",
    title: "Coordinate Grid Lines",
    assignmentUnit: "intro-functions",
    assignmentUnitLabel: "Introduction to Functions",
    directions: "Use the graph to answer each question",
    problemCount: 30,
    answerMode: "graphLine",
    answerPlaceholder: "value",
    generator: makeCoordinateGridLineProblem,
  },
];

const CUSTOM_ASSIGNMENT_UNITS = [
  {
    id: "intro-expressions",
    label: "Intro to Expressions",
  },
  {
    id: "exponents-radicals",
    label: "Exponents and Radicals",
  },
  {
    id: "polynomials",
    label: "Polynomials",
  },
  {
    id: "linear-equations",
    label: "Linear Equations",
  },
  {
    id: "linear-inequalities",
    label: "Linear Inequalities",
  },
  {
    id: "systems-equations-inequalities",
    label: "Systems of Equations and Inequalities",
  },
  {
    id: "intro-functions",
    label: "Introduction to Functions",
  },
  {
    id: "quadratic-equations",
    label: "Quadratic Equations",
  },
];

const CUSTOM_ASSIGNMENT_TYPES = [
  {
    id: "parts-of-an-expression",
    label: "Parts of an Expression",
    unitId: "intro-expressions",
    generator: makePartsOfExpressionProblem,
    answerMode: "expressionParts",
    directions: "Identify terms, coefficients, variables, constants, and other parts of expressions",
  },
  {
    id: "combining-like-terms",
    label: "Combining Like Terms",
    unitId: "intro-expressions",
    generator: makeCombiningLikeTermsProblem,
    answerMode: "combineLikeTerms",
    directions: "Simplify each expression by combining like terms",
  },
  {
    id: "simplify-and-evaluate-expressions",
    label: "Simplify and Evaluate Expressions",
    unitId: "intro-expressions",
    generator: makeSimplifyAndEvaluateExpressionProblem,
    answerMode: "evaluateExpression",
    directions: "Simplify each expression, then evaluate using the given variable values",
  },
  {
    id: "equivalent-expressions",
    label: "Equivalent Expressions",
    unitId: "intro-expressions",
    generator: makeEquivalentExpressionsProblem,
    answerMode: "combineLikeTerms",
    directions: "Write an equivalent expression by using the distributive property and combining like terms",
  },
  {
    id: "complex-fractions",
    label: "Complex Fractions",
    unitId: "intro-expressions",
    generator: makeComplexFractionsProblem,
    answerMode: "fractionValue",
    directions: "Simplify each complex fraction",
  },
  {
    id: "exponent-laws-notation",
    label: "Exponent Laws and Notation",
    unitId: "exponents-radicals",
    generator: makeExponentLawsNotationProblem,
    answerMode: "textValue",
    directions: "Simplify expressions using exponent laws and notation",
  },
  {
    id: "simplify-roots",
    label: "Simplify Roots",
    unitId: "exponents-radicals",
    generator: makeSimplifyRootsProblem,
    answerMode: "textValue",
    directions: "Simplify square roots and cube roots",
  },
  {
    id: "radical-laws-notation",
    label: "Radical Laws and Notation",
    unitId: "exponents-radicals",
    generator: makeRadicalLawsNotationProblem,
    answerMode: "textValue",
    directions: "Use radical laws and notation to simplify expressions",
  },
  {
    id: "rational-exponents",
    label: "Rational Exponents",
    unitId: "exponents-radicals",
    generator: makeRationalExponentsProblem,
    answerMode: "textValue",
    directions: "Evaluate and rewrite expressions with rational exponents",
  },
  {
    id: "rationalize-denominators",
    label: "Rationalize Denominators",
    unitId: "exponents-radicals",
    generator: makeRationalizeDenominatorsProblem,
    answerMode: "textValue",
    directions: "Rewrite expressions so no radical remains in the denominator",
  },
  {
    id: "polynomial-operations",
    label: "Polynomial Operations",
    unitId: "polynomials",
    generator: makePolynomialOperationsProblem,
    answerMode: "polynomialExpression",
    directions: "Add, subtract, and multiply polynomials",
  },
  {
    id: "factor-polynomials",
    label: "Factor Polynomials",
    unitId: "polynomials",
    generator: makeFactorPolynomialsProblem,
    answerMode: "textValue",
    directions: "Factor each polynomial completely",
  },
  {
    id: "linear-equations",
    label: "Linear Equations",
    unitId: "linear-equations",
    generator: makeLinearProblem,
    answerMode: "single",
    directions: "Solve for x",
  },
  {
    id: "formulas",
    label: "Formulas",
    unitId: "linear-equations",
    generator: makeFormulasProblem,
    answerMode: "textValue",
    directions: "Use formulas to find missing values",
  },
  {
    id: "systems-equations",
    label: "Systems of Equations",
    unitId: "systems-equations-inequalities",
    generator: makeSystemProblem,
    answerMode: "pair",
    directions: "Solve for x and y",
  },
  {
    id: "algebraic-functions",
    label: "Algebraic Functions",
    unitId: "intro-functions",
    generator: makeAlgebraicFunctionProblem,
    answerMode: "functionValue",
    directions: "Evaluate algebraic functions and use function notation",
  },
  {
    id: "slope-two-points",
    label: "Slope from Two Points",
    unitId: "intro-functions",
    generator: makeSlopeProblem,
    answerMode: "slope",
    directions: "Find the slope between the two points",
  },
  {
    id: "graphing-linear-equations",
    label: "Graphing Linear Equations",
    unitId: "intro-functions",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Use the graph to answer each question",
  },
  {
    id: "writing-equations-from-graphs",
    label: "Writing Equations from Graphs",
    unitId: "intro-functions",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Write equations from graphs",
  },
  {
    id: "multi-step-equations",
    label: "Solving Multi-Step Equations",
    unitId: "linear-equations",
    generator: makeLinearProblem,
    answerMode: "single",
    directions: "Solve each multi-step equation",
  },
  {
    id: "inequalities",
    label: "Inequalities",
    unitId: "linear-inequalities",
    generator: makeLinearInequalityProblem,
    answerMode: "inequality",
    directions: "Solve each inequality for x",
  },
  {
    id: "coordinate-grid-problems",
    label: "Coordinate Grid Problems",
    unitId: "intro-functions",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Use the coordinate grid to answer",
  },
  {
    id: "quadratic-functions-graphing",
    label: "Quadratic Functions with Graphing",
    unitId: "quadratic-equations",
    generator: makeQuadraticGraphProblem,
    answerMode: "graphQuadratic",
    directions: "Use the graph to answer each quadratic function question",
  },
];

export const roster = [
  {
    key: "akers-lillian",
    name: "Lillian Akers",
    accessHash: "dcf4289b3363df6ddfbc2e17d440a6542c0a1cf5a6a2cf783250e8683244d70c",
  },
  {
    key: "canda-rayden",
    name: "Rayden Canda",
    accessHash: "6c77a26797d9cf2c35b3c8cd0656a207e403ad7f485e63be3818e3846b756ecc",
  },
  {
    key: "davis-austin",
    name: "Austin Davis",
    accessHash: "56c064ffa17e9135caafb8cfa8b30471db7448eddfe420598ed7a93d50e7ed85",
  },
  {
    key: "hearne-joshua",
    name: "Joshua Hearne",
    accessHash: "bca251d043f8f4f9b5ed4306a72d1a04fbe26a22a532343ece6c3afd8697d373",
  },
  {
    key: "ishola-zaim",
    name: "Zaim Ishola",
    accessHash: "33903a8a2dd9001452791961615dae052df0f9c29a42114435126a5ec7930b57",
  },
  {
    key: "jezbera-madyson",
    name: "Madyson Jezbera",
    accessHash: "a4492b8a0949fb6bd800fbd9069165ff2855f9ff34e8a9d23c894a475b837caf",
  },
  {
    key: "kassaya-naol",
    name: "Naol Kassaya",
    accessHash: "ad3ddf18829e56f70f45ebd7b6a00e59798001387169b405235f16e85e301bb6",
  },
  {
    key: "lopez-camila",
    name: "Camila Lopez",
    accessHash: "a7d610db14a238d65541c85bc1acc18bcb91bec6fab3dc0bf531400fdd2b1c79",
  },
  {
    key: "mkhitaryan-tony",
    name: "Tony Mkhitaryan",
    accessHash: "13b2acb575b192664537c961f75d1e3da2b68ec2a0fd850fb1e14a6b4b8e465a",
  },
  {
    key: "moates-brilynn",
    name: "Brilynn Moates",
    accessHash: "a286f5251b9c061a01a38912b43c02c4674be985b7da2adb6ce29059f85dcd1c",
  },
  {
    key: "moore-raevyn",
    name: "Raevyn Moore",
    accessHash: "76cc5e66cbee03b3e5abd3b6bd69ef32dcb589e429e5704f00912e671367dd74",
  },
  {
    key: "mosley-melia",
    name: "Melia Mosley",
    accessHash: "c79e9e11ece3672fb8fb06157061ec5997321aa7ccdbad4fecc672f95b66efd0",
  },
  {
    key: "nguyen-emme",
    name: "Emme Nguyen",
    accessHash: "7bfdf23602cd2fa847eb8cae265051934c6c9b5514b12c4a04110ce710af000c",
  },
  {
    key: "novo-gabriella",
    name: "Gabriella Novo",
    accessHash: "70633a433e1c20417daef946bdfaf5a1b052a99f67f1f29f93ec8f95ca8c4287",
  },
  {
    key: "osborn-madison",
    name: "Madison Osborn (Maddie)",
    accessHash: "10eb5155bb3aad6c949de9ce64e23f73924bad7963346b6629f77911e577dd57",
  },
  {
    key: "peraza-mason",
    name: "Mason Peraza",
    accessHash: "a7ec436cefe0c7d8341d0ce352edde803db124bca422381903159ec13039f1fb",
  },
  {
    key: "peterson-presley",
    name: "Presley Peterson",
    accessHash: "00d8fa15ea5cfcffbe0ff17ab786487c556ce716d8e5dba70b588c1b9c5afd01",
  },
  {
    key: "pitura-julian",
    name: "Julian Pitura (Jude)",
    accessHash: "855b350d4fc90dd9edbeeb0751ede166da9ad994776ec4dcbc7d01ba5dad8a26",
  },
  {
    key: "rosas-elijan",
    name: "Elijan Rosas",
    accessHash: "36cb3ac06d17bcd8221a3f87558c26caeb0432ea7e6910d8b69ad62fa2915533",
  },
  {
    key: "solbes-amaya",
    name: "Amaya Solbes",
    accessHash: "1aa46dcb795f6b6ca193bf8e4b1f40205170d97cdd479de870e198a69db593c0",
  },
  {
    key: "stoev-antony",
    name: "Antony Stoev (Tony)",
    accessHash: "903dda2c16a3d58e51633eaa44fc71c532734d90701157405d21e7d4400ce903",
  },
  {
    key: "terry-elias",
    name: "Elias Terry (Eli)",
    accessHash: "61fdbaeb4e5ce523a68a16a9dfdbfb10fc328d471b961854c3f0c55d1249133d",
  },
  {
    key: "tomlinson-zoe",
    name: "Zoe Tomlinson",
    accessHash: "1d80d56123fe854e91a5570f87ee82ae5d613cfd46e844faaa4707f2820ef8b7",
  },
  {
    key: "vickers-capri",
    name: "Capri Vickers",
    accessHash: "c23a9fe4d7b969aa51330de048696805e460e42715493b33322adabcb01a9981",
  },
].sort(compareStudentsByLastName);

const state = {
  selectedAssignment: assignments[0],
  selectedStudent: null,
  lockedSubmission: null,
  problems: [],
  answers: new Map(),
  submissions: loadSubmissions(),
  visibleStudentKeys: null,
  customAssignments: [],
  account: null,
  assignmentUnsubscribe: null,
  selectedWorkStudentKey: "",
};

let elements = {};
let dashboardRefreshTimer = null;

function collectElements() {
  elements = {
    assignmentSelect: document.querySelector("#assignment-select"),
    dashboardAssignmentSelect: document.querySelector("#dashboard-assignment-select"),
    studentId: document.querySelector("#student-id"),
    accessNote: document.querySelector("#student-access-note"),
    loadAssignment: document.querySelector("#load-assignment"),
    submitAssignment: document.querySelector("#submit-assignment"),
    problemList: document.querySelector("#problem-list"),
    assignmentDirections: document.querySelector("#assignment-directions"),
    assignmentTitle: document.querySelector("#assignment-title"),
    currentScore: document.querySelector("#current-score"),
    currentPercent: document.querySelector("#current-percent"),
    answeredCount: document.querySelector("#answered-count"),
    correctCount: document.querySelector("#correct-count"),
    submissionNote: document.querySelector("#submission-note"),
    dashboardBody: document.querySelector("#dashboard-body"),
    submittedCount: document.querySelector("#submitted-count"),
    classAverage: document.querySelector("#class-average"),
    highestScore: document.querySelector("#highest-score"),
    dashboardSyncStatus: document.querySelector("#dashboard-sync-status"),
    refreshDashboard: document.querySelector("#refresh-dashboard"),
    resetDashboard: document.querySelector("#reset-dashboard"),
    headerProblemCount: document.querySelector("#header-problem-count"),
    headerStudentCount: document.querySelector("#header-student-count"),
    teacherNote: document.querySelector("#teacher-note"),
    customAssignmentTitle: document.querySelector("#custom-assignment-title"),
    customAssignmentUnit: document.querySelector("#custom-assignment-unit"),
    customAssignmentType: document.querySelector("#custom-assignment-type"),
    customProblemCount: document.querySelector("#custom-problem-count"),
    customProblemCountOther: document.querySelector("#custom-problem-count-other"),
    customDifficulty: document.querySelector("#custom-difficulty"),
    customDueDate: document.querySelector("#custom-due-date"),
    customClassPeriod: document.querySelector("#custom-class-period"),
    customFeedbackMode: document.querySelector("#custom-feedback-mode"),
    customAllowRetries: document.querySelector("#custom-allow-retries"),
    customMaxAttempts: document.querySelector("#custom-max-attempts"),
    customTimeEnabled: document.querySelector("#custom-time-enabled"),
    customTimeLimit: document.querySelector("#custom-time-limit"),
    saveAssignmentButton: document.querySelector("#save-assignment"),
    assignmentPreview: document.querySelector("#assignment-preview"),
    customAssignmentList: document.querySelector("#custom-assignment-list"),
    studentWorkPanel: document.querySelector("#student-work-panel"),
    studentWorkTitle: document.querySelector("#student-work-title"),
    studentWorkMeta: document.querySelector("#student-work-meta"),
    studentWorkProblems: document.querySelector("#student-work-problems"),
    closeWorkPanel: document.querySelector("#close-work-panel"),
  };
}

function compareStudentsByLastName(a, b) {
  const [aLast] = a.key.split("-");
  const [bLast] = b.key.split("-");
  return aLast.localeCompare(bLast) || a.name.localeCompare(b.name);
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setDisabled(element, disabled) {
  if (element) {
    element.disabled = disabled;
  }
}

function setBanner(element, message, tone = "neutral") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMathText(value) {
  return escapeHtml(value).replace(/\^\(([^)]+)\)|\^([A-Za-z0-9+-]+)/g, (_match, grouped, simple) => {
    const exponent = grouped || simple;
    return `<sup>${exponent}</sup>`;
  });
}

function normalizeStudentId(value) {
  return value.replace(/\D/g, "").slice(0, 9);
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function findStudentByAccessCode(accessCode) {
  const accessHash = await sha256Hex(`${ACCESS_HASH_SALT}:${accessCode}`);
  return roster.find((student) => student.accessHash === accessHash) || null;
}

function getVisibleRoster() {
  if (!Array.isArray(state.visibleStudentKeys)) return roster;
  const visibleKeys = new Set(state.visibleStudentKeys);
  return roster.filter((student) => visibleKeys.has(student.key));
}

function setAccessNote(message, status = "") {
  if (!elements.accessNote) return;

  elements.accessNote.textContent = message;
  elements.accessNote.classList.toggle("is-error", status === "error");
  elements.accessNote.classList.toggle("is-success", status === "success");
}

function getSelectedAssignment() {
  return state.selectedAssignment || assignments[0];
}

function getAllAssignments() {
  return [...assignments, ...state.customAssignments];
}

function getAssignmentById(assignmentId) {
  return getAllAssignments().find((assignment) => assignment.id === assignmentId) || assignments[0];
}

function getAssignmentUnitLabel(assignment = {}) {
  if (assignment.assignmentUnitLabel) return assignment.assignmentUnitLabel;
  if (assignment.assignmentUnit) return getAssignmentUnitConfig(assignment.assignmentUnit).label;
  if (assignment.assignmentType) {
    const typeConfig = getAssignmentTypeConfig(assignment.assignmentType);
    return getAssignmentUnitConfig(typeConfig.unitId).label;
  }
  return "";
}

function getAssignmentOptionLabel(assignment = {}) {
  const title = assignment.title || assignment.assignmentTypeLabel || "Assignment";
  const unitLabel = getAssignmentUnitLabel(assignment);
  const label = unitLabel ? `${unitLabel} - ${title}` : title;
  return `${label} (${assignment.problemCount || 0})`;
}

function renderHeaderCounts() {
  const assignment = getSelectedAssignment();
  setText(elements.headerProblemCount, assignment.problemCount);
  setText(elements.headerStudentCount, getVisibleRoster().length);
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
    equation: `${formatLinear(coefficient, constant)} = ${right}`,
    answer: solution,
  };
}

function makeVariablesBothSides(random) {
  const solution = nonZeroBetween(random, -10, 10);
  let leftCoefficient = nonZeroBetween(random, -8, 8);
  let rightCoefficient = nonZeroBetween(random, -8, 8);
  while (rightCoefficient === leftCoefficient) {
    rightCoefficient = nonZeroBetween(random, -8, 8);
  }
  const leftConstant = integerBetween(random, -16, 16);
  const rightConstant = (leftCoefficient - rightCoefficient) * solution + leftConstant;
  return {
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
  const right = coefficient * (solution + inside);
  return {
    equation: `${coefficient}(${
      inside === 0 ? "x" : `x ${inside > 0 ? "+" : "-"} ${Math.abs(inside)}`
    }) = ${right}`,
    answer: solution,
  };
}

function makeDistributed(random) {
  const solution = nonZeroBetween(random, -9, 9);
  const coefficient = nonZeroBetween(random, -6, 6);
  const inside = integerBetween(random, -8, 8);
  const outside = integerBetween(random, -14, 14);
  const right = coefficient * (solution + inside) + outside;
  return {
    equation: `${coefficient}(${
      inside === 0 ? "x" : `x ${inside > 0 ? "+" : "-"} ${Math.abs(inside)}`
    }) ${outside >= 0 ? "+" : "-"} ${Math.abs(outside)} = ${right}`,
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

function makeFormulaTable(entries) {
  return {
    headers: ["Variable", "Value"],
    rows: entries.map(([variable, value]) => [variable, value === null ? "?" : `${value}`]),
  };
}

function makeFormulaNumericAnswer(variable, value) {
  return makeTextAnswer(`${value}`, [
    `${variable} = ${value}`,
    `${variable}=${value}`,
    `${value}.0`,
    `${variable} = ${value}.0`,
    `${variable}=${value}.0`,
  ]);
}

function makeFormulaProblemCard(type, formula, entries, missingVariable, answerValue) {
  return {
    type,
    promptLabel: "Formula",
    expression: formula,
    table: makeFormulaTable(entries),
    equation: `Use the formula to find ${missingVariable}. Answer with the number only.`,
    answer: makeFormulaNumericAnswer(missingVariable, answerValue),
  };
}

function makeFormulasProblem(random, problemNumber = 1) {
  const problemKind = (problemNumber - 1) % 5;

  if (problemKind === 0) {
    const rate = integerBetween(random, 4, 16);
    const time = integerBetween(random, 2, 9);
    const distance = rate * time;
    const missingOptions = ["d", "r", "t"];
    const missing = missingOptions[integerBetween(random, 0, missingOptions.length - 1)];
    const answer = { d: distance, r: rate, t: time }[missing];
    return makeFormulaProblemCard(
      "Distance formula",
      "d = rt",
      [
        ["d", missing === "d" ? null : distance],
        ["r", missing === "r" ? null : rate],
        ["t", missing === "t" ? null : time],
      ],
      missing,
      answer,
    );
  }

  if (problemKind === 1) {
    const length = integerBetween(random, 5, 18);
    const width = integerBetween(random, 3, 14);
    const perimeter = 2 * length + 2 * width;
    const missingOptions = ["P", "L", "W"];
    const missing = missingOptions[integerBetween(random, 0, missingOptions.length - 1)];
    const answer = { P: perimeter, L: length, W: width }[missing];
    return makeFormulaProblemCard(
      "Rectangle perimeter formula",
      "P = 2L + 2W",
      [
        ["P", missing === "P" ? null : perimeter],
        ["L", missing === "L" ? null : length],
        ["W", missing === "W" ? null : width],
      ],
      missing,
      answer,
    );
  }

  if (problemKind === 2) {
    const length = integerBetween(random, 4, 16);
    const width = integerBetween(random, 3, 13);
    const area = length * width;
    const missingOptions = ["A", "L", "W"];
    const missing = missingOptions[integerBetween(random, 0, missingOptions.length - 1)];
    const answer = { A: area, L: length, W: width }[missing];
    return makeFormulaProblemCard(
      "Rectangle area formula",
      "A = LW",
      [
        ["A", missing === "A" ? null : area],
        ["L", missing === "L" ? null : length],
        ["W", missing === "W" ? null : width],
      ],
      missing,
      answer,
    );
  }

  if (problemKind === 3) {
    const base = integerBetween(random, 3, 13) * 2;
    const height = integerBetween(random, 3, 14);
    const area = (base * height) / 2;
    const missingOptions = ["A", "b", "h"];
    const missing = missingOptions[integerBetween(random, 0, missingOptions.length - 1)];
    const answer = { A: area, b: base, h: height }[missing];
    return makeFormulaProblemCard(
      "Triangle area formula",
      "A = bh / 2",
      [
        ["A", missing === "A" ? null : area],
        ["b", missing === "b" ? null : base],
        ["h", missing === "h" ? null : height],
      ],
      missing,
      answer,
    );
  }

  const celsius = integerBetween(random, -2, 10) * 5;
  const fahrenheit = (9 / 5) * celsius + 32;
  const missing = integerBetween(random, 0, 1) === 0 ? "F" : "C";
  const answer = missing === "F" ? fahrenheit : celsius;
  return makeFormulaProblemCard(
    "Temperature formula",
    "F = (9 / 5)C + 32",
    [
      ["F", missing === "F" ? null : fahrenheit],
      ["C", missing === "C" ? null : celsius],
    ],
    missing,
    answer,
  );
}

function formatExpressionTerm(term, isFirstTerm = false, options = {}) {
  const coefficient = Number(term.coefficient);
  const variable = term.variable || "";
  const absoluteCoefficient = Math.abs(coefficient);
  const body = variable
    ? `${absoluteCoefficient === 1 ? "" : absoluteCoefficient}${variable}`
    : `${absoluteCoefficient}`;

  if (isFirstTerm) {
    return coefficient < 0 ? `-${body}` : body;
  }

  if (options.omitSign) return body;
  return `${coefficient < 0 ? "-" : "+"} ${body}`;
}

function formatExpression(terms) {
  return terms.map((term, index) => formatExpressionTerm(term, index === 0)).join(" ");
}

function makeExpressionVariableTerm(random, variable, options = {}) {
  const allowOne = options.allowOne !== false;
  let coefficient = nonZeroBetween(random, -9, 9);
  while (!allowOne && Math.abs(coefficient) === 1) {
    coefficient = nonZeroBetween(random, -9, 9);
  }
  return { coefficient, variable };
}

function combineExpressionTerms(terms) {
  const combined = new Map();
  const variableOrder = [];

  terms.forEach((term) => {
    const variable = term.variable || "";
    if (!combined.has(variable)) {
      combined.set(variable, 0);
      if (variable) variableOrder.push(variable);
    }
    combined.set(variable, combined.get(variable) + term.coefficient);
  });

  return [...variableOrder, ""]
    .filter((variable, index, list) => list.indexOf(variable) === index)
    .map((variable) => ({ variable, coefficient: combined.get(variable) || 0 }))
    .filter((term) => term.coefficient !== 0);
}

function formatSimplifiedExpression(terms) {
  if (!terms.length) return "0";
  return formatExpression(terms);
}

function evaluateExpressionTerms(terms, values = {}) {
  return terms.reduce((total, term) => {
    if (!term.variable) return total + term.coefficient;
    return total + term.coefficient * Number(values[term.variable] || 0);
  }, 0);
}

function expressionTermsToKey(terms) {
  return terms
    .map((term) => `${term.variable || "#"}:${term.coefficient}`)
    .sort()
    .join("|");
}

function makeNonCancelingLikePair(random, variable, options = {}) {
  let first = makeExpressionVariableTerm(random, variable, options);
  let second = makeExpressionVariableTerm(random, variable, options);

  while (first.coefficient + second.coefficient === 0) {
    second = makeExpressionVariableTerm(random, variable, options);
  }

  return [first, second];
}

function shuffleTerms(random, terms) {
  const shuffled = [...terms];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = integerBetween(random, 0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function makeCombiningLikeTermsProblem(random, problemNumber = 1) {
  const variables = ["x", "y", "n", "a", "b"];
  const firstVariable = variables[integerBetween(random, 0, variables.length - 1)];
  const secondVariable = variables.find((variable) => variable !== firstVariable) || "y";
  const problemKind = (problemNumber - 1) % 5;
  let terms = [];
  let type = "";

  if (problemKind === 0) {
    terms = [
      ...makeNonCancelingLikePair(random, firstVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, secondVariable, { allowOne: false }),
    ];
    type = "Combine matching variable terms";
  } else if (problemKind === 1) {
    terms = [
      ...makeNonCancelingLikePair(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -12, 12), variable: "" },
      { coefficient: nonZeroBetween(random, -12, 12), variable: "" },
    ];
    type = "Combine variables and constants";
  } else if (problemKind === 2) {
    const likePair = makeNonCancelingLikePair(random, firstVariable, { allowOne: false }).map(
      (term) => ({ ...term, coefficient: -Math.abs(term.coefficient) }),
    );
    if (likePair[0].coefficient + likePair[1].coefficient === 0) {
      likePair[1].coefficient -= 1;
    }
    terms = [
      ...likePair,
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
    ];
    type = "Negative coefficients";
  } else if (problemKind === 3) {
    terms = [
      ...makeNonCancelingLikePair(random, firstVariable, { allowOne: false }),
      ...makeNonCancelingLikePair(random, secondVariable, { allowOne: false }),
    ];
    type = "Two-variable like terms";
  } else {
    terms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, secondVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -12, 12), variable: "" },
      { coefficient: nonZeroBetween(random, -12, 12), variable: "" },
    ];
    type = "Mixed expression";
  }

  terms = shuffleTerms(random, terms);
  const simplifiedTerms = combineExpressionTerms(terms);
  const simplifiedExpression = formatSimplifiedExpression(simplifiedTerms);

  return {
    type,
    expression: formatExpression(terms),
    equation: "Simplify by combining like terms.",
    answer: {
      terms: simplifiedTerms,
      display: simplifiedExpression,
      key: expressionTermsToKey(simplifiedTerms),
    },
  };
}

function makeVariableValueTable(values) {
  const entries = Object.entries(values);
  return {
    headers: entries.map(([variable]) => variable),
    rows: [entries.map(([, value]) => value)],
  };
}

function formatExpressionWithTrailingTerm(baseExpression, term) {
  return `${baseExpression} ${formatExpressionTerm(term, false)}`;
}

function formatExpressionMultiplier(multiplier) {
  if (multiplier === 1) return "";
  if (multiplier === -1) return "-";
  return `${multiplier}`;
}

function formatDistributedExpression(multiplier, insideTerms) {
  return `${formatExpressionMultiplier(multiplier)}(${formatExpression(insideTerms)})`;
}

function multiplyExpressionTerms(terms, multiplier) {
  return terms.map((term) => ({
    coefficient: term.coefficient * multiplier,
    variable: term.variable,
  }));
}

function makeEquivalentExpressionsProblem(random, problemNumber = 1) {
  const variables = ["x", "y", "n", "a", "b"];
  const firstVariable = variables[integerBetween(random, 0, variables.length - 1)];
  const secondVariable = variables.find((variable) => variable !== firstVariable) || "y";
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let equivalentTerms = [];
  let type = "";

  if (problemKind === 0) {
    const multiplier = integerBetween(random, 2, 6);
    const insideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -9, 9), variable: "" },
    ];
    equivalentTerms = multiplyExpressionTerms(insideTerms, multiplier);
    expression = formatDistributedExpression(multiplier, insideTerms);
    type = "Distributive property";
  } else if (problemKind === 1) {
    const multiplier = -integerBetween(random, 2, 6);
    const insideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -9, 9), variable: "" },
    ];
    equivalentTerms = multiplyExpressionTerms(insideTerms, multiplier);
    expression = formatDistributedExpression(multiplier, insideTerms);
    type = "Negative distributive property";
  } else if (problemKind === 2) {
    const multiplier = nonZeroBetween(random, -5, 5);
    const insideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -8, 8), variable: "" },
    ];
    const outsideTerm = makeExpressionVariableTerm(random, firstVariable, { allowOne: false });
    equivalentTerms = [...multiplyExpressionTerms(insideTerms, multiplier), outsideTerm];
    expression = formatExpressionWithTrailingTerm(
      formatDistributedExpression(multiplier, insideTerms),
      outsideTerm,
    );
    type = "Distribute and combine";
  } else if (problemKind === 3) {
    const multiplier = integerBetween(random, 2, 5);
    const insideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, secondVariable, { allowOne: false }),
    ];
    const outsideTerm = makeExpressionVariableTerm(random, secondVariable, { allowOne: false });
    equivalentTerms = [...multiplyExpressionTerms(insideTerms, multiplier), outsideTerm];
    expression = formatExpressionWithTrailingTerm(
      formatDistributedExpression(multiplier, insideTerms),
      outsideTerm,
    );
    type = "Two-variable equivalent expression";
  } else {
    const firstMultiplier = nonZeroBetween(random, -4, 4);
    const secondMultiplier = nonZeroBetween(random, 2, 5);
    const firstInsideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -8, 8), variable: "" },
    ];
    const secondInsideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -8, 8), variable: "" },
    ];
    equivalentTerms = [
      ...multiplyExpressionTerms(firstInsideTerms, firstMultiplier),
      ...multiplyExpressionTerms(secondInsideTerms, secondMultiplier),
    ];
    expression = `${formatDistributedExpression(firstMultiplier, firstInsideTerms)} ${formatExpressionTerm(
      { coefficient: secondMultiplier, variable: "" },
      false,
    )}(${formatExpression(secondInsideTerms)})`;
    type = "Equivalent expressions with two groups";
  }

  const simplifiedTerms = combineExpressionTerms(equivalentTerms);
  const simplifiedExpression = formatSimplifiedExpression(simplifiedTerms);

  return {
    type,
    expression,
    equation: "Write an equivalent expression without parentheses.",
    answer: {
      terms: simplifiedTerms,
      display: simplifiedExpression,
      key: expressionTermsToKey(simplifiedTerms),
    },
  };
}

function makeSimplifyAndEvaluateExpressionProblem(random, problemNumber = 1) {
  const variables = ["x", "y", "n", "a", "b"];
  const firstVariable = variables[integerBetween(random, 0, variables.length - 1)];
  const secondVariable = variables.find((variable) => variable !== firstVariable) || "y";
  const problemKind = (problemNumber - 1) % 5;
  const values = {};
  let terms = [];
  let displayedExpression = "";
  let type = "";

  if (problemKind === 0) {
    values[firstVariable] = nonZeroBetween(random, -5, 5);
    terms = [
      ...makeNonCancelingLikePair(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
    ];
    type = "One-variable evaluation";
  } else if (problemKind === 1) {
    values[firstVariable] = nonZeroBetween(random, -4, 4);
    terms = [
      { coefficient: -Math.abs(nonZeroBetween(random, 2, 9)), variable: firstVariable },
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -12, 12), variable: "" },
    ];
    type = "Negative coefficients";
  } else if (problemKind === 2) {
    values[firstVariable] = nonZeroBetween(random, -4, 4);
    values[secondVariable] = nonZeroBetween(random, -4, 4);
    terms = [
      ...makeNonCancelingLikePair(random, firstVariable, { allowOne: false }),
      ...makeNonCancelingLikePair(random, secondVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -8, 8), variable: "" },
    ];
    type = "Two-variable evaluation";
  } else if (problemKind === 3) {
    values[firstVariable] = nonZeroBetween(random, -4, 4);
    const multiplier = nonZeroBetween(random, -5, 5);
    const insideTerms = [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -8, 8), variable: "" },
    ];
    const outsideTerm = makeExpressionVariableTerm(random, firstVariable, { allowOne: false });
    const distributedTerms = insideTerms.map((term) => ({
      coefficient: term.coefficient * multiplier,
      variable: term.variable,
    }));
    terms = [...distributedTerms, outsideTerm];
    displayedExpression = formatExpressionWithTrailingTerm(
      `${multiplier}(${formatExpression(insideTerms)})`,
      outsideTerm,
    );
    type = "Distributive property";
  } else {
    values[firstVariable] = nonZeroBetween(random, -5, 5);
    values[secondVariable] = nonZeroBetween(random, -5, 5);
    terms = shuffleTerms(random, [
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, secondVariable, { allowOne: false }),
      makeExpressionVariableTerm(random, firstVariable, { allowOne: false }),
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
      { coefficient: nonZeroBetween(random, -10, 10), variable: "" },
    ]);
    type = "Mixed simplify and evaluate";
  }

  if (!displayedExpression) {
    displayedExpression = formatExpression(shuffleTerms(random, terms));
  }

  const simplifiedTerms = combineExpressionTerms(terms);
  const simplifiedExpression = formatSimplifiedExpression(simplifiedTerms);
  const value = evaluateExpressionTerms(simplifiedTerms, values);
  const valuesText = Object.entries(values)
    .map(([variable, variableValue]) => `${variable} = ${variableValue}`)
    .join(", ");

  return {
    type,
    expression: displayedExpression,
    equation: `Simplify, then evaluate when ${valuesText}.`,
    table: makeVariableValueTable(values),
    answer: {
      value,
      simplified: simplifiedExpression,
      display: `Simplified: ${simplifiedExpression}; value = ${value}`,
    },
  };
}

function makePartsOfExpressionProblem(random, problemNumber = 1) {
  const variables = ["x", "y", "n", "a", "b"];
  const questionCycle = [
    "termCount",
    "coefficient",
    "constant",
    "variableInTerm",
    "termWithVariable",
    "operation",
    "likeTerms",
  ];
  const questionKind = questionCycle[(problemNumber - 1) % questionCycle.length];
  const variable = variables[integerBetween(random, 0, variables.length - 1)];
  const secondVariable = variables.find((item) => item !== variable) || "y";
  const thirdVariable = variables.find((item) => ![variable, secondVariable].includes(item)) || "n";
  const constant = nonZeroBetween(random, -12, 12);
  let terms = [];
  let question = "";
  let type = "";
  let answer = null;

  if (questionKind === "termCount") {
    terms = [
      makeExpressionVariableTerm(random, variable),
      makeExpressionVariableTerm(random, secondVariable),
      { coefficient: constant, variable: "" },
    ];
    if (problemNumber > 7) {
      terms.push(makeExpressionVariableTerm(random, thirdVariable));
    }
    type = "Counting terms";
    question = "How many terms are in this expression?";
    answer = { kind: "number", value: terms.length, display: `${terms.length}` };
  } else if (questionKind === "coefficient") {
    const targetTerm = makeExpressionVariableTerm(random, variable, { allowOne: false });
    terms = [
      targetTerm,
      makeExpressionVariableTerm(random, secondVariable),
      { coefficient: constant, variable: "" },
    ];
    type = "Identifying coefficients";
    question = `What is the coefficient of ${variable}?`;
    answer = {
      kind: "number",
      value: targetTerm.coefficient,
      display: `${targetTerm.coefficient}`,
    };
  } else if (questionKind === "constant") {
    const constantTerm = { coefficient: constant, variable: "" };
    terms = [
      makeExpressionVariableTerm(random, variable),
      makeExpressionVariableTerm(random, secondVariable),
      constantTerm,
    ];
    type = "Identifying constants";
    question = "What is the constant term?";
    answer = { kind: "number", value: constantTerm.coefficient, display: `${constantTerm.coefficient}` };
  } else if (questionKind === "variableInTerm") {
    const targetTerm = makeExpressionVariableTerm(random, variable);
    terms = [
      targetTerm,
      { coefficient: constant, variable: "" },
      makeExpressionVariableTerm(random, secondVariable),
    ];
    type = "Variables in terms";
    question = `What variable is in the term ${formatExpressionTerm(targetTerm, true)}?`;
    answer = { kind: "variable", value: variable, display: variable };
  } else if (questionKind === "termWithVariable") {
    const targetTerm = makeExpressionVariableTerm(random, variable, { allowOne: false });
    terms = [
      makeExpressionVariableTerm(random, secondVariable),
      targetTerm,
      { coefficient: constant, variable: "" },
    ];
    type = "Identifying terms";
    question = `Which term contains the variable ${variable}?`;
    answer = {
      kind: "term",
      value: formatExpressionTerm(targetTerm, true),
      display: formatExpressionTerm(targetTerm, true),
    };
  } else if (questionKind === "operation") {
    const firstTerm = { coefficient: integerBetween(random, 2, 9), variable };
    const secondTerm = {
      coefficient: integerBetween(random, 2, 9) * (integerBetween(random, 0, 1) === 0 ? 1 : -1),
      variable: "",
    };
    terms = [firstTerm, secondTerm];
    const isAddition = secondTerm.coefficient > 0;
    type = "Operations in expressions";
    question = `What operation is between ${formatExpressionTerm(
      firstTerm,
      true,
    )} and ${formatExpressionTerm(secondTerm, false, { omitSign: true })}?`;
    answer = {
      kind: "operation",
      value: isAddition ? "addition" : "subtraction",
      display: isAddition ? "+ or addition" : "- or subtraction",
    };
  } else {
    const firstLikeTerm = makeExpressionVariableTerm(random, variable, { allowOne: false });
    const secondLikeTerm = makeExpressionVariableTerm(random, variable, { allowOne: false });
    terms = [
      firstLikeTerm,
      makeExpressionVariableTerm(random, secondVariable),
      secondLikeTerm,
      { coefficient: constant, variable: "" },
    ];
    type = "Like terms";
    question = "Which variable has like terms in this expression?";
    answer = { kind: "variable", value: variable, display: variable };
  }

  return {
    type,
    expression: formatExpression(terms),
    equation: question,
    expressionQuestion: questionKind,
    answer,
  };
}

function makeRandomFractionValue(random, options = {}) {
  const numerator = options.positive
    ? integerBetween(random, 1, 12)
    : nonZeroBetween(random, -12, 12);
  const denominator = integerBetween(random, 2, 12);
  return reduceFraction(numerator, denominator);
}

function addFractionValues(left, right) {
  return reduceFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractFractionValues(left, right) {
  return reduceFraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function divideFractionValues(left, right) {
  return reduceFraction(left.numerator * right.denominator, left.denominator * right.numerator);
}

function fractionToken(fraction) {
  if (fraction.denominator === 1) {
    return { kind: "text", value: `${fraction.numerator}` };
  }
  return {
    kind: "fraction",
    numerator: `${fraction.numerator}`,
    denominator: `${fraction.denominator}`,
  };
}

function operatorToken(value) {
  return { kind: "operator", value };
}

function wholeNumberToken(value) {
  return { kind: "text", value: `${value}` };
}

function fractionExpressionToText(tokens) {
  return tokens
    .map((token) => {
      if (token.kind === "fraction") return `${token.numerator}/${token.denominator}`;
      return token.value;
    })
    .join(" ");
}

function makeComplexFractionsProblem(random, problemNumber = 1) {
  const problemKind = (problemNumber - 1) % 6;
  const firstFraction = makeRandomFractionValue(random);
  const secondFraction = makeRandomFractionValue(random);
  const thirdFraction = makeRandomFractionValue(random, { positive: true });
  let numeratorTokens = [];
  let denominatorTokens = [];
  let numeratorValue = firstFraction;
  let denominatorValue = secondFraction;
  let type = "";

  if (problemKind === 0) {
    type = "Fraction divided by fraction";
    numeratorTokens = [fractionToken(firstFraction)];
    denominatorTokens = [fractionToken(secondFraction)];
  } else if (problemKind === 1) {
    const wholeNumber = nonZeroBetween(random, -9, 9);
    numeratorValue = reduceFraction(wholeNumber, 1);
    type = "Whole number over a fraction";
    numeratorTokens = [wholeNumberToken(wholeNumber)];
    denominatorTokens = [fractionToken(secondFraction)];
  } else if (problemKind === 2) {
    const wholeNumber = nonZeroBetween(random, -9, 9);
    denominatorValue = reduceFraction(wholeNumber, 1);
    type = "Fraction over a whole number";
    numeratorTokens = [fractionToken(firstFraction)];
    denominatorTokens = [wholeNumberToken(wholeNumber)];
  } else if (problemKind === 3) {
    numeratorValue = addFractionValues(firstFraction, secondFraction);
    denominatorValue = thirdFraction;
    type = "Sum in the numerator";
    numeratorTokens = [fractionToken(firstFraction), operatorToken("+"), fractionToken(secondFraction)];
    denominatorTokens = [fractionToken(thirdFraction)];
  } else if (problemKind === 4) {
    let bottomLeft = makeRandomFractionValue(random);
    let bottomRight = makeRandomFractionValue(random);
    denominatorValue = subtractFractionValues(bottomLeft, bottomRight);
    while (denominatorValue.numerator === 0) {
      bottomLeft = makeRandomFractionValue(random);
      bottomRight = makeRandomFractionValue(random);
      denominatorValue = subtractFractionValues(bottomLeft, bottomRight);
    }
    type = "Difference in the denominator";
    numeratorTokens = [fractionToken(firstFraction)];
    denominatorTokens = [fractionToken(bottomLeft), operatorToken("-"), fractionToken(bottomRight)];
  } else {
    const wholeNumber = integerBetween(random, 1, 6);
    const addedFraction = makeRandomFractionValue(random, { positive: true });
    numeratorValue = addFractionValues(reduceFraction(wholeNumber, 1), addedFraction);
    denominatorValue = thirdFraction;
    type = "Mixed numerator";
    numeratorTokens = [wholeNumberToken(wholeNumber), operatorToken("+"), fractionToken(addedFraction)];
    denominatorTokens = [fractionToken(thirdFraction)];
  }

  const answer = divideFractionValues(numeratorValue, denominatorValue);

  return {
    type,
    expression: `(${fractionExpressionToText(numeratorTokens)}) / (${fractionExpressionToText(
      denominatorTokens,
    )})`,
    equation: "Simplify the complex fraction.",
    complexFraction: {
      numerator: numeratorTokens,
      denominator: denominatorTokens,
    },
    answer,
  };
}

function uniqueAnswerList(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ""))];
}

function makeTextAnswer(display, accepted = []) {
  return {
    display,
    accepted: uniqueAnswerList([display, ...accepted]),
  };
}

function formatPower(base, exponent) {
  return `${base}^${exponent}`;
}

function formatGroupedPower(base, exponent) {
  return `(${base})^${exponent}`;
}

function formatRadical(radicand, index = 2) {
  if (index === 2) return `√(${radicand})`;
  if (index === 3) return `∛(${radicand})`;
  return `${index}√(${radicand})`;
}

function formatRadicalTerm(coefficient, radicand, index = 2) {
  if (radicand === 1) return `${coefficient}`;
  const radical = formatRadical(radicand, index);
  if (coefficient === 1) return radical;
  if (coefficient === -1) return `-${radical}`;
  return `${coefficient}${radical}`;
}

function radicalAnswerVariants(display) {
  return [
    display
      .replace(/√\(([^)]+)\)/g, "sqrt($1)")
      .replace(/∛\(([^)]+)\)/g, "root3($1)"),
    display
      .replace(/√\(([^)]+)\)/g, "sqrt$1")
      .replace(/∛\(([^)]+)\)/g, "root3$1"),
  ];
}

function makeRadicalTextAnswer(display, accepted = []) {
  return makeTextAnswer(display, [...radicalAnswerVariants(display), ...accepted]);
}

function makeExponentLawsNotationProblem(random, problemNumber = 1) {
  const variables = ["x", "y", "a", "b", "m"];
  const variable = variables[integerBetween(random, 0, variables.length - 1)];
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answerDisplay = "";

  if (problemKind === 0) {
    const firstExponent = integerBetween(random, 2, 7);
    const secondExponent = integerBetween(random, 2, 7);
    type = "Product rule";
    expression = `${formatPower(variable, firstExponent)} * ${formatPower(variable, secondExponent)}`;
    answerDisplay = formatPower(variable, firstExponent + secondExponent);
  } else if (problemKind === 1) {
    const finalExponent = integerBetween(random, 2, 7);
    const denominatorExponent = integerBetween(random, 2, 5);
    type = "Quotient rule";
    expression = `${formatPower(variable, finalExponent + denominatorExponent)} / ${formatPower(
      variable,
      denominatorExponent,
    )}`;
    answerDisplay = formatPower(variable, finalExponent);
  } else if (problemKind === 2) {
    const innerExponent = integerBetween(random, 2, 5);
    const outerExponent = integerBetween(random, 2, 4);
    type = "Power of a power";
    expression = `${formatGroupedPower(formatPower(variable, innerExponent), outerExponent)}`;
    answerDisplay = formatPower(variable, innerExponent * outerExponent);
  } else if (problemKind === 3) {
    const exponent = integerBetween(random, 2, 5);
    const firstVariable = variable;
    const secondVariable = variables.find((item) => item !== variable) || "n";
    type = "Power of a product";
    expression = formatGroupedPower(`${firstVariable}${secondVariable}`, exponent);
    answerDisplay = `${formatPower(firstVariable, exponent)}${formatPower(secondVariable, exponent)}`;
  } else {
    const base = integerBetween(random, 2, 5);
    const exponent = integerBetween(random, 2, 4);
    type = "Evaluate exponent notation";
    expression = formatPower(base, exponent);
    answerDisplay = `${base ** exponent}`;
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Simplify using exponent laws.",
    answer: makeTextAnswer(answerDisplay),
  };
}

function makeSimplifyRootsProblem(random, problemNumber = 1) {
  const squareFreeValues = [2, 3, 5, 6, 7, 10, 11, 13];
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answerDisplay = "";

  if (problemKind === 0) {
    const root = integerBetween(random, 4, 13);
    type = "Perfect square root";
    expression = formatRadical(root * root);
    answerDisplay = `${root}`;
  } else if (problemKind === 1) {
    const outside = integerBetween(random, 2, 8);
    const inside = squareFreeValues[integerBetween(random, 0, squareFreeValues.length - 1)];
    type = "Simplify square root";
    expression = formatRadical(outside * outside * inside);
    answerDisplay = formatRadicalTerm(outside, inside);
  } else if (problemKind === 2) {
    const root = integerBetween(random, 2, 7);
    type = "Perfect cube root";
    expression = formatRadical(root * root * root, 3);
    answerDisplay = `${root}`;
  } else if (problemKind === 3) {
    const outside = integerBetween(random, 2, 5);
    const inside = squareFreeValues[integerBetween(random, 0, squareFreeValues.length - 1)];
    type = "Simplify cube root";
    expression = formatRadical(outside * outside * outside * inside, 3);
    answerDisplay = formatRadicalTerm(outside, inside, 3);
  } else {
    const multiplier = integerBetween(random, 2, 5);
    const outside = integerBetween(random, 2, 7);
    const inside = squareFreeValues[integerBetween(random, 0, squareFreeValues.length - 1)];
    type = "Coefficient with a root";
    expression = `${multiplier}${formatRadical(outside * outside * inside)}`;
    answerDisplay = formatRadicalTerm(multiplier * outside, inside);
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Simplify the root.",
    answer: makeRadicalTextAnswer(answerDisplay),
  };
}

function makeRadicalLawsNotationProblem(random, problemNumber = 1) {
  const squareFreeValues = [2, 3, 5, 6, 7, 10, 11];
  const radicand = squareFreeValues[integerBetween(random, 0, squareFreeValues.length - 1)];
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answerDisplay = "";

  if (problemKind === 0) {
    const factor = integerBetween(random, 2, 6);
    type = "Product property";
    expression = `${formatRadical(radicand)} * ${formatRadical(radicand * factor * factor)}`;
    answerDisplay = `${radicand * factor}`;
  } else if (problemKind === 1) {
    const quotient = integerBetween(random, 2, 8);
    type = "Quotient property";
    expression = `${formatRadical(radicand * quotient * quotient)} / ${formatRadical(radicand)}`;
    answerDisplay = `${quotient}`;
  } else if (problemKind === 2) {
    const firstCoefficient = integerBetween(random, 2, 8);
    const secondCoefficient = integerBetween(random, 2, 8);
    type = "Adding like radicals";
    expression = `${firstCoefficient}${formatRadical(radicand)} + ${secondCoefficient}${formatRadical(
      radicand,
    )}`;
    answerDisplay = formatRadicalTerm(firstCoefficient + secondCoefficient, radicand);
  } else if (problemKind === 3) {
    const firstCoefficient = integerBetween(random, 2, 5);
    const secondCoefficient = integerBetween(random, 2, 5);
    type = "Multiplying like radicals";
    expression = `${firstCoefficient}${formatRadical(radicand)} * ${secondCoefficient}${formatRadical(
      radicand,
    )}`;
    answerDisplay = `${firstCoefficient * secondCoefficient * radicand}`;
  } else {
    const exponent = integerBetween(random, 2, 5);
    type = "Radical notation";
    expression = formatRadical(`x^${exponent * 2}`);
    answerDisplay = formatPower("x", exponent);
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Simplify using radical laws.",
    answer: makeRadicalTextAnswer(answerDisplay),
  };
}

function makeRationalExponentsProblem(random, problemNumber = 1) {
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answerDisplay = "";
  let accepted = [];

  if (problemKind === 0) {
    const root = integerBetween(random, 3, 12);
    type = "Square-root exponent";
    expression = `${root * root}^(1/2)`;
    answerDisplay = `${root}`;
  } else if (problemKind === 1) {
    const root = integerBetween(random, 2, 6);
    type = "Cube-root exponent";
    expression = `${root * root * root}^(1/3)`;
    answerDisplay = `${root}`;
  } else if (problemKind === 2) {
    const root = integerBetween(random, 2, 5);
    const numerator = integerBetween(random, 2, 4);
    const denominator = integerBetween(random, 2, 3);
    type = "Power with rational exponent";
    expression = `${root ** denominator}^(${numerator}/${denominator})`;
    answerDisplay = `${root ** numerator}`;
  } else if (problemKind === 3) {
    const numerator = integerBetween(random, 2, 5);
    type = "Rewrite as a radical";
    expression = `x^(${numerator}/2)`;
    answerDisplay = formatRadical(`x^${numerator}`);
    accepted = [`(sqrt(x))^${numerator}`];
  } else {
    const numerator = integerBetween(random, 2, 5);
    type = "Rewrite as a rational exponent";
    expression = formatRadical(`x^${numerator}`, 3);
    answerDisplay = `x^(${numerator}/3)`;
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Evaluate or rewrite the expression.",
    answer: makeRadicalTextAnswer(answerDisplay, accepted),
  };
}

function makeRationalizeDenominatorsProblem(random, problemNumber = 1) {
  const squareFreeValues = [2, 3, 5, 7, 11];
  const firstRadicand = squareFreeValues[integerBetween(random, 0, squareFreeValues.length - 1)];
  const remainingRadicands = squareFreeValues.filter((value) => value !== firstRadicand);
  const secondRadicand = remainingRadicands[integerBetween(random, 0, remainingRadicands.length - 1)];
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answerDisplay = "";

  if (problemKind === 0) {
    type = "Unit fraction denominator";
    expression = `1 / ${formatRadical(firstRadicand)}`;
    answerDisplay = `${formatRadical(firstRadicand)} / ${firstRadicand}`;
  } else if (problemKind === 1) {
    let numerator = integerBetween(random, 2, 8);
    while (greatestCommonDivisor(numerator, firstRadicand) > 1) {
      numerator = integerBetween(random, 2, 8);
    }
    type = "Coefficient over radical";
    expression = `${numerator} / ${formatRadical(firstRadicand)}`;
    answerDisplay = `${numerator}${formatRadical(firstRadicand)} / ${firstRadicand}`;
  } else if (problemKind === 2) {
    const coefficient = integerBetween(random, 2, 5);
    type = "Coefficient with radical denominator";
    expression = `1 / (${coefficient}${formatRadical(firstRadicand)})`;
    answerDisplay = `${formatRadical(firstRadicand)} / ${coefficient * firstRadicand}`;
  } else if (problemKind === 3) {
    type = "Radical over radical";
    expression = `${formatRadical(firstRadicand)} / ${formatRadical(secondRadicand)}`;
    answerDisplay = `${formatRadical(firstRadicand * secondRadicand)} / ${secondRadicand}`;
  } else {
    const coefficient = integerBetween(random, 2, 5);
    type = "Coefficient and radical numerator";
    expression = `${coefficient}${formatRadical(firstRadicand)} / ${formatRadical(secondRadicand)}`;
    answerDisplay = `${coefficient}${formatRadical(firstRadicand * secondRadicand)} / ${secondRadicand}`;
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Rationalize the denominator.",
    answer: makeRadicalTextAnswer(answerDisplay),
  };
}

function combinePolynomialTerms(terms) {
  const combined = new Map();
  terms.forEach((term) => {
    combined.set(term.power, (combined.get(term.power) || 0) + term.coefficient);
  });

  return [...combined.entries()]
    .map(([power, coefficient]) => ({ power: Number(power), coefficient }))
    .filter((term) => term.coefficient !== 0)
    .sort((left, right) => right.power - left.power);
}

function formatPolynomialTerm(term, isFirstTerm = false) {
  const coefficient = Number(term.coefficient);
  const power = Number(term.power);
  const absoluteCoefficient = Math.abs(coefficient);
  let body = `${absoluteCoefficient}`;

  if (power === 1) {
    body = `${absoluteCoefficient === 1 ? "" : absoluteCoefficient}x`;
  } else if (power > 1) {
    body = `${absoluteCoefficient === 1 ? "" : absoluteCoefficient}x^${power}`;
  }

  if (isFirstTerm) {
    return coefficient < 0 ? `-${body}` : body;
  }

  return `${coefficient < 0 ? "-" : "+"} ${body}`;
}

function formatPolynomial(terms) {
  const simplifiedTerms = combinePolynomialTerms(terms);
  if (!simplifiedTerms.length) return "0";
  return simplifiedTerms
    .map((term, index) => formatPolynomialTerm(term, index === 0))
    .join(" ");
}

function polynomialTermsToKey(terms) {
  return combinePolynomialTerms(terms)
    .map((term) => `${term.power}:${term.coefficient}`)
    .join("|");
}

function makePolynomialTerm(coefficient, power) {
  return { coefficient, power };
}

function makeRandomPolynomial(random, degree, options = {}) {
  const terms = [];
  for (let power = degree; power >= 0; power -= 1) {
    let coefficient = nonZeroBetween(random, -8, 8);
    if (power === degree && options.monic === true) {
      coefficient = 1;
    }
    if (power === 0 && options.positiveConstant === true) {
      coefficient = integerBetween(random, 1, 9);
    }
    terms.push(makePolynomialTerm(coefficient, power));
  }
  return terms;
}

function negatePolynomialTerms(terms) {
  return terms.map((term) => ({ ...term, coefficient: -term.coefficient }));
}

function multiplyPolynomialTerms(leftTerms, rightTerms) {
  const productTerms = [];
  leftTerms.forEach((leftTerm) => {
    rightTerms.forEach((rightTerm) => {
      productTerms.push(
        makePolynomialTerm(
          leftTerm.coefficient * rightTerm.coefficient,
          leftTerm.power + rightTerm.power,
        ),
      );
    });
  });
  return combinePolynomialTerms(productTerms);
}

function formatPolynomialGroup(terms) {
  return `(${formatPolynomial(terms)})`;
}

function makePolynomialAnswer(terms) {
  const display = formatPolynomial(terms);
  return {
    terms: combinePolynomialTerms(terms),
    display,
    key: polynomialTermsToKey(terms),
  };
}

function makePolynomialOperationsProblem(random, problemNumber = 1) {
  const problemKind = (problemNumber - 1) % 6;
  let expression = "";
  let type = "";
  let answerTerms = [];

  if (problemKind === 0) {
    const firstPolynomial = makeRandomPolynomial(random, 2);
    const secondPolynomial = makeRandomPolynomial(random, 2);
    type = "Add polynomials";
    expression = `${formatPolynomialGroup(firstPolynomial)} + ${formatPolynomialGroup(secondPolynomial)}`;
    answerTerms = [...firstPolynomial, ...secondPolynomial];
  } else if (problemKind === 1) {
    const firstPolynomial = makeRandomPolynomial(random, 2);
    const secondPolynomial = makeRandomPolynomial(random, 2);
    type = "Subtract polynomials";
    expression = `${formatPolynomialGroup(firstPolynomial)} - ${formatPolynomialGroup(secondPolynomial)}`;
    answerTerms = [...firstPolynomial, ...negatePolynomialTerms(secondPolynomial)];
  } else if (problemKind === 2) {
    const monomial = [
      makePolynomialTerm(nonZeroBetween(random, -5, 5), integerBetween(random, 1, 2)),
    ];
    const polynomial = makeRandomPolynomial(random, 2);
    type = "Multiply by a monomial";
    expression = `${formatPolynomial(monomial)}${formatPolynomialGroup(polynomial)}`;
    answerTerms = multiplyPolynomialTerms(monomial, polynomial);
  } else if (problemKind === 3) {
    const firstConstant = nonZeroBetween(random, -8, 8);
    const secondConstant = nonZeroBetween(random, -8, 8);
    const firstBinomial = [makePolynomialTerm(1, 1), makePolynomialTerm(firstConstant, 0)];
    const secondBinomial = [makePolynomialTerm(1, 1), makePolynomialTerm(secondConstant, 0)];
    type = "Multiply binomials";
    expression = `${formatPolynomialGroup(firstBinomial)}${formatPolynomialGroup(secondBinomial)}`;
    answerTerms = multiplyPolynomialTerms(firstBinomial, secondBinomial);
  } else if (problemKind === 4) {
    const constant = nonZeroBetween(random, -7, 7);
    const binomial = [makePolynomialTerm(1, 1), makePolynomialTerm(constant, 0)];
    type = "Square a binomial";
    expression = `${formatPolynomialGroup(binomial)}^2`;
    answerTerms = multiplyPolynomialTerms(binomial, binomial);
  } else {
    const constant = integerBetween(random, 2, 9);
    const firstBinomial = [makePolynomialTerm(1, 1), makePolynomialTerm(constant, 0)];
    const secondBinomial = [makePolynomialTerm(1, 1), makePolynomialTerm(-constant, 0)];
    type = "Difference of squares";
    expression = `${formatPolynomialGroup(firstBinomial)}${formatPolynomialGroup(secondBinomial)}`;
    answerTerms = multiplyPolynomialTerms(firstBinomial, secondBinomial);
  }

  return {
    type,
    promptLabel: "Expression",
    expression,
    equation: "Simplify the polynomial expression.",
    answer: makePolynomialAnswer(answerTerms),
  };
}

function makeBinomialFactor(constant, leadingCoefficient = 1) {
  return [makePolynomialTerm(leadingCoefficient, 1), makePolynomialTerm(constant, 0)];
}

function makeFactorTextAnswer(display, accepted = []) {
  return makeTextAnswer(display, accepted);
}

function makeFactorProductAnswer(factors, options = {}) {
  const coefficient = options.coefficient || "";
  const display = `${coefficient}${factors.join("")}`;
  const accepted = [];

  if (factors.length === 2) {
    accepted.push(`${coefficient}${factors[1]}${factors[0]}`);
  }

  if (options.squareFactor) {
    accepted.push(`${coefficient}${options.squareFactor}${options.squareFactor}`);
  }

  return makeFactorTextAnswer(display, accepted);
}

function makeFactorPolynomialsProblem(random, problemNumber = 1) {
  const problemKind = (problemNumber - 1) % 5;
  let expression = "";
  let type = "";
  let answer = null;

  if (problemKind === 0) {
    const gcfCoefficient = integerBetween(random, 2, 8);
    const gcfPower = integerBetween(random, 1, 2);
    const innerBinomial = [
      makePolynomialTerm(nonZeroBetween(random, -5, 5), 1),
      makePolynomialTerm(nonZeroBetween(random, -9, 9), 0),
    ];
    const gcfTerm = [makePolynomialTerm(gcfCoefficient, gcfPower)];
    const expanded = multiplyPolynomialTerms(gcfTerm, innerBinomial);
    const gcfText = formatPolynomial(gcfTerm);
    const factorText = formatPolynomialGroup(innerBinomial);
    type = "Greatest common factor";
    expression = formatPolynomial(expanded);
    answer = makeFactorTextAnswer(`${gcfText}${factorText}`);
  } else if (problemKind === 1) {
    const firstConstant = nonZeroBetween(random, -8, 8);
    const secondConstant = nonZeroBetween(random, -8, 8);
    const firstFactor = makeBinomialFactor(firstConstant);
    const secondFactor = makeBinomialFactor(secondConstant);
    const expanded = multiplyPolynomialTerms(firstFactor, secondFactor);
    type = "Factor a trinomial";
    expression = formatPolynomial(expanded);
    answer = makeFactorProductAnswer([
      formatPolynomialGroup(firstFactor),
      formatPolynomialGroup(secondFactor),
    ]);
  } else if (problemKind === 2) {
    const constant = integerBetween(random, 2, 12);
    const firstFactor = makeBinomialFactor(-constant);
    const secondFactor = makeBinomialFactor(constant);
    const expanded = multiplyPolynomialTerms(firstFactor, secondFactor);
    type = "Difference of squares";
    expression = formatPolynomial(expanded);
    answer = makeFactorProductAnswer([
      formatPolynomialGroup(firstFactor),
      formatPolynomialGroup(secondFactor),
    ]);
  } else if (problemKind === 3) {
    const constant = nonZeroBetween(random, -7, 7);
    const factor = makeBinomialFactor(constant);
    const expanded = multiplyPolynomialTerms(factor, factor);
    const factorText = formatPolynomialGroup(factor);
    type = "Perfect square trinomial";
    expression = formatPolynomial(expanded);
    answer = makeFactorProductAnswer([`${factorText}^2`], { squareFactor: factorText });
  } else {
    const firstConstant = nonZeroBetween(random, -6, 6);
    const secondConstant = integerBetween(random, 2, 9);
    const firstFactor = makeBinomialFactor(firstConstant);
    const secondFactor = [
      makePolynomialTerm(1, 2),
      makePolynomialTerm(secondConstant, 0),
    ];
    const expanded = multiplyPolynomialTerms(firstFactor, secondFactor);
    type = "Factor by grouping";
    expression = formatPolynomial(expanded);
    answer = makeFactorProductAnswer([
      formatPolynomialGroup(firstFactor),
      formatPolynomialGroup(secondFactor),
    ]);
  }

  return {
    type,
    promptLabel: "Polynomial",
    expression,
    equation: "Factor the polynomial completely.",
    answer,
  };
}

function formatFunctionRule(name, coefficient, constant) {
  return `${name}(x) = ${formatLinear(coefficient, constant)}`;
}

function evaluateLinearFunction(coefficient, constant, input) {
  return coefficient * input + constant;
}

function makeFunctionTable(headers, rows) {
  return { headers, rows };
}

function makeAlgebraicFunctionProblem(random, problemNumber = 1) {
  const functionNames = ["f", "g", "h"];
  const functionName = functionNames[(problemNumber - 1) % functionNames.length];
  const coefficient = nonZeroBetween(random, -7, 7);
  const constant = integerBetween(random, -12, 12);
  const input = integerBetween(random, -6, 6);
  const problemKind = (problemNumber - 1) % 6;
  let equation = "";
  let type = "";
  let table = null;
  let answer = evaluateLinearFunction(coefficient, constant, input);

  if (problemKind === 0) {
    type = "Evaluate function notation";
    equation = `Given ${formatFunctionRule(functionName, coefficient, constant)}, find ${functionName}(${input}).`;
  } else if (problemKind === 1) {
    const targetInput = nonZeroBetween(random, -6, 6);
    answer = targetInput;
    type = "Find the input";
    equation = `Given ${formatFunctionRule(
      functionName,
      coefficient,
      constant,
    )}, find x when ${functionName}(x) = ${evaluateLinearFunction(
      coefficient,
      constant,
      targetInput,
    )}.`;
  } else if (problemKind === 2) {
    const secondCoefficient = nonZeroBetween(random, -6, 6);
    const secondConstant = integerBetween(random, -10, 10);
    const fValue = evaluateLinearFunction(coefficient, constant, input);
    const gValue = evaluateLinearFunction(secondCoefficient, secondConstant, input);
    answer = fValue + gValue;
    type = "Use two functions";
    equation = `Given f(x) = ${formatLinear(coefficient, constant)} and g(x) = ${formatLinear(
      secondCoefficient,
      secondConstant,
    )}, find f(${input}) + g(${input}).`;
  } else if (problemKind === 3) {
    const innerCoefficient = nonZeroBetween(random, -5, 5);
    const innerConstant = integerBetween(random, -8, 8);
    const innerValue = evaluateLinearFunction(innerCoefficient, innerConstant, input);
    answer = evaluateLinearFunction(coefficient, constant, innerValue);
    type = "Function composition";
    equation = `Given f(x) = ${formatLinear(coefficient, constant)} and g(x) = ${formatLinear(
      innerCoefficient,
      innerConstant,
    )}, find f(g(${input})).`;
  } else if (problemKind === 4) {
    const rows = [-2, 0, 2].map((xValue) => [
      xValue,
      evaluateLinearFunction(coefficient, constant, xValue),
    ]);
    const targetIndex = integerBetween(random, 0, rows.length - 1);
    answer = rows[targetIndex][1];
    type = "Function table";
    equation = `The table follows ${formatFunctionRule(
      functionName,
      coefficient,
      constant,
    )}. Find the missing output.`;
    table = makeFunctionTable(
      ["x", `${functionName}(x)`],
      rows.map((row, rowIndex) => (rowIndex === targetIndex ? [row[0], "?"] : row)),
    );
  } else {
    const firstInput = integerBetween(random, -5, 0);
    const secondInput = integerBetween(random, 1, 6);
    const firstValue = evaluateLinearFunction(coefficient, constant, firstInput);
    const secondValue = evaluateLinearFunction(coefficient, constant, secondInput);
    answer = secondValue - firstValue;
    type = "Compare outputs";
    equation = `Given ${formatFunctionRule(
      functionName,
      coefficient,
      constant,
    )}, find ${functionName}(${secondInput}) - ${functionName}(${firstInput}).`;
  }

  return {
    type,
    equation,
    table,
    answer,
  };
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

function formatQuadraticVertexEquation(a, h, k) {
  const aText = a === 1 ? "" : a === -1 ? "-" : `${a}`;
  const hText = h === 0 ? "x" : h > 0 ? `x - ${h}` : `x + ${Math.abs(h)}`;
  const kText = k === 0 ? "" : k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`;
  return `y = ${aText}(${hText})^2${kText}`;
}

function fractionToNumber(fraction) {
  if (!fraction || fraction.undefined) return NaN;
  return fraction.numerator / fraction.denominator;
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

function flipInequalitySymbol(symbol) {
  return {
    "<": ">",
    ">": "<",
    "<=": ">=",
    ">=": "<=",
  }[symbol];
}

function makeInequalityAnswer(coefficient, symbol, rightValue) {
  const boundary = rightValue / coefficient;
  return {
    boundary,
    symbol: coefficient < 0 ? flipInequalitySymbol(symbol) : symbol,
  };
}

function makeLinearInequalityProblem(random, problemNumber = 1) {
  const noSignFlip = problemNumber <= 20;
  const negativeCoefficient = problemNumber > 20 && problemNumber <= 26;
  const variablesBothSides = problemNumber >= 27;
  const boundary = integerBetween(random, -12, 12);
  const symbolOptions = ["<", ">", "<=", ">="];
  const baseSymbol = symbolOptions[integerBetween(random, 0, symbolOptions.length - 1)];
  let equation = "";
  let answer = { boundary, symbol: baseSymbol };
  let type = "Positive coefficient";

  if (noSignFlip) {
    const coefficient = nonZeroBetween(random, 2, 9);
    const constant =
      problemNumber <= 10 ? integerBetween(random, 1, 18) : integerBetween(random, -18, -1);
    const rightValue = coefficient * boundary + constant;
    equation = `${formatLinear(coefficient, constant)} ${baseSymbol} ${rightValue}`;
    answer = makeInequalityAnswer(coefficient, baseSymbol, rightValue - constant);
    type = problemNumber <= 10 ? "Positive coefficient" : "Negative constant";
  } else if (negativeCoefficient) {
    const coefficient = -integerBetween(random, 2, 9);
    const constant = integerBetween(random, -12, 12);
    const rightValue = coefficient * boundary + constant;
    equation = `${formatLinear(coefficient, constant)} ${baseSymbol} ${rightValue}`;
    answer = makeInequalityAnswer(coefficient, baseSymbol, rightValue - constant);
    type = "Negative coefficient";
  } else if (variablesBothSides) {
    let leftCoefficient = nonZeroBetween(random, -8, 8);
    let rightCoefficient = nonZeroBetween(random, -8, 8);
    while (leftCoefficient === rightCoefficient) {
      rightCoefficient = nonZeroBetween(random, -8, 8);
    }

    const coefficientDifference = leftCoefficient - rightCoefficient;
    const leftConstant = integerBetween(random, -12, 12);
    const rightConstant = coefficientDifference * boundary + leftConstant;
    equation = `${formatLinear(leftCoefficient, leftConstant)} ${baseSymbol} ${formatLinear(
      rightCoefficient,
      rightConstant,
    )}`;
    answer = makeInequalityAnswer(coefficientDifference, baseSymbol, rightConstant - leftConstant);
    type = "Variables on both sides";
  }

  return {
    type,
    equation,
    answer,
  };
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

function makeCoordinateGridLineProblem(random, problemNumber = 1) {
  const slopeRanges =
    problemNumber <= 10
      ? [
          [1, 1],
          [2, 1],
          [3, 1],
        ]
      : problemNumber <= 18
        ? [
            [-3, 1],
            [-2, 1],
            [-1, 1],
            [1, 1],
            [2, 1],
            [3, 1],
          ]
        : [
            [-3, 2],
            [-2, 3],
            [-1, 2],
            [1, 2],
            [2, 3],
            [3, 2],
          ];
  const [slopeNumerator, slopeDenominator] =
    slopeRanges[integerBetween(random, 0, slopeRanges.length - 1)];
  const slope = reduceFraction(slopeNumerator, slopeDenominator);
  let intercept = reduceFraction(integerBetween(random, -6, 6), 1);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  let attempts = 0;

  while (
    (x1 === x2 ||
      Math.abs(x1) > 10 ||
      Math.abs(x2) > 10 ||
      !Number.isInteger(y1) ||
      !Number.isInteger(y2) ||
      Math.abs(y1) > 10 ||
      Math.abs(y2) > 10) &&
    attempts < 80
  ) {
    x1 = slope.denominator * integerBetween(random, -4, 4);
    x2 = slope.denominator * integerBetween(random, -4, 4);
    intercept = reduceFraction(integerBetween(random, -6, 6), 1);
    y1 = fractionToNumber(slope) * x1 + fractionToNumber(intercept);
    y2 = fractionToNumber(slope) * x2 + fractionToNumber(intercept);
    attempts += 1;
  }

  const questionKind =
    problemNumber <= 10
      ? "slope"
      : problemNumber <= 18
        ? "intercept"
        : problemNumber <= 24
          ? "point"
          : "equation";
  const pointMultiplier = x1 === 0 ? 1 : x1 / slope.denominator;
  const pointX = x1 === 0 ? x2 : x1 + slope.denominator * (pointMultiplier > 0 ? -1 : 1);
  const pointY = fractionToNumber(slope) * pointX + fractionToNumber(intercept);
  const safePoint =
    Number.isInteger(pointY) && Math.abs(pointX) <= 10 && Math.abs(pointY) <= 10
      ? { x: pointX, y: pointY }
      : { x: x2, y: y2 };
  const prompts = {
    slope: "Find the slope of the line shown on the graph.",
    intercept: "Find the y-intercept of the line shown on the graph.",
    point: "Enter one point on the line shown on the graph.",
    equation: "Write the equation of the line in y = mx + b form.",
  };
  const typeLabels = {
    slope: problemNumber <= 5 ? "Positive slope from graph" : "Slope from graph",
    intercept: "Y-intercept from graph",
    point: "Point on a graphed line",
    equation: "Equation from graph",
  };

  return {
    type: typeLabels[questionKind],
    equation: prompts[questionKind],
    graphQuestion: questionKind,
    graph: {
      slope,
      intercept,
      points: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
    },
    table: {
      headers: ["Point", "x", "y"],
      rows: [
        ["A", x1, y1],
        ["B", x2, y2],
      ],
    },
    answer:
      questionKind === "slope"
        ? { slope }
        : questionKind === "intercept"
          ? { b: intercept }
          : questionKind === "point"
            ? { point: safePoint }
            : { m: slope, b: intercept },
  };
}

function makeQuadraticGraphProblem(random, problemNumber = 1) {
  const aOptions = problemNumber <= 10 ? [1, -1] : [1, -1, 2, -2];
  const questionCycle = ["vertex", "axis", "yIntercept", "xIntercepts", "equation"];
  const graphQuestion = questionCycle[(problemNumber - 1) % questionCycle.length];
  let graph = null;
  let attempts = 0;

  while (!graph && attempts < 100) {
    const a = aOptions[integerBetween(random, 0, aOptions.length - 1)];
    const rootDistance = integerBetween(random, 1, 3);
    const h = integerBetween(random, -5, 5);
    const k = -a * rootDistance * rootDistance;
    const leftRoot = h - rootDistance;
    const rightRoot = h + rootDistance;
    const yIntercept = a * h * h + k;

    if (
      leftRoot >= -10 &&
      rightRoot <= 10 &&
      Math.abs(k) <= 9 &&
      Math.abs(yIntercept) <= 10
    ) {
      graph = {
        kind: "quadratic",
        a,
        h,
        k,
        leftRoot,
        rightRoot,
        yIntercept,
        points: [
          { label: "A", x: leftRoot, y: 0 },
          { label: "V", x: h, y: k },
          { label: "B", x: rightRoot, y: 0 },
        ],
      };
    }

    attempts += 1;
  }

  if (!graph) {
    graph = {
      kind: "quadratic",
      a: 1,
      h: 0,
      k: -4,
      leftRoot: -2,
      rightRoot: 2,
      yIntercept: -4,
      points: [
        { label: "A", x: -2, y: 0 },
        { label: "V", x: 0, y: -4 },
        { label: "B", x: 2, y: 0 },
      ],
    };
  }

  const prompts = {
    vertex: "Find the vertex of the quadratic function shown on the graph.",
    axis: "Write the axis of symmetry for the parabola.",
    yIntercept: "Find the y-intercept of the quadratic function.",
    xIntercepts: "Find the x-intercepts of the quadratic function.",
    equation: "Write the equation in vertex form: y = a(x - h)^2 + k.",
  };
  const typeLabels = {
    vertex: "Vertex from graph",
    axis: "Axis of symmetry",
    yIntercept: "Y-intercept from graph",
    xIntercepts: "X-intercepts from graph",
    equation: "Equation from graph",
  };
  const answers = {
    vertex: { vertex: { x: graph.h, y: graph.k } },
    axis: { axis: graph.h },
    yIntercept: { yIntercept: graph.yIntercept },
    xIntercepts: { xIntercepts: [graph.leftRoot, graph.rightRoot] },
    equation: { a: graph.a, h: graph.h, k: graph.k },
  };

  return {
    type: typeLabels[graphQuestion],
    equation: prompts[graphQuestion],
    graphQuestion,
    graph,
    answer: answers[graphQuestion],
  };
}

function makeProblem(assignment, student, problemNumber, attempt = 0) {
  const seedText = `${assignment.id}:${student.key}:${student.name}:${problemNumber}:${attempt}`;
  const random = mulberry32(hashString(seedText));
  const problem = assignment.generator(random, problemNumber);
  return {
    ...problem,
    answerMode: assignment.answerMode || assignment.answerType || "single",
    id: `${assignment.id}-${student.key}-${problemNumber}`,
    number: problemNumber,
  };
}

function getProblemSignature(problem) {
  if (problem.graph?.kind === "quadratic") {
    return [
      "quadratic",
      problem.graphQuestion,
      problem.graph.a,
      problem.graph.h,
      problem.graph.k,
    ].join("|");
  }

  if (problem.graph?.points?.length) {
    return [
      problem.answerMode,
      problem.graphQuestion,
      ...problem.graph.points.map((point) => `${point.x},${point.y}`),
    ].join("|");
  }

  if (problem.answerMode === "expressionParts") {
    return [problem.expression, problem.equation, problem.answer?.display].join("|");
  }

  if (problem.answerMode === "combineLikeTerms") {
    return [problem.expression, problem.answer?.key].join("|");
  }

  if (problem.answerMode === "evaluateExpression") {
    return [problem.expression, problem.equation, problem.answer?.value].join("|");
  }

  if (
    problem.answerMode === "fractionValue" ||
    problem.answerMode === "textValue" ||
    problem.answerMode === "polynomialExpression"
  ) {
    return [problem.expression, problem.equation, problem.answer?.display].join("|");
  }

  return problem.equations ? problem.equations.join("|") : problem.equation;
}

function generateAssignment(student, assignment) {
  const problems = [];
  const seen = new Set();

  for (let problemNumber = 1; problemNumber <= assignment.problemCount; problemNumber += 1) {
    let attempt = 0;
    let problem = makeProblem(assignment, student, problemNumber, attempt);
    while (seen.has(getProblemSignature(problem)) && attempt < 20) {
      attempt += 1;
      problem = makeProblem(assignment, student, problemNumber, attempt);
    }
    seen.add(getProblemSignature(problem));
    problems.push(problem);
  }

  return problems;
}

function createEmptySubmissionStore() {
  return assignments.reduce((store, assignment) => {
    store[assignment.id] = {};
    return store;
  }, {});
}

function isLegacySubmissionStore(saved) {
  return Object.values(saved).some(
    (value) =>
      value &&
      typeof value === "object" &&
      "studentId" in value &&
      "correct" in value &&
      "submittedAt" in value,
  );
}

function normalizeSubmissions(saved) {
  const normalized = createEmptySubmissionStore();
  if (!saved || typeof saved !== "object") return normalized;

  if (isLegacySubmissionStore(saved)) {
    normalized[LINEAR_ASSIGNMENT_ID] = saved;
    return normalized;
  }

  Object.entries(saved).forEach(([assignmentId, submissions]) => {
    if (submissions && typeof submissions === "object") {
      normalized[assignmentId] = submissions;
    }
  });

  return normalized;
}

function mergeSubmissions(...stores) {
  const merged = createEmptySubmissionStore();

  stores.forEach((store) => {
    const normalized = normalizeSubmissions(store);
    Object.entries(normalized).forEach(([assignmentId, submissions]) => {
      if (!merged[assignmentId]) {
        merged[assignmentId] = {};
      }
      Object.entries(submissions || {}).forEach(([studentKey, submission]) => {
        const existing = merged[assignmentId][studentKey];
        if (
          !existing ||
          new Date(submission.submittedAt || 0) >= new Date(existing.submittedAt || 0)
        ) {
          merged[assignmentId][studentKey] = submission;
        }
      });
    });
  });

  return merged;
}

function loadSubmissions() {
  const savedStores = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].map((key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  });

  return mergeSubmissions(...savedStores);
}

function saveSubmissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.submissions));
}

function getAssignmentSubmissions(assignment = getSelectedAssignment()) {
  if (!state.submissions[assignment.id]) {
    state.submissions[assignment.id] = {};
  }

  return state.submissions[assignment.id];
}

function getSubmission(student, assignment = getSelectedAssignment()) {
  if (!student) return null;
  return getAssignmentSubmissions(assignment)[student.key] || null;
}

function serializeAnswers() {
  return Object.fromEntries(state.answers);
}

function restoreAnswers(savedAnswers) {
  if (!savedAnswers || typeof savedAnswers !== "object") {
    state.answers = new Map();
    return;
  }

  state.answers = new Map(Object.entries(savedAnswers));
}

function isAssignmentLocked() {
  return Boolean(state.lockedSubmission);
}

function renderAssignmentOptions() {
  const options = getAllAssignments()
    .map(
      (assignment) =>
        `<option value="${escapeHtml(assignment.id)}">${escapeHtml(getAssignmentOptionLabel(assignment))}</option>`,
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

function getAssignmentTypeConfig(typeId) {
  return CUSTOM_ASSIGNMENT_TYPES.find((type) => type.id === typeId) || CUSTOM_ASSIGNMENT_TYPES[0];
}

function getAssignmentUnitConfig(unitId) {
  return (
    CUSTOM_ASSIGNMENT_UNITS.find((unit) => unit.id === unitId) ||
    CUSTOM_ASSIGNMENT_UNITS.find((unit) => getTypesForUnit(unit.id).length) ||
    CUSTOM_ASSIGNMENT_UNITS[0]
  );
}

function getTypesForUnit(unitId) {
  return CUSTOM_ASSIGNMENT_TYPES.filter((type) => type.unitId === unitId);
}

function getDefaultAssignmentUnitId() {
  return (
    CUSTOM_ASSIGNMENT_UNITS.find((unit) => getTypesForUnit(unit.id).length)?.id ||
    CUSTOM_ASSIGNMENT_UNITS[0].id
  );
}

function getBuilderTypeConfig() {
  const unitId = elements.customAssignmentUnit?.value || getDefaultAssignmentUnitId();
  const availableTypes = getTypesForUnit(unitId);
  const selectedType = availableTypes.find((type) => type.id === elements.customAssignmentType?.value);
  return selectedType || availableTypes[0] || null;
}

function normalizeProblemCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) return 10;
  return Math.min(count, 60);
}

function normalizeCustomAssignment(data = {}, fallbackId = "") {
  const typeConfig = getAssignmentTypeConfig(data.assignmentType);
  const unitConfig = getAssignmentUnitConfig(data.assignmentUnit || typeConfig.unitId);
  const problemCount = normalizeProblemCount(data.problemCount);
  return {
    id: data.assignmentId || fallbackId,
    title: data.title || typeConfig.label,
    directions: data.directions || typeConfig.directions,
    problemCount,
    answerMode: data.answerMode || typeConfig.answerMode,
    answerPlaceholder: data.answerPlaceholder || "value",
    generator: typeConfig.generator,
    isTeacherCreated: true,
    assignmentUnit: unitConfig.id,
    assignmentUnitLabel: unitConfig.label,
    assignmentType: typeConfig.id,
    assignmentTypeLabel: typeConfig.label,
    difficulty: data.difficulty || "mixed",
    dueDate: data.dueDate || "",
    classPeriod: data.classPeriod || "",
    showImmediateFeedback: data.showImmediateFeedback === true,
    allowRetries: data.allowRetries === true,
    maxAttempts: normalizeProblemCount(data.maxAttempts || 1),
    timeLimitMinutes: Number(data.timeLimitMinutes || 0),
    teacherUid: data.teacherUid || "",
    active: data.active !== false,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function shouldShowCustomAssignment(assignment) {
  if (!assignment.active) return false;
  if (!elements.customAssignmentList) return true;
  if (state.account?.role === "admin") return true;
  return !assignment.teacherUid || assignment.teacherUid === state.account?.uid;
}

function subscribeCustomAssignments() {
  if (state.assignmentUnsubscribe) {
    state.assignmentUnsubscribe();
    state.assignmentUnsubscribe = null;
  }

  if (!firebaseConfigured || !db || !state.account) {
    state.customAssignments = [];
    renderAssignmentOptions();
    renderCustomAssignmentList();
    return;
  }

  state.assignmentUnsubscribe = onSnapshot(
    collection(db, "assignments"),
    (snapshot) => {
      state.customAssignments = snapshot.docs
        .map((assignmentDoc) => normalizeCustomAssignment(assignmentDoc.data(), assignmentDoc.id))
        .filter(shouldShowCustomAssignment)
        .sort((left, right) => left.title.localeCompare(right.title));

      if (!getAllAssignments().some((assignment) => assignment.id === getSelectedAssignment().id)) {
        state.selectedAssignment = assignments[0];
      }

      renderAssignmentOptions();
      renderCustomAssignmentList();
      updateAssignmentDisplay();
      renderDashboard();
    },
    (error) => {
      setBanner(
        elements.teacherNote,
        error.message || "Unable to load teacher-created assignments.",
        "danger",
      );
    },
  );
}

function renderAssignmentBuilderOptions() {
  if (!elements.customAssignmentUnit || !elements.customAssignmentType) return;

  elements.customAssignmentUnit.innerHTML = CUSTOM_ASSIGNMENT_UNITS.map(
    (unit) => `<option value="${unit.id}">${escapeHtml(unit.label)}</option>`,
  ).join("");
  elements.customAssignmentUnit.value = elements.customAssignmentUnit.value || getDefaultAssignmentUnitId();
  renderAssignmentTypeOptions();
}

function renderAssignmentTypeOptions() {
  if (!elements.customAssignmentUnit || !elements.customAssignmentType) return;

  const unitId = elements.customAssignmentUnit.value || getDefaultAssignmentUnitId();
  const availableTypes = getTypesForUnit(unitId);
  const currentTypeId = elements.customAssignmentType.value;

  if (!availableTypes.length) {
    elements.customAssignmentType.innerHTML = `<option value="">No assignment types yet</option>`;
    elements.customAssignmentType.disabled = true;
    setDisabled(elements.saveAssignmentButton, true);
    return;
  }

  elements.customAssignmentType.disabled = false;
  setDisabled(elements.saveAssignmentButton, false);
  elements.customAssignmentType.innerHTML = availableTypes.map(
    (type) => `<option value="${type.id}">${escapeHtml(type.label)}</option>`,
  ).join("");
  elements.customAssignmentType.value = availableTypes.some((type) => type.id === currentTypeId)
    ? currentTypeId
    : availableTypes[0].id;
}

function getCustomProblemCountInput() {
  const selected = elements.customProblemCount?.value || "10";
  if (selected === "custom") {
    return normalizeProblemCount(elements.customProblemCountOther?.value || 10);
  }
  return normalizeProblemCount(selected);
}

function getCustomAssignmentDraft() {
  const unitConfig = getAssignmentUnitConfig(elements.customAssignmentUnit?.value);
  const typeConfig = getBuilderTypeConfig();

  if (!typeConfig) {
    return null;
  }

  const title = elements.customAssignmentTitle?.value.trim() || typeConfig.label;
  const problemCount = getCustomProblemCountInput();
  const timeEnabled = elements.customTimeEnabled?.checked === true;
  const classPeriod = elements.customClassPeriod?.value.trim();

  return {
    id: `preview-${typeConfig.id}`,
    title,
    assignmentUnit: unitConfig.id,
    assignmentUnitLabel: unitConfig.label,
    assignmentType: typeConfig.id,
    assignmentTypeLabel: typeConfig.label,
    answerMode: typeConfig.answerMode,
    answerPlaceholder: "value",
    directions: typeConfig.directions,
    problemCount,
    difficulty: elements.customDifficulty?.value || "mixed",
    classKey: classPeriod || "default",
    classPeriod: classPeriod || "Default class",
    dueDate: elements.customDueDate?.value || "",
    showImmediateFeedback: elements.customFeedbackMode?.value === "immediate",
    allowRetries: elements.customAllowRetries?.checked === true,
    maxAttempts: normalizeProblemCount(elements.customMaxAttempts?.value || 1),
    timeLimitMinutes: timeEnabled ? normalizeProblemCount(elements.customTimeLimit?.value || 30) : 0,
    generator: typeConfig.generator,
  };
}

function getCustomAssignmentPayload() {
  const draft = getCustomAssignmentDraft();
  if (!draft) return null;

  const assignmentId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    assignmentId,
    isTeacherCreated: true,
    teacherUid: state.account?.uid || "",
    title: draft.title,
    assignmentUnit: draft.assignmentUnit,
    assignmentUnitLabel: draft.assignmentUnitLabel,
    assignmentType: draft.assignmentType,
    assignmentTypeLabel: draft.assignmentTypeLabel,
    answerMode: draft.answerMode,
    directions: draft.directions,
    problemCount: draft.problemCount,
    difficulty: draft.difficulty,
    assignedClassIds: [draft.classKey || "default"],
    classPeriod: draft.classPeriod,
    dueDate: draft.dueDate,
    showImmediateFeedback: draft.showImmediateFeedback,
    allowRetries: draft.allowRetries,
    maxAttempts: draft.maxAttempts,
    timeLimitMinutes: draft.timeLimitMinutes,
    resetKey: "initial",
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function formatExpectedAnswer(problem) {
  if (problem.answerMode === "pair") {
    return `(${problem.answer.x}, ${problem.answer.y})`;
  }

  if (problem.answerMode === "slope") {
    return problem.answer.kind === "undefined"
      ? "undefined"
      : formatFractionValue(problem.answer);
  }

  if (problem.answerMode === "slopeIntercept") {
    return `m = ${formatFractionValue(problem.answer.m)}, b = ${formatFractionValue(
      problem.answer.b,
    )}`;
  }

  if (problem.answerMode === "inequality") {
    return `x ${problem.answer.symbol} ${problem.answer.boundary}`;
  }

  if (problem.answerMode === "graphLine") {
    if (problem.graphQuestion === "slope") {
      return formatFractionValue(problem.answer.slope);
    }
    if (problem.graphQuestion === "intercept") {
      return `b = ${formatFractionValue(problem.answer.b)}`;
    }
    if (problem.graphQuestion === "point") {
      return `Any point on the line, such as (${problem.answer.point.x}, ${problem.answer.point.y})`;
    }
    return formatSlopeInterceptEquation(problem.answer.m, problem.answer.b);
  }

  if (problem.answerMode === "graphQuadratic") {
    if (problem.graphQuestion === "vertex") {
      return `(${problem.answer.vertex.x}, ${problem.answer.vertex.y})`;
    }
    if (problem.graphQuestion === "axis") {
      return `x = ${problem.answer.axis}`;
    }
    if (problem.graphQuestion === "yIntercept") {
      return `(0, ${problem.answer.yIntercept})`;
    }
    if (problem.graphQuestion === "xIntercepts") {
      return problem.answer.xIntercepts.map((x) => `(${x}, 0)`).join(" and ");
    }
    return formatQuadraticVertexEquation(problem.answer.a, problem.answer.h, problem.answer.k);
  }

  if (problem.answerMode === "expressionParts") {
    return problem.answer.display || `${problem.answer.value}`;
  }

  if (problem.answerMode === "combineLikeTerms") {
    return problem.answer.display;
  }

  if (problem.answerMode === "evaluateExpression") {
    return problem.answer.display;
  }

  if (problem.answerMode === "functionValue") {
    return `${problem.answer}`;
  }

  if (problem.answerMode === "fractionValue") {
    return formatFractionValue(problem.answer);
  }

  if (problem.answerMode === "textValue") {
    return problem.answer.display;
  }

  if (problem.answerMode === "polynomialExpression") {
    return problem.answer.display;
  }

  return `x = ${problem.answer}`;
}

function answersToMap(savedAnswers) {
  if (!savedAnswers || typeof savedAnswers !== "object") {
    return new Map();
  }
  return new Map(Object.entries(savedAnswers));
}

function formatSubmittedAnswer(problem, answers = new Map()) {
  const answer = answers.get(problem.id);
  if (!answer || typeof answer !== "object") return "";

  if (problem.answerMode === "pair") {
    return answer.x || answer.y ? `(${answer.x || "blank"}, ${answer.y || "blank"})` : "";
  }

  if (problem.answerMode === "slope") {
    if (answer.kind === "undefined") return "undefined";
    return answer.numerator || answer.denominator
      ? `${answer.numerator || "blank"}/${answer.denominator || "blank"}`
      : "";
  }

  if (problem.answerMode === "slopeIntercept") {
    return answer.m || answer.b ? `m = ${answer.m || "blank"}, b = ${answer.b || "blank"}` : "";
  }

  if (problem.answerMode === "inequality") {
    return answer.symbol || answer.boundary
      ? `x ${answer.symbol || "?"} ${answer.boundary || "blank"}`
      : "";
  }

  if (problem.answerMode === "graphLine") {
    if (problem.graphQuestion === "slope") {
      return answer.numerator || answer.denominator
        ? `${answer.numerator || "blank"}/${answer.denominator || "blank"}`
        : "";
    }
    if (problem.graphQuestion === "intercept") {
      return answer.b ? `b = ${answer.b}` : "";
    }
    if (problem.graphQuestion === "point") {
      return answer.x || answer.y ? `(${answer.x || "blank"}, ${answer.y || "blank"})` : "";
    }
    return answer.m || answer.b ? `m = ${answer.m || "blank"}, b = ${answer.b || "blank"}` : "";
  }

  if (problem.answerMode === "graphQuadratic") {
    if (problem.graphQuestion === "vertex") {
      return answer.x || answer.y ? `(${answer.x || "blank"}, ${answer.y || "blank"})` : "";
    }
    if (problem.graphQuestion === "axis") {
      return answer.axis ? `x = ${answer.axis}` : "";
    }
    if (problem.graphQuestion === "yIntercept") {
      return answer.y ? `(0, ${answer.y})` : "";
    }
    if (problem.graphQuestion === "xIntercepts") {
      return answer.x1 || answer.x2
        ? `(${answer.x1 || "blank"}, 0), (${answer.x2 || "blank"}, 0)`
        : "";
    }
    return answer.a || answer.h || answer.k
      ? `a = ${answer.a || "blank"}, h = ${answer.h || "blank"}, k = ${answer.k || "blank"}`
      : "";
  }

  if (problem.answerMode === "expressionParts") {
    return answer.value || "";
  }

  if (problem.answerMode === "combineLikeTerms") {
    return answer.expression || "";
  }

  if (problem.answerMode === "evaluateExpression") {
    return answer.value || "";
  }

  if (problem.answerMode === "functionValue") {
    return answer.value || "";
  }

  if (problem.answerMode === "fractionValue") {
    return answer.value || "";
  }

  if (problem.answerMode === "textValue") {
    return answer.value || "";
  }

  if (problem.answerMode === "polynomialExpression") {
    return answer.expression || "";
  }

  return answer.x || "";
}

function getReviewStatus(problem, answers) {
  if (!hasAnswerForProblem(problem, answers)) {
    return { label: "No answer", className: "is-pending" };
  }

  return getProblemResult(problem, answers) === "correct"
    ? { label: "Correct", className: "is-correct" }
    : { label: "Incorrect", className: "is-wrong" };
}

function renderReviewProblemCard(problem, answers = new Map(), options = {}) {
  const isPreview = options.preview === true;
  const assignmentTitle = options.assignmentTitle || getSelectedAssignment().title;
  const status = isPreview ? { label: "Preview", className: "is-preview" } : getReviewStatus(problem, answers);
  const submittedAnswer = isPreview ? "" : formatSubmittedAnswer(problem, answers);
  const reviewClasses = [
    "review-card",
    status.className,
    ["graphLine", "graphQuadratic"].includes(problem.answerMode) ? "is-graph-review" : "",
    [
      "expressionParts",
      "combineLikeTerms",
      "evaluateExpression",
      "fractionValue",
      "textValue",
      "polynomialExpression",
    ].includes(problem.answerMode)
      ? "is-expression-review"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <article class="${reviewClasses}">
      <div class="review-card-header">
        <span class="problem-number">${problem.number}</span>
        <div>
          <p class="problem-type">${escapeHtml(problem.type || assignmentTitle)}</p>
          <div class="equation">${renderProblemPrompt(problem)}</div>
        </div>
        <span class="review-status">${status.label}</span>
      </div>
      <div class="review-answer-grid">
        ${
          isPreview
            ? ""
            : `<div>
                <span>Student answer</span>
                <strong>${escapeHtml(submittedAnswer || "Not answered")}</strong>
              </div>`
        }
        <div>
          <span>Answer key</span>
          <strong>${renderMathText(formatExpectedAnswer(problem))}</strong>
        </div>
      </div>
    </article>
  `;
}

function renderAssignmentPreview() {
  if (!elements.assignmentPreview || !elements.customAssignmentType) return;

  const assignment = getCustomAssignmentDraft();

  if (!assignment) {
    const unitConfig = getAssignmentUnitConfig(elements.customAssignmentUnit?.value);
    elements.assignmentPreview.innerHTML = `
      <div class="empty-state compact-empty">
        No assignment types have been added to ${escapeHtml(unitConfig.label)} yet.
      </div>
    `;
    return;
  }

  const previewStudent = { key: "preview-student", name: "Preview Student" };
  const previewProblems = generateAssignment(previewStudent, assignment);

  elements.assignmentPreview.innerHTML = `
    <div class="preview-heading">
      <div>
        <p class="eyebrow">${escapeHtml(assignment.assignmentUnitLabel)}</p>
        <h3>${escapeHtml(assignment.title)}</h3>
      </div>
      <span>${assignment.problemCount} problems</span>
    </div>
    <div class="student-work-problems preview-problems">
      ${previewProblems
        .map((problem) =>
          renderReviewProblemCard(problem, new Map(), {
            assignmentTitle: assignment.title,
            preview: true,
          }),
        )
        .join("")}
    </div>
  `;
}

function renderCustomAssignmentList() {
  if (!elements.customAssignmentList) return;
  if (!state.customAssignments.length) {
    elements.customAssignmentList.innerHTML = `<div class="empty-state compact-empty">No teacher-created assignments yet.</div>`;
    return;
  }

  elements.customAssignmentList.innerHTML = state.customAssignments
    .map(
      (assignment) => `
        <article class="assignment-card">
          <div>
            <p class="eyebrow">${escapeHtml(
              assignment.assignmentUnitLabel || assignment.assignmentTypeLabel || assignment.assignmentType,
            )}</p>
            <h3>${escapeHtml(assignment.title)}</h3>
            <p>${assignment.assignmentTypeLabel ? `${escapeHtml(assignment.assignmentTypeLabel)} - ` : ""}${
              assignment.problemCount
            } problems - ${escapeHtml(assignment.difficulty)} - ${escapeHtml(
              assignment.classPeriod || "Default class",
            )}</p>
          </div>
          <span>${assignment.showImmediateFeedback ? "Immediate feedback" : "After submission"}</span>
        </article>
      `,
    )
    .join("");
}

async function saveCustomAssignment() {
  if (!state.account || !["teacher", "admin"].includes(state.account.role)) return;
  if (!firebaseConfigured || !db) {
    setBanner(elements.teacherNote, "Firebase is not configured for this deployment.", "danger");
    return;
  }

  const payload = getCustomAssignmentPayload();
  if (!payload) {
    setBanner(elements.teacherNote, "Choose a unit with at least one assignment type.", "warning");
    return;
  }

  setDisabled(elements.saveAssignmentButton, true);
  setBanner(elements.teacherNote, "Creating assignment...", "neutral");

  try {
    await setDoc(doc(db, "assignments", payload.assignmentId), payload, { merge: true });
    const createdAssignment = normalizeCustomAssignment(payload, payload.assignmentId);
    state.customAssignments = [
      ...state.customAssignments.filter((assignment) => assignment.id !== createdAssignment.id),
      createdAssignment,
    ].sort((left, right) => left.title.localeCompare(right.title));
    renderAssignmentOptions();
    renderCustomAssignmentList();
    setBanner(
      elements.teacherNote,
      `${payload.title} was created with ${payload.problemCount} problems.`,
      "success",
    );
    if (elements.customAssignmentTitle) elements.customAssignmentTitle.value = "";
    selectAssignment(payload.assignmentId);
  } catch (error) {
    setBanner(elements.teacherNote, error.message || "Unable to create assignment.", "danger");
  } finally {
    setDisabled(elements.saveAssignmentButton, false);
  }
}

function renderStudentAccess() {
  if (!elements.studentId) return;

  elements.studentId.value = "";
  setAccessNote("");
}

function updateAssignmentDisplay() {
  const assignment = getSelectedAssignment();
  setText(elements.assignmentDirections, assignment.directions);
  renderHeaderCounts();
}

function resetStudentWorkspace(title = "Enter your student ID to begin") {
  state.selectedStudent = null;
  state.lockedSubmission = null;
  state.problems = [];
  state.answers = new Map();
  setText(elements.assignmentTitle, title);
  setText(elements.submissionNote, "");
  if (elements.submitAssignment) {
    elements.submitAssignment.disabled = true;
    elements.submitAssignment.textContent = "Submit Grade";
  }
  renderProblems();
  updateStudentScore();
}

function selectAssignment(assignmentId, options = {}) {
  state.selectedAssignment = getAssignmentById(assignmentId);
  if (elements.assignmentSelect) {
    elements.assignmentSelect.value = state.selectedAssignment.id;
  }
  if (elements.dashboardAssignmentSelect) {
    elements.dashboardAssignmentSelect.value = state.selectedAssignment.id;
  }

  updateAssignmentDisplay();

  if (options.resetStudentWork) {
    setAccessNote("");
    resetStudentWorkspace();
  }

  renderDashboard();
  renderStudentWorkPanel(state.selectedWorkStudentKey);
}

async function loadSelectedStudent() {
  if (!elements.studentId) return;

  const assignment = getSelectedAssignment();
  const accessCode = normalizeStudentId(elements.studentId.value);
  elements.studentId.value = accessCode;

  if (accessCode.length !== 9) {
    resetStudentWorkspace();
    setAccessNote("Use the full 9-digit student ID.", "error");
    return;
  }

  let student = null;
  try {
    student = await findStudentByAccessCode(accessCode);
  } catch {
    resetStudentWorkspace("Access check unavailable");
    setAccessNote("Open this page from GitHub Pages or localhost and try again.", "error");
    return;
  }

  if (!student) {
    resetStudentWorkspace("Student ID not found");
    setAccessNote("Check the number and try again.", "error");
    return;
  }

  state.selectedStudent = student;
  state.problems = generateAssignment(student, assignment);
  state.lockedSubmission = getSubmission(student, assignment);
  restoreAnswers(state.lockedSubmission?.answers);
  elements.assignmentTitle.textContent = `${student.name}'s ${assignment.problemCount} ${assignment.title.toLowerCase()} problems`;
  setText(
    elements.submissionNote,
    state.lockedSubmission
      ? `Submitted: ${state.lockedSubmission.correct} out of ${state.lockedSubmission.total} (${state.lockedSubmission.percent}%). Ask your teacher to reset this attempt before trying again.`
      : "",
  );
  setAccessNote(
    state.lockedSubmission
      ? `Submitted attempt loaded for ${student.name}.`
      : `Access granted for ${student.name}.`,
    "success",
  );
  if (elements.submitAssignment) {
    elements.submitAssignment.disabled = isAssignmentLocked();
    elements.submitAssignment.textContent = isAssignmentLocked() ? "Submitted" : "Submit Grade";
  }
  renderProblems();
  updateStudentScore();
}

function getAnswerRowClass(problem) {
  if (problem.answerMode === "pair") return "is-pair";
  if (problem.answerMode === "slope") return "is-slope";
  if (problem.answerMode === "slopeIntercept") return "is-slope-intercept";
  if (problem.answerMode === "inequality") return "is-inequality";
  if (problem.answerMode === "expressionParts") return "is-expression-parts";
  if (problem.answerMode === "combineLikeTerms") return "is-combine-like-terms";
  if (problem.answerMode === "evaluateExpression") return "is-evaluate-expression";
  if (problem.answerMode === "functionValue") return "is-function-value";
  if (problem.answerMode === "fractionValue") return "is-fraction-value";
  if (problem.answerMode === "textValue") return "is-text-value";
  if (problem.answerMode === "polynomialExpression") return "is-polynomial-expression";
  if (problem.answerMode === "graphLine") return `is-graph-line is-graph-${problem.graphQuestion}`;
  if (problem.answerMode === "graphQuadratic") {
    return `is-graph-quadratic is-quadratic-${problem.graphQuestion.toLowerCase()}`;
  }
  return "";
}

function renderFractionExpression(tokens = []) {
  return tokens
    .map((token) => {
      if (token.kind === "fraction") {
        return `
          <span class="inline-fraction">
            <span>${escapeHtml(token.numerator)}</span>
            <span>${escapeHtml(token.denominator)}</span>
          </span>
        `;
      }

      if (token.kind === "operator") {
        return `<span class="complex-fraction-operator">${escapeHtml(token.value)}</span>`;
      }

      return `<span class="complex-fraction-text">${escapeHtml(token.value)}</span>`;
    })
    .join("");
}

function renderComplexFraction(problem) {
  if (!problem.complexFraction) return `<strong>${escapeHtml(problem.expression)}</strong>`;
  return `
    <div class="complex-fraction" aria-label="${escapeHtml(problem.expression)}">
      <div class="complex-fraction-section">${renderFractionExpression(
        problem.complexFraction.numerator,
      )}</div>
      <div class="complex-fraction-bar" aria-hidden="true"></div>
      <div class="complex-fraction-section">${renderFractionExpression(
        problem.complexFraction.denominator,
      )}</div>
    </div>
  `;
}

function renderProblemPrompt(problem) {
  if (problem.answerMode === "textValue" || problem.answerMode === "polynomialExpression") {
    return `
      <div class="expression-parts-prompt">
        <span>${escapeHtml(problem.promptLabel || "Expression")}</span>
        ${problem.expression ? `<strong>${renderMathText(problem.expression)}</strong>` : ""}
        <p>${escapeHtml(problem.equation)}</p>
        ${renderMathTable(problem.table)}
      </div>
    `;
  }

  if (problem.answerMode === "fractionValue") {
    return `
      <div class="expression-parts-prompt">
        <span>Complex Fraction</span>
        ${renderComplexFraction(problem)}
        <p>${escapeHtml(problem.equation)}</p>
      </div>
    `;
  }

  if (
    problem.answerMode === "expressionParts" ||
    problem.answerMode === "combineLikeTerms" ||
    problem.answerMode === "evaluateExpression"
  ) {
    return `
      <div class="expression-parts-prompt">
        <span>Expression</span>
        <strong>${renderMathText(problem.expression)}</strong>
        <p>${escapeHtml(problem.equation)}</p>
        ${renderMathTable(problem.table)}
      </div>
    `;
  }

  if (problem.answerMode === "graphLine" || problem.answerMode === "graphQuadratic") {
    return `
      <div class="graph-problem">
        ${renderCoordinateGrid(problem)}
        <div class="graph-prompt-stack">
          <p>${escapeHtml(problem.equation)}</p>
          ${renderMathTable(problem.table)}
        </div>
      </div>
    `;
  }

  if (problem.equations) {
    return `<div class="system-equations">${problem.equations
      .map((equation) => `<span>${escapeHtml(equation)}</span>`)
      .join("")}</div>${renderMathTable(problem.table)}`;
  }

  return `${escapeHtml(problem.equation)}${renderMathTable(problem.table)}`;
}

function renderMathTable(table) {
  if (!table?.headers?.length || !Array.isArray(table.rows)) return "";
  return `
    <div class="math-table-wrap">
      <table class="math-table">
        <thead>
          <tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${table.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function makeCoordinateGridParts(toSvgX, toSvgY) {
  const gridLines = [];
  const tickLabels = [];

  for (let value = -10; value <= 10; value += 1) {
    const position = toSvgX(value);
    const axisClass = value === 0 ? "grid-axis" : "grid-line";
    gridLines.push(
      `<line class="${axisClass}" x1="${position}" y1="${toSvgY(-10)}" x2="${position}" y2="${toSvgY(10)}" />`,
      `<line class="${axisClass}" x1="${toSvgX(-10)}" y1="${position}" x2="${toSvgX(10)}" y2="${position}" />`,
    );
    if (value !== 0) {
      tickLabels.push(
        `<text class="x-tick" x="${toSvgX(value)}" y="${toSvgY(0) + 9}">${value}</text>`,
        `<text class="y-tick" x="${toSvgX(0) - 5}" y="${toSvgY(value) + 2}">${value}</text>`,
      );
    }
  }

  return { gridLines, tickLabels };
}

function renderAxisLabels(toSvgX, toSvgY, tickLabels) {
  return `
    <g class="axis-labels" aria-hidden="true">
      <text x="${toSvgX(10) + 8}" y="${toSvgY(0) + 4}">x</text>
      <text x="${toSvgX(0) + 5}" y="${toSvgY(10) - 6}">y</text>
      ${tickLabels.join("")}
    </g>
  `;
}

function clampGraphLabel(value) {
  return Math.max(8, Math.min(252, value));
}

function getQuadraticLabelPosition(point, graph, toSvgX, toSvgY) {
  const baseX = toSvgX(point.x);
  const baseY = toSvgY(point.y);

  if (point.label === "V") {
    return {
      x: clampGraphLabel(baseX),
      y: clampGraphLabel(baseY + (graph.a > 0 ? 18 : -18)),
    };
  }

  const svgSlope = -2 * graph.a * (point.x - graph.h);
  const length = Math.hypot(1, svgSlope) || 1;
  const normal = { x: -svgSlope / length, y: 1 / length };
  const preferredSign = point.x < graph.h ? -1 : 1;
  const offsets = [
    preferredSign * 18,
    -preferredSign * 18,
    preferredSign * 22,
    -preferredSign * 22,
  ];
  const candidates = offsets.map((offset) => ({
    x: baseX + normal.x * offset,
    y: baseY + normal.y * offset,
  }));
  const chosen =
    candidates.find(
      (candidate) =>
        candidate.x >= 8 && candidate.x <= 252 && candidate.y >= 8 && candidate.y <= 252,
    ) || candidates[0];

  return {
    x: clampGraphLabel(chosen.x),
    y: clampGraphLabel(chosen.y),
  };
}

function renderCoordinateGrid(problem) {
  if (problem.graph?.kind === "quadratic") {
    return renderQuadraticCoordinateGrid(problem);
  }

  const size = 260;
  const center = size / 2;
  const unit = 11;
  const toSvgX = (value) => center + value * unit;
  const toSvgY = (value) => center - value * unit;
  const slope = problem.graph.slope;
  const intercept = problem.graph.intercept;
  const start = { x: -10, y: fractionToNumber(slope) * -10 + fractionToNumber(intercept) };
  const end = { x: 10, y: fractionToNumber(slope) * 10 + fractionToNumber(intercept) };
  const clipId = `grid-clip-${problem.id.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const { gridLines, tickLabels } = makeCoordinateGridParts(toSvgX, toSvgY);

  return `
    <figure class="coordinate-graph" aria-label="Coordinate grid from -10 to 10">
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Line through (${problem.graph.points[0].x}, ${problem.graph.points[0].y}) and (${problem.graph.points[1].x}, ${problem.graph.points[1].y})">
        <defs>
          <clipPath id="${clipId}">
            <rect x="${toSvgX(-10)}" y="${toSvgY(10)}" width="${unit * 20}" height="${unit * 20}" />
          </clipPath>
        </defs>
        <rect class="grid-background" x="${toSvgX(-10)}" y="${toSvgY(10)}" width="${unit * 20}" height="${unit * 20}" />
        ${gridLines.join("")}
        <g clip-path="url(#${clipId})">
          <line
            class="graph-line"
            x1="${toSvgX(start.x)}"
            y1="${toSvgY(start.y)}"
            x2="${toSvgX(end.x)}"
            y2="${toSvgY(end.y)}"
          />
        </g>
        ${renderAxisLabels(toSvgX, toSvgY, tickLabels)}
        ${problem.graph.points
          .map(
            (point, index) => `
              <g class="graph-point">
                <circle cx="${toSvgX(point.x)}" cy="${toSvgY(point.y)}" r="3.1" />
                <text x="${toSvgX(point.x) + 5}" y="${toSvgY(point.y) - 5}">${index === 0 ? "A" : "B"}</text>
              </g>
            `,
          )
          .join("")}
      </svg>
    </figure>
  `;
}

function renderQuadraticCoordinateGrid(problem) {
  const size = 260;
  const center = size / 2;
  const unit = 11;
  const toSvgX = (value) => center + value * unit;
  const toSvgY = (value) => center - value * unit;
  const clipId = `grid-clip-${problem.id.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const { gridLines, tickLabels } = makeCoordinateGridParts(toSvgX, toSvgY);
  const graph = problem.graph;
  const curvePath = [];

  for (let x = -10; x <= 10.001; x += 0.25) {
    const y = graph.a * (x - graph.h) ** 2 + graph.k;
    curvePath.push(
      `${curvePath.length ? "L" : "M"} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`,
    );
  }

  return `
    <figure class="coordinate-graph" aria-label="Coordinate grid from -10 to 10">
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Quadratic function with vertex (${graph.h}, ${graph.k})">
        <defs>
          <clipPath id="${clipId}">
            <rect x="${toSvgX(-10)}" y="${toSvgY(10)}" width="${unit * 20}" height="${unit * 20}" />
          </clipPath>
        </defs>
        <rect class="grid-background" x="${toSvgX(-10)}" y="${toSvgY(10)}" width="${unit * 20}" height="${unit * 20}" />
        ${gridLines.join("")}
        <g clip-path="url(#${clipId})">
          <path class="graph-curve" d="${curvePath.join(" ")}" />
        </g>
        ${renderAxisLabels(toSvgX, toSvgY, tickLabels)}
        ${graph.points
          .map((point) => {
            const labelPosition = getQuadraticLabelPosition(point, graph, toSvgX, toSvgY);
            return `
              <g class="graph-point">
                <circle cx="${toSvgX(point.x)}" cy="${toSvgY(point.y)}" r="3.1" />
                <text x="${labelPosition.x.toFixed(2)}" y="${labelPosition.y.toFixed(2)}">${point.label}</text>
              </g>
            `;
          })
          .join("")}
      </svg>
    </figure>
  `;
}

function renderAnswerInputs(problem) {
  const lockedAttribute = isAssignmentLocked() ? "disabled" : "";

  if (problem.answerMode === "pair") {
    return `
      <label class="answer-field">
        <span>x</span>
        <input type="text" inputmode="decimal" aria-label="x value for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x" placeholder="x" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>y</span>
        <input type="text" inputmode="decimal" aria-label="y value for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="y" placeholder="y" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "slope") {
    return `
      <label class="answer-field slope-kind-field">
        <span>Type</span>
        <select aria-label="Slope type for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="kind" ${lockedAttribute}>
          <option value="number">Number</option>
          <option value="undefined">Undefined</option>
        </select>
      </label>
      <label class="answer-field">
        <span>Num.</span>
        <input type="text" inputmode="numeric" aria-label="Slope numerator for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="numerator" placeholder="rise" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>Den.</span>
        <input type="text" inputmode="numeric" aria-label="Slope denominator for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="denominator" placeholder="run" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "slopeIntercept") {
    return `
      <label class="answer-field">
        <span>m</span>
        <input type="text" inputmode="text" aria-label="Slope m for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="m" placeholder="m" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>b</span>
        <input type="text" inputmode="text" aria-label="Y-intercept b for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="b" placeholder="b" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "inequality") {
    return `
      <label class="answer-field">
        <span>x</span>
        <select aria-label="Inequality symbol for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="symbol" ${lockedAttribute}>
          <option value="<">&lt;</option>
          <option value=">">&gt;</option>
          <option value="<=">&lt;=</option>
          <option value=">=">&gt;=</option>
        </select>
      </label>
      <label class="answer-field">
        <span>Boundary</span>
        <input type="text" inputmode="numeric" aria-label="Boundary number for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="boundary" placeholder="number" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "graphLine") {
    if (problem.graphQuestion === "slope") {
      return `
        <label class="answer-field">
          <span>Rise</span>
          <input type="text" inputmode="numeric" aria-label="Slope numerator for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="numerator" placeholder="num." ${lockedAttribute} />
        </label>
        <label class="answer-field">
          <span>Run</span>
          <input type="text" inputmode="numeric" aria-label="Slope denominator for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="denominator" placeholder="den." ${lockedAttribute} />
        </label>
      `;
    }

    if (problem.graphQuestion === "intercept") {
      return `
        <label class="answer-field">
          <span>b</span>
          <input type="text" inputmode="text" aria-label="Y-intercept for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="b" placeholder="b" ${lockedAttribute} />
        </label>
      `;
    }

    if (problem.graphQuestion === "point") {
      return `
        <label class="answer-field">
          <span>x</span>
          <input type="text" inputmode="numeric" aria-label="x-coordinate for a point on problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x" placeholder="x" ${lockedAttribute} />
        </label>
        <label class="answer-field">
          <span>y</span>
          <input type="text" inputmode="numeric" aria-label="y-coordinate for a point on problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="y" placeholder="y" ${lockedAttribute} />
        </label>
      `;
    }

    return `
      <label class="answer-field">
        <span>m</span>
        <input type="text" inputmode="text" aria-label="Slope m for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="m" placeholder="m" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>b</span>
        <input type="text" inputmode="text" aria-label="Y-intercept b for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="b" placeholder="b" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "graphQuadratic") {
    if (problem.graphQuestion === "vertex") {
      return `
        <label class="answer-field">
          <span>x</span>
          <input type="text" inputmode="numeric" aria-label="Vertex x-coordinate for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x" placeholder="x" ${lockedAttribute} />
        </label>
        <label class="answer-field">
          <span>y</span>
          <input type="text" inputmode="numeric" aria-label="Vertex y-coordinate for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="y" placeholder="y" ${lockedAttribute} />
        </label>
      `;
    }

    if (problem.graphQuestion === "axis") {
      return `
        <label class="answer-field">
          <span>x =</span>
          <input type="text" inputmode="numeric" aria-label="Axis of symmetry for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="axis" placeholder="number" ${lockedAttribute} />
        </label>
      `;
    }

    if (problem.graphQuestion === "yIntercept") {
      return `
        <label class="answer-field">
          <span>y</span>
          <input type="text" inputmode="numeric" aria-label="Y-intercept value for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="y" placeholder="y" ${lockedAttribute} />
        </label>
      `;
    }

    if (problem.graphQuestion === "xIntercepts") {
      return `
        <label class="answer-field">
          <span>x1</span>
          <input type="text" inputmode="numeric" aria-label="First x-intercept for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x1" placeholder="x" ${lockedAttribute} />
        </label>
        <label class="answer-field">
          <span>x2</span>
          <input type="text" inputmode="numeric" aria-label="Second x-intercept for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x2" placeholder="x" ${lockedAttribute} />
        </label>
      `;
    }

    return `
      <label class="answer-field">
        <span>a</span>
        <input type="text" inputmode="numeric" aria-label="Quadratic coefficient a for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="a" placeholder="a" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>h</span>
        <input type="text" inputmode="numeric" aria-label="Vertex form h for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="h" placeholder="h" ${lockedAttribute} />
      </label>
      <label class="answer-field">
        <span>k</span>
        <input type="text" inputmode="numeric" aria-label="Vertex form k for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="k" placeholder="k" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "expressionParts") {
    return `
      <label class="answer-field">
        <span>Answer</span>
        <input type="text" inputmode="text" aria-label="Answer for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="value" placeholder="answer" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "combineLikeTerms") {
    return `
      <label class="answer-field">
        <span>Simplified</span>
        <input type="text" inputmode="text" aria-label="Simplified expression for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="expression" placeholder="simplified expression" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "evaluateExpression") {
    return `
      <label class="answer-field">
        <span>Value</span>
        <input type="text" inputmode="numeric" aria-label="Final evaluated value for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="value" placeholder="value" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "functionValue") {
    return `
      <label class="answer-field">
        <span>Answer</span>
        <input type="text" inputmode="numeric" aria-label="Answer for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="value" placeholder="value" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "fractionValue") {
    return `
      <label class="answer-field">
        <span>Simplified</span>
        <input type="text" inputmode="text" aria-label="Simplified fraction for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="value" placeholder="fraction or decimal" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "textValue") {
    return `
      <label class="answer-field">
        <span>Answer</span>
        <input type="text" inputmode="text" aria-label="Answer for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="value" placeholder="answer" ${lockedAttribute} />
      </label>
    `;
  }

  if (problem.answerMode === "polynomialExpression") {
    return `
      <label class="answer-field">
        <span>Simplified</span>
        <input type="text" inputmode="text" aria-label="Simplified polynomial for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="expression" placeholder="simplified polynomial" ${lockedAttribute} />
      </label>
    `;
  }

  return `
    <input type="text" inputmode="decimal" aria-label="Answer for problem ${problem.number}" data-answer-input="${problem.id}" data-answer-key="x" placeholder="${getSelectedAssignment().answerPlaceholder}" ${lockedAttribute} />
  `;
}

function renderProblems() {
  if (!elements.problemList) return;

  if (!state.problems.length) {
    elements.problemList.innerHTML = `<div class="empty-state">Enter your student ID to load the selected assignment.</div>`;
    return;
  }

  elements.problemList.innerHTML = state.problems
    .map(
      (problem) => `
        <article class="problem-card" data-problem-id="${problem.id}">
          <span class="problem-number">${problem.number}</span>
          <div>
            <div class="problem-type">${escapeHtml(problem.type || getSelectedAssignment().title)}</div>
            <div class="equation">${renderProblemPrompt(problem)}</div>
          </div>
          <div class="answer-row ${getAnswerRowClass(problem)}">
            ${renderAnswerInputs(problem)}
            <span class="feedback" data-feedback="${problem.id}">${getProblemStatus(problem)}</span>
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
    input.value =
      input.tagName === "SELECT" && !savedValue
        ? answerKey === "kind"
          ? "number"
          : "<"
        : savedValue;
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", handleAnswerInput);
  });

  state.problems.forEach((problem) => updateProblemStatus(problem.id));
}

function handleAnswerInput(event) {
  const input = event.currentTarget;
  const problemId = input.dataset.answerInput;
  const answerKey = input.dataset.answerKey || "x";
  const answer = state.answers.get(problemId);
  const nextAnswer = answer && typeof answer === "object" ? { ...answer } : {};
  nextAnswer[answerKey] = input.value.trim();
  state.answers.set(problemId, nextAnswer);
  updateProblemStatus(problemId);
  updateStudentScore();
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

  if (problem.answerMode === "inequality") {
    const symbol = answer && typeof answer === "object" ? answer.symbol : "";
    const boundary = answer && typeof answer === "object" ? answer.boundary : "";
    return !isBlank(symbol) || !isBlank(boundary);
  }

  if (problem.answerMode === "graphLine") {
    const response = answer && typeof answer === "object" ? answer : {};
    if (problem.graphQuestion === "slope") {
      return !isBlank(response.numerator) || !isBlank(response.denominator);
    }
    if (problem.graphQuestion === "intercept") {
      return !isBlank(response.b);
    }
    if (problem.graphQuestion === "point") {
      return !isBlank(response.x) || !isBlank(response.y);
    }
    return !isBlank(response.m) || !isBlank(response.b);
  }

  if (problem.answerMode === "graphQuadratic") {
    const response = answer && typeof answer === "object" ? answer : {};
    if (problem.graphQuestion === "vertex") {
      return !isBlank(response.x) || !isBlank(response.y);
    }
    if (problem.graphQuestion === "axis") {
      return !isBlank(response.axis);
    }
    if (problem.graphQuestion === "yIntercept") {
      return !isBlank(response.y);
    }
    if (problem.graphQuestion === "xIntercepts") {
      return !isBlank(response.x1) || !isBlank(response.x2);
    }
    return !isBlank(response.a) || !isBlank(response.h) || !isBlank(response.k);
  }

  if (problem.answerMode === "expressionParts") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.value);
  }

  if (problem.answerMode === "combineLikeTerms") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.expression);
  }

  if (problem.answerMode === "evaluateExpression") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.value);
  }

  if (problem.answerMode === "functionValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.value);
  }

  if (problem.answerMode === "fractionValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.value);
  }

  if (problem.answerMode === "textValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.value);
  }

  if (problem.answerMode === "polynomialExpression") {
    const response = answer && typeof answer === "object" ? answer : {};
    return !isBlank(response.expression);
  }

  const rawAnswer = answer && typeof answer === "object" ? answer.x : answer;
  return !isBlank(rawAnswer);
}

function isCloseEnough(actual, expected) {
  return Math.abs(actual - expected) < ANSWER_TOLERANCE;
}

function parseGraphNumberInput(value) {
  const normalized = `${value ?? ""}`
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/^[xy]=/, "");
  const parsed = parseFractionInput(normalized);
  return parsed ? fractionToNumber(parsed) : NaN;
}

function normalizeExpressionTextAnswer(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function normalizeExpressionTermAnswer(value) {
  return normalizeExpressionTextAnswer(value)
    .replace(/\s/g, "")
    .replace(/\*/g, "")
    .replace(/^\+/, "");
}

function normalizeSymbolicAnswer(value) {
  return `${value ?? ""}`
    .trim()
    .toLowerCase()
    .replace(/\u2212|\u2013|\u2014/g, "-")
    .replace(/\u221a/g, "sqrt")
    .replace(/\u221b/g, "root3")
    .replace(/\s/g, "")
    .replace(/\*/g, "")
    .replace(/sqrt(\d+|[a-z])(?![\w(])/g, "sqrt($1)")
    .replace(/root3(\d+|[a-z])(?![\w(])/g, "root3($1)");
}

function isCorrectExpressionOperation(rawValue, expectedOperation) {
  const normalized = normalizeExpressionTextAnswer(rawValue).replace(/\s/g, "");
  const additionAnswers = ["+", "add", "addition", "plus"];
  const subtractionAnswers = ["-", "subtract", "subtraction", "minus"];
  return expectedOperation === "addition"
    ? additionAnswers.includes(normalized)
    : subtractionAnswers.includes(normalized);
}

function parseCombinedExpressionAnswer(value) {
  const normalized = `${value ?? ""}`
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s/g, "")
    .replace(/\*/g, "");

  if (!normalized) return null;
  if (normalized === "0") return [];

  const tokens = normalized
    .replace(/-/g, "+-")
    .split("+")
    .filter(Boolean);
  if (!tokens.length) return null;

  const terms = [];
  for (const token of tokens) {
    const match = token.match(/^([+-]?\d*)([a-z])?$/);
    if (!match) return null;

    const coefficientText = match[1];
    const variable = match[2] || "";
    let coefficient = 0;

    if (variable) {
      if (coefficientText === "" || coefficientText === "+") {
        coefficient = 1;
      } else if (coefficientText === "-") {
        coefficient = -1;
      } else {
        coefficient = Number(coefficientText);
      }
    } else {
      if (coefficientText === "" || coefficientText === "+" || coefficientText === "-") {
        return null;
      }
      coefficient = Number(coefficientText);
    }

    if (!Number.isInteger(coefficient)) return null;
    terms.push({ coefficient, variable });
  }

  return combineExpressionTerms(terms);
}

function parsePolynomialExpressionAnswer(value) {
  const normalized = `${value ?? ""}`
    .trim()
    .toLowerCase()
    .replace(/\u2212|\u2013|\u2014/g, "-")
    .replace(/\s/g, "")
    .replace(/\*/g, "");

  if (!normalized) return null;
  if (normalized === "0") return [];

  const tokens = normalized
    .replace(/-/g, "+-")
    .split("+")
    .filter(Boolean);
  if (!tokens.length) return null;

  const terms = [];
  for (const token of tokens) {
    if (token.includes("x")) {
      const match = token.match(/^([+-]?\d*)x(?:\^(\d+))?$/);
      if (!match) return null;

      const coefficientText = match[1];
      let coefficient = 1;
      if (coefficientText === "-") {
        coefficient = -1;
      } else if (coefficientText && coefficientText !== "+") {
        coefficient = Number(coefficientText);
      }

      const power = match[2] === undefined ? 1 : Number(match[2]);
      if (!Number.isInteger(coefficient) || !Number.isInteger(power) || power < 0) {
        return null;
      }
      terms.push(makePolynomialTerm(coefficient, power));
    } else {
      const coefficient = Number(token);
      if (!Number.isInteger(coefficient)) return null;
      terms.push(makePolynomialTerm(coefficient, 0));
    }
  }

  return combinePolynomialTerms(terms);
}

function getCombineLikeTermsResult(problem, response = {}) {
  const submittedExpression = response.expression;
  if (isBlank(submittedExpression)) return "blank";

  const submittedTerms = parseCombinedExpressionAnswer(submittedExpression);
  if (!submittedTerms) return "wrong";

  return expressionTermsToKey(submittedTerms) === problem.answer.key ? "correct" : "wrong";
}

function getPolynomialExpressionResult(problem, response = {}) {
  const submittedExpression = response.expression;
  if (isBlank(submittedExpression)) return "blank";

  const submittedTerms = parsePolynomialExpressionAnswer(submittedExpression);
  if (!submittedTerms) return "wrong";

  return polynomialTermsToKey(submittedTerms) === problem.answer.key ? "correct" : "wrong";
}

function getEvaluateExpressionResult(problem, response = {}) {
  const rawValue = response.value;
  if (isBlank(rawValue)) return "blank";

  const submittedValue = parseGraphNumberInput(rawValue);
  return Number.isFinite(submittedValue) && isCloseEnough(submittedValue, problem.answer.value)
    ? "correct"
    : "wrong";
}

function getExpressionPartsResult(problem, response = {}) {
  const rawValue = response.value;
  const expected = problem.answer;

  if (isBlank(rawValue)) return "blank";

  if (expected.kind === "number") {
    const submittedValue = parseGraphNumberInput(rawValue);
    return Number.isFinite(submittedValue) && isCloseEnough(submittedValue, expected.value)
      ? "correct"
      : "wrong";
  }

  if (expected.kind === "variable") {
    return normalizeExpressionTextAnswer(rawValue) === expected.value ? "correct" : "wrong";
  }

  if (expected.kind === "term") {
    return normalizeExpressionTermAnswer(rawValue) === normalizeExpressionTermAnswer(expected.value)
      ? "correct"
      : "wrong";
  }

  if (expected.kind === "operation") {
    return isCorrectExpressionOperation(rawValue, expected.value) ? "correct" : "wrong";
  }

  return "wrong";
}

function getTextValueResult(problem, response = {}) {
  const rawValue = response.value;
  if (isBlank(rawValue)) return "blank";

  const normalizedSubmitted = normalizeSymbolicAnswer(rawValue);
  const acceptedAnswers = problem.answer?.accepted?.length
    ? problem.answer.accepted
    : [problem.answer?.display];

  return acceptedAnswers.some(
    (acceptedAnswer) => normalizeSymbolicAnswer(acceptedAnswer) === normalizedSubmitted,
  )
    ? "correct"
    : "wrong";
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

  if (problem.answerMode === "inequality") {
    const symbol = answer && typeof answer === "object" ? answer.symbol : "";
    const boundaryValue = answer && typeof answer === "object" ? answer.boundary : "";
    if (isBlank(symbol) && isBlank(boundaryValue)) {
      return "blank";
    }

    const boundary = Number(boundaryValue);
    if (
      isBlank(symbol) ||
      isBlank(boundaryValue) ||
      !["<", ">", "<=", ">="].includes(symbol) ||
      !Number.isInteger(boundary)
    ) {
      return "wrong";
    }

    return symbol === problem.answer.symbol && boundary === problem.answer.boundary
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "graphLine") {
    const response = answer && typeof answer === "object" ? answer : {};

    if (problem.graphQuestion === "slope") {
      const numeratorValue = response.numerator;
      const denominatorValue = response.denominator;
      if (isBlank(numeratorValue) && isBlank(denominatorValue)) return "blank";

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

      return fractionsEqual(reduceFraction(numerator, denominator), problem.answer.slope)
        ? "correct"
        : "wrong";
    }

    if (problem.graphQuestion === "intercept") {
      if (isBlank(response.b)) return "blank";
      const bAnswer = parseFractionInput(response.b);
      return bAnswer && fractionsEqual(bAnswer, problem.answer.b) ? "correct" : "wrong";
    }

    if (problem.graphQuestion === "point") {
      if (isBlank(response.x) && isBlank(response.y)) return "blank";
      const x = Number(response.x);
      const y = Number(response.y);
      if (
        isBlank(response.x) ||
        isBlank(response.y) ||
        !Number.isInteger(x) ||
        !Number.isInteger(y)
      ) {
        return "wrong";
      }
      const expectedY =
        fractionToNumber(problem.graph.slope) * x + fractionToNumber(problem.graph.intercept);
      return isCloseEnough(y, expectedY) ? "correct" : "wrong";
    }

    if (isBlank(response.m) && isBlank(response.b)) return "blank";
    const mAnswer = parseFractionInput(response.m);
    const bAnswer = parseFractionInput(response.b);
    if (isBlank(response.m) || isBlank(response.b) || !mAnswer || !bAnswer) {
      return "wrong";
    }

    return fractionsEqual(mAnswer, problem.answer.m) && fractionsEqual(bAnswer, problem.answer.b)
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "graphQuadratic") {
    const response = answer && typeof answer === "object" ? answer : {};

    if (problem.graphQuestion === "vertex") {
      if (isBlank(response.x) && isBlank(response.y)) return "blank";
      const x = parseGraphNumberInput(response.x);
      const y = parseGraphNumberInput(response.y);
      if (isBlank(response.x) || isBlank(response.y) || !Number.isFinite(x) || !Number.isFinite(y)) {
        return "wrong";
      }
      return isCloseEnough(x, problem.answer.vertex.x) && isCloseEnough(y, problem.answer.vertex.y)
        ? "correct"
        : "wrong";
    }

    if (problem.graphQuestion === "axis") {
      if (isBlank(response.axis)) return "blank";
      const axis = parseGraphNumberInput(response.axis);
      return Number.isFinite(axis) && isCloseEnough(axis, problem.answer.axis)
        ? "correct"
        : "wrong";
    }

    if (problem.graphQuestion === "yIntercept") {
      if (isBlank(response.y)) return "blank";
      const y = parseGraphNumberInput(response.y);
      return Number.isFinite(y) && isCloseEnough(y, problem.answer.yIntercept)
        ? "correct"
        : "wrong";
    }

    if (problem.graphQuestion === "xIntercepts") {
      if (isBlank(response.x1) && isBlank(response.x2)) return "blank";
      const submitted = [parseGraphNumberInput(response.x1), parseGraphNumberInput(response.x2)].sort(
        (left, right) => left - right,
      );
      const expected = [...problem.answer.xIntercepts].sort((left, right) => left - right);
      if (
        isBlank(response.x1) ||
        isBlank(response.x2) ||
        !Number.isFinite(submitted[0]) ||
        !Number.isFinite(submitted[1])
      ) {
        return "wrong";
      }
      return isCloseEnough(submitted[0], expected[0]) && isCloseEnough(submitted[1], expected[1])
        ? "correct"
        : "wrong";
    }

    if (isBlank(response.a) && isBlank(response.h) && isBlank(response.k)) return "blank";
    const a = parseGraphNumberInput(response.a);
    const h = parseGraphNumberInput(response.h);
    const k = parseGraphNumberInput(response.k);
    if (
      isBlank(response.a) ||
      isBlank(response.h) ||
      isBlank(response.k) ||
      !Number.isFinite(a) ||
      !Number.isFinite(h) ||
      !Number.isFinite(k)
    ) {
      return "wrong";
    }

    return isCloseEnough(a, problem.answer.a) &&
      isCloseEnough(h, problem.answer.h) &&
      isCloseEnough(k, problem.answer.k)
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "expressionParts") {
    const response = answer && typeof answer === "object" ? answer : {};
    return getExpressionPartsResult(problem, response);
  }

  if (problem.answerMode === "combineLikeTerms") {
    const response = answer && typeof answer === "object" ? answer : {};
    return getCombineLikeTermsResult(problem, response);
  }

  if (problem.answerMode === "polynomialExpression") {
    const response = answer && typeof answer === "object" ? answer : {};
    return getPolynomialExpressionResult(problem, response);
  }

  if (problem.answerMode === "evaluateExpression") {
    const response = answer && typeof answer === "object" ? answer : {};
    return getEvaluateExpressionResult(problem, response);
  }

  if (problem.answerMode === "functionValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    if (isBlank(response.value)) return "blank";
    const submittedValue = parseGraphNumberInput(response.value);
    return Number.isFinite(submittedValue) && isCloseEnough(submittedValue, problem.answer)
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "fractionValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    if (isBlank(response.value)) return "blank";
    const submittedFraction = parseFractionInput(response.value);
    return submittedFraction && fractionsEqual(submittedFraction, problem.answer)
      ? "correct"
      : "wrong";
  }

  if (problem.answerMode === "textValue") {
    const response = answer && typeof answer === "object" ? answer : {};
    return getTextValueResult(problem, response);
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

function getProblemStatus(problem) {
  const result = getProblemResult(problem);
  const shouldRevealGrade =
    isAssignmentLocked() || getSelectedAssignment().showImmediateFeedback === true;

  if (!shouldRevealGrade) {
    return hasAnswerForProblem(problem) ? "Saved" : "Blank";
  }

  if (result === "correct") return "Correct";
  if (result === "wrong") return "Incorrect";
  return "Blank";
}

function updateProblemStatus(problemId) {
  if (!elements.problemList) return;

  const problem = state.problems.find((item) => item.id === problemId);
  const card = elements.problemList.querySelector(`[data-problem-id="${problemId}"]`);
  const feedback = elements.problemList.querySelector(`[data-feedback="${problemId}"]`);
  if (!problem || !feedback) return;

  const result = getProblemResult(problem);
  const shouldRevealGrade =
    isAssignmentLocked() || getSelectedAssignment().showImmediateFeedback === true;
  card?.classList.toggle("is-correct", shouldRevealGrade && result === "correct");
  card?.classList.toggle("is-wrong", shouldRevealGrade && result === "wrong");
  feedback.textContent = getProblemStatus(problem);
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
  const answered = state.problems.filter((problem) => hasAnswerForProblem(problem)).length;

  if (!state.problems.length) {
    elements.currentScore.textContent = `0 / ${assignment.problemCount}`;
    elements.currentPercent.textContent = "--";
    elements.answeredCount.textContent = "0 answered";
    elements.correctCount.textContent = "Grade hidden";
    return;
  }

  if (!isAssignmentLocked()) {
    elements.currentScore.textContent = "Not submitted";
    elements.currentPercent.textContent = "--";
    elements.answeredCount.textContent = `${answered} answered`;
    elements.correctCount.textContent = "Grade hidden";
    return;
  }

  const score = state.lockedSubmission || calculateScore();
  elements.currentScore.textContent = `${score.correct} / ${score.total || assignment.problemCount}`;
  elements.currentPercent.textContent = `${score.percent}%`;
  elements.answeredCount.textContent = `${score.answered} answered`;
  elements.correctCount.textContent = "Submitted";
}

function submitAssignment() {
  if (!state.selectedStudent || !state.problems.length) return;
  if (isAssignmentLocked()) {
    setText(
      elements.submissionNote,
      "This attempt is already submitted and locked. Ask your teacher to reset it before trying again.",
    );
    return;
  }

  const assignment = getSelectedAssignment();
  const score = calculateScore();
  const assignmentSubmissions = getAssignmentSubmissions(assignment);

  assignmentSubmissions[state.selectedStudent.key] = {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    studentKey: state.selectedStudent.key,
    name: state.selectedStudent.name,
    correct: score.correct,
    total: assignment.problemCount,
    percent: score.percent,
    answered: score.answered,
    answers: serializeAnswers(),
    submittedAt: new Date().toISOString(),
  };
  state.lockedSubmission = assignmentSubmissions[state.selectedStudent.key];
  saveSubmissions();
  renderProblems();
  updateStudentScore();
  if (elements.dashboardBody) {
    renderDashboard();
  }
  if (elements.submitAssignment) {
    elements.submitAssignment.disabled = true;
    elements.submitAssignment.textContent = "Submitted";
  }
  setText(
    elements.submissionNote,
    `Submitted and locked: ${score.correct} out of ${assignment.problemCount} (${score.percent}%).`,
  );
}

function renderStudentWorkPanel(studentKey = "") {
  if (!elements.studentWorkPanel || !elements.studentWorkProblems) return;

  const assignment = getSelectedAssignment();
  const student = getVisibleRoster().find((item) => item.key === studentKey);
  state.selectedWorkStudentKey = student?.key || "";

  if (!student) {
    setText(elements.studentWorkTitle, "Choose a student");
    setText(
      elements.studentWorkMeta,
      "Use View Work in the roster to inspect generated problems, submitted answers, and the answer key.",
    );
    elements.studentWorkProblems.innerHTML = `<div class="empty-state compact-empty">No student selected.</div>`;
    if (elements.closeWorkPanel) {
      elements.closeWorkPanel.hidden = true;
    }
    elements.studentWorkPanel.classList.remove("is-attention");
    return;
  }

  const submission = getSubmission(student, assignment);
  const problems = generateAssignment(student, assignment);
  const answers = answersToMap(submission?.answers);
  const submittedAt = submission
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(submission.submittedAt))
    : "";

  setText(elements.studentWorkTitle, `${student.name} - ${assignment.title}`);
  setText(
    elements.studentWorkMeta,
    submission
      ? `Submitted ${submittedAt}. Score: ${submission.correct} / ${submission.total} (${submission.percent}%).`
      : "No submitted answers yet. Showing the generated problem set and answer key.",
  );
  elements.studentWorkProblems.innerHTML = problems
    .map((problem) => renderReviewProblemCard(problem, answers))
    .join("");
  if (elements.closeWorkPanel) {
    elements.closeWorkPanel.hidden = false;
  }
  elements.studentWorkPanel.classList.add("is-attention");
  elements.studentWorkPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  elements.studentWorkPanel.focus({ preventScroll: true });
}

function renderDashboard() {
  if (!elements.dashboardBody) return;

  const assignment = getSelectedAssignment();
  const assignmentSubmissions = getAssignmentSubmissions(assignment);
  const visibleRoster = getVisibleRoster();
  const visibleKeys = new Set(visibleRoster.map((student) => student.key));
  const rows = visibleRoster.map((student) => {
    const submission = assignmentSubmissions[student.key];
    const submittedAt = submission
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(submission.submittedAt))
      : "--";
    return `
      <tr class="${state.selectedWorkStudentKey === student.key ? "is-selected-work" : ""}">
        <td>${escapeHtml(student.name)}</td>
        <td>
          <span class="status-pill ${submission ? "is-submitted" : ""}">
            ${submission ? "Submitted" : "Waiting"}
          </span>
        </td>
        <td>${submission ? `${submission.correct} / ${submission.total}` : "--"}</td>
        <td>${submission ? `${submission.percent}%` : "--"}</td>
        <td>${submission ? `${submission.answered} / ${submission.total}` : "--"}</td>
        <td>${submittedAt}</td>
        <td>
          <button class="secondary-button table-reset-button" type="button" data-view-work="${student.key}">
            View Work
          </button>
        </td>
        <td>
          ${
            submission
              ? `<button class="secondary-button table-reset-button" type="button" data-reset-student="${student.key}">Reset</button>`
              : "--"
          }
        </td>
      </tr>
    `;
  });

  elements.dashboardBody.innerHTML = rows.join("");
  elements.dashboardBody.querySelectorAll("[data-view-work]").forEach((button) => {
    button.addEventListener("click", () => {
      renderStudentWorkPanel(button.dataset.viewWork);
      renderDashboard();
    });
  });
  elements.dashboardBody.querySelectorAll("[data-reset-student]").forEach((button) => {
    button.addEventListener("click", () => resetStudentSubmission(button.dataset.resetStudent));
  });

  const submissions = Object.values(assignmentSubmissions).filter((submission) =>
    visibleKeys.has(submission.studentKey),
  );
  const submittedCount = submissions.length;
  const average = submittedCount
    ? Math.round(submissions.reduce((sum, item) => sum + item.percent, 0) / submittedCount)
    : null;
  const highest = submittedCount
    ? Math.max(...submissions.map((item) => item.percent))
    : null;

  setText(elements.submittedCount, `${submittedCount} / ${visibleRoster.length}`);
  setText(elements.classAverage, average === null ? "--" : `${average}%`);
  setText(elements.highestScore, highest === null ? "--" : `${highest}%`);
  updateDashboardSyncStatus();
}

function refreshDashboard() {
  state.submissions = loadSubmissions();
  renderDashboard();
  renderStudentWorkPanel(state.selectedWorkStudentKey);
}

function updateDashboardSyncStatus() {
  if (!elements.dashboardSyncStatus) return;

  const timestamp = new Intl.DateTimeFormat(undefined, {
    timeStyle: "medium",
  }).format(new Date());
  elements.dashboardSyncStatus.textContent = `Updated ${timestamp}. This dashboard reads submissions saved in this browser. Student devices need a shared database to appear here.`;
}

function resetDashboard() {
  const assignment = getSelectedAssignment();
  const confirmed = window.confirm(`Clear all submitted grades for ${assignment.title}?`);
  if (!confirmed) return;

  state.submissions[assignment.id] = {};
  saveSubmissions();
  renderDashboard();
  renderStudentWorkPanel(state.selectedWorkStudentKey);
}

function resetStudentSubmission(studentKey) {
  const assignment = getSelectedAssignment();
  const student = getVisibleRoster().find((item) => item.key === studentKey);
  if (!student) return;

  const confirmed = window.confirm(`Reset ${student.name}'s submitted answers for ${assignment.title}?`);
  if (!confirmed) return;

  delete getAssignmentSubmissions(assignment)[student.key];
  saveSubmissions();
  renderDashboard();
  renderStudentWorkPanel(student.key);
}

function bindEvents() {
  if (elements.assignmentSelect) {
    elements.assignmentSelect.addEventListener("change", () => {
      selectAssignment(elements.assignmentSelect.value, { resetStudentWork: true });
    });
  }

  if (elements.dashboardAssignmentSelect) {
    elements.dashboardAssignmentSelect.addEventListener("change", () => {
      selectAssignment(elements.dashboardAssignmentSelect.value);
    });
  }

  if (elements.studentId) {
    elements.studentId.addEventListener("input", () => {
      const normalizedValue = normalizeStudentId(elements.studentId.value);
      if (elements.studentId.value !== normalizedValue) {
        elements.studentId.value = normalizedValue;
      }

      setAccessNote("");
      if (state.selectedStudent) {
        resetStudentWorkspace();
      }
    });

    elements.studentId.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loadSelectedStudent();
      }
    });
  }

  if (elements.loadAssignment) {
    elements.loadAssignment.addEventListener("click", loadSelectedStudent);
  }
  if (elements.submitAssignment) {
    elements.submitAssignment.addEventListener("click", submitAssignment);
  }
  if (elements.refreshDashboard) {
    elements.refreshDashboard.addEventListener("click", refreshDashboard);
  }
  if (elements.resetDashboard) {
    elements.resetDashboard.addEventListener("click", resetDashboard);
  }
  if (elements.closeWorkPanel) {
    elements.closeWorkPanel.addEventListener("click", () => {
      state.selectedWorkStudentKey = "";
      renderStudentWorkPanel("");
      renderDashboard();
    });
  }
  if (elements.saveAssignmentButton) {
    elements.saveAssignmentButton.addEventListener("click", saveCustomAssignment);
  }
  if (elements.customProblemCount) {
    elements.customProblemCount.addEventListener("change", () => {
      if (elements.customProblemCountOther) {
        elements.customProblemCountOther.hidden = elements.customProblemCount.value !== "custom";
      }
      renderAssignmentPreview();
    });
  }
  if (elements.customTimeEnabled) {
    elements.customTimeEnabled.addEventListener("change", () => {
      setDisabled(elements.customTimeLimit, !elements.customTimeEnabled.checked);
      renderAssignmentPreview();
    });
  }
  if (elements.customAssignmentUnit) {
    elements.customAssignmentUnit.addEventListener("change", () => {
      renderAssignmentTypeOptions();
      renderAssignmentPreview();
    });
  }
  [
    elements.customAssignmentTitle,
    elements.customAssignmentType,
    elements.customProblemCountOther,
    elements.customDifficulty,
    elements.customDueDate,
    elements.customClassPeriod,
    elements.customFeedbackMode,
    elements.customAllowRetries,
    elements.customMaxAttempts,
    elements.customTimeLimit,
  ].forEach((element) => {
    if (!element) return;
    element.addEventListener(element.type === "checkbox" || element.tagName === "SELECT" ? "change" : "input", renderAssignmentPreview);
  });

  if (elements.dashboardBody) {
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY || LEGACY_STORAGE_KEYS.includes(event.key)) {
        refreshDashboard();
      }
    });

    window.addEventListener("focus", refreshDashboard);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshDashboard();
      }
    });

    dashboardRefreshTimer = window.setInterval(refreshDashboard, DASHBOARD_REFRESH_INTERVAL_MS);
  }
}

function init() {
  renderAssignmentBuilderOptions();
  renderAssignmentOptions();
  updateAssignmentDisplay();
  renderStudentAccess();
  renderProblems();
  updateStudentScore();
  renderDashboard();
  renderAssignmentPreview();
  renderStudentWorkPanel();
  renderCustomAssignmentList();
  bindEvents();
}

export function mountAssignmentDashboard(options = {}) {
  if (dashboardRefreshTimer) {
    window.clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = null;
  }

  collectElements();
  state.selectedAssignment = assignments[0];
  state.selectedStudent = null;
  state.lockedSubmission = null;
  state.problems = [];
  state.answers = new Map();
  state.submissions = loadSubmissions();
  state.visibleStudentKeys = Array.isArray(options.visibleStudentKeys)
    ? options.visibleStudentKeys
    : null;
  state.customAssignments = [];
  state.account = options.account || null;
  state.selectedWorkStudentKey = "";
  init();
  subscribeCustomAssignments();

  return () => {
    if (dashboardRefreshTimer) {
      window.clearInterval(dashboardRefreshTimer);
      dashboardRefreshTimer = null;
    }
    if (state.assignmentUnsubscribe) {
      state.assignmentUnsubscribe();
      state.assignmentUnsubscribe = null;
    }
  };
}
