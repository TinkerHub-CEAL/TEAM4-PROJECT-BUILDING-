const SECTORS = {
    hospital: {
        name: "Medical Center",
        theme: "hospital",
        departments: [
            { id: 'OPD', name: 'Outpatient Dept', icon: 'stethoscope', avgTime: 12 },
            { id: 'LAB', name: 'Laboratory', icon: 'test-tube', avgTime: 8 },
            { id: 'PHA', name: 'Pharmacy', icon: 'pill', avgTime: 5 },
            { id: 'EMG', name: 'Emergency', icon: 'ambulance', avgTime: 2 }
        ]
    },
    banking: {
        name: "National Bank",
        theme: "banking",
        departments: [
            { id: 'CSH', name: 'Cashier/Teller', icon: 'banknote', avgTime: 4 },
            { id: 'LOA', name: 'Loans & Credit', icon: 'landmark', avgTime: 15 },
            { id: 'ACC', name: 'New Accounts', icon: 'user-plus', avgTime: 10 },
            { id: 'FX', name: 'Foreign Exchange', icon: 'repeat', avgTime: 6 }
        ]
    },
    government: {
        name: "Civic Services",
        theme: "government",
        departments: [
            { id: 'PAS', name: 'Passport Services', icon: 'globe', avgTime: 20 },
            { id: 'TAX', name: 'Revenue/Tax', icon: 'calculator', avgTime: 15 },
            { id: 'LIC', name: 'Licensing', icon: 'file-text', avgTime: 12 },
            { id: 'SOC', name: 'Social Benefits', icon: 'heart', avgTime: 10 }
        ]
    },
    supermarket: {
        name: "Grand Supermarket",
        theme: "supermarket",
        departments: [
            { id: 'DEL', name: 'Deli Counter', icon: 'utensils', avgTime: 5 },
            { id: 'BAK', name: 'Bakery Fresh', icon: 'wheat', avgTime: 3 },
            { id: 'CHK', name: 'Priority Checkout', icon: 'shopping-cart', avgTime: 2 },
            { id: 'SRV', name: 'Customer Service', icon: 'help-circle', avgTime: 8 }
        ]
    },
    restaurant: {
        name: "Dine & Joy",
        theme: "restaurant",
        departments: [
            { id: 'TBL', name: 'Table Booking', icon: 'utensils-crosses', avgTime: 20 },
            { id: 'TKW', name: 'Takeaway Order', icon: 'package', avgTime: 10 },
            { id: 'BAR', name: 'Bar & Drinks', icon: 'glass-water', avgTime: 5 },
            { id: 'COL', name: 'Order Collection', icon: 'check-circle', avgTime: 2 }
        ]
    },
    salon: {
        name: "Elite Salon & Spa",
        theme: "salon",
        departments: [
            { id: 'CUT', name: 'Hair Cutting', icon: 'scissors', avgTime: 15 },
            { id: 'NAI', name: 'Nail Art', icon: 'sparkles', avgTime: 25 },
            { id: 'MAS', name: 'Therapy/Massage', icon: 'flower-2', avgTime: 40 },
            { id: 'REC', name: 'Reception Desk', icon: 'concierge-bell', avgTime: 5 }
        ]
    },
    telecom: {
        name: "Telecom Express",
        theme: "telecom",
        departments: [
            { id: 'BIL', name: 'Bill Payment', icon: 'receipt', avgTime: 5 },
            { id: 'NEW', name: 'New Connection', icon: 'smartphone', avgTime: 15 },
            { id: 'TEC', name: 'Tech Support', icon: 'wrench', avgTime: 12 },
            { id: 'WAR', name: 'Warranty Claim', icon: 'shield', avgTime: 10 }
        ]
    },
    general: {
        name: "Service Hub",
        theme: "general",
        departments: [
            { id: 'SR1', name: 'Service Counter A', icon: 'clipboard', avgTime: 5 },
            { id: 'SR2', name: 'Service Counter B', icon: 'clipboard-list', avgTime: 5 },
            { id: 'INF', name: 'Information Desk', icon: 'info', avgTime: 3 },
            { id: 'SPT', name: 'Technical Support', icon: 'settings', avgTime: 12 }
        ]
    }
};

