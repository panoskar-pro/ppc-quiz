/**
 * PPC Quiz Game - Google Ads Edition
 * Main Application Logic
 */

// ============ STATE ============
const APP = {
  profile: null,
  levels: [],
  currentQuiz: null,
  screens: ['welcome', 'dashboard', 'quiz', 'results'],
};

// ============ LEVELS DEFINITION ============
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

// ============ PROFILE MANAGEMENT ============
const STORAGE_KEY = 'ppc_quiz_profile';

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

function createProfile(name) {
  return {
    name: name,
    currentLevel: 1,
    xp: 0,
    badges: [],
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      bestStreak: 0,
      quizzesCompleted: 0,
      levelScores: {},
    },
    createdAt: new Date().toISOString(),
  };
}

function saveProfile() {
  if (APP.profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(APP.profile));
  }
}

function loadProfile() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

function deleteProfile() {
  localStorage.removeItem(STORAGE_KEY);
  APP.profile = null;
}

function getInitials(name) {
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

// ============ SCREEN MANAGEMENT ============
function showScreen(screenName) {
  APP.screens.forEach((name) => {
    const el = document.getElementById(`screen-${name}`);
    if (el) {
      el.classList.toggle('active', name === screenName);
    }
  });
}

// ============ TOAST NOTIFICATIONS ============
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
  const existing = loadProfile();

  if (existing) {
    APP.profile = existing;
    document.getElementById('existing-profile').style.display = 'block';
    document.getElementById('new-profile-section').style.display = 'none';

    document.getElementById('welcome-avatar').textContent = getInitials(existing.name);
    document.getElementById('welcome-name').textContent = existing.name;
    document.getElementById('welcome-level').textContent = `Level ${existing.currentLevel} • ${existing.xp} XP`;
  } else {
    document.getElementById('existing-profile').style.display = 'none';
    document.getElementById('new-profile-section').style.display = 'block';
  }

  // Load total question count from static data
  if (typeof STATIC_QUESTIONS !== 'undefined') {
    document.getElementById('total-questions-stat').textContent = STATIC_QUESTIONS.metadata.totalQuestions;
  }
}

function handleStartNewProfile() {
  const nameInput = document.getElementById('player-name');
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.style.borderColor = 'var(--accent-red)';
    nameInput.focus();
    return;
  }

  APP.profile = createProfile(name);
  saveProfile();
  showToast(`Welcome, ${name}! 🎮`, 'success');
  openDashboard();
}

function handleContinue() {
  openDashboard();
}

