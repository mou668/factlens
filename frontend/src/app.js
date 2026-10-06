// Model configurations
const models = [
  {
    id: "lstm",
    name: "Sequence cues",
    task: "Sentence flow and tone",
    description: "Highlights punctuation, capitalization, and emotional language patterns.",
    weight: 0.25,
  },
  {
    id: "albert",
    name: "Semantic cues",
    task: "Claim framing and wording",
    description: "Highlights sensational claims, certainty language, and conspiracy framing.",
    weight: 0.35,
  },
  {
    id: "cnn-rnn",
    name: "Attribution and phrases",
    task: "Phrase patterns and attribution",
    description: "Looks for named publishers, quoted attribution, and recurring phrase patterns.",
    weight: 0.20,
  },
  {
    id: "fnnet",
    name: "Combined signals",
    task: "Summary of detected cues",
    description: "Combines the language and attribution signals into an initial assessment.",
    weight: 0.20,
  },
];

// Presets for quick 1-click testing
const PRESETS = {
  fake1: "SHOCKING SECRET EXPOSED! Doctors are hiding this 100% miracle remedy that cures all diseases instantly! Mainstream media is covering up the truth! Share before it gets deleted!",
  fake2: "UNBELIEVABLE COVER-UP! Secret government plan revealed to control citizens through food supply! They don't want you to know what is really in your water!",
  real1: "According to a study published in Nature Journal, researchers at Oxford University have developed a new solar energy storage system. Official data confirms a 35% increase in battery efficiency.",
  real2: "Reuters reported that the World Health Organization issued an updated health guideline today. The ministry of health confirmed official vaccination statistics across 12 countries.",
};

// NLP Dictionaries for high-precision local fallback matching the backend
const CLICKBAIT_TERMS = [
  "shocking", "secret", "exposed", "you won't believe", "unbelievable", "viral",
  "breaking!!!", "must see", "what happens next", "doctors hate",
  "they do not want you to know", "don't want you to know", "miracle trick",
  "mind blowing", "mind-blowing", "share before deleted", "share before it gets deleted",
  "instantly cure"
];

const CONSPIRACY_TERMS = [
  "cover-up", "coverup", "conspiracy", "deep state", "mainstream media hiding",
  "truth revealed", "banned by", "censored by", "secret plan", "fake news media",
  "population control", "microchip", "illuminati", "cabal", "hidden agenda"
];

const FALSE_CERTAINTY_TERMS = [
  "guaranteed", "miracle", "instant cure", "cure all", "cures all",
  "100% effective", "100% proven", "no evidence needed", "proves everything",
  "everyone knows", "undeniable proof", "magic remedy"
];

const VAGUE_SOURCE_TERMS = [
  "sources say", "people are saying", "experts claim", "many believe",
  "it is said", "rumors suggest", "unnamed sources", "some say"
];

const CREDIBLE_TERMS = [
  "according to", "reported by", "official", "data", "research", "study",
  "statement", "evidence", "court", "ministry", "agency", "university",
  "published", "peer-reviewed", "press release", "confirmed by", "investigation", "statistics"
];

const SOURCE_TERMS = [
  "reuters", "associated press", "ap news", "bbc", "the hindu", "indian express",
  "press trust of india", "pti", "bloomberg", "afp", "who", "world health organization",
  "cdc", "united nations", "nasa", "nature journal", "the lancet", "oxford university",
  "harvard", "government"
];

const API_BASE_URL = "http://127.0.0.1:8000";

// DOM Elements
const screens = document.querySelectorAll("[data-screen]");
const productNav = document.querySelectorAll("[data-product-nav]");
const form = document.querySelector("#check-form");
const textarea = document.querySelector("#article-text");
const recentList = document.querySelector("#recent-list");
const clearHistory = document.querySelector("#clear-history");
const scanModels = document.querySelector("#scan-models");
const progressValue = document.querySelector("#progress-value");
const progressFill = document.querySelector("#progress-fill");
const verdictBand = document.querySelector("#verdict-band");
const verdictTitle = document.querySelector("#verdict-title");
const confidence = document.querySelector("#combined-confidence");
const rationaleText = document.querySelector("#rationale-text");
const breakdownList = document.querySelector("#breakdown-list");
const breakdownSummaryCopy = document.querySelector("#breakdown-summary-copy");
const breakdownKeySignals = document.querySelector("#breakdown-key-signals");
const openBreakdown = document.querySelector("#open-breakdown");
const accountName = document.querySelector("#account-name");
const authToggleBtn = document.querySelector("#auth-toggle-btn");
const authBtnLabel = document.querySelector("#auth-btn-label");
const skipAuthBtn = document.querySelector("#skip-auth-btn");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authForms = document.querySelectorAll("[data-auth-form]");
const authMessage = document.querySelector("#auth-message");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const registerPasswordInput = document.querySelector("#register-password");
const strengthMeterFill = document.querySelector("#strength-meter-fill");
const strengthLabel = document.querySelector("#strength-label");
const scanTicker = document.querySelector("#scan-ticker");
const charCountSpan = document.querySelector("#char-count");
const wordCountSpan = document.querySelector("#word-count");
const readTimeSpan = document.querySelector("#read-time");
const clearTextBtn = document.querySelector("#clear-text-btn");
const riskTagsContainer = document.querySelector("#risk-tags");
const trustTagsContainer = document.querySelector("#trust-tags");
const imageInput = document.querySelector("#article-image");
const languageInput = document.querySelector("#analysis-language");
const simpleModeToggle = document.querySelector("#simple-mode-toggle");
const simpleModeLabel = document.querySelector("#simple-mode-label");
const voiceInputButton = document.querySelector("#voice-input-button");
const voiceInputLabel = document.querySelector("#voice-input-label");
const voiceStatus = document.querySelector("#voice-status");
const languageSupportNote = document.querySelector("#language-support-note");
const trafficLightResult = document.querySelector("#traffic-light-result");
const trafficLightIndicator = document.querySelector("#traffic-light-indicator");
const trafficLightTitle = document.querySelector("#traffic-light-title");
const trafficLightCopy = document.querySelector("#traffic-light-copy");
const readVerdictAloud = document.querySelector("#read-verdict-aloud");
const readVerdictLabel = document.querySelector("#read-verdict-label");
const speechOutputStatus = document.querySelector("#speech-output-status");
const sourceToggle = document.querySelector("#source-toggle");
const sourceUrlInput = document.querySelector("#source-url");
const verdictCategory = document.querySelector("#verdict-category");
const verdictSecondaryTags = document.querySelector("#verdict-secondary-tags");
const openVerificationPlan = document.querySelector("#open-verification-plan");
const planVerdict = document.querySelector("#plan-verdict");
const planClaim = document.querySelector("#plan-claim");
const planProgress = document.querySelector("#plan-progress");
const planProgressTrack = document.querySelector("#plan-progress-track");
const planProgressFill = document.querySelector("#plan-progress-fill");
const verificationPlanList = document.querySelector("#verification-plan-list");
const planFeedback = document.querySelector("#plan-feedback");
const copyVerificationPlan = document.querySelector("#copy-verification-plan");
const evidenceList = document.querySelector("#evidence-list");
const sourceTrustPanel = document.querySelector("#source-trust-panel");
const evidenceDetail = document.querySelector("#evidence-detail");
const auditRecord = document.querySelector("#audit-record");
const communityList = document.querySelector("#community-list");
const communityForm = document.querySelector("#community-form");
const notificationButton = document.querySelector("#notification-button");
const notificationPanel = document.querySelector("#notification-panel");

