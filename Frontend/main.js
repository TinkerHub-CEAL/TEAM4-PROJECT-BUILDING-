const SECTORS = {
    hospital: { name: "Medical Center", theme: "hospital", departments: [{ id: 'OPD', name: 'Outpatient Dept', icon: 'stethoscope', avgTime: 12 }, { id: 'LAB', name: 'Laboratory', icon: 'test-tube', avgTime: 8 }, { id: 'PHA', name: 'Pharmacy', icon: 'pill', avgTime: 5 }, { id: 'EMG', name: 'Emergency', icon: 'ambulance', avgTime: 2 }] },
    banking: { name: "National Bank", theme: "banking", departments: [{ id: 'CSH', name: 'Cashier/Teller', icon: 'banknote', avgTime: 4 }, { id: 'LOA', name: 'Loans & Credit', icon: 'landmark', avgTime: 15 }, { id: 'ACC', name: 'New Accounts', icon: 'user-plus', avgTime: 10 }, { id: 'FX', name: 'Foreign Exchange', icon: 'repeat', avgTime: 6 }] },
    government: { name: "Civic Services", theme: "government", departments: [{ id: 'PAS', name: 'Passport Services', icon: 'globe', avgTime: 20 }, { id: 'TAX', name: 'Revenue/Tax', icon: 'calculator', avgTime: 15 }, { id: 'LIC', name: 'Licensing', icon: 'file-text', avgTime: 12 }, { id: 'SOC', name: 'Social Benefits', icon: 'heart', avgTime: 10 }] },
    supermarket: { name: "Grand Supermarket", theme: "supermarket", departments: [{ id: 'DEL', name: 'Deli Counter', icon: 'utensils', avgTime: 5 }, { id: 'BAK', name: 'Bakery Fresh', icon: 'wheat', avgTime: 3 }, { id: 'CHK', name: 'Priority Checkout', icon: 'shopping-cart', avgTime: 2 }, { id: 'SRV', name: 'Customer Service', icon: 'help-circle', avgTime: 8 }] },
    restaurant: { name: "Dine & Joy", theme: "restaurant", departments: [{ id: 'TBL', name: 'Table Booking', icon: 'utensils-crosses', avgTime: 20 }, { id: 'TKW', name: 'Takeaway Order', icon: 'package', avgTime: 10 }, { id: 'BAR', name: 'Bar & Drinks', icon: 'glass-water', avgTime: 5 }, { id: 'COL', name: 'Order Collection', icon: 'check-circle', avgTime: 2 }] },
    salon: { name: "Elite Salon & Spa", theme: "salon", departments: [{ id: 'CUT', name: 'Hair Cutting', icon: 'scissors', avgTime: 15 }, { id: 'NAI', name: 'Nail Art', icon: 'sparkles', avgTime: 25 }, { id: 'MAS', name: 'Therapy/Massage', icon: 'flower-2', avgTime: 40 }, { id: 'REC', name: 'Reception Desk', icon: 'concierge-bell', avgTime: 5 }] },
    telecom: { name: "Telecom Express", theme: "telecom", departments: [{ id: 'BIL', name: 'Bill Payment', icon: 'receipt', avgTime: 5 }, { id: 'NEW', name: 'New Connection', icon: 'smartphone', avgTime: 15 }, { id: 'TEC', name: 'Tech Support', icon: 'wrench', avgTime: 12 }, { id: 'WAR', name: 'Warranty Claim', icon: 'shield', avgTime: 10 }] },
    general: { name: "Service Hub", theme: "general", departments: [{ id: 'SR1', name: 'Service Counter A', icon: 'clipboard', avgTime: 5 }, { id: 'SR2', name: 'Service Counter B', icon: 'clipboard-list', avgTime: 5 }, { id: 'INF', name: 'Information Desk', icon: 'info', avgTime: 3 }, { id: 'SPT', name: 'Technical Support', icon: 'settings', avgTime: 12 }] }
};

