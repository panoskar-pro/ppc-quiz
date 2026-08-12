/**
 * PPC Quiz Game - Google Ads Edition
 * Main Application Logic (Firebase Integrated)
 */

// ============ FIREBASE SETUP ============
const firebaseConfig = {
  apiKey: "AIzaSyCpdW7zZ0PIna2K3UJPRg_93ljvPGxntuk",
  authDomain: "ppc-quiz.firebaseapp.com",
  projectId: "ppc-quiz",
  storageBucket: "ppc-quiz.firebasestorage.app",
  messagingSenderId: "259508497267",
  appId: "1:259508497267:web:aa8f1f26828152962db306"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ============ STATE ============
const APP = {
  user: null,
  profile: null,
  levels: [],
  currentQuiz: null,
  screens: ['welcome', 'dashboard', 'quiz', 'results', 'leaderboard'],
  authMode: 'login' // 'login' or 'register'
};

// ============ AUTHENTICATION SETTINGS ============
const ALLOWED_EMAILS = [
  'panagiotis.kargidis@tempomediagroup.gr',
  'charalampos.lianos@tempomediagroup.gr',
  'christos.kotrotsos@tempomediagroup.gr',
  'pepi.kakari@tempomediagroup.gr',
  'dimitris.poporis@tempomediagroup.gr',
  'Elena.Emmanouil@tempomediagroup.gr',
  'elena.emmanouil@tempomediagroup.gr',
  'eirini.gele@tempomediagroup.gr',
  'Vasilis.Baziotis@tempomediagroup.gr',
  'Ioannis.Paraschos@tempomediagroup.gr',
  'Vicky.Angelidou@tempomediagroup.gr',
  'Nikolas.Sofianos@tempomediagroup.gr',
  'Stratis.Nikolaou@tempomediagroup.gr'
  // Add as many exact emails as you want here
];

// ============ LEVELS & CATEGORIES ============
const STATIC_LEVELS = [
  { level: 1, name: 'Rookie', description: 'Google Ads fundamentals and basic concepts', icon: '🌱', xpRequired: 0, questionsToUnlock: 0, accuracyToUnlock: 0, color: '#4ade80' },
  { level: 2, name: 'Specialist', description: 'Campaign types, bidding strategies, and keyword match types', icon: '⚡', xpRequired: 100, questionsToUnlock: 8, accuracyToUnlock: 70, color: '#60a5fa' },
  { level: 3, name: 'Strategist', description: 'Optimization, Quality Score, ad extensions, and audiences', icon: '🎯', xpRequired: 300, questionsToUnlock: 8, accuracyToUnlock: 75, color: '#a78bfa' },
  { level: 4, name: 'Expert', description: 'Advanced bidding, attribution, scripts, and automation', icon: '🔥', xpRequired: 600, questionsToUnlock: 8, accuracyToUnlock: 80, color: '#f97316' },
  { level: 5, name: 'Master', description: 'Complex scenarios, cross-platform strategy, and measurement', icon: '👑', xpRequired: 1000, questionsToUnlock: 8, accuracyToUnlock: 85, color: '#eab308' },
];

const CATEGORY_LINKS = {
  'Basics': 'https://support.google.com/google-ads/answer/6146252',
  'Campaign Types': 'https://support.google.com/google-ads/answer/2567043',
  'Bidding': 'https://support.google.com/google-ads/answer/2459326',
  'Keywords': 'https://support.google.com/google-ads/answer/2453981',
  'Ad Formats': 'https://support.google.com/google-ads/answer/1722124',
  'Quality Score': 'https://support.google.com/google-ads/answer/6167118',
  'Optimization': 'https://support.google.com/google-ads/answer/6167123',
  'Extensions': 'https://support.google.com/google-ads/answer/2375499',
  'Audiences': 'https://support.google.com/google-ads/answer/2497941',
  'Tracking': 'https://support.google.com/google-ads/answer/1722022',
  'Advanced Bidding': 'https://support.google.com/google-ads/answer/2979071',
  'Attribution': 'https://support.google.com/google-ads/answer/6226252',
  'Automation': 'https://support.google.com/google-ads/answer/2471188',
  'Strategy': 'https://support.google.com/google-ads/answer/6167123'
};

const BADGES = [
  { id: 'first_quiz', name: 'First Steps', icon: '🎓', desc: 'Complete your first quiz', check: (p) => p.stats.totalAnswered >= 1 },
  { id: 'perfect_10', name: 'Perfect 10', icon: '💯', desc: 'Get 10/10 on any quiz', check: (p) => p.badges.includes('perfect_10') },
  { id: 'streak_5', name: 'On Fire', icon: '🔥', desc: 'Get a 5-answer streak', check: (p) => p.stats.bestStreak >= 5 },
  { id: 'streak_10', name: 'Unstoppable', icon: '⚡', desc: 'Get a 10-answer streak', check: (p) => p.stats.bestStreak >= 10 },
  { id: 'level_2', name: 'Specialist', icon: '📘', desc: 'Reach Level 2', check: (p) => p.currentLevel >= 2 },
  { id: 'level_3', name: 'Strategist', icon: '🎯', desc: 'Reach Level 3', check: (p) => p.currentLevel >= 3 },
  { id: 'level_4', name: 'Expert', icon: '🔥', desc: 'Reach Level 4', check: (p) => p.currentLevel >= 4 },
  { id: 'level_5', name: 'Master', icon: '👑', desc: 'Reach Level 5', check: (p) => p.currentLevel >= 5 },
  { id: 'fifty_qs', name: 'Scholar', icon: '📚', desc: 'Answer 50 questions', check: (p) => p.stats.totalAnswered >= 50 },
  { id: 'hundred_qs', name: 'Veteran', icon: '🏅', desc: 'Answer 100 questions', check: (p) => p.stats.totalAnswered >= 100 },
];

// ============ AUTHENTICATION & PROFILE ============
auth.onAuthStateChanged(async (user) => {
  if (user) {
    APP.user = user;
    try {
      const docRef = db.collection('users').doc(user.uid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        // Fallback if registered but doc wasn't created
        await createProfileDoc(user, user.email.split('@')[0]);
      } else {
        APP.profile = docSnap.data();
        await docRef.update({ lastActive: firebase.firestore.FieldValue.serverTimestamp() });
      }

      closeAuthModal();
      openDashboard();
    } catch (e) {
      console.error("Error fetching user data:", e);
      showToast("Error loading profile", "error");
    }
  } else {
    APP.user = null;
    APP.profile = null;
    showScreen('welcome');
    initWelcomeScreen();
  }
});

async function createProfileDoc(user, displayName) {
  const newProfile = {
    name: displayName,
    email: user.email,
    currentLevel: 1,
    xp: 0,
    total_xp: 0, // Used for leaderboard sorting
    badges: [],
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      bestStreak: 0,
      quizzesCompleted: 0,
      levelScores: {},
    },
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('users').doc(user.uid).set(newProfile);
  APP.profile = newProfile;
}

async function saveProfile() {
  if (APP.profile && APP.user) {
    APP.profile.total_xp = APP.profile.xp; // Sync for leaderboard
    await db.collection('users').doc(APP.user.uid).set(APP.profile, { merge: true });
  }
}

// ============ AUTH UI ============
function toggleAuthMode() {
  APP.authMode = APP.authMode === 'login' ? 'register' : 'login';
  const isLogin = APP.authMode === 'login';

  document.getElementById('auth-title').textContent = isLogin ? 'Sign In' : 'Create Account';
  document.getElementById('btn-auth-submit').textContent = isLogin ? 'Sign In' : 'Register';
  document.getElementById('auth-toggle-text').textContent = isLogin ? 'Need an account?' : 'Already have an account?';
  document.getElementById('btn-auth-toggle').textContent = isLogin ? 'Register' : 'Sign In';
  document.getElementById('auth-name-group').style.display = isLogin ? 'none' : 'block';
  document.getElementById('auth-verify-password-group').style.display = isLogin ? 'none' : 'block';
  document.getElementById('auth-error').style.display = 'none';

  // Clear inputs on toggle
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-verify-password').value = '';
}

function showAuthModal() {
  document.getElementById('modal-auth').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('modal-auth').style.display = 'none';
}

async function handleAuthSubmit() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const verifyPassword = document.getElementById('auth-verify-password').value;
  const name = document.getElementById('auth-name').value.trim();
  const errorEl = document.getElementById('auth-error');
  const btn = document.getElementById('btn-auth-submit');

  errorEl.style.display = 'none';

  if (!email || !password) {
    errorEl.textContent = "Please fill in all fields.";
    errorEl.style.display = 'block';
    return;
  }

  if (APP.authMode === 'register') {
    if (password !== verifyPassword) {
      errorEl.textContent = "Passwords do not match.";
      errorEl.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters long.";
      errorEl.style.display = 'block';
      return;
    }
  }

  // Whitelist restriction check (only necessary for registration, not login)
  if (APP.authMode === 'register') {
    const isAllowed = ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
    if (!isAllowed) {
      errorEl.textContent = "Access denied: Your exact email address is not on the authorized team list.";
      errorEl.style.display = 'block';
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    if (APP.authMode === 'login') {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      if (!name) {
        throw new Error("Display name is required for registration.");
      }
      const userCred = await auth.createUserWithEmailAndPassword(email, password);
      await createProfileDoc(userCred.user, name);
    }
    // Success is handled by onAuthStateChanged
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = APP.authMode === 'login' ? 'Sign In' : 'Register';
  }
}

function handleLogout() {
  auth.signOut();
}

// ============ UTILS ============
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getLevelXPThreshold(level) {
  return level * 100;
}

function getTotalXPForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getLevelXPThreshold(i);
  }
  return total;
}