let activeText = "";
let latestResult = null;
let latestResultPromise = null;
let timers = [];
let scanRunId = 0;
let session = loadSession();
let history = loadHistory();
let verificationPlanKey = "";
let verificationPlanItems = [];
let activeRecognition = null;

function selectedLanguageStrings() {
  const language = languageInput ? languageInput.value : "en";
  return window.FACTLENS_STRINGS?.[language] || window.FACTLENS_STRINGS?.en || {};
}

function updateLanguageSupportNote() {
  if (!languageSupportNote) return;
  const text = textarea ? textarea.value : "";
  const containsUnsupportedScript = /[\u0900-\u097f\u0c00-\u0c7f]/.test(text);
  const nonEnglishSelected = languageInput && languageInput.value !== "en";
  languageSupportNote.hidden = !containsUnsupportedScript && !nonEnglishSelected;
  languageSupportNote.textContent = containsUnsupportedScript
    ? selectedLanguageStrings().translateBeforeCheck
    : nonEnglishSelected
      ? selectedLanguageStrings().languageCaution
      : "";
}

function updateAccessibleControlLabels() {
  const strings = selectedLanguageStrings();
  if (simpleModeLabel) simpleModeLabel.textContent = strings.simpleView;
  if (voiceInputLabel && !activeRecognition) voiceInputLabel.textContent = strings.speakClaim;
  if (readVerdictLabel && !window.speechSynthesis?.speaking) readVerdictLabel.textContent = strings.readAloud;
  updateLanguageSupportNote();
}

function updateTrafficLightResult() {
  if (!latestResult || !trafficLightResult) return;
  const strings = selectedLanguageStrings();
  const labelKey = latestResult.type === "fake" ? "trafficFake" : latestResult.type === "real" ? "trafficReal" : "trafficReview";
  trafficLightIndicator.className = `traffic-light-indicator ${latestResult.type}`;
  trafficLightTitle.textContent = strings[labelKey];
  trafficLightCopy.textContent = strings.trafficSummary;
  trafficLightResult.hidden = !simpleModeToggle?.checked;
}

function initializeAccessibleControls() {
  if (simpleModeToggle) {
    simpleModeToggle.checked = localStorage.getItem("factlens-simple-mode") === "true";
    document.body.classList.toggle("simple-mode", simpleModeToggle.checked);
    simpleModeToggle.addEventListener("change", () => {
      document.body.classList.toggle("simple-mode", simpleModeToggle.checked);
      localStorage.setItem("factlens-simple-mode", String(simpleModeToggle.checked));
      updateTrafficLightResult();
    });
  }

  if (languageInput) languageInput.addEventListener("change", updateAccessibleControlLabels);
  updateAccessibleControlLabels();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (voiceInputButton && !SpeechRecognition) {
    voiceInputButton.disabled = true;
    if (voiceStatus) voiceStatus.textContent = selectedLanguageStrings().voiceUnsupported;
  }
}

function startOpeningAnimation() {
  const splash = document.querySelector('[data-screen="splash"]');
  const appShell = document.querySelector(".app-shell");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!splash || !appShell || prefersReducedMotion || sessionStorage.getItem("factlens-intro-shown")) {
    setScreen("input");
    return;
  }

  sessionStorage.setItem("factlens-intro-shown", "true");
  appShell.inert = true;
  setScreen("splash");
  window.setTimeout(() => {
    splash.classList.add("is-leaving");
    window.setTimeout(() => {
      setScreen("input");
      splash.classList.remove("is-leaving");
      appShell.inert = false;
    }, 280);
  }, 1100);
}

function loadSession() {
  try {
    const stored = JSON.parse(localStorage.getItem("verity-session"));
    if (stored) return stored;
  } catch {}
  return { username: "Guest Researcher", isGuest: true, token: "guest" };
}

function saveSession(nextSession) {
  session = nextSession;
  localStorage.setItem("verity-session", JSON.stringify(nextSession));
}

function clearSession() {
  session = { username: "Guest Researcher", isGuest: true, token: "guest" };
  localStorage.removeItem("verity-session");
}

function loadHistory() {
  try {
    const username = session && session.username ? session.username.toLowerCase() : "guest";
    const scopedKey = `verity-history:${username}`;
    const scopedHistory = localStorage.getItem(scopedKey);
    if (scopedHistory) return JSON.parse(scopedHistory) || [];
    return [];
  } catch {
    return [];
  }
}

function saveHistory() {
  const username = session && session.username ? session.username.toLowerCase() : "guest";
  localStorage.setItem(`verity-history:${username}`, JSON.stringify(history.slice(0, 8)));
}

function setScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === screenName);
  });

  productNav.forEach((pill) => {
    const isActive = pill.dataset.productNav === screenName;
    pill.classList.toggle("is-active", isActive);
    if (isActive) {
      pill.setAttribute("aria-current", "page");
    } else {
      pill.removeAttribute("aria-current");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Cinematic Opening Logo Animation Sequence
// Header brand logo re-trigger
const headerBrandClick = document.querySelector("#header-brand-click");
if (headerBrandClick) {
  headerBrandClick.addEventListener("click", () => {
    setScreen("input");
  });
}

function updateAccountHeader() {
  if (!accountName) return;
  const isGuest = !session || session.isGuest;
  accountName.textContent = session && !session.isGuest ? session.username : "Guest";

  if (authBtnLabel) {
    authBtnLabel.textContent = isGuest ? "Sign In" : "Sign Out";
  }
}

function setAuthMode(mode) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.authTab === mode);
  });

  authForms.forEach((formElement) => {
    formElement.classList.toggle("is-active", formElement.dataset.authForm === mode);
  });

  showAuthMessage("");
}

function showAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.classList.toggle("error", isError);
  authMessage.classList.toggle("success", !isError && message.length > 0);
}

// Password Strength Meter
if (registerPasswordInput) {
  registerPasswordInput.addEventListener("input", () => {
    const val = registerPasswordInput.value;
    let score = 0;
    if (val.length >= 6) score += 1;
    if (val.length >= 10) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    if (!strengthMeterFill || !strengthLabel) return;

    if (val.length === 0) {
      strengthMeterFill.style.width = "0%";
      strengthMeterFill.style.backgroundColor = "transparent";
      strengthLabel.textContent = "Password strength";
      return;
    }

    if (score <= 2) {
      strengthMeterFill.style.width = "33%";
      strengthMeterFill.style.backgroundColor = "var(--fake)";
      strengthLabel.textContent = "Strength: Weak";
    } else if (score <= 4) {
      strengthMeterFill.style.width = "66%";
      strengthMeterFill.style.backgroundColor = "var(--amber)";
      strengthLabel.textContent = "Strength: Medium";
    } else {
      strengthMeterFill.style.width = "100%";
      strengthMeterFill.style.backgroundColor = "var(--real)";
      strengthLabel.textContent = "Strength: Strong";
    }
  });
}

async function authenticate(mode, formElement) {
  const formData = new FormData(formElement);
  const credentials = {
    username: String(formData.get("username")).trim(),
    password: String(formData.get("password")),
  };

  if (!credentials.username || !credentials.password) {
    showAuthMessage("Please enter both username/email and password.", true);
    return;
  }

  if (mode === "register" && credentials.password.length < 6) {
    showAuthMessage("Password must be at least 6 characters.", true);
    return;
  }

  if (mode === "register" && credentials.password !== String(formData.get("confirmPassword"))) {
    showAuthMessage("Passwords do not match.", true);
    return;
  }

  showAuthMessage(mode === "login" ? "Authenticating..." : "Creating account...");

  try {
    const nextSession = await requestAuth(mode, credentials);
    completeAuthentication(nextSession);
  } catch (error) {
    showAuthMessage(error.message, true);
  }
}

async function requestAuth(mode, credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || "Authentication failed");
    }

    return response.json();
  } catch (error) {
    if (error.name !== "TypeError") throw error;
    return localAuth(mode, credentials);
  }
}

function localAuth(mode, credentials) {
  const users = loadLocalUsers();
  const username = credentials.username.toLowerCase();

  if (mode === "register") {
    if (users[username]) {
      throw new Error("Username already registered. Try logging in.");
    }
    users[username] = { username, password: credentials.password };
    saveLocalUsers(users);
    return { username, isGuest: false, token: `local-${Date.now()}` };
  }

  if (!users[username] || users[username].password !== credentials.password) {
    throw new Error("Invalid username or password");
  }

  return { username, isGuest: false, token: `local-${Date.now()}` };
}

function loadLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem("verity-users")) || {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users) {
  localStorage.setItem("verity-users", JSON.stringify(users));
}

function completeAuthentication(nextSession) {
  saveSession({ ...nextSession, isGuest: false });
  history = loadHistory();
  loginForm.reset();
  registerForm.reset();
  showAuthMessage("");
  updateAccountHeader();
  renderRecent();
  refreshNotifications();
  setScreen("input");
}

async function communityRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session && session.token ? session.token : ""}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Community service unavailable");
  }
  return response.json();
}

