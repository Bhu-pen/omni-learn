const appState = {
    currentSubject: 'physics',
    currentUnit: 1,
    hearts: 5,
    gems: 500,
    streak: 0,
    completedLevels: [1, 2], // Mocked completed levels IDs
    currentQuestionIndex: 0,
    currentExerciseSession: null,
    totalStudyTime: 0, // In seconds
    studyStartTimestamp: null
};

// API Base URL
const API_URL = 'http://localhost:3000/api';

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// Mock Data
const subjects = {
    'physics': {
        name: 'Physics 101',
        icon: '⚛️',
        units: [
            {
                id: 1,
                title: 'Introduction to Motion',
                description: 'Learn about velocity and acceleration',
                color: 'var(--color-primary)',
                levels: 5
            },
            {
                id: 2,
                title: "Newton's Laws",
                description: 'Forces and how they interact',
                color: 'var(--color-secondary)',
                levels: 4
            }
        ]
    }
};

const questionBank = [
    {
        type: 'select',
        question: 'Which of these represents velocity?',
        options: [
            { text: 'm/s', correct: true },
            { text: 'm/s²', correct: false },
            { text: 'kg', correct: false },
            { text: 'N', correct: false }
        ]
    },
    {
        type: 'select',
        question: 'What is the unit of Force?',
        options: [
            { text: 'Joule', correct: false },
            { text: 'Newton', correct: true },
            { text: 'Watt', correct: false },
            { text: 'Pascal', correct: false }
        ]
    },
    {
        type: 'select',
        question: 'Gravity on Earth is approximately:',
        options: [
            { text: '9.8 m/s²', correct: true },
            { text: '5.2 m/s²', correct: false },
            { text: '1.6 m/s²', correct: false },
            { text: '12 m/s²', correct: false }
        ]
    }
];

// DOM Elements
const sidebarLinks = document.querySelectorAll('.nav-item');
const learnView = document.querySelector('#learn-view');
const exerciseOverlay = document.querySelector('#exercise-overlay');
const questionText = document.querySelector('#question-text');
const questionArea = document.querySelector('#question-area');
const progressBarFill = document.querySelector('.progress-bar-fill');
const checkButton = document.querySelector('#check-answer');
const exerciseHearts = document.querySelector('#exercise-hearts');
const footer = document.querySelector('.exercise-footer');
const resultMessage = document.querySelector('#result-message');
const feedbackTitle = document.querySelector('#feedback-title');
const feedbackDetail = document.querySelector('#feedback-detail');
const quitExerciseBtn = document.querySelector('#quit-exercise');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('omniUser'));
    if (!user) {
        window.location.href = 'signup.html';
        return;
    }

    // Update Profile Data from LocalStorage
    if (user.name) {
        // Update mock leaderboard "You" entry
        const me = leaderboardData.find(u => u.isMe);
        if (me) {
            me.name = user.name;
            if (user.avatar && user.avatar.startsWith('data:')) {
                me.avatar = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
        }
    }

    renderPath();
    setupNavigation();
});

// Navigation Logic
// Shop Items
const shopItems = [
    { id: 1, name: 'Streak Freeze', icon: '❄️', desc: 'Keep your streak for one missed day', cost: 200 },
    { id: 2, name: 'Double XP', icon: '🧪', desc: 'Earn double XP for the next 15 minutes', cost: 50 },
    { id: 3, name: 'Super Duo', icon: '🦉', desc: 'Get a fancy golden owl avatar', cost: 1000 }
];

// Mock Leaderboard
const leaderboardData = [
    { name: 'Einstein', xp: 15400, avatar: '👴🏻' },
    { name: 'Curie', xp: 12500, avatar: '🧪' },
    { name: 'You', xp: 500, avatar: '👤', isMe: true }, // xp matches appState.gems for simplicity or separate
    { name: 'Newton', xp: 450, avatar: '🍎' }
];