let state = {
    activeSector: 'hospital',
    tokens: [],
    users: [],
    currentUser: null,
    currentView: 'home',
    selectedDept: null,
    pendingBooking: null,
    activeCounter: "1"
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initLucide();
    await loadState();
    setupNav();
    updateAuthUI();
    setupSectorSelector();
    refreshViews();

    // Removed storage listener as state is now in DB

    setTimeout(() => {
        showToast(`Welcome to ${SECTORS[state.activeSector].name}. System generalized for all sectors.`, "accent");
    }, 1500);

    const counterSelect = document.getElementById('counter-select');
    if (counterSelect) {
        counterSelect.addEventListener('change', (e) => {
            state.activeCounter = e.target.value;
            refreshAdmin();
        });
    }

    setupOTPListeners();

    // Auto refresh status every 10 seconds
    setInterval(loadState, 10000);
});

function initLucide() {
    if (window.lucide) lucide.createIcons();
}

function sortTokens(tokens) {
    const priority = { emergency: 1, disabled: 2, regular: 3 };
    return [...tokens].sort((a, b) => {
        if (priority[a.type] !== priority[b.type]) {
            return priority[a.type] - priority[b.type];
        }
        return a.timestamp - b.timestamp;
    });
}

async function loadState() {
    try {
        const tokens = await api.getTokens();
        if (!Array.isArray(tokens)) throw new Error("Invalid token data");
        // Priority Sorting
        state.tokens = sortTokens(tokens);

        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && savedUser !== 'undefined') {
            try {
                state.currentUser = JSON.parse(savedUser);
                if (state.currentUser && state.currentView === 'profile') {
                    await refreshProfile();
                }
            } catch (e) {
                localStorage.removeItem('currentUser');
                state.currentUser = null;
            }
        }

        refreshViews();
    } catch (error) {
        console.error("Failed to load state:", error);
    }
}

async function saveState() {
    // saveState is now mostly handled by individual API calls
    refreshViews();
}

// SECTOR LOGIC
function setupSectorSelector() {
    const selector = document.getElementById('sector-selector');
    if (!selector) return;

    selector.value = state.activeSector;
    selector.addEventListener('change', (e) => {
        state.activeSector = e.target.value;
        localStorage.setItem('activeSector', state.activeSector);
        showToast(`Switched to ${SECTORS[state.activeSector].name}`, "primary");
        refreshViews();
    });
}

function getActiveDepartments() {
    return SECTORS[state.activeSector].departments;
}

// NAVIGATION & VIEWS
function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(viewId) {
    if (state.currentView === viewId) return;

    if (viewId === 'admin' && (!state.currentUser || state.currentUser.role !== 'staff')) {
        showToast("Staff authentication required.", "danger");
        openAuthModal('login');
        return;
    }

    const currentSection = document.getElementById(`${state.currentView}-view`);
    const nextSection = document.getElementById(`${viewId}-view`);

    if (currentSection) currentSection.classList.remove('view-active');
    if (nextSection) {
        nextSection.classList.add('view-active');
        state.currentView = viewId;
        refreshViews();
    }

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-view') === viewId);
    });
}

function refreshViews() {
    renderDepartments();
    if (state.currentView === 'admin') refreshAdmin();
    if (state.currentView === 'lobby') refreshLobby();
    if (state.currentView === 'profile') refreshProfile();
    updateMyTokenDisplay();

    // Update terminology
    const portalName = document.getElementById('portal-name');
    if (portalName) portalName.innerText = SECTORS[state.activeSector].name;
}

