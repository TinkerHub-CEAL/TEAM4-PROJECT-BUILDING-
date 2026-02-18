const API_URL = 'http://localhost:5001/api';

const api = {
    // Auth
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Login failed');
        return await response.json();
    },

    async signup(user) {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        if (!response.ok) throw new Error('Signup failed');
        return await response.json();
    },

    // Tokens
    async getTokens() {
        const response = await fetch(`${API_URL}/tokens`);
        return await response.json();
    },

    async getUserHistory(userId) {
        const response = await fetch(`${API_URL}/tokens/history/${userId}`);
        return await response.json();
    },

    async bookToken(token) {
        const response = await fetch(`${API_URL}/tokens/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(token)
        });
        if (!response.ok) throw new Error('Booking failed');
        return await response.json();
    },

    async updateTokenStatus(id, status, counter = null) {
        const response = await fetch(`${API_URL}/tokens/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, counter })
        });
        return await response.json();
    },

    async rescheduleToken(id) {
        const response = await fetch(`${API_URL}/tokens/reschedule/${id}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Reschedule failed');
        return await response.json();
    },

    async deleteToken(id) {
        const response = await fetch(`${API_URL}/tokens/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Cancellation failed');
        return await response.json();
    }
};

window.api = api;