// Navigation Logic Update
function setupNavigation() {
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const tab = link.dataset.tab;

            // Hide all views first
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

            if (tab === 'learn') {
                document.getElementById('learn-view').classList.remove('hidden');
            } else if (tab === 'shop') {
                (document.getElementById('shop-view') || createShopView()).classList.remove('hidden');
                renderShop();
            } else if (tab === 'profile') {
                (document.getElementById('profile-view') || createProfileView()).classList.remove('hidden');
                renderProfile();
            } else if (tab === 'leaderboard') {
                (document.getElementById('leaderboard-view') || createLeaderboardView()).classList.remove('hidden');
                renderLeaderboard();
            } else {
                const target = document.getElementById(tab + '-view') || document.getElementById('practice-view');
                if (target) target.classList.remove('hidden');
            }
        });
    });
}

// Lazy creation helpers for views not in initial HTML
function createShopView() {
    const v = document.createElement('div');
    v.id = 'shop-view';
    v.className = 'view-section hidden';
    v.innerHTML = '<div class="view-header"><h2>Shop</h2></div><div id="shop-container" class="shop-container"></div>';
    document.getElementById('main-content').appendChild(v);
    return v;
}

function createProfileView() {
    const user = JSON.parse(localStorage.getItem('omniUser')) || { name: 'Guest', joined: new Date() };
    const userName = user.name && user.name.trim() !== "" ? user.name : "Guest";
    const date = new Date(user.joined);
    const dateStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const avatar = user.avatar || '👤';

    const v = document.createElement('div');
    v.id = 'profile-view';
    v.className = 'view-section hidden';
    v.innerHTML = `
        <div class="view-header"><h2>Profile</h2></div>
        <div class="profile-container">
            <div class="profile-header-card">
                <div class="profile-avatar-wrapper">
                    <div class="profile-avatar" id="current-avatar">
                        ${avatar.startsWith('data:') ? `<img src="${avatar}" class="avatar-img">` : avatar}
                    </div>
                    <label for="avatar-upload" class="avatar-edit-btn">✏️</label>
                    <input type="file" id="avatar-upload" accept="image/*" hidden onchange="handleAvatarUpload(this)">
                </div>
                
                <div class="profile-details">
                    <div class="name-edit-wrapper">
                        <h3 id="profile-name-display">${userName}</h3>
                        <button class="btn-icon" onclick="toggleNameEdit()">📝</button>
                    </div>
                    <div id="name-edit-form" class="hidden">
                        <input type="text" id="name-input" value="${user.name}" class="form-input-sm">
                        <button class="btn btn-primary btn-sm" onclick="saveName()">Save</button>
                    </div>
                    
                    <p id="profile-joined">Joined ${dateStr}</p>
                    <button class="btn btn-secondary" onclick="logout()" style="margin-top:16px; font-size:12px; height:32px;">Sign Out</button>
                </div>
            </div>
            <div class="profile-stats">
                <div class="stat-box">
                    <span class="icon">🔥</span>
                    <span class="value" id="profile-streak-val">0</span>
                    <span class="label">Day Streak</span>
                </div>
                <div class="stat-box">
                    <span class="icon">⚡</span>
                    <span class="value" id="profile-xp-val">0</span>
                    <span class="label">Total XP</span>
                </div>
            </div>
        </div>`;
    document.getElementById('main-content').appendChild(v);
    return v;
}