// AUTHENTICATION LOGIC
function openAuthModal(mode) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('auth-modal').style.display = 'block';
    document.getElementById('booking-modal').style.display = 'none';
    toggleAuthForm(mode);

    setTimeout(() => {
        const firstInput = document.getElementById(`${mode}-form`).querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function toggleAuthForm(mode) {
    const forms = ['login', 'signup', 'forgot'];
    forms.forEach(f => {
        const el = document.getElementById(`${f}-form`);
        if (el) el.style.display = 'none';
    });
    const active = document.getElementById(`${mode}-form`);
    if (active) active.style.display = 'block';
}

function closeAllModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('booking-modal').style.display = 'none';
}

function setGuestMode() {
    state.currentUser = { id: 'guest-' + Date.now(), name: 'Guest User', role: 'guest' };
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    updateAuthUI();
    showToast("Guest Mode Activated.", "primary");
    closeAllModals();
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    // Reset errors
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));

    if (!email) {
        document.getElementById('login-email-error').style.display = 'block';
        document.getElementById('login-email').classList.add('error');
        return;
    }
    if (!pass) {
        document.getElementById('login-pass-error').style.display = 'block';
        document.getElementById('login-pass').classList.add('error');
        return;
    }

    try {
        const user = await api.login(email, pass);
        state.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        updateAuthUI();
        showToast(`Welcome, ${state.currentUser.name}`, "success");
        closeAllModals();
        await loadState();
    } catch (error) {
        console.error("Login Error:", error);
        document.getElementById('login-email-error').innerText = error.message.includes('fetch') ? "Server connection refused" : "Invalid email or password";
        document.getElementById('login-email-error').style.display = 'block';
        document.getElementById('login-email').classList.add('error');
    }
}

async function handleSignup() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    // Reset errors
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));

    if (!name) {
        document.getElementById('reg-name-error').style.display = 'block';
        document.getElementById('reg-name').classList.add('error');
        return;
    }
    if (!email || !email.includes('@')) {
        document.getElementById('reg-email-error').style.display = 'block';
        document.getElementById('reg-email').classList.add('error');
        return;
    }
    if (!pass || pass.length < 6) {
        document.getElementById('reg-pass-error').style.display = 'block';
        document.getElementById('reg-pass').classList.add('error');
        return;
    }

    const newUser = { id: Date.now().toString(), name, email, password: pass };
    try {
        const user = await api.signup(newUser);
        state.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        updateAuthUI();
        showToast("Account created!", "success");
        closeAllModals();
        await loadState();
    } catch (error) {
        console.error("Signup Error:", error);
        document.getElementById('reg-email-error').innerText = error.message || "Signup failed. Check server.";
        document.getElementById('reg-email-error').style.display = 'block';
        document.getElementById('reg-email').classList.add('error');
    }
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    switchView('customer');
    showToast("Logged out.", "primary");
}

function updateAuthUI() {
    const controls = document.getElementById('auth-controls');
    const profile = document.getElementById('user-profile-badge');
    const links = controls.querySelectorAll('.auth-link');

    if (state.currentUser) {
        links.forEach(l => l.style.display = 'none');
        profile.style.display = 'flex';
        document.getElementById('user-display-name').innerText = state.currentUser.name;
    } else {
        links.forEach(l => l.style.display = 'block');
        profile.style.display = 'none';
    }
}

// BOOKING FLOW
function openBooking(deptId) {
    if (!state.currentUser) {
        showToast("Login/Guest required to book.", "warning");
        openAuthModal('login');
        return;
    }

    state.selectedDept = deptId;
    const dept = getActiveDepartments().find(d => d.id === deptId);
    document.getElementById('modal-dept-title').innerText = `Join ${dept.name} Queue`;

    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('booking-modal').style.display = 'block';
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('booking-form').style.display = 'block';
    document.getElementById('otp-form').style.display = 'none';

    if (state.currentUser.role !== 'guest') {
        document.getElementById('book-name').value = state.currentUser.name || "";
    }
}

