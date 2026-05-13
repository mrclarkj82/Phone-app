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
    answerType: "single",
    answerPlaceholder: "x =",
    generator: makeLinearProblem,
  },
  {
    id: "systems-equations-doral-v1",
    title: "Systems of Equations",
    directions: "Solve for x and y",
    problemCount: 15,
    answerType: "ordered-pair",
    answerPlaceholder: "value",
    generator: makeSystemProblem,
  },
];

const roster = [
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
};

const elements = {
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
};

function compareStudentsByLastName(a, b) {
  const aParts = a.name.split(" ");
  const bParts = b.name.split(" ");
  const aLast = aParts[aParts.length - 1];
  const bLast = bParts[bParts.length - 1];
  return aLast.localeCompare(bLast) || a.name.localeCompare(b.name);
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
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

function setAccessNote(message, status = "") {
  if (!elements.accessNote) return;

  elements.accessNote.textContent = message;
  elements.accessNote.classList.toggle("is-error", status === "error");
  elements.accessNote.classList.toggle("is-success", status === "success");
}

function getSelectedAssignment() {
  return state.selectedAssignment || assignments[0];
}

function getAssignmentById(assignmentId) {
  return assignments.find((assignment) => assignment.id === assignmentId) || assignments[0];
}

function renderHeaderCounts() {
  const assignment = getSelectedAssignment();
  setText(elements.headerProblemCount, assignment.problemCount);
  setText(elements.headerStudentCount, roster.length);
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

function makeProblem(assignment, student, problemNumber, attempt = 0) {
  const seedText = `${assignment.id}:${student.key}:${student.name}:${problemNumber}:${attempt}`;
  const random = mulberry32(hashString(seedText));
  const problem = assignment.generator(random);
  return {
    ...problem,
    answerType: assignment.answerType,
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

  assignments.forEach((assignment) => {
    if (saved[assignment.id] && typeof saved[assignment.id] === "object") {
      normalized[assignment.id] = saved[assignment.id];
    }
  });

  return normalized;
}

function mergeSubmissions(...stores) {
  const merged = createEmptySubmissionStore();

  stores.forEach((store) => {
    const normalized = normalizeSubmissions(store);
    assignments.forEach((assignment) => {
      Object.entries(normalized[assignment.id] || {}).forEach(([studentKey, submission]) => {
        const existing = merged[assignment.id][studentKey];
        if (
          !existing ||
          new Date(submission.submittedAt || 0) >= new Date(existing.submittedAt || 0)
        ) {
          merged[assignment.id][studentKey] = submission;
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
  const options = assignments
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

function renderEquation(problem) {
  if (problem.equations) {
    return `<div class="system-equations">${problem.equations
      .map((equation) => `<span>${equation}</span>`)
      .join("")}</div>`;
  }

  return problem.equation;
}

function getSavedAnswer(problem, answerKey = "x") {
  return state.answers.get(problem.id)?.[answerKey] || "";
}

function getProblemStatus(problem) {
  if (isAssignmentLocked()) return "Locked";
  return getProblemResult(problem) === "blank" ? "Blank" : "Saved";
}

function renderAnswerInputs(problem) {
  const lockedAttribute = isAssignmentLocked() ? "disabled" : "";
  if (problem.answerType === "ordered-pair") {
    return `
      <label class="answer-field">
        <span>x</span>
        <input
          type="text"
          inputmode="decimal"
          aria-label="x value for problem ${problem.number}"
          data-answer-input="${problem.id}"
          data-answer-key="x"
          value="${escapeHtml(getSavedAnswer(problem, "x"))}"
          placeholder="x"
          ${lockedAttribute}
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
          value="${escapeHtml(getSavedAnswer(problem, "y"))}"
          placeholder="y"
          ${lockedAttribute}
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
      value="${escapeHtml(getSavedAnswer(problem))}"
      placeholder="${getSelectedAssignment().answerPlaceholder}"
      ${lockedAttribute}
    />
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
          <div class="equation">${renderEquation(problem)}</div>
          <div class="answer-row ${problem.answerType === "ordered-pair" ? "is-pair" : ""}">
            ${renderAnswerInputs(problem)}
            <span class="feedback" data-feedback="${problem.id}">${getProblemStatus(problem)}</span>
          </div>
        </article>
      `,
    )
    .join("");

  elements.problemList.querySelectorAll("[data-answer-input]").forEach((input) => {
    input.addEventListener("input", handleAnswerInput);
  });
}

function handleAnswerInput(event) {
  const input = event.currentTarget;
  const problemId = input.dataset.answerInput;
  const answerKey = input.dataset.answerKey || "x";
  const answer = state.answers.get(problemId) || {};
  answer[answerKey] = input.value.trim();
  state.answers.set(problemId, answer);
  updateProblemStatus(problemId);
  updateStudentScore();
}

function isBlank(value) {
  return value === undefined || value === "";
}

function isCloseEnough(actual, expected) {
  return Math.abs(actual - expected) < ANSWER_TOLERANCE;
}

function getProblemResult(problem) {
  const answer = state.answers.get(problem.id) || {};

  if (problem.answerType === "ordered-pair") {
    if (isBlank(answer.x) && isBlank(answer.y)) {
      return "blank";
    }

    const x = Number(answer.x);
    const y = Number(answer.y);
    if (isBlank(answer.x) || isBlank(answer.y) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return "wrong";
    }

    return isCloseEnough(x, problem.answer.x) && isCloseEnough(y, problem.answer.y)
      ? "correct"
      : "wrong";
  }

  if (isBlank(answer.x)) {
    return "blank";
  }

  const numericAnswer = Number(answer.x);
  if (!Number.isFinite(numericAnswer)) {
    return "wrong";
  }

  return isCloseEnough(numericAnswer, problem.answer) ? "correct" : "wrong";
}

function updateProblemStatus(problemId) {
  if (!elements.problemList) return;

  const problem = state.problems.find((item) => item.id === problemId);
  const feedback = elements.problemList.querySelector(`[data-feedback="${problemId}"]`);
  if (!problem || !feedback) return;

  feedback.textContent = getProblemStatus(problem);
}

function calculateScore() {
  const assignment = getSelectedAssignment();
  const answered = state.problems.filter((problem) => getProblemResult(problem) !== "blank").length;
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
  const answered = state.problems.filter((problem) => getProblemResult(problem) !== "blank").length;

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

function renderDashboard() {
  if (!elements.dashboardBody) return;

  const assignment = getSelectedAssignment();
  const assignmentSubmissions = getAssignmentSubmissions(assignment);
  const rows = roster.map((student) => {
    const submission = assignmentSubmissions[student.key];
    const submittedAt = submission
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(submission.submittedAt))
      : "--";
    return `
      <tr>
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
  elements.dashboardBody.querySelectorAll("[data-reset-student]").forEach((button) => {
    button.addEventListener("click", () => resetStudentSubmission(button.dataset.resetStudent));
  });

  const submissions = Object.values(assignmentSubmissions);
  const submittedCount = submissions.length;
  const average = submittedCount
    ? Math.round(submissions.reduce((sum, item) => sum + item.percent, 0) / submittedCount)
    : null;
  const highest = submittedCount
    ? Math.max(...submissions.map((item) => item.percent))
    : null;

  setText(elements.submittedCount, `${submittedCount} / ${roster.length}`);
  setText(elements.classAverage, average === null ? "--" : `${average}%`);
  setText(elements.highestScore, highest === null ? "--" : `${highest}%`);
  updateDashboardSyncStatus();
}

function refreshDashboard() {
  state.submissions = loadSubmissions();
  renderDashboard();
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
}

function resetStudentSubmission(studentKey) {
  const assignment = getSelectedAssignment();
  const student = roster.find((item) => item.key === studentKey);
  if (!student) return;

  const confirmed = window.confirm(`Reset ${student.name}'s submitted answers for ${assignment.title}?`);
  if (!confirmed) return;

  delete getAssignmentSubmissions(assignment)[student.key];
  saveSubmissions();
  renderDashboard();
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

    window.setInterval(refreshDashboard, DASHBOARD_REFRESH_INTERVAL_MS);
  }
}

function init() {
  renderAssignmentOptions();
  updateAssignmentDisplay();
  renderStudentAccess();
  renderProblems();
  updateStudentScore();
  renderDashboard();
  bindEvents();
}

init();