// Profile Actions
window.handleAvatarUpload = function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const result = e.target.result;
            // Update UI
            document.getElementById('current-avatar').innerHTML = `<img src="${result}" class="avatar-img">`;

            // Save to Storage
            try {
                const user = JSON.parse(localStorage.getItem('omniUser'));
                user.avatar = result;
                localStorage.setItem('omniUser', JSON.stringify(user));
                alert('Profile picture updated!');
            } catch (e) {
                console.error(e);
                alert('Image too large! Please choose a smaller file (under 2MB).');
                // Revert UI change
                const user = JSON.parse(localStorage.getItem('omniUser'));
                const avatar = user.avatar || '👤';
                document.getElementById('current-avatar').innerHTML =
                    avatar.startsWith('data:') ? `<img src="${avatar}" class="avatar-img">` : avatar;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.toggleNameEdit = function () {
    document.querySelector('.name-edit-wrapper').classList.toggle('hidden');
    document.getElementById('name-edit-form').classList.toggle('hidden');
};

window.saveName = function () {
    const newName = document.getElementById('name-input').value.trim();
    if (newName) {
        // Update UI
        document.getElementById('profile-name-display').textContent = newName;
        window.toggleNameEdit();

        // Save to Storage
        const user = JSON.parse(localStorage.getItem('omniUser'));
        user.name = newName;
        localStorage.setItem('omniUser', JSON.stringify(user));

        // Update Leaderboard mock
        const me = leaderboardData.find(u => u.isMe);
        if (me) me.name = newName;
    }
};

function logout() {
    localStorage.removeItem('omniUser');
    window.location.href = 'signup.html';
}

function createLeaderboardView() {
    const v = document.createElement('div');
    v.id = 'leaderboard-view';
    v.className = 'view-section hidden';
    v.innerHTML = '<div class="view-header"><h2>Leaderboard</h2></div><div id="leaderboard-list" class="leaderboard-list"></div>';
    document.getElementById('main-content').appendChild(v);
    return v;
}

// Render Path Logic
function renderPath() {
    const units = subjects[appState.currentSubject].units;

    units.forEach(unit => {
        const container = document.getElementById(`path-unit-${unit.id}`);
        if (!container) return;

        container.innerHTML = '';

        for (let i = 1; i <= unit.levels; i++) {
            const levelId = (unit.id - 1) * 5 + i; // Simple unique ID logic
            const node = document.createElement('div');
            node.className = 'level-node';

            // Random horizontal offset for snake effect
            // We use specific sine wave pattern usually, but random works for mock
            const offset = Math.sin(i) * 50;
            node.style.transform = `translateX(${offset}px)`;

            // State
            if (appState.completedLevels.includes(levelId)) {
                node.style.backgroundColor = 'var(--color-gold)';
                node.innerHTML = '👑';
            } else if (levelId === Math.max(...appState.completedLevels) + 1) {
                // Current level
                node.classList.add('current');
                node.innerHTML = '⭐';
                node.onclick = () => startLevel(levelId);
            } else {
                // Locked
                node.classList.add('locked');
                node.innerHTML = '🔒';
            }

            container.appendChild(node);
        }
    });
}

// Exercise Logic
async function startLevel(levelId) {
    // Show Loading State
    const content = document.querySelector('.exercise-content');
    content.innerHTML = '<div class="loading-spinner">🤖 Generating unique lesson...</div>';
    exerciseOverlay.classList.remove('hidden');

    try {
        // Fetch Questions from Backend
        const questions = await apiCall('/generate-quiz', 'POST', {
            topic: appState.currentSubject,
            difficulty: 'medium'
        });

        if (!questions || questions.length === 0) {
            alert("Failed to load lesson. Please try again.");
            exerciseOverlay.classList.add('hidden');
            return;
        }

        // Restore Content Div
        content.innerHTML = `
            <h2 class="question-text" id="question-text"></h2>
            <div class="question-area" id="question-area"></div>
        `;
        // Re-select mock elements usually cleared by innerHTML
        // (In a real app, we'd manage state better, but here we just re-query or rely on renderQuestion finding them if we didn't destroy them. 
        // Actually, 'question-text' and 'question-area' are consts at top of file. If I destroy them with innerHTML, those consts might be stale or disconnected? 
        // No, document.querySelector finds the element. If I replace the PARENT's innerHTML, the old elements are gone.
        // So I need to ensure renderQuestion re-queries them or I don't destroy them.)

        appState.currentExerciseSession = {
            questions: shuffleArray(questions),
            currentIdx: 0,
            correctCount: 0
        };

        // Start Timer
        appState.studyStartTimestamp = Date.now();

        renderQuestion();
        updateProgressBar(0);

    } catch (e) {
        console.error(e);
        alert("Error starting lesson");
        exerciseOverlay.classList.add('hidden');
    }
}

function renderQuestion() {
    const session = appState.currentExerciseSession;
    if (session.currentIdx >= session.questions.length) {
        finishLevel();
        return;
    }

    // specific re-query in case DOM was rebuilt
    const qText = document.getElementById('question-text');
    const qArea = document.getElementById('question-area');

    const q = session.questions[session.currentIdx];
    qText.textContent = q.question;
    qArea.innerHTML = '';

    // Reset Footer
    const foot = document.querySelector('.exercise-footer');
    const msg = document.getElementById('result-message');
    const btn = document.getElementById('check-answer');

    foot.className = 'exercise-footer';
    msg.classList.add('hidden');
    btn.textContent = 'Check';
    btn.disabled = true;
    btn.onclick = () => validateAnswer();

    if (q.options) { // Handle standardized 'options' array
        const grid = document.createElement('div');
        grid.className = 'option-grid';

        q.options.forEach((optText, idx) => {
            const btn = document.createElement('div');
            btn.className = 'option-card';
            btn.textContent = optText;
            btn.onclick = () => {
                grid.querySelectorAll('.option-card').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('check-answer').disabled = false;
                grid.dataset.selected = idx;
            };
            grid.appendChild(btn);
        });
        qArea.appendChild(grid);
    }
}

function validateAnswer() {
    const session = appState.currentExerciseSession;
    const q = session.questions[session.currentIdx];
    const grid = document.querySelector('.option-grid');
    const selectedIdx = parseInt(grid.dataset.selected);
    // Check if q.options is array of strings (Gemini) or objects (Mock)
    let selectedText;
    if (typeof q.options[0] === 'string') {
        selectedText = q.options[selectedIdx];
    } else {
        selectedText = q.options[selectedIdx].text;
    }

    // Verification: Gemini JSON has 'answer' string
    // Mock data has 'correct' boolean in options, but we are moving to standard string compare
    let isCorrect = false;
    if (q.answer) {
        isCorrect = (selectedText === q.answer);
    } else {
        // Fallback for old mock data style if still present
        isCorrect = q.options[selectedIdx].correct;
    }

    // UI Feedback
    const msg = document.getElementById('result-message');
    const foot = document.querySelector('.exercise-footer');
    const title = document.getElementById('feedback-title');
    const detail = document.getElementById('feedback-detail');
    const btn = document.getElementById('check-answer');
    const heartsVal = document.getElementById('exercise-hearts');

    msg.classList.remove('hidden');

    if (isCorrect) {
        foot.classList.add('correct');
        title.textContent = 'Nicely done!';
        title.classList.add('anim-bounce');
        setTimeout(() => title.classList.remove('anim-bounce'), 600);

        detail.textContent = '';
        btn.textContent = 'Continue';
        btn.onclick = nextQuestion;
    } else {
        foot.classList.add('wrong');
        title.textContent = 'Correct solution:';
        detail.textContent = q.answer || q.options.find(o => o.correct).text;
        btn.textContent = 'Continue';
        btn.onclick = nextQuestion;

        grid.classList.add('anim-shake');
        setTimeout(() => grid.classList.remove('anim-shake'), 400);

        appState.hearts--;
        heartsVal.textContent = appState.hearts;
    }
}

function nextQuestion() {
    const session = appState.currentExerciseSession;
    session.currentIdx++;
    const progress = (session.currentIdx / session.questions.length) * 100;
    updateProgressBar(progress);
    renderQuestion();
}

function updateProgressBar(percent) {
    progressBarFill.style.width = `${percent}%`;
}

function finishLevel() {
    // Stop Timer
    const elapsedSeconds = Math.floor((Date.now() - appState.studyStartTimestamp) / 1000);
    appState.totalStudyTime += elapsedSeconds;

    // Sync with Backend
    const user = JSON.parse(localStorage.getItem('omniUser'));
    apiCall('/user/update', 'POST', {
        name: user.name,
        avatar: user.avatar,
        xp: appState.gems, // Still syncing XP/Gems conceptually
        totalStudyTime: appState.totalStudyTime
    });

    alert(`Lesson Complete! +${elapsedSeconds}s study time added.`);
    exerciseOverlay.classList.add('hidden');

    // Update State
    const nextLevel = Math.max(...appState.completedLevels) + 1;
    appState.completedLevels.push(nextLevel);
    renderPath();
}

// Render Shop
function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = '';

    shopItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-item';
        card.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
            <button class="btn btn-primary btn-buy" onclick="buyItem(${item.id})">
                💎 ${item.cost}
            </button>
        `;
        container.appendChild(card);
    });
}

function buyItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (appState.gems >= item.cost) {
        appState.gems -= item.cost;
        updateStatsUI();
        alert(`You bought ${item.name}!`);
    } else {
        alert("Not enough gems!");
    }
}

// Render Profile
function renderProfile() {
    document.getElementById('profile-joined').textContent = `Joined ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    document.getElementById('profile-streak-val').textContent = appState.streak;
    document.getElementById('profile-xp-val').textContent = appState.gems; // Using gems as XP placeholder
    // League is static for now
}