function handleNewProfile() {
  deleteProfile();
  document.getElementById('existing-profile').style.display = 'none';
  document.getElementById('new-profile-section').style.display = 'block';
  document.getElementById('player-name').focus();
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

  // Header
  document.getElementById('dash-avatar').textContent = getInitials(p.name);
  document.getElementById('dash-name').textContent = p.name;
  const levelInfo = APP.levels.find((l) => l.level === p.currentLevel);
  document.getElementById('dash-title').textContent = levelInfo
    ? `${levelInfo.icon} ${levelInfo.name}`
    : `Level ${p.currentLevel}`;

  // XP bar
  const xpProg = getXPProgress();
  document.getElementById('dash-level-badge').textContent = `Level ${p.currentLevel}`;
  document.getElementById('dash-xp-text').textContent = `${xpProg.current} / ${xpProg.threshold} XP`;
  requestAnimationFrame(() => {
    document.getElementById('dash-xp-bar').style.width = `${Math.min(100, (xpProg.current / xpProg.threshold) * 100)}%`;
  });

  // Stats
  const accuracy = p.stats.totalAnswered > 0
    ? Math.round((p.stats.totalCorrect / p.stats.totalAnswered) * 100)
    : 0;

  document.getElementById('stat-total-answered').textContent = p.stats.totalAnswered;
  document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
  document.getElementById('stat-streak').textContent = p.stats.bestStreak;
  document.getElementById('stat-xp').textContent = p.xp;

  // Level grid
  renderLevelGrid();

  // Badges
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

  // Check XP requirement
  const levelDef = APP.levels.find((l) => l.level === level);
  if (!levelDef) return false;
  if (p.xp < levelDef.xpRequired) return false;

  // Check if previous level has been completed with sufficient accuracy
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

// ============ QUIZ ENGINE ============
async function startQuiz(level) {
  try {
    // Filter questions by level from static data
    let levelQuestions = STATIC_QUESTIONS.questions.filter(q => q.level === level);
    
    // Shuffle and pick up to 10
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
    showToast('Failed to load questions. Is the server running?', 'error');
  }
}

function renderQuestion() {
  const quiz = APP.currentQuiz;
  const q = quiz.questions[quiz.currentIndex];

  // Progress
  document.getElementById('quiz-question-counter').textContent =
    `${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  document.getElementById('quiz-progress-bar').style.width =
    `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%`;

  // Streak
  document.getElementById('quiz-streak').textContent = quiz.streak;
  const fire = document.getElementById('streak-fire');
  fire.style.opacity = quiz.streak > 0 ? '1' : '0.3';

  // Level label
  const levelDef = APP.levels.find((l) => l.level === quiz.level);
  document.getElementById('quiz-level-label').textContent =
    `Level ${quiz.level} — ${levelDef ? levelDef.name : ''}`;

  // Category
  document.getElementById('quiz-category').textContent = q.category;

  // Question type badge
  document.getElementById('question-type-badge').textContent =
    q.type === 'true_false' ? 'True / False' : 'Multiple Choice';

  // Question text
  document.getElementById('question-text').textContent = q.question;

  // Options
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

  // Hide feedback
  document.getElementById('feedback-card').style.display = 'none';
}

function handleAnswer(selectedIndex) {
  const quiz = APP.currentQuiz;
  const q = quiz.questions[quiz.currentIndex];
  const isCorrect = selectedIndex === q.correct_answer;

  // Disable all options
  const options = document.querySelectorAll('.option-btn');
  options.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct_answer) {
      btn.classList.add('correct');
    }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });

  // Update streak
  if (isCorrect) {
    quiz.streak++;
  } else {
    quiz.streak = 0;
  }

  // Calculate XP
  let xp = 0;
  if (isCorrect) {
    xp = 10 * quiz.level; // Base XP
    xp += Math.min(quiz.streak, 10) * 5; // Streak bonus (capped at 10)
  }
  quiz.xpEarned += xp;

  // Store answer
  quiz.answers.push({
    questionId: q.id,
    selected: selectedIndex,
    correct: isCorrect,
    xpEarned: xp,
  });

  // Streak fire animation
  const fire = document.getElementById('streak-fire');
  document.getElementById('quiz-streak').textContent = quiz.streak;
  if (isCorrect && quiz.streak > 1) {
    fire.classList.add('active');
    setTimeout(() => fire.classList.remove('active'), 300);
  }
  fire.style.opacity = quiz.streak > 0 ? '1' : '0.3';

  // Show feedback
  showFeedback(isCorrect, q.explanation, xp, q.category, q.link);
}

function showFeedback(isCorrect, explanation, xp, category, customLink) {
  const feedbackCard = document.getElementById('feedback-card');
  feedbackCard.style.display = 'block';

  document.getElementById('feedback-icon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedback-text').textContent = isCorrect ? 'Correct!' : 'Incorrect!';
  document.getElementById('feedback-explanation').textContent = explanation;

  // Set the "Read More" link
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

  // Scroll to feedback
  feedbackCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleNextQuestion() {
  const quiz = APP.currentQuiz;
  quiz.currentIndex++;

  if (quiz.currentIndex >= quiz.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
    // Scroll to top of quiz body
    document.querySelector('.quiz-body').scrollIntoView({ behavior: 'smooth' });
  }
}

function finishQuiz() {
  const quiz = APP.currentQuiz;
  const p = APP.profile;

  // Calculate results
  const totalCorrect = quiz.answers.filter((a) => a.correct).length;
  const totalQuestions = quiz.answers.length;
  const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

  // Update profile stats
  p.stats.totalAnswered += totalQuestions;
  p.stats.totalCorrect += totalCorrect;
  p.stats.quizzesCompleted++;

  // Update best streak
  let maxStreak = 0;
  let currentStreak = 0;
  quiz.answers.forEach((a) => {
    if (a.correct) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  p.stats.bestStreak = Math.max(p.stats.bestStreak, maxStreak);

  // Update level scores
  const levelKey = `level_${quiz.level}`;
  if (!p.stats.levelScores[levelKey]) {
    p.stats.levelScores[levelKey] = { bestAccuracy: 0, timesPlayed: 0 };
  }
  p.stats.levelScores[levelKey].bestAccuracy = Math.max(
    p.stats.levelScores[levelKey].bestAccuracy,
    accuracy
  );
  p.stats.levelScores[levelKey].timesPlayed++;

  // Add XP
  const prevLevel = p.currentLevel;
  p.xp += quiz.xpEarned;

  // Check level up
  let leveledUp = false;
  while (true) {
    const threshold = getTotalXPForLevel(p.currentLevel + 1);
    if (p.xp >= threshold && p.currentLevel < 5) {
      p.currentLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Check for perfect score badge
  if (totalCorrect === totalQuestions && totalQuestions >= 10) {
    if (!p.badges.includes('perfect_10')) {
      p.badges.push('perfect_10');
    }
  }

  saveProfile();

  // Show results
  showResults(totalCorrect, totalQuestions, accuracy, quiz.xpEarned, leveledUp, prevLevel);
}

function showResults(correct, total, accuracy, xpEarned, leveledUp, prevLevel) {
  showScreen('results');

  // Icon based on performance
  let icon = '😢';
  let title = 'Keep Practicing!';
  let subtitle = 'Every mistake is a learning opportunity.';

  if (accuracy >= 90) {
    icon = '🏆'; title = 'Outstanding!'; subtitle = 'You\'re a Google Ads genius!';
  } else if (accuracy >= 70) {
    icon = '🌟'; title = 'Great Job!'; subtitle = 'You really know your stuff!';
  } else if (accuracy >= 50) {
    icon = '👍'; title = 'Good Effort!'; subtitle = 'Keep learning, you\'re getting there!';
  }

  document.getElementById('results-icon').textContent = icon;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-subtitle').textContent = subtitle;

  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-total').textContent = total;
  document.getElementById('result-accuracy').textContent = `${accuracy}%`;
  document.getElementById('result-xp').textContent = `+${xpEarned}`;

  // Level up card
  const levelUpCard = document.getElementById('level-up-card');
  if (leveledUp) {
    levelUpCard.style.display = 'block';
    const newLevelDef = APP.levels.find((l) => l.level === APP.profile.currentLevel);
    document.getElementById('level-up-text').textContent =
      `You've advanced to Level ${APP.profile.currentLevel} — ${newLevelDef ? newLevelDef.name : ''}!`;
  } else {
    levelUpCard.style.display = 'none';
  }
}