function extractFeatures(text) {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-zA-Z0-9']+/g) || [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const wordCount = words.length;

  const countHits = (phrases) => phrases.filter((p) => normalized.includes(p)).length;

  const clickbaitHits = countHits(CLICKBAIT_TERMS);
  const conspiracyHits = countHits(CONSPIRACY_TERMS);
  const certaintyHits = countHits(FALSE_CERTAINTY_TERMS);
  const vagueHits = countHits(VAGUE_SOURCE_TERMS);
  const credibleHits = countHits(CREDIBLE_TERMS);
  const sourceHits = countHits(SOURCE_TERMS);
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const allCapsWords = words.filter((w) => w.length >= 4 && w === w.toUpperCase() && isNaN(w)).length;
  const numberCount = (text.match(/\b\d+([.,]\d+)?%?\b/g) || []).length;
  const quoteCount = (text.match(/["']/g) || []).length;

  const riskSignals = [];
  const trustSignals = [];

  if (clickbaitHits) riskSignals.push("Sensational clickbait language");
  if (conspiracyHits) riskSignals.push("Conspiracy framing & cover-up terms");
  if (certaintyHits) riskSignals.push("Absolute / miracle cure claims");
  if (vagueHits) riskSignals.push("Vague sourcing ('sources say')");
  if (exclamationCount >= 2) riskSignals.push("Excessive punctuation pressure (!)");
  if (allCapsWords >= 2) riskSignals.push("All-caps emotional capitalisation");
  if (wordCount < 18 && (clickbaitHits || exclamationCount)) riskSignals.push("Short sensational headline");

  if (credibleHits) trustSignals.push("Peer-reviewed evidence vocabulary");
  if (sourceHits) trustSignals.push("Named credible news agency");
  if (numberCount) trustSignals.push("Specific empirical data & figures");
  if (quoteCount >= 2) trustSignals.push("Direct quotes & attributed statements");
  if (wordCount >= 60) trustSignals.push("Detailed analytical article structure");

  return {
    wordCount,
    sentenceCount: sentences.length,
    clickbaitHits,
    conspiracyHits,
    certaintyHits,
    vagueHits,
    credibleHits,
    sourceHits,
    exclamationCount,
    questionCount,
    allCapsWords,
    numberCount,
    quoteCount,
    riskSignals,
    trustSignals,
  };
}

function clamp(val) {
  return Math.max(0.08, Math.min(0.95, val));
}

function buildLocalResult(text) {
  const feat = extractFeatures(text);

  let lstmScore = 0.35 + feat.vagueHits * 0.12 + Math.min(feat.exclamationCount, 4) * 0.08 + Math.min(feat.questionCount, 3) * 0.04 + Math.min(feat.allCapsWords, 5) * 0.07;
  if (feat.wordCount < 20 && (feat.clickbaitHits || feat.exclamationCount)) lstmScore += 0.15;
  lstmScore -= Math.min(feat.credibleHits, 4) * 0.07 + (feat.wordCount >= 60 ? 0.08 : 0);
  lstmScore = clamp(lstmScore);

  let albertScore = 0.35 + feat.clickbaitHits * 0.14 + feat.conspiracyHits * 0.18 + feat.certaintyHits * 0.16 + feat.vagueHits * 0.08 - feat.credibleHits * 0.10 - feat.sourceHits * 0.12 - Math.min(feat.numberCount, 4) * 0.04;
  albertScore = clamp(albertScore);

  let cnnRnnScore = 0.35 + (feat.clickbaitHits * 1.2 + feat.conspiracyHits * 1.5 + Math.min(feat.exclamationCount, 4) * 0.6 + Math.min(feat.allCapsWords, 4) * 0.5) * 0.08 - feat.sourceHits * 0.10 - Math.min(feat.credibleHits, 4) * 0.06 - (feat.quoteCount >= 2 ? 0.05 : 0);
  cnnRnnScore = clamp(cnnRnnScore);

  const firstPass = (lstmScore * 0.25 + albertScore * 0.35 + cnnRnnScore * 0.20) / 0.80;
  let fnnetScore = firstPass + feat.riskSignals.length * 0.05 - feat.trustSignals.length * 0.05;
  if (feat.riskSignals.length && !feat.trustSignals.length) fnnetScore += 0.12;
  if (feat.trustSignals.length && !feat.riskSignals.length) fnnetScore -= 0.12;
  fnnetScore = clamp(fnnetScore);

  const modelScores = [lstmScore, albertScore, cnnRnnScore, fnnetScore];
  const modelResults = models.map((m, idx) => {
    const fakeScore = modelScores[idx];
    const verdict = fakeScore >= 0.50 ? "Fake" : "Real";
    const conf = Math.round((verdict === "Fake" ? fakeScore : 1 - fakeScore) * 100);
    return { ...m, verdict, confidence: conf, fakeScore };
  });

  const combinedFakeScore = modelResults.reduce((sum, m) => sum + m.fakeScore * m.weight, 0);
  const isFake = combinedFakeScore >= 0.50;

  const dist = Math.abs(combinedFakeScore - 0.50);
  const finalConf = Math.round(Math.max(isFake ? combinedFakeScore : 1 - combinedFakeScore, 0.55 + Math.min(dist * 1.5, 0.40)) * 100);

  const rationale = isFake
    ? `Signals to review: ${feat.riskSignals.slice(0, 3).join(", ") || "language patterns associated with sensational claims"}. These patterns are not proof that a claim is false; check the original source before sharing.`
    : `Signals found: ${feat.trustSignals.slice(0, 3).join(", ") || "some attribution or evidence language"}. These patterns do not confirm a claim; compare it with reliable primary sources.`;

  return {
    verdict: isFake ? "Likely Fabricated" : "Likely Real",
    type: isFake ? "fake" : "real",
    confidence: finalConf,
    rationale,
    modelResults,
    riskSignals: feat.riskSignals,
    trustSignals: feat.trustSignals,
    category: isFake ? "Fabricated" : "Real",
    highlights: [],
    evidence: [{ title: "FactLens Signal Review", source: "FactLens", domain: "", stance: "signal review", snippet: "Reviewed language cues, certainty indicators, and source attribution. This is not independent verification.", url: "" }],
    sourceTrust: { score: isFake ? 35 : 85, domain: "", basis: isFake ? "Unverified sensational phrases detected" : "Contains credible source framing" },
    spreadRisk: { level: feat.riskSignals.length >= 3 ? "High" : feat.riskSignals.length ? "Medium" : "Low", score: Math.min(100, feat.riskSignals.length * 20) },
    aiSignal: { label: "Likely human-written", flagged: false, score: 28 },
    mediaSignal: { relevant: false, aligned: null, message: "No image attached" },
    auditId: "local-preview",
  };
}

async function analyzeText(text, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_url: options.sourceUrl || "", image_name: options.imageName || "", language: options.language || "en" }),
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);
    return normalizeBackendResult(await response.json());
  } catch (err) {
    console.log("Using deterministic local detection engine:", err.message);
    return buildLocalResult(text);
  }
}

function normalizeBackendResult(result) {
  return {
    verdict: result.verdict,
    type: result.type,
    confidence: result.confidence,
    rationale: result.rationale,
    modelResults: result.modelResults || result.model_results || [],
    riskSignals: result.riskSignals || [],
    trustSignals: result.trustSignals || [],
    category: result.category || (result.type === "fake" ? "Fabricated" : "Real"),
    highlights: result.highlights || [],
    evidence: result.evidence || [],
    sourceTrust: result.sourceTrust || { score: 50, domain: "", basis: "No source provided" },
    spreadRisk: result.spreadRisk || { level: "Low", score: 0 },
    aiSignal: result.aiSignal || { label: "Likely human-written", flagged: false, score: 28 },
    mediaSignal: result.mediaSignal || { relevant: false, aligned: null, message: "No image attached" },
    auditId: result.auditId || "local-preview",
  };
}

function summarizeText(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (cleanText.length <= 65) return cleanText;
  return `${cleanText.slice(0, 62)}...`;
}

function formatRelativeTime(timestamp) {
  if (typeof timestamp !== "number") return timestamp || "Just now";
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return `${Math.floor(hours / 24)}d ago`;
}