let currentBookingType = 'regular';
function setBookingType(type) {
    currentBookingType = type;
    ['regular', 'emergency', 'disabled'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        if (btn) btn.style.borderColor = (t === type) ? 'var(--accent-primary)' : 'var(--glass-border)';
    });
}

function initiateOTP() {
    const name = document.getElementById('book-name').value;
    const phone = document.getElementById('book-phone').value;
    if (!name || !phone) return showToast("Name and Phone required.", "warning");

    // Clear previous OTP inputs
    ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    state.pendingBooking = { name, phone, type: currentBookingType };
    document.getElementById('booking-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'block';

    setTimeout(() => document.getElementById('otp1')?.focus(), 100);
    showToast("OTP Code '1234' sent.", "accent");
}

function setupOTPListeners() {
    ['otp1', 'otp2', 'otp3', 'otp4'].forEach((id, index, arr) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                // Focus next
                if (index < arr.length - 1) {
                    document.getElementById(arr[index + 1]).focus();
                } else if (index === arr.length - 1) {
                    confirmOTP();
                }
            } else if (e.key === 'Backspace') {
                // Focus previous
                if (index > 0) {
                    document.getElementById(arr[index - 1]).focus();
                }
            }
        });

        // Handle pasting
        el.addEventListener('paste', (e) => {
            const data = e.clipboardData.getData('text');
            if (data.length === 4 && !isNaN(data)) {
                data.split('').forEach((char, i) => {
                    const input = document.getElementById(arr[i]);
                    if (input) input.value = char;
                });
                document.getElementById(arr[arr.length - 1]).focus();
                confirmOTP();
            }
        });
    });
}

function confirmOTP() {
    const otp = [
        document.getElementById('otp1').value,
        document.getElementById('otp2').value,
        document.getElementById('otp3').value,
        document.getElementById('otp4').value
    ].join('');
    if (otp !== "1234") return showToast("Invalid OTP.", "danger");
    finalizeBooking();
}

async function finalizeBooking() {
    const dept = getActiveDepartments().find(d => d.id === state.selectedDept);
    const deptPrefix = dept.id.charAt(0);
    const count = state.tokens.filter(t => t.deptId === dept.id).length + 1;
    const number = `${deptPrefix}-${count.toString().padStart(3, '0')}`;

    const newToken = {
        id: crypto.randomUUID(),
        number: number,
        deptId: dept.id,
        sector: state.activeSector,
        type: state.pendingBooking.type,
        name: state.pendingBooking.name,
        phone: state.pendingBooking.phone,
        userId: state.currentUser ? state.currentUser.id : null,
        timestamp: Date.now()
    };

    try {
        await api.bookToken(newToken);
        await loadState();
        closeAllModals();
        showToast(`Token ${number} issued!`, 'success');
    } catch (error) {
        showToast("Failed to book token.", "danger");
    }
}

// RENDERING
function renderDepartments() {
    const grid = document.getElementById('department-grid');
    if (!grid) return;

    grid.innerHTML = getActiveDepartments().map(dept => {
        const deptTokens = state.tokens.filter(t => t.deptId === dept.id && t.status === 'waiting');
        const crowd = getCrowdLevel(deptTokens.length);
        return `
            <div class="glass-card" onclick="openBooking('${dept.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div class="profile-avatar"><i data-lucide="${dept.icon}"></i></div>
                    <span class="status-indicator status-${crowd}"></span>
                </div>
                <h3>${dept.name}</h3>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">${deptTokens.length} waiting</p>
                <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: var(--accent-primary);">~${predictWait(dept.id)}m wait</span>
                    <i data-lucide="arrow-right" style="width: 18px;"></i>
                </div>
            </div>
        `;
    }).join('');
    initLucide();
}