// Render Leaderboard
async function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    container.innerHTML = '<div class="loading">Loading rankings...</div>';

    // Fetch from Backend
    const leaderboardData = await apiCall('/leaderboard');

    container.innerHTML = '';

    if (!leaderboardData || leaderboardData.length === 0) {
        container.innerHTML = '<div class="empty-state">No active learners yet. Be the first!</div>';
        return;
    }

    leaderboardData.forEach((user, idx) => {
        const isMe = user.name === (JSON.parse(localStorage.getItem('omniUser'))?.name);
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isMe ? 'highlight' : ''}`;

        let avatarHTML = user.avatar || '👤';
        if (user.avatar && user.avatar.startsWith('data:')) {
            avatarHTML = `<img src="${user.avatar}" class="lb-avatar-img">`;
        }

        // Format Time
        const minutes = Math.floor((user.totalStudyTime || 0) / 60);
        const hours = Math.floor(minutes / 60);
        const timeStr = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;

        item.innerHTML = `
            <div class="lb-rank">${idx + 1}</div>
            <div class="lb-avatar">${avatarHTML}</div>
            <div class="lb-name">${user.name}</div>
            <div class="lb-xp">${timeStr} Studied</div>
        `;
        container.appendChild(item);
    });
}

// Helper to update top stats bar
function updateStatsUI() {
    document.querySelector('.stat-item.gems .value').textContent = appState.gems;
    document.querySelector('.stat-item.hearts .value').textContent = appState.hearts;
    document.querySelector('.stat-item.fire-streak .value').textContent = appState.streak;
}

// Helpers
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Custom Practice Logic
async function startCustomTopic() {
    const topic = document.getElementById('custom-topic').value.trim();
    const difficulty = document.getElementById('custom-difficulty').value;

    if (!topic) {
        alert("Please enter a topic!");
        return;
    }

    // Reuse startLevel logic but with custom params
    startCustomSession('/generate-quiz', { topic, difficulty });
}

async function startPdfUpload() {
    const fileInput = document.getElementById('pdf-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a PDF file!");
        return;
    }

    const formData = new FormData();
    formData.append('pdf', fileInput.files[0]);

    // Show Loading directly here as we can't reuse apiCall for FormData nicely without refactor
    const content = document.querySelector('.exercise-content');
    content.innerHTML = '<div class="loading-spinner">📄 Parsing PDF & Generating Quiz...</div>';
    exerciseOverlay.classList.remove('hidden');

    try {
        const res = await fetch('http://localhost:3000/api/upload-pdf', {
            method: 'POST',
            body: formData
        });
        const questions = await res.json();

        if (questions.error) throw new Error(questions.error);
        if (!questions || questions.length === 0) throw new Error("No questions generated");

        initSession(questions);

    } catch (e) {
        console.error(e);
        alert("Error generating from PDF: " + e.message);
        exerciseOverlay.classList.add('hidden');
    }
}

// Refactored helper to start session from any source
async function startCustomSession(endpoint, body) {
    const content = document.querySelector('.exercise-content');
    content.innerHTML = '<div class="loading-spinner">🤖 Generating unique lesson...</div>';
    exerciseOverlay.classList.remove('hidden');

    try {
        const questions = await apiCall(endpoint, 'POST', body);
        if (!questions || questions.length === 0) {
            alert("Failed to load lesson.");
            exerciseOverlay.classList.add('hidden');
            return;
        }
        initSession(questions);
    } catch (e) {
        console.error(e);
        exerciseOverlay.classList.add('hidden');
    }
}

function initSession(questions) {
    // Restore UI
    const content = document.querySelector('.exercise-content');
    content.innerHTML = `
        <h2 class="question-text" id="question-text"></h2>
        <div class="question-area" id="question-area"></div>
    `;

    appState.currentExerciseSession = {
        questions: shuffleArray(questions),
        currentIdx: 0,
        correctCount: 0
    };

    appState.studyStartTimestamp = Date.now();
    renderQuestion();
    updateProgressBar(0);
}