function renderRecent() {
  if (!recentList) return;
  recentList.innerHTML = "";

  if (!history.length) {
    recentList.innerHTML = `<div class="empty-state"><span class="empty-signal" aria-hidden="true">+</span><p>Nothing checked yet &mdash; paste a story or click any test sample above.</p></div>`;
    return;
  }

  history.forEach((item) => {
    const card = document.createElement("article");
    card.className = `recent-card ${item.type}`;
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="recent-body">
        <p class="recent-title">${item.summary}</p>
        <div class="recent-meta">
          <span class="timestamp">${formatRelativeTime(item.timestamp || item.time)}</span>
        </div>
      </div>
      <span class="verdict-chip ${item.type}">${item.type === "fake" ? "Fake" : item.type === "review" ? "Review" : "Real"}</span>
    `;

    card.addEventListener("click", () => {
      activeText = item.fullText || item.summary;
      if (textarea) textarea.value = activeText;
      updateTextStats();
      latestResult = item.result ? normalizeBackendResult(item.result) : latestResult;
      if (latestResult) {
        renderVerdict();
        renderBreakdown();
        setScreen("verdict");
      }
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") card.click();
    });

    recentList.append(card);
  });
}

function renderScanRows(statuses) {
  if (!scanModels) return;
  scanModels.innerHTML = "";

  models.forEach((model) => {
    const status = statuses[model.id] || "waiting";
    const card = document.createElement("article");
    card.className = `model-scan-card ${status}`;

    card.innerHTML = `
      <div class="model-scan-head">
        <div class="model-badge">
          <span class="model-name">${model.name}</span>
          <span class="model-weight">${Math.round(model.weight * 100)}% weight</span>
        </div>
        <span class="status-chip ${status}">
          ${status === "running" ? `<span class="pulse-dot"></span> Scanning...` : status === "done" ? "Complete" : "Waiting"}
        </span>
      </div>
      <p class="model-task">${model.task}</p>
      <div class="model-progress-mini"><span class="bar ${status}"></span></div>
    `;

    scanModels.append(card);
  });
}

function updateProgress(doneCount) {
  const percent = Math.round((doneCount / models.length) * 100);
  if (progressValue) progressValue.textContent = `${percent}%`;
  if (progressFill) progressFill.style.width = `${percent}%`;
}

function startScan(text, options = {}) {
  scanRunId += 1;
  const currentRunId = scanRunId;
  activeText = text;
  latestResultPromise = analyzeText(text, options);
  clearTimers();
  setScreen("scan");

  const statuses = Object.fromEntries(models.map((model) => [model.id, "waiting"]));
  renderScanRows(statuses);
  updateProgress(0);

  const tickerMessages = [
    "Preparing the claim review...",
    "Reviewing sentence flow and tone...",
    "Checking wording and claim framing...",
    "Looking for attribution and phrase cues...",
    "Summarizing detected signals...",
  ];

  if (scanTicker) scanTicker.textContent = tickerMessages[0];

  models.forEach((model, index) => {
    timers.push(
      window.setTimeout(() => {
        statuses[model.id] = "running";
        renderScanRows(statuses);
        if (scanTicker) scanTicker.textContent = tickerMessages[index + 1] || "Finalizing report...";
      }, index * 400)
    );

    timers.push(
      window.setTimeout(() => {
        statuses[model.id] = "done";
        renderScanRows(statuses);
        updateProgress(index + 1);

        if (index === models.length - 1) {
          timers.push(window.setTimeout(() => finishScan(currentRunId), 350));
        }
      }, index * 400 + 350)
    );
  });
}

async function finishScan(currentRunId) {
  latestResult = await latestResultPromise;
  if (currentRunId !== scanRunId) return;

  renderVerdict();
  renderBreakdown();
  addHistoryEntry();
  setScreen("verdict");
}

function renderVerdict() {
  if (!verdictBand) return;

  verdictBand.className = `verdict-card ${latestResult.type}`;
  if (verdictTitle) verdictTitle.textContent = latestResult.type === "fake" ? "Likely Fabricated" : latestResult.type === "review" ? "Needs Review" : "Likely Real";
  if (confidence) confidence.textContent = `${latestResult.confidence}%`;
  if (rationaleText) rationaleText.textContent = latestResult.rationale;
  if (verdictCategory) verdictCategory.textContent = latestResult.category || "Unclassified";
  updateTrafficLightResult();

  if (verdictSecondaryTags) {
    verdictSecondaryTags.innerHTML = "";
    const spreadTag = document.createElement("span");
    spreadTag.className = `secondary-tag spread-${String(latestResult.spreadRisk.level).toLowerCase()}`;
    spreadTag.textContent = `Spread risk: ${latestResult.spreadRisk.level}`;
    verdictSecondaryTags.append(spreadTag);
    if (latestResult.aiSignal.flagged) {
      const aiTag = document.createElement("span");
      aiTag.className = "secondary-tag ai-tag";
      aiTag.textContent = latestResult.aiSignal.label;
      verdictSecondaryTags.append(aiTag);
    }
  }
  renderEvidence();

  if (riskTagsContainer) {
    riskTagsContainer.innerHTML = "";
    if (latestResult.riskSignals && latestResult.riskSignals.length) {
      latestResult.riskSignals.forEach((sig) => {
        const tag = document.createElement("span");
        tag.className = "signal-tag risk";
        tag.textContent = `⚠️ ${sig}`;
        riskTagsContainer.append(tag);
      });
    } else {
      riskTagsContainer.innerHTML = `<span class="signal-tag neutral">No high-risk sensational phrases detected</span>`;
    }
  }

  if (trustTagsContainer) {
    trustTagsContainer.innerHTML = "";
    if (latestResult.trustSignals && latestResult.trustSignals.length) {
      latestResult.trustSignals.forEach((sig) => {
        const tag = document.createElement("span");
        tag.className = "signal-tag trust";
        tag.textContent = `🛡️ ${sig}`;
        trustTagsContainer.append(tag);
      });
    } else {
      trustTagsContainer.innerHTML = `<span class="signal-tag neutral">No formal news attribution tags detected</span>`;
    }
  }
}

function createVerificationPlan(result) {
  const risks = (result.riskSignals || []).slice(0, 2);
  const trustSignals = (result.trustSignals || []).slice(0, 2);

  return [
    {
      title: "Find the original publication",
      description: "Trace the claim to its first article, report, or official post. Check the author, date, and full context.",
    },
    {
      title: risks.length ? "Investigate the flagged language" : "Check the claim in full context",
      description: risks.length
        ? `Look for primary evidence for: ${risks.join("; ")}. Confirm the wording reflects the source accurately.`
        : "Read beyond the headline and compare the complete statement with the source it refers to.",
    },
    {
      title: trustSignals.length ? "Trace the supporting references" : "Find primary evidence",
      description: trustSignals.length
        ? `Open the original publication, dataset, or statement behind: ${trustSignals.join("; ")}.`
        : "Look for original records, data, or statements that directly support the claim.",
    },
    {
      title: "Cross-check independently",
      description: "Compare names, dates, and figures with independent reporting. Note any missing context or disagreement.",
    },
  ];
}

function updateVerificationPlanProgress() {
  if (!planProgress || !planProgressTrack || !planProgressFill) return;
  const complete = verificationPlanItems.filter((item) => item.checked).length;
  const total = verificationPlanItems.length;
  planProgress.textContent = `${complete} of ${total} complete`;
  planProgressTrack.setAttribute("aria-valuemax", String(total));
  planProgressTrack.setAttribute("aria-valuenow", String(complete));
  planProgressFill.style.width = `${total ? (complete / total) * 100 : 0}%`;
}

function renderVerificationPlan() {
  if (!latestResult || !verificationPlanList) return;
  const nextKey = `${latestResult.auditId || ""}:${activeText}`;
  if (nextKey !== verificationPlanKey) {
    verificationPlanKey = nextKey;
    verificationPlanItems = createVerificationPlan(latestResult).map((item) => ({ ...item, checked: false }));
  }

  const verdictLabel = latestResult.type === "fake" ? "Likely fabricated" : latestResult.type === "real" ? "Likely real" : "Needs review";
  if (planVerdict) planVerdict.textContent = verdictLabel;
  if (planClaim) planClaim.textContent = summarizeText(activeText);
  verificationPlanList.replaceChildren();

  verificationPlanItems.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = `verification-plan-item${item.checked ? " is-complete" : ""}`;

    const label = document.createElement("label");
    label.className = "plan-task-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.setAttribute("aria-label", `Mark step ${index + 1} complete: ${item.title}`);
    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      row.classList.toggle("is-complete", item.checked);
      updateVerificationPlanProgress();
    });

    const copy = document.createElement("span");
    copy.className = "plan-task-copy";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const description = document.createElement("span");
    description.textContent = item.description;
    copy.append(title, description);
    label.append(checkbox, copy);
    row.append(label);
    verificationPlanList.append(row);
  });

  updateVerificationPlanProgress();
  if (planFeedback) planFeedback.textContent = "";
}

function renderEvidence() {
  if (!evidenceList) return;
  evidenceList.innerHTML = "";
  (latestResult.evidence || []).forEach((source) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `evidence-card ${source.stance.replaceAll(" ", "-")}`;
    card.innerHTML = `<span><strong>${source.source || "FactLens Registry"}</strong><small>${source.title}</small><em>${source.stance}</em></span><span aria-hidden="true">&#8599;</span>`;
    card.addEventListener("click", () => {
      if (evidenceDetail) evidenceDetail.innerHTML = `<div class="detail-stance ${source.stance.replaceAll(" ", "-")}">${source.stance}</div><h3>${source.title}</h3><p class="detail-source">${source.source || "FactLens Registry"}${source.domain ? ` · ${source.domain}` : ""}</p><p>${source.snippet}</p>${source.url ? `<a href="${source.url}" target="_blank" rel="noreferrer">Open source &#8599;</a>` : ""}`;
      setScreen("evidence");
    });
    evidenceList.append(card);
  });
}