function getXPProgress() {
  const p = APP.profile;
  const totalXPForCurrent = getTotalXPForLevel(p.currentLevel);
  const xpInCurrentLevel = p.xp - totalXPForCurrent;
  const threshold = getLevelXPThreshold(p.currentLevel);
  return { current: Math.max(0, xpInCurrentLevel), threshold };
}

function showScreen(screenName) {
  APP.screens.forEach((name) => {
    const el = document.getElementById(`screen-${name}`);
    if (el) {
      el.classList.toggle('active', name === screenName);
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============ WELCOME SCREEN ============
function initWelcomeScreen() {
  if (typeof STATIC_QUESTIONS !== 'undefined') {
    document.getElementById('total-questions-stat').textContent = STATIC_QUESTIONS.metadata.totalQuestions;
  }
}

// ============ DASHBOARD ============
async function openDashboard() {
  showScreen('dashboard');
  await loadLevels();
  renderDashboard();
}

async function loadLevels() {
  APP.levels = STATIC_LEVELS.map(lvl => ({
    ...lvl,
    totalQuestions: typeof STATIC_QUESTIONS !== 'undefined'
      ? STATIC_QUESTIONS.questions.filter(q => q.level === lvl.level).length
      : 0
  }));
}

function renderDashboard() {
  const p = APP.profile;
  if (!p) return;

  document.getElementById('dash-avatar').textContent = getInitials(p.name);
  document.getElementById('dash-name').textContent = p.name;
  const levelInfo = APP.levels.find((l) => l.level === p.currentLevel);
  document.getElementById('dash-title').textContent = levelInfo
    ? `${levelInfo.icon} ${levelInfo.name}`
    : `Level ${p.currentLevel}`;

  const xpProg = getXPProgress();
  document.getElementById('dash-level-badge').textContent = `Level ${p.currentLevel}`;
  document.getElementById('dash-xp-text').textContent = `${xpProg.current} / ${xpProg.threshold} XP`;
  requestAnimationFrame(() => {
    document.getElementById('dash-xp-bar').style.width = `${Math.min(100, (xpProg.current / xpProg.threshold) * 100)}%`;
  });

  const accuracy = p.stats.totalAnswered > 0
    ? Math.round((p.stats.totalCorrect / p.stats.totalAnswered) * 100)
    : 0;

  document.getElementById('stat-total-answered').textContent = p.stats.totalAnswered;
  document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
  document.getElementById('stat-streak').textContent = p.stats.bestStreak;
  document.getElementById('stat-xp').textContent = p.xp;

  renderLevelGrid();
  renderBadges();
}

function renderLevelGrid() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  APP.levels.forEach((level) => {
    const isUnlocked = isLevelUnlocked(level.level);
    const card = document.createElement('div');
    card.className = `level-card glass-card ${isUnlocked ? '' : 'level-locked'}`;
    card.style.setProperty('--level-color', level.color);
    card.innerHTML = `
      <style>.level-card[style*="${level.color}"]::before { background: ${level.color}; }</style>
      <div class="level-card-header">
        <span class="level-card-icon">${isUnlocked ? level.icon : '🔒'}</span>
        <div>
          <div class="level-card-title">${level.name}</div>
          <div class="level-card-number">Level ${level.level}</div>
        </div>
      </div>
      <div class="level-card-desc">${level.description}</div>
      <div class="level-card-footer">
        <span class="level-card-questions">📝 ${level.totalQuestions} questions</span>
        ${isUnlocked ? '<span style="color:' + level.color + '">Play →</span>' : '<span class="level-lock-icon">🔒 Locked</span>'}
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => startQuiz(level.level));
    }

    grid.appendChild(card);
  });
}

function isLevelUnlocked(level) {
  if (level === 1) return true;
  const p = APP.profile;

  const levelDef = APP.levels.find((l) => l.level === level);
  if (!levelDef) return false;
  if (p.xp < levelDef.xpRequired) return false;

  const prevLevelKey = `level_${level - 1}`;
  const prevScore = p.stats.levelScores[prevLevelKey];
  if (!prevScore) return false;

  const prevLevelDef = APP.levels.find((l) => l.level === level);
  const requiredAccuracy = prevLevelDef ? prevLevelDef.accuracyToUnlock : 70;
  return prevScore.bestAccuracy >= requiredAccuracy;
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '';

  BADGES.forEach((badge) => {
    const earned = badge.check(APP.profile);
    const item = document.createElement('div');
    item.className = `badge-item ${earned ? 'badge-earned' : ''}`;
    item.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-name">${badge.name}</span>
    `;
    item.title = badge.desc;
    grid.appendChild(item);
  });
}

// ============ LEADERBOARD ============
async function openLeaderboard() {
  showScreen('leaderboard');
  await loadLeaderboard('all');
}

async function loadLeaderboard(type) {
  const listEl = document.getElementById('leaderboard-list');
  const loadingEl = document.getElementById('leaderboard-loading');

  listEl.innerHTML = '';
  loadingEl.style.display = 'block';

  document.getElementById('tab-all-time').className = `btn btn-sm ${type === 'all' ? 'btn-primary' : 'btn-ghost'}`;
  document.getElementById('tab-monthly').className = `btn btn-sm ${type === 'monthly' ? 'btn-primary' : 'btn-ghost'}`;

  try {
    let html = '';

    if (type === 'all') {
      const snapshot = await db.collection('users').orderBy('total_xp', 'desc').limit(10).get();
      let rank = 1;
      snapshot.forEach(doc => {
        const data = doc.data();
        html += createLeaderboardRow(rank++, data.name, data.total_xp, data.currentLevel);
      });
    } else {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const snapshot = await db.collection('monthly_scores')
        .where('month', '==', monthKey)
        .orderBy('xp_earned', 'desc')
        .limit(10)
        .get();

      let rank = 1;
      snapshot.forEach(doc => {
        const data = doc.data();
        html += createLeaderboardRow(rank++, data.name, data.xp_earned, '—');
      });
      if (snapshot.empty) {
        html = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No scores recorded this month yet!</div>';
      }
    }

    loadingEl.style.display = 'none';
    listEl.innerHTML = html;
  } catch (e) {
    console.error(e);
    loadingEl.style.display = 'none';
    listEl.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--accent-red);">Failed to load leaderboard. Firestore rules might deny access.</div>';
  }
}

function createLeaderboardRow(rank, name, xp, level) {
  let medal = '';
  if (rank === 1) medal = '🥇';
  else if (rank === 2) medal = '🥈';
  else if (rank === 3) medal = '🥉';
  else medal = `<span style="color:var(--text-muted)">#${rank}</span>`;

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.5rem; width: 30px; text-align: center;">${medal}</div>
        <div>
          <div style="font-weight: 600;">${name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Level ${level}</div>
        </div>
      </div>
      <div style="font-weight: bold; color: var(--accent-blue);">${xp} XP</div>
    </div>
  `;
}

// ============ QUIZ ENGINE ============
async function startQuiz(level) {
  try {
    let levelQuestions = STATIC_QUESTIONS.questions.filter(q => q.level === level);
    levelQuestions = levelQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

    if (levelQuestions.length === 0) {
      showToast('No questions available for this level!', 'error');
      return;
    }

    APP.currentQuiz = {
      level: level,
      questions: levelQuestions,
      currentIndex: 0,
      answers: [],
      streak: 0,
      xpEarned: 0,
      startTime: Date.now(),
    };

    showScreen('quiz');
    renderQuestion();
  } catch (e) {
    showToast('Failed to load questions.', 'error');
  }
}

function renderQuestion() {
  const quiz = APP.currentQuiz;
  const q = quiz.questions[quiz.currentIndex];

  document.getElementById('quiz-question-counter').textContent = `${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  document.getElementById('quiz-progress-bar').style.width = `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%`;

  document.getElementById('quiz-streak').textContent = quiz.streak;
  const fire = document.getElementById('streak-fire');
  fire.style.opacity = quiz.streak > 0 ? '1' : '0.3';

  const levelDef = APP.levels.find((l) => l.level === quiz.level);
  document.getElementById('quiz-level-label').textContent = `Level ${quiz.level} — ${levelDef ? levelDef.name : ''}`;
  document.getElementById('quiz-category').textContent = q.category;
  document.getElementById('question-type-badge').textContent = q.type === 'true_false' ? 'True / False' : 'Multiple Choice';
  document.getElementById('question-text').textContent = q.question;

  const optionsGrid = document.getElementById('options-grid');
  optionsGrid.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${q.type === 'true_false' ? (index === 0 ? '✓' : '✕') : letters[index]}</span>
      <span>${option}</span>
    `;
    btn.addEventListener('click', () => handleAnswer(index));
    optionsGrid.appendChild(btn);
  });

  document.getElementById('feedback-card').style.display = 'none';
}

function handleAnswer(selectedIndex) {
  const quiz = APP.currentQuiz;
  const q = quiz.questions[quiz.currentIndex];
  const isCorrect = selectedIndex === q.correct_answer;

  const options = document.querySelectorAll('.option-btn');
  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct_answer) btn.classList.add('correct');
    if (i === selectedIndex && !isCorrect) btn.classList.add('incorrect');
  });

  if (isCorrect) quiz.streak++;
  else quiz.streak = 0;

  let xp = 0;
  if (isCorrect) {
    xp = 10 * quiz.level;
    xp += Math.min(quiz.streak, 10) * 5;
  }
  quiz.xpEarned += xp;

  quiz.answers.push({
    questionId: q.id,
    selected: selectedIndex,
    correct: isCorrect,
    xpEarned: xp,
  });

  const fire = document.getElementById('streak-fire');
  document.getElementById('quiz-streak').textContent = quiz.streak;
  if (isCorrect && quiz.streak > 1) {
    fire.classList.add('active');
    setTimeout(() => fire.classList.remove('active'), 300);
  }
  fire.style.opacity = quiz.streak > 0 ? '1' : '0.3';

  showFeedback(isCorrect, q.explanation, xp, q.category, q.link);
}

function showFeedback(isCorrect, explanation, xp, category, customLink) {
  const feedbackCard = document.getElementById('feedback-card');
  feedbackCard.style.display = 'block';

  document.getElementById('feedback-icon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedback-text').textContent = isCorrect ? 'Correct!' : 'Incorrect!';
  document.getElementById('feedback-explanation').textContent = explanation;

  const linkEl = document.getElementById('feedback-link');
  const targetUrl = customLink || CATEGORY_LINKS[category] || 'https://support.google.com/google-ads';
  linkEl.href = targetUrl;

  const xpEl = document.getElementById('feedback-xp');
  if (xp > 0) {
    xpEl.textContent = `+${xp} XP`;
    xpEl.className = 'feedback-xp positive';
  } else {
    xpEl.textContent = 'No XP earned';
    xpEl.className = 'feedback-xp';
  }

  feedbackCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleNextQuestion() {
  const quiz = APP.currentQuiz;
  quiz.currentIndex++;

  if (quiz.currentIndex >= quiz.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
    document.querySelector('.quiz-body').scrollIntoView({ behavior: 'smooth' });
  }
}

async function finishQuiz() {
  const quiz = APP.currentQuiz;
  const p = APP.profile;

  const totalCorrect = quiz.answers.filter((a) => a.correct).length;
  const totalQuestions = quiz.answers.length;
  const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

  p.stats.totalAnswered += totalQuestions;
  p.stats.totalCorrect += totalCorrect;
  p.stats.quizzesCompleted++;

  let maxStreak = 0;
  let currentStreak = 0;
  quiz.answers.forEach((a) => {
    if (a.correct) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else currentStreak = 0;
  });
  p.stats.bestStreak = Math.max(p.stats.bestStreak, maxStreak);

  const levelKey = `level_${quiz.level}`;
  if (!p.stats.levelScores[levelKey]) p.stats.levelScores[levelKey] = { bestAccuracy: 0, timesPlayed: 0 };
  p.stats.levelScores[levelKey].bestAccuracy = Math.max(p.stats.levelScores[levelKey].bestAccuracy, accuracy);
  p.stats.levelScores[levelKey].timesPlayed++;

  const prevLevel = p.currentLevel;
  p.xp += quiz.xpEarned;

  let leveledUp = false;
  while (true) {
    const threshold = getTotalXPForLevel(p.currentLevel + 1);
    if (p.xp >= threshold && p.currentLevel < 5) {
      p.currentLevel++;
      leveledUp = true;
    } else break;
  }

  if (totalCorrect === totalQuestions && totalQuestions >= 10) {
    if (!p.badges.includes('perfect_10')) p.badges.push('perfect_10');
  }

  // Save profile to Firestore
  await saveProfile();

  // Push to Monthly Scores
  if (quiz.xpEarned > 0 && APP.user) {
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyRef = db.collection('monthly_scores').doc(`${APP.user.uid}_${monthKey}`);
      await monthlyRef.set({
        user_id: APP.user.uid,
        name: p.name,
        month: monthKey,
        xp_earned: firebase.firestore.FieldValue.increment(quiz.xpEarned)
      }, { merge: true });
    } catch (e) {
      console.error("Error saving monthly scores: ", e);
    }
  }

  showResults(totalCorrect, totalQuestions, accuracy, quiz.xpEarned, leveledUp, prevLevel);
}

function showResults(correct, total, accuracy, xpEarned, leveledUp, prevLevel) {
  showScreen('results');

  let icon = '😢'; let title = 'Keep Practicing!'; let subtitle = 'Every mistake is a learning opportunity.';
  if (accuracy >= 90) { icon = '🏆'; title = 'Outstanding!'; subtitle = "You're a Google Ads genius!"; }
  else if (accuracy >= 70) { icon = '🌟'; title = 'Great Job!'; subtitle = "You really know your stuff!"; }
  else if (accuracy >= 50) { icon = '👍'; title = 'Good Effort!'; subtitle = "Keep learning, you're getting there!"; }

  document.getElementById('results-icon').textContent = icon;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-subtitle').textContent = subtitle;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-total').textContent = total;
  document.getElementById('result-accuracy').textContent = `${accuracy}%`;
  document.getElementById('result-xp').textContent = `+${xpEarned}`;

  const levelUpCard = document.getElementById('level-up-card');
  if (leveledUp) {
    levelUpCard.style.display = 'block';
    const newLevelDef = APP.levels.find((l) => l.level === APP.profile.currentLevel);
    document.getElementById('level-up-text').textContent = `You've advanced to Level ${APP.profile.currentLevel} — ${newLevelDef ? newLevelDef.name : ''}!`;
  } else levelUpCard.style.display = 'none';
}

function handleQuitQuiz() {
  if (APP.currentQuiz && APP.currentQuiz.answers.length > 0) {
    if (!confirm('Are you sure you want to quit? Your progress in this quiz will be lost.')) return;
  }
  APP.currentQuiz = null;
  openDashboard();
}

function handlePoolQuestions() {
  const modal = document.getElementById('modal-pooling');
  const spinner = document.getElementById('pooling-spinner');
  const btn = document.getElementById('btn-close-modal');

  modal.style.display = 'flex';
  spinner.style.display = 'block';
  btn.style.display = 'none';

  document.getElementById('modal-pooling-icon').textContent = '⚠️';
  document.getElementById('modal-pooling-title').textContent = 'Offline Mode';
  document.getElementById('modal-pooling-text').textContent =
    'Because you are running the completely static, offline version of the game, live web scraping from Google Ads Help Center is disabled. You are playing with the 55 pre-loaded curated questions!';

  setTimeout(() => {
    spinner.style.display = 'none';
    btn.style.display = 'inline-flex';
    document.getElementById('modal-pooling-icon').textContent = '💡';
    document.getElementById('modal-pooling-title').textContent = 'Enjoy the Game!';
    document.getElementById('modal-pooling-text').textContent =
      'You have 55 premium questions across 5 levels. Good luck mastering all the levels and earning the badges!';
  }, 1000);
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
  // Auth Screen bounds
  document.getElementById('btn-show-auth').addEventListener('click', showAuthModal);
  document.getElementById('btn-close-auth').addEventListener('click', closeAuthModal);
  document.getElementById('btn-auth-toggle').addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(); });
  document.getElementById('btn-auth-submit').addEventListener('click', handleAuthSubmit);

  // Toggle Password Visibility Logic
  function toggleInputType(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  }

  document.getElementById('btn-toggle-password').addEventListener('click', () => {
    toggleInputType('auth-password');
  });

  document.getElementById('btn-toggle-verify-password').addEventListener('click', () => {
    toggleInputType('auth-verify-password');
  });

  // Enter key on inputs
  document.getElementById('auth-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthSubmit(); });

  // Dashboard
  document.getElementById('btn-pool-questions').addEventListener('click', handlePoolQuestions);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboard);

  // Quiz
  document.getElementById('btn-quit-quiz').addEventListener('click', handleQuitQuiz);
  document.getElementById('btn-next-question').addEventListener('click', handleNextQuestion);

  // Results
  document.getElementById('btn-retry').addEventListener('click', () => { if (APP.currentQuiz) startQuiz(APP.currentQuiz.level); });
  document.getElementById('btn-back-dashboard').addEventListener('click', openDashboard);

  // Leaderboard Modals
  document.getElementById('btn-leaderboard-back').addEventListener('click', openDashboard);
  document.getElementById('tab-all-time').addEventListener('click', () => loadLeaderboard('all'));
  document.getElementById('tab-monthly').addEventListener('click', () => loadLeaderboard('monthly'));

  // Modals
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-pooling').style.display = 'none';
  });
});