function handleQuitQuiz() {
  if (APP.currentQuiz && APP.currentQuiz.answers.length > 0) {
    if (!confirm('Are you sure you want to quit? Your progress in this quiz will be lost.')) {
      return;
    }
  }
  APP.currentQuiz = null;
  openDashboard();
}

// ============ QUESTION POOLING ============
async function handlePoolQuestions() {
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

  // Just simulate a small delay to read the message
  setTimeout(() => {
    spinner.style.display = 'none';
    btn.style.display = 'inline-flex';
    document.getElementById('modal-pooling-icon').textContent = '💡';
    document.getElementById('modal-pooling-title').textContent = 'Enjoy the Game!';
    document.getElementById('modal-pooling-text').textContent = 
      'You have 55 premium questions across 5 levels. Good luck mastering all the levels and earning the badges!';
  }, 1000);
}

function closePoolingModal() {
  document.getElementById('modal-pooling').style.display = 'none';
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
  // Welcome screen
  initWelcomeScreen();

  // Welcome buttons
  document.getElementById('btn-start').addEventListener('click', handleStartNewProfile);
  document.getElementById('btn-continue').addEventListener('click', handleContinue);
  document.getElementById('btn-new-profile').addEventListener('click', handleNewProfile);

  // Enter key on name input
  document.getElementById('player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStartNewProfile();
    // Reset error styling
    e.target.style.borderColor = '';
  });

  // Dashboard buttons
  document.getElementById('btn-pool-questions').addEventListener('click', handlePoolQuestions);
  document.getElementById('btn-logout').addEventListener('click', () => {
    deleteProfile();
    showScreen('welcome');
    initWelcomeScreen();
  });

  // Quiz buttons
  document.getElementById('btn-quit-quiz').addEventListener('click', handleQuitQuiz);
  document.getElementById('btn-next-question').addEventListener('click', handleNextQuestion);

  // Results buttons
  document.getElementById('btn-retry').addEventListener('click', () => {
    if (APP.currentQuiz) {
      startQuiz(APP.currentQuiz.level);
    }
  });
  document.getElementById('btn-back-dashboard').addEventListener('click', openDashboard);

  // Modal
  document.getElementById('btn-close-modal').addEventListener('click', closePoolingModal);
});