function renderBreakdown() {
  if (!breakdownList) return;
  breakdownList.innerHTML = "";

  const riskSignals = latestResult.riskSignals || [];
  const trustSignals = latestResult.trustSignals || [];
  if (breakdownSummaryCopy) {
    const riskCount = riskSignals.length;
    const trustCount = trustSignals.length;
    if (riskCount && trustCount) {
      breakdownSummaryCopy.textContent = `${riskCount} risk cue${riskCount === 1 ? "" : "s"} and ${trustCount} credibility cue${trustCount === 1 ? "" : "s"} stood out. These are language patterns, not verification.`;
    } else if (riskCount) {
      breakdownSummaryCopy.textContent = `${riskCount} risk cue${riskCount === 1 ? "" : "s"} stood out. Check primary sources before relying on the claim.`;
    } else if (trustCount) {
      breakdownSummaryCopy.textContent = `${trustCount} credibility cue${trustCount === 1 ? "" : "s"} appeared. They do not confirm the claim; check the original source.`;
    } else {
      breakdownSummaryCopy.textContent = "No standout language cues were detected. That does not confirm the claim; check the original source.";
    }
  }

  if (breakdownKeySignals) {
    breakdownKeySignals.replaceChildren();
    const highlights = [
      ...riskSignals.slice(0, 2).map((text) => ({ text, type: "risk" })),
      ...trustSignals.slice(0, 1).map((text) => ({ text, type: "trust" })),
    ];
    if (!highlights.length) highlights.push({ text: "No standout cues detected", type: "neutral" });
    highlights.forEach((signal) => {
      const tag = document.createElement("span");
      tag.className = `breakdown-key-signal ${signal.type}`;
      tag.textContent = signal.text;
      breakdownKeySignals.append(tag);
    });
  }

  latestResult.modelResults.forEach((model) => {
    const displayModel = models.find((item) => item.id === model.id);
    const card = document.createElement("article");
    card.className = `breakdown-card ${model.verdict.toLowerCase()}`;

    card.innerHTML = `
      <div class="breakdown-header">
        <div class="breakdown-title-wrap">
          <span class="model-pill">${displayModel?.name || model.name}</span>
          <span class="weight-label">Weight: ${Math.round(model.weight * 100)}%</span>
        </div>
        <div class="breakdown-score-badge ${model.verdict.toLowerCase()}">
          <span class="score-verdict">${model.verdict}</span>
          <span class="score-conf">${model.confidence}%</span>
        </div>
      </div>
      <p class="breakdown-desc">${displayModel?.description || model.description}</p>
      <div class="highlight-chips">${(latestResult.highlights || []).slice(0, 3).map((item) => `<span title="${item.reason}">${item.text}</span>`).join("") || "<span class=\"no-highlight\">No dominant phrase</span>"}</div>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar-fill ${model.verdict.toLowerCase()}" style="width: ${model.confidence}%"></div>
      </div>
    `;

    breakdownList.append(card);
  });

  if (sourceTrustPanel) {
    const trust = latestResult.sourceTrust || { score: 50, domain: "", basis: "No source provided" };
    sourceTrustPanel.innerHTML = `<div><span>Source Trust Index</span><strong>${trust.score}/100</strong></div><p>${trust.domain || "No recognized domain"} &bull; ${trust.basis}</p>`;
  }
}

async function renderCommunity() {
  if (!communityList) return;
  communityList.innerHTML = `<div class="empty-state">Loading community context...</div>`;
  try {
    const notes = await communityRequest("/community/notes");
    const currentUser = session && session.username ? session.username.toLowerCase() : "";
    communityList.innerHTML = notes.length ? notes.map((note) => {
      const liked = note.currentUserReaction === "like";
      const unliked = note.currentUserReaction === "unlike";
      const canDelete = note.author && note.author === currentUser;
      return `<article class="community-note" data-note-id="${note.id}">
        <div class="community-note-head"><span class="community-verdict ${note.verdict}">${note.verdict === "fake" ? "Fake" : "Real"}</span><span>Trust ${note.trust}/100</span></div>
        <p class="community-article">${note.article || "Community context"}</p><p>${note.text}</p><small class="community-author">Posted by ${note.author}</small>
        <div class="community-note-actions">
          <button class="reaction-button ${liked ? "is-selected" : ""}" type="button" data-reaction="like" aria-label="Like this note" title="Like"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9.4a2 2 0 0 0 1.9-1.4l2-6A2 2 0 0 0 18.4 10H14l.7-3.4A2.2 2.2 0 0 0 12.5 4L7 10v10Z" /></svg> <span class="reaction-count">${note.likes || 0}</span></button>
          <button class="reaction-button ${unliked ? "is-selected is-negative" : ""}" type="button" data-reaction="unlike" aria-label="Unlike this note" title="Unlike"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17 14V4h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3ZM17 4H7.6a2 2 0 0 0-1.9 1.4l-2 6A2 2 0 0 0 5.6 14H10l-.7 3.4A2.2 2.2 0 0 0 11.5 20L17 14V4Z" /></svg> <span class="reaction-count">${note.unlikes || 0}</span></button>
          ${canDelete ? `<button class="delete-note-button" type="button" data-delete-note title="Delete your note">Delete</button>` : ""}
        </div>
      </article>`;
    }).join("") : `<div class="empty-state">No community notes yet. Be the first to add an assessment.</div>`;
  } catch (error) {
    communityList.innerHTML = `<div class="empty-state">${error.message}. Start backend to publish community notes.</div>`;
  }
}

async function refreshNotifications() {
  if (!notificationButton || !session || session.isGuest) return;
  try {
    const notifications = await communityRequest("/notifications");
    const unread = notifications.filter((item) => !item.read).length;
    notificationButton.setAttribute("data-count", unread ? String(unread) : "");
    notificationPanel.innerHTML = notifications.length
      ? notifications.map((item) => `<div class="notification-item"><strong>${item.message}</strong><small>${new Date(item.timestamp).toLocaleString()}</small></div>`).join("")
      : `<div class="notification-empty">No notifications yet.</div>`;
  } catch {
    notificationButton.setAttribute("data-count", "");
  }
}

if (notificationButton) {
  notificationButton.addEventListener("click", () => {
    const notificationWrap = notificationButton.closest(".notification-wrap");
    const isOpen = notificationWrap.classList.toggle("is-open");
    notificationButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const notificationWrap = notificationButton.closest(".notification-wrap");
    if (!notificationWrap.contains(event.target)) {
      notificationWrap.classList.remove("is-open");
      notificationButton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      notificationButton.closest(".notification-wrap").classList.remove("is-open");
      notificationButton.setAttribute("aria-expanded", "false");
      notificationButton.focus();
    }
  });
}

function renderAudit() {
  if (!auditRecord || !latestResult) return;
  auditRecord.textContent = JSON.stringify({
    auditId: latestResult.auditId,
    timestamp: new Date().toISOString(),
    modelScores: Object.fromEntries(latestResult.modelResults.map((model) => [model.id, model.fakeScore])),
    evidence: latestResult.evidence,
    verdict: latestResult.verdict,
    category: latestResult.category,
  }, null, 2);
}

function addHistoryEntry() {
  history = [
    {
      summary: summarizeText(activeText),
      fullText: activeText,
      type: latestResult.type,
      confidence: latestResult.confidence,
      timestamp: Date.now(),
      result: latestResult,
    },
    ...history,
  ].slice(0, 8);

  saveHistory();
  renderRecent();
}

function clearTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function updateTextStats() {
  const text = textarea ? textarea.value.trim() : "";
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const readTime = Math.ceil(words / 200);

  if (charCountSpan) charCountSpan.textContent = chars;
  if (wordCountSpan) wordCountSpan.textContent = words;
  if (readTimeSpan) readTimeSpan.textContent = text ? `${readTime} min read` : "0 min read";

  const submitBtn = form ? form.querySelector("button[type='submit']") : null;
  if (submitBtn) submitBtn.disabled = chars === 0;
  updateLanguageSupportNote();
}

// Form Submission
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;
    if (/[\u0900-\u097f\u0c00-\u0c7f]/.test(text)) {
      updateLanguageSupportNote();
      languageSupportNote?.focus();
      return;
    }
    startScan(text, {
      sourceUrl: sourceToggle && sourceToggle.checked && sourceUrlInput ? sourceUrlInput.value.trim() : "",
      imageName: imageInput && imageInput.files[0] ? imageInput.files[0].name : "",
      language: languageInput ? languageInput.value : "en",
    });
  });
}

if (textarea) {
  textarea.addEventListener("input", updateTextStats);
}

if (clearTextBtn) {
  clearTextBtn.addEventListener("click", () => {
    if (textarea) textarea.value = "";
    updateTextStats();
  });
}

if (voiceInputButton) {
  voiceInputButton.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !textarea) {
      if (voiceStatus) voiceStatus.textContent = selectedLanguageStrings().voiceUnsupported;
      return;
    }
    if (activeRecognition) {
      activeRecognition.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = { en: "en-US", hi: "hi-IN", te: "te-IN" }[languageInput?.value || "en"] || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      activeRecognition = recognition;
      voiceInputButton.setAttribute("aria-pressed", "true");
      voiceInputLabel.textContent = selectedLanguageStrings().stopListening;
      if (voiceStatus) voiceStatus.textContent = selectedLanguageStrings().listening;
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
      if (!transcript) return;
      textarea.value = [textarea.value.trim(), transcript].filter(Boolean).join(" ");
      updateTextStats();
      textarea.focus();
      if (voiceStatus) voiceStatus.textContent = selectedLanguageStrings().transcriptAdded;
    };
    recognition.onerror = (event) => {
      if (voiceStatus) {
        voiceStatus.textContent = event.error === "not-allowed"
          ? selectedLanguageStrings().voicePermissionDenied
          : selectedLanguageStrings().voiceError;
      }
    };
    recognition.onend = () => {
      activeRecognition = null;
      voiceInputButton.setAttribute("aria-pressed", "false");
      voiceInputLabel.textContent = selectedLanguageStrings().speakClaim;
    };

    try {
      recognition.start();
    } catch {
      if (voiceStatus) voiceStatus.textContent = selectedLanguageStrings().voiceError;
    }
  });
}