function getCrowdLevel(count) {
    if (count < 3) return 'low';
    if (count < 7) return 'medium';
    return 'high';
}

function predictWait(deptId) {
    const dept = getActiveDepartments().find(d => d.id === deptId);
    if (!dept) return 0;
    const count = state.tokens.filter(t => t.deptId === deptId && t.status === 'waiting').length;
    return Math.max(2, count * dept.avgTime);
}

function updateMyTokenDisplay() {
    const container = document.getElementById('active-token-container');
    if (!state.currentUser) { container.style.display = 'none'; return; }

    const myActiveToken = state.tokens.find(t => t.userId === state.currentUser.id && t.status !== 'done');
    if (myActiveToken) {
        container.style.display = 'block';
        const deptName = getActiveDepartments().find(d => d.id === myActiveToken.deptId)?.name || "Service";
        document.getElementById('token-dept-name').innerText = deptName;
        document.getElementById('token-number').innerText = `#${myActiveToken.number}`;
        document.getElementById('assigned-counter').innerText = myActiveToken.counter ? `Desk ${myActiveToken.counter}` : "Awaiting Desk...";

        const deptTokens = state.tokens.filter(t => t.deptId === myActiveToken.deptId && t.status === 'waiting');
        const pos = deptTokens.findIndex(t => t.id === myActiveToken.id) + 1;
        document.getElementById('queue-position').innerText = pos > 0 ? pos + "th" : "Serving";
        document.getElementById('wait-time').innerText = `~ ${predictWait(myActiveToken.deptId)} mins`;

        // Smart Notification: Check if turn is near
        const alertBox = document.getElementById('near-turn-alert');
        if (pos > 0 && pos <= 3) {
            if (!alertBox) {
                const alert = document.createElement('div');
                alert.id = 'near-turn-alert';
                alert.className = 'near-turn-alert';
                alert.innerHTML = `<i data-lucide="bell-ring"></i> Get Ready! Your turn is approaching (Position: ${pos})`;
                container.prepend(alert);
                initLucide();
                // Play notification sound
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
            }
        } else if (alertBox) {
            alertBox.remove();
        }

        document.getElementById('qrcode').innerHTML = "";
        new QRCode(document.getElementById('qrcode'), { text: myActiveToken.id, width: 120, height: 120 });
    } else {
        container.style.display = 'none';
    }
}

async function refreshProfile() {
    const historyContainer = document.getElementById('booking-history');
    if (state.currentUser.role === 'guest') {
        document.getElementById('profile-name').innerText = "Guest User";
        document.getElementById('profile-email').innerText = "Sessions only";
        historyContainer.innerHTML = "<p>Sign up for history.</p>";
        return;
    }

    // Show skeleton to avoid flickering
    historyContainer.innerHTML = `
        <div class="profile-loading">
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
        </div>
    `;

    try {
        const history = await api.getUserHistory(state.currentUser.id);
        document.getElementById('profile-name').innerText = state.currentUser.name;
        document.getElementById('profile-email').innerText = state.currentUser.email;

        historyContainer.innerHTML = history.map(h => `
            <div class="glass-card" style="padding: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between;">
                <div><strong>${h.number}</strong><br><small>${h.sector.toUpperCase()}</small></div>
                <span class="status-indicator status-${h.status === 'done' ? 'low' : (h.status === 'cancelled' ? 'high' : 'medium')}"></span>
                <span>${h.status.toUpperCase()}</span>
            </div>
        `).join('') || "<p>No history yet.</p>";
    } catch (e) {
        historyContainer.innerHTML = "<p>Failed to load history.</p>";
    }
}

function refreshAdmin() {
    const list = document.getElementById('admin-queue-list');
    const waiting = state.tokens.filter(t => t.status === 'waiting');
    const servingHere = state.tokens.find(t => t.status === 'serving' && t.counter === state.activeCounter);
    document.getElementById('serving-token').innerText = servingHere ? servingHere.number : '--';
    list.innerHTML = waiting.map(t => `
        <div class="glass-card" style="padding: 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
            <div><strong>${t.number}</strong><br><small>${t.name}</small></div>
            <span>${t.type.toUpperCase()}</span>
        </div>
    `).join('');
}