let state = {
    activeSector: 'hospital',
    tokens: [],
    users: [],
    currentUser: null,
    currentView: 'customer',
    selectedDept: null,
    pendingBooking: null,
    activeCounter: "1"
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initLucide();
    loadState();
    refreshViews();

    window.addEventListener('storage', () => {
        loadState();
        refreshViews();
    });
});

function initLucide() {
    if (window.lucide) lucide.createIcons();
}

function loadState() {
    const saved = localStorage.getItem('queue_state_v3');
    if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
    }

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
    }

    const savedSector = localStorage.getItem('activeSector');
    if (savedSector && SECTORS[savedSector]) {
        state.activeSector = savedSector;
    }
}

function saveState() {
    localStorage.setItem('queue_state_v3', JSON.stringify({
        tokens: state.tokens,
        users: state.users,
        activeSector: state.activeSector
    }));
    refreshViews();
}

function getActiveDepartments() {
    return SECTORS[state.activeSector].departments;
}

function refreshViews() {
    renderDepartments();
    updateMyTokenDisplay();

    // Update terminology
    const portalName = document.getElementById('portal-name');
    if (portalName) portalName.innerText = SECTORS[state.activeSector].name;
}

// BOOKING FLOW
function openBooking(deptId) {
    if (!state.currentUser) {
        showToast("Login/Guest required to book. Please proceed to Home.", "warning");
        setTimeout(() => window.location.href = "../Member1_Home/index.html", 1500);
        return;
    }

    state.selectedDept = deptId;
    const dept = getActiveDepartments().find(d => d.id === deptId);
    document.getElementById('modal-dept-title').innerText = `Join ${dept.name} Queue`;

    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('booking-modal').style.display = 'block';

    // Booking Form Show
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

    state.pendingBooking = { name, phone, type: currentBookingType };
    document.getElementById('booking-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'block';
    showToast("OTP Code '1234' sent.", "accent");
}

function moveOTP(input, nextId) {
    if (input.value.length === 1) {
        const next = document.getElementById(nextId);
        if (next) next.focus();
    }
}

function confirmOTP() {
    const otp = [
        document.querySelector('.otp-input').value,
        document.getElementById('otp2').value,
        document.getElementById('otp3').value,
        document.getElementById('otp4').value
    ].join('');
    if (otp !== "1234") return showToast("Invalid OTP.", "danger");
    finalizeBooking();
}

function finalizeBooking() {
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
        status: 'waiting',
        timestamp: Date.now(),
        userId: state.currentUser.id
    };

    state.tokens.push(newToken);
    if (state.currentUser.role === 'user') {
        const userIndex = state.users.findIndex(u => u.id === state.currentUser.id);
        if (userIndex !== -1) state.users[userIndex].history.unshift({ ...newToken });
    } else {
        // Just for session storage guests, maybe update current user object in storage so it persists lightly?
        // Actually since we reload state on start, pushing to state.users if we wanted history persistence would be needed. 
        // But for guest we don't persist history deeply.
    }

    saveState();
    closeAllModals();
    showToast(`Token ${number} issued!`, 'success');
}

function closeAllModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('booking-modal').style.display = 'none';
}

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

        document.getElementById('qrcode').innerHTML = "";
        new QRCode(document.getElementById('qrcode'), { text: myActiveToken.id, width: 120, height: 120 });
    } else {
        container.style.display = 'none';
    }
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

function rescheduleToken() {
    // Logic for cancelling/rescheduling
    alert("Functionality to be implemented by Member 2");
}

function cancelToken() {
    const myActiveToken = state.tokens.find(t => t.userId === state.currentUser.id && t.status !== 'done');
    if (myActiveToken) {
        myActiveToken.status = 'cancelled' // or remove
        // Actually let's just mark it done or remove it
        state.tokens = state.tokens.filter(t => t.id !== myActiveToken.id);
        saveState();
        showToast("Token cancelled", "danger");
    }
}