if (readVerdictAloud) {
  readVerdictAloud.addEventListener("click", () => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (speechOutputStatus) speechOutputStatus.textContent = selectedLanguageStrings().speechUnsupported;
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      readVerdictAloud.setAttribute("aria-pressed", "false");
      readVerdictLabel.textContent = selectedLanguageStrings().readAloud;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${trafficLightTitle.textContent} ${trafficLightCopy.textContent}`);
    utterance.lang = { en: "en-US", hi: "hi-IN", te: "te-IN" }[languageInput?.value || "en"] || "en-US";
    utterance.onstart = () => {
      readVerdictAloud.setAttribute("aria-pressed", "true");
      readVerdictLabel.textContent = selectedLanguageStrings().stopReading;
    };
    utterance.onend = () => {
      readVerdictAloud.setAttribute("aria-pressed", "false");
      readVerdictLabel.textContent = selectedLanguageStrings().readAloud;
    };
    utterance.onerror = () => {
      readVerdictAloud.setAttribute("aria-pressed", "false");
      readVerdictLabel.textContent = selectedLanguageStrings().readAloud;
      if (speechOutputStatus) speechOutputStatus.textContent = selectedLanguageStrings().speechUnsupported;
    };
    window.speechSynthesis.speak(utterance);
  });
}

if (sourceToggle && sourceUrlInput) {
  sourceToggle.addEventListener("change", () => {
    sourceUrlInput.disabled = !sourceToggle.checked;
    if (!sourceToggle.checked) sourceUrlInput.value = "";
  });
}

// 1-Click Sample Preset Handler
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    const autoscan = btn.dataset.autoscan === "true";
    if (PRESETS[key] && textarea) {
      textarea.value = PRESETS[key];
      updateTextStats();
      if (autoscan) {
        startScan(PRESETS[key]);
      } else {
        textarea.focus();
      }
    }
  });
});

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    authenticate("login", loginForm);
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    authenticate("register", registerForm);
  });
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setAuthMode(tab.dataset.authTab);
  });
});

const demoLoginBtn = document.querySelector("#demo-login-btn");
if (demoLoginBtn) {
  demoLoginBtn.addEventListener("click", () => {
    completeAuthentication({ username: "demo_researcher", token: `demo-${Date.now()}` });
  });
}

// Password Reveal Toggle Handler
document.querySelectorAll(".password-toggle").forEach((toggleBtn) => {
  toggleBtn.addEventListener("click", () => {
    const targetId = toggleBtn.dataset.target;
    const input = document.getElementById(targetId);
    if (input) {
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      toggleBtn.innerHTML = isPass
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  });
});

if (authToggleBtn) {
  authToggleBtn.addEventListener("click", () => {
    if (session && !session.isGuest) {
      scanRunId += 1;
      clearTimers();
      clearSession();
      history = loadHistory();
      updateAccountHeader();
      renderRecent();
      setScreen("input");
    } else {
      setAuthMode("login");
      setScreen("auth");
    }
  });
}

if (skipAuthBtn) {
  skipAuthBtn.addEventListener("click", () => {
    setScreen("input");
  });
}

if (openBreakdown) {
  openBreakdown.addEventListener("click", () => {
    setScreen("breakdown");
  });
}

if (openVerificationPlan) {
  openVerificationPlan.addEventListener("click", () => {
    renderVerificationPlan();
    setScreen("verification-plan");
  });
}

if (copyVerificationPlan) {
  copyVerificationPlan.addEventListener("click", async () => {
    const checklist = [
      `FactLens verification plan: ${planVerdict ? planVerdict.textContent : ""}`,
      `Claim: ${activeText.trim()}`,
      ...verificationPlanItems.map((item) => `${item.checked ? "[x]" : "[ ]"} ${item.title} - ${item.description}`),
      "Automated signals are a starting point, not a conclusion.",
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(checklist);
      if (planFeedback) planFeedback.textContent = "Checklist copied.";
    } catch {
      if (planFeedback) planFeedback.textContent = "Clipboard access is unavailable. You can still use the checklist on this page.";
    }
  });
}

document.querySelectorAll("[data-open-community]").forEach((button) => {
  button.addEventListener("click", () => {
    renderCommunity();
    setScreen("community");
  });
});

document.querySelectorAll("[data-open-audit]").forEach((button) => {
  button.addEventListener("click", () => {
    renderAudit();
    setScreen("audit");
  });
});

document.querySelectorAll("[data-back-breakdown]").forEach((button) => {
  button.addEventListener("click", () => setScreen("breakdown"));
});

if (communityForm) {
  communityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const articleField = document.querySelector("#community-article");
    const noteField = document.querySelector("#community-note");
    const article = articleField ? articleField.value.trim() : "";
    const note = noteField ? noteField.value.trim() : "";
    const verdictField = communityForm.querySelector("input[name='community-verdict']:checked");
    if (!article || !note || !verdictField) return;
    try {
      await communityRequest("/community/notes", {
        method: "POST",
        body: JSON.stringify({ article, verdict: verdictField.value, text: note }),
      });
      articleField.value = "";
      noteField.value = "";
      communityForm.reset();
      await renderCommunity();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

if (communityList) {
  communityList.addEventListener("click", async (event) => {
    const noteCard = event.target.closest("[data-note-id]");
    if (!noteCard) return;
    const noteId = noteCard.dataset.noteId;

    const reactionButton = event.target.closest("[data-reaction]");
    if (reactionButton) {
      const nextReaction = reactionButton.dataset.reaction;
      try {
        const selected = reactionButton.classList.contains("is-selected");
        await communityRequest(`/community/notes/${noteId}/reaction`, selected ? {
          method: "DELETE",
        } : {
          method: "PUT",
          body: JSON.stringify({ reaction: nextReaction }),
        });
        await renderCommunity();
        await refreshNotifications();
      } catch (error) {
        window.alert(error.message);
      }
      return;
    }

    if (event.target.closest("[data-delete-note]")) {
      try {
        await communityRequest(`/community/notes/${noteId}`, { method: "DELETE" });
        await renderCommunity();
      } catch (error) {
        window.alert(error.message);
      }
    }
  });
}

productNav.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.productNav;
    if (target === "input") setScreen("input");
    if (target === "community") {
      renderCommunity();
      setScreen("community");
    }
    if (target === "about") setScreen("about");
  });
});

document.querySelectorAll("[data-start-over]").forEach((button) => {
  button.addEventListener("click", () => {
    scanRunId += 1;
    clearTimers();
    if (textarea) textarea.value = "";
    updateTextStats();
    setScreen("input");
  });
});

document.querySelectorAll("[data-back-verdict]").forEach((button) => {
  button.addEventListener("click", () => {
    setScreen("verdict");
  });
});

if (clearHistory) {
  clearHistory.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderRecent();
  });
}

// Initializing application state
initializeAccessibleControls();
updateAccountHeader();
renderRecent();
renderScanRows({});
updateTextStats();

// Show the brand intro once per tab session, then open the claim review.
startOpeningAnimation();
