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
    title: "Slope-Intercept Form",
    directions: "Identify the slope m and y-intercept b",
    problemCount: 30,
    answerMode: "slopeIntercept",
    answerPlaceholder: "value",
    generator: makeSlopeInterceptProblem,
  },
  {
    id: "linear-inequalities-html-v1",
    title: "Linear Inequalities",
    directions: "Solve each inequality for x",
    problemCount: 30,
    answerMode: "inequality",
    answerPlaceholder: "boundary",
    generator: makeLinearInequalityProblem,
  },
  {
    id: "coordinate-grid-lines-v1",
    title: "Coordinate Grid Lines",
    directions: "Use the graph to answer each question",
    problemCount: 30,
    answerMode: "graphLine",
    answerPlaceholder: "value",
    generator: makeCoordinateGridLineProblem,
  },
];

const CUSTOM_ASSIGNMENT_TYPES = [
  {
    id: "linear-equations",
    label: "Linear Equations",
    generator: makeLinearProblem,
    answerMode: "single",
    directions: "Solve for x",
  },
  {
    id: "systems-equations",
    label: "Systems of Equations",
    generator: makeSystemProblem,
    answerMode: "pair",
    directions: "Solve for x and y",
  },
  {
    id: "slope-two-points",
    label: "Slope from Two Points",
    generator: makeSlopeProblem,
    answerMode: "slope",
    directions: "Find the slope between the two points",
  },
  {
    id: "graphing-linear-equations",
    label: "Graphing Linear Equations",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Use the graph to answer each question",
  },
  {
    id: "writing-equations-from-graphs",
    label: "Writing Equations from Graphs",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Write equations from graphs",
  },
  {
    id: "multi-step-equations",
    label: "Solving Multi-Step Equations",
    generator: makeLinearProblem,
    answerMode: "single",
    directions: "Solve each multi-step equation",
  },
  {
    id: "inequalities",
    label: "Inequalities",
    generator: makeLinearInequalityProblem,
    answerMode: "inequality",
    directions: "Solve each inequality for x",
  },
  {
    id: "coordinate-grid-problems",
    label: "Coordinate Grid Problems",
    generator: makeCoordinateGridLineProblem,
    answerMode: "graphLine",
    directions: "Use the coordinate grid to answer",
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
        `<option value="${assignment.id}">${assignment.title} (${assignment.problemCount})</option>`,
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

function normalizeProblemCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) return 10;
  return Math.min(count, 60);
}

function normalizeCustomAssignment(data = {}, fallbackId = "") {
  const typeConfig = getAssignmentTypeConfig(data.assignmentType);
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
  if (!elements.customAssignmentType) return;
  elements.customAssignmentType.innerHTML = CUSTOM_ASSIGNMENT_TYPES.map(
    (type) => `<option value="${type.id}">${escapeHtml(type.label)}</option>`,
  ).join("");
}

function getCustomProblemCountInput() {
  const selected = elements.customProblemCount?.value || "10";
  if (selected === "custom") {
    return normalizeProblemCount(elements.customProblemCountOther?.value || 10);
  }
  return normalizeProblemCount(selected);
}

function getCustomAssignmentDraft() {
  const typeConfig = getAssignmentTypeConfig(elements.customAssignmentType?.value);
  const title = elements.customAssignmentTitle?.value.trim() || typeConfig.label;
  const problemCount = getCustomProblemCountInput();
  const timeEnabled = elements.customTimeEnabled?.checked === true;
  const classPeriod = elements.customClassPeriod?.value.trim();

  return {
    id: `preview-${typeConfig.id}`,
    title,
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
  const assignmentId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    assignmentId,
    isTeacherCreated: true,
    teacherUid: state.account?.uid || "",
    title: draft.title,
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

  return `
    <article class="review-card ${status.className} ${
      problem.answerMode === "graphLine" ? "is-graph-review" : ""
    }">
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
          <strong>${escapeHtml(formatExpectedAnswer(problem))}</strong>
        </div>
      </div>
    </article>
  `;
}

function renderAssignmentPreview() {
  if (!elements.assignmentPreview || !elements.customAssignmentType) return;

  const assignment = getCustomAssignmentDraft();
  const previewStudent = { key: "preview-student", name: "Preview Student" };
  const previewProblems = generateAssignment(previewStudent, assignment);

  elements.assignmentPreview.innerHTML = `
    <div class="preview-heading">
      <div>
        <p class="eyebrow">Preview</p>
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
            <p class="eyebrow">${escapeHtml(assignment.assignmentTypeLabel || assignment.assignmentType)}</p>
            <h3>${escapeHtml(assignment.title)}</h3>
            <p>${assignment.problemCount} problems - ${escapeHtml(assignment.difficulty)} - ${escapeHtml(
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
  if (problem.answerMode === "graphLine") return `is-graph-line is-graph-${problem.graphQuestion}`;
  return "";
}

function renderProblemPrompt(problem) {
  if (problem.answerMode === "graphLine") {
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

function renderCoordinateGrid(problem) {
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
        <g class="axis-labels" aria-hidden="true">
          <text x="${toSvgX(10) + 8}" y="${toSvgY(0) + 4}">x</text>
          <text x="${toSvgX(0) + 5}" y="${toSvgY(10) - 6}">y</text>
          ${tickLabels.join("")}
        </g>
        <g clip-path="url(#${clipId})">
          <line
            class="graph-line"
            x1="${toSvgX(start.x)}"
            y1="${toSvgY(start.y)}"
            x2="${toSvgX(end.x)}"
            y2="${toSvgY(end.y)}"
          />
        </g>
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

  const rawAnswer = answer && typeof answer === "object" ? answer.x : answer;
  return !isBlank(rawAnswer);
}

function isCloseEnough(actual, expected) {
  return Math.abs(actual - expected) < ANSWER_TOLERANCE;
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