async function callNext() {
    const serving = state.tokens.find(t => t.status === 'serving' && t.counter === state.activeCounter);
    if (serving) {
        try {
            await api.updateTokenStatus(serving.id, 'done');
        } catch (e) { console.error(e); }
    }

    const waiting = state.tokens.filter(t => t.status === 'waiting');
    if (waiting.length > 0) {
        const next = waiting[0];
        try {
            await api.updateTokenStatus(next.id, 'serving', state.activeCounter);
            announceToken(next.number, state.activeCounter);
            await loadState();
            showToast(`Calling ${next.number}`, 'accent');
        } catch (error) {
            showToast("Failed to call next token.", "danger");
        }
    }
}

function announceToken(number, counter) {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.4;
    audio.play();
    setTimeout(() => {
        const msg = new SpeechSynthesisUtterance();
        msg.text = `Token ${number.split('').join(' ')}, proceed to Counter ${counter}`;
        window.speechSynthesis.speak(msg);
    }, 1000);
}

function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshLobby() {
    const grid = document.getElementById('lobby-serving-grid');
    const waitList = document.getElementById('lobby-waiting-list');

    const serving = state.tokens.filter(t => t.status === 'serving').sort((a, b) => a.counter - b.counter);
    grid.innerHTML = serving.map(t => `
        <div class="glass-card" style="text-align: center; padding: 2rem;">
            <h3>DESK ${t.counter}</h3>
            <div class="counter-token">${t.number}</div>
        </div>
    `).join('') || "<h3>All counters available.</h3>";

    const upcoming = state.tokens.filter(t => t.status === 'waiting');
    waitList.innerHTML = upcoming.map(t => `
        <div class="glass-card" style="padding: 1.5rem; min-width: 180px; text-align: center; flex-shrink: 0;">
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-primary);">#${t.number}</div>
            <small style="color: var(--text-secondary); text-transform: uppercase;">${t.type}</small>
        </div>
    `).join('') || "<p>No upcoming tokens.</p>";
}

function showToast(msg, type = 'primary') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeftColor = `var(--${type})`;
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 4000);
}

// Confirmation Modal Helper
function openConfirmModal(title, msg, onConfirm) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;
    const btn = document.getElementById('confirm-btn');
    btn.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
    document.getElementById('confirm-modal-overlay').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal-overlay').style.display = 'none';
}

async function rescheduleToken() {
    const myActiveToken = state.tokens.find(t => t.userId === state.currentUser?.id && t.status !== 'done');
    if (!myActiveToken) return;

    openConfirmModal(
        "Reschedule Token?",
        "You will be moved to the back of the line for this department. Proceed?",
        async () => {
            try {
                await api.rescheduleToken(myActiveToken.id);
                showToast("Token rescheduled to end of queue.", "accent");
                await loadState();
            } catch (error) {
                showToast("Failed to reschedule token.", "danger");
            }
        }
    );
}

async function cancelToken() {
    const myActiveToken = state.tokens.find(t => t.userId === state.currentUser?.id && t.status !== 'done');
    if (!myActiveToken) return;

    openConfirmModal(
        "Cancel Token?",
        "Are you sure you want to cancel your digital token? This action is permanent.",
        async () => {
            try {
                await api.deleteToken(myActiveToken.id);
                showToast("Token cancelled successfully.", "warning");
                await loadState();
            } catch (error) {
                showToast("Failed to cancel token.", "danger");
            }
        }
    );
}

function scrollToFeatures() {
    const features = document.getElementById('features');
    if (features) {
        features.scrollIntoView({ behavior: 'smooth' });
    }
}