// Discord OAuth Configuration
const CLIENT_ID = 'YOUR_BOT_CLIENT_ID'; // Replace with your bot's client ID
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = 'identify guilds';
const API_BASE = 'http://localhost:5000/api'; // Change to your bot's API URL

// State management
let currentUser = null;
let currentGuild = null;
let currentTicket = null;
let currentApp = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupEventListeners();
});

// ============= AUTHENTICATION =============

function initAuth() {
    const token = localStorage.getItem('discord_token');
    
    if (token) {
        fetchUserData(token);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            exchangeCodeForToken(code);
        } else {
            showLoginPage();
        }
    }
}

function showLoginPage() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
}

function discordLogin() {
    const url = `https://discord.com/api/oauth2/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = url;
}

async function exchangeCodeForToken(code) {
    try {
        const response = await fetch(`${API_BASE}/auth/callback?code=${code}`);
        const data = await response.json();
        
        if (data.access_token) {
            localStorage.setItem('discord_token', data.access_token);
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchUserData(data.access_token);
        }
    } catch (error) {
        console.error('Token exchange failed:', error);
        showLoginPage();
    }
}

async function fetchUserData(token) {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user');
        
        currentUser = await response.json();
        localStorage.setItem('discord_token', token);
        
        updateUserUI();
        await loadGuilds(token);
        showDashboard();
    } catch (error) {
        console.error('User fetch failed:', error);
        localStorage.removeItem('discord_token');
        showLoginPage();
    }
}

function updateUserUI() {
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.username;
        document.getElementById('user-avatar').src = 
            `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`;
    }
}

async function loadGuilds(token) {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch guilds');
        
        const guilds = await response.json();
        const select = document.getElementById('guild-select');
        
        select.innerHTML = '<option value="">Select a server...</option>';
        guilds.forEach(guild => {
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = guild.name;
            select.appendChild(option);
        });
        
        if (guilds.length > 0) {
            select.value = guilds[0].id;
            loadGuildData(guilds[0].id);
        }
    } catch (error) {
        console.error('Guilds fetch failed:', error);
    }
}

async function loadGuildData(guildId) {
    currentGuild = guildId;
    document.getElementById('guild-name').textContent = 
        document.getElementById('guild-select').options[document.getElementById('guild-select').selectedIndex].text;
    
    loadTickets();
    loadApplications();
    loadSecuritySettings();
}

// ============= EVENT LISTENERS =============

function setupEventListeners() {
    // Login
    document.getElementById('discord-login')?.addEventListener('click', discordLogin);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            e.target.closest('.nav-item').classList.add('active');
            
            const tab = e.target.closest('.nav-item').dataset.tab;
            showSection(tab);
        });
    });
    
    // Guild selector
    document.getElementById('guild-select').addEventListener('change', (e) => {
        if (e.target.value) loadGuildData(e.target.value);
    });
    
    // Tickets
    document.addEventListener('click', (e) => {
        if (e.target.closest('.ticket-item')) {
            const ticketId = e.target.closest('.ticket-item').dataset.id;
            showTicketDetail(ticketId);
        }
        if (e.target.closest('.back-btn') && currentTicket) {
            closeTicketDetail();
        }
    });
    
    // Applications
    document.addEventListener('click', (e) => {
        if (e.target.closest('.app-item')) {
            const appId = e.target.closest('.app-item').dataset.id;
            showAppDetail(appId);
        }
        if (e.target.closest('.back-btn') && currentApp) {
            closeAppDetail();
        }
    });
    
    // Close ticket
    document.getElementById('close-ticket-btn')?.addEventListener('click', closeTicket);
    
    // Download transcript
    document.getElementById('download-transcript-btn')?.addEventListener('click', downloadTranscript);
    
    // Approve/Deny app
    document.getElementById('approve-btn')?.addEventListener('click', approveApp);
    document.getElementById('deny-btn')?.addEventListener('click', denyApp);
    
    // Security settings
    document.getElementById('save-raid-btn')?.addEventListener('click', saveRaidSettings);
    document.getElementById('save-account-btn')?.addEventListener('click', saveAccountSettings);
    
    // Modal
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

// ============= UTILITIES =============

function showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    if (section === 'tickets') loadTickets();
    if (section === 'applications') loadApplications();
    if (section === 'security') loadSecuritySettings();
}

function logout() {
    localStorage.removeItem('discord_token');
    currentUser = null;
    currentGuild = null;
    showLoginPage();
}

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modal-body');
    body.innerHTML = `<h2>${title}</h2>${content}`;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
}

// ============= TICKETS =============

async function loadTickets() {
    if (!currentGuild) return;
    
    try {
        const response = await fetch(`${API_BASE}/guilds/${currentGuild}/tickets`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const data = await response.json();
        const openTickets = data.filter(t => t.status === 'open');
        const closedTickets = data.filter(t => t.status === 'closed');
        
        document.getElementById('open-tickets').textContent = openTickets.length;
        document.getElementById('closed-tickets').textContent = closedTickets.length;
        
        const list = document.getElementById('tickets-list');
        if (openTickets.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No open tickets</p></div>';
            return;
        }
        
        list.innerHTML = openTickets.map(ticket => `
            <div class="ticket-item" data-id="${ticket.ticket_id}">
                <div class="ticket-header-item">
                    <div>
                        <h4>#${ticket.ticket_id}</h4>
                        <p>User: <@${ticket.user_id}></p>
                    </div>
                    <span class="ticket-status ${ticket.status}">${ticket.status}</span>
                </div>
                <p class="ticket-time">Created: ${formatDate(ticket.created_at)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load tickets:', error);
    }
}

async function showTicketDetail(ticketId) {
    currentTicket = ticketId;
    
    try {
        const response = await fetch(`${API_BASE}/guilds/${currentGuild}/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const ticket = await response.json();
        
        document.getElementById('ticket-title').textContent = `#${ticket.ticket_id}`;
        document.getElementById('ticket-user').textContent = `User: <@${ticket.user_id}>`;
        
        const transcriptDiv = document.getElementById('ticket-transcript');
        transcriptDiv.innerHTML = `
            <div class="transcript-header">
                <h3>Transcript</h3>
                <p>${formatDate(ticket.created_at)} → ${ticket.closed_at ? formatDate(ticket.closed_at) : 'Still open'}</p>
            </div>
            <div class="messages">
                ${ticket.messages.map(msg => `
                    <div class="message">
                        <strong>${msg.author}</strong>
                        <p>${msg.content}</p>
                        <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('tickets-list').classList.add('hidden');
        document.getElementById('ticket-detail').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load ticket:', error);
    }
}

function closeTicketDetail() {
    currentTicket = null;
    document.getElementById('tickets-list').classList.remove('hidden');
    document.getElementById('ticket-detail').classList.add('hidden');
}

async function closeTicket() {
    if (!currentTicket || !currentGuild) return;
    
    if (!confirm('Close this ticket?')) return;
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/tickets/${currentTicket}/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        closeTicketDetail();
        loadTickets();
    } catch (error) {
        console.error('Failed to close ticket:', error);
    }
}

async function downloadTranscript() {
    if (!currentTicket || !currentGuild) return;
    
    try {
        const response = await fetch(`${API_BASE}/guilds/${currentGuild}/tickets/${currentTicket}/transcript`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${currentTicket}.txt`;
        a.click();
    } catch (error) {
        console.error('Failed to download transcript:', error);
    }
}

// ============= APPLICATIONS =============

async function loadApplications() {
    if (!currentGuild) return;
    
    try {
        const response = await fetch(`${API_BASE}/guilds/${currentGuild}/applications`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const data = await response.json();
        const pending = data.filter(a => a.status === 'pending');
        const approved = data.filter(a => a.status === 'approved');
        const denied = data.filter(a => a.status === 'denied');
        
        document.getElementById('pending-apps').textContent = pending.length;
        document.getElementById('approved-apps').textContent = approved.length;
        document.getElementById('denied-apps').textContent = denied.length;
        
        const list = document.getElementById('apps-list');
        if (pending.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No pending applications</p></div>';
            return;
        }
        
        list.innerHTML = pending.map(app => `
            <div class="app-item" data-id="${app.app_id}">
                <div class="app-header-item">
                    <div>
                        <h4>Application #${app.app_id}</h4>
                        <p>User: <@${app.user_id}></p>
                    </div>
                    <span class="app-status pending">Pending</span>
                </div>
                <p class="app-time">Submitted: ${formatDate(app.submitted_at)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load applications:', error);
    }
}

async function showAppDetail(appId) {
    currentApp = appId;
    
    try {
        const response = await fetch(`${API_BASE}/guilds/${currentGuild}/applications/${appId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const app = await response.json();
        
        document.getElementById('app-user').textContent = `<@${app.user_id}>`;
        document.getElementById('app-submitted').textContent = `Submitted: ${formatDate(app.submitted_at)}`;
        
        const responsesDiv = document.getElementById('app-responses');
        responsesDiv.innerHTML = app.responses.map(r => `
            <div class="response">
                <h4>${r.question}</h4>
                <p>${r.response}</p>
            </div>
        `).join('');
        
        document.getElementById('apps-list').classList.add('hidden');
        document.getElementById('app-detail').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load application:', error);
    }
}

function closeAppDetail() {
    currentApp = null;
    document.getElementById('apps-list').classList.remove('hidden');
    document.getElementById('app-detail').classList.add('hidden');
}

async function approveApp() {
    if (!currentApp || !currentGuild) return;
    
    const feedback = document.getElementById('feedback-input').value;
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/applications/${currentApp}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` },
            body: JSON.stringify({ feedback })
        });
        
        closeAppDetail();
        loadApplications();
    } catch (error) {
        console.error('Failed to approve application:', error);
    }
}

async function denyApp() {
    if (!currentApp || !currentGuild) return;
    
    const feedback = document.getElementById('feedback-input').value;
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/applications/${currentApp}/deny`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` },
            body: JSON.stringify({ feedback })
        });
        
        closeAppDetail();
        loadApplications();
    } catch (error) {
        console.error('Failed to deny application:', error);
    }
}

// ============= SECURITY =============

async function loadSecuritySettings() {
    if (!currentGuild) return;
    
    try {
        // Load security actions
        const secResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/actions`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const actions = await secResponse.json();
        const actionsList = document.getElementById('security-actions');
        
        actionsList.innerHTML = actions.map(action => `
            <div class="security-item">
                <div>
                    <h4>${action.action}</h4>
                    <p>${action.enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                </div>
                <div class="security-details">
                    <p><strong>Punishment:</strong> ${action.punishment}</p>
                    <p><strong>Limit:</strong> ${action.limit_count}</p>
                </div>
            </div>
        `).join('');
        
        // Load raid config
        const raidResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/raid`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const raid = await raidResponse.json();
        document.getElementById('raid-enabled').checked = raid.enabled;
        document.getElementById('raid-threshold').value = raid.join_threshold;
        document.getElementById('raid-window').value = raid.time_window;
        
        // Load account config
        const accountResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/account`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const account = await accountResponse.json();
        document.getElementById('account-enabled').checked = account.enabled;
        document.getElementById('account-age').value = account.min_age_days;
        
        // Load flagged members
        const flagResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/flags`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        const flagged = await flagResponse.json();
        const flaggedDiv = document.getElementById('flagged-members');
        
        if (flagged.length === 0) {
            flaggedDiv.innerHTML = '<p>No flagged members</p>';
            return;
        }
        
        flaggedDiv.innerHTML = flagged.map(member => `
            <div class="flagged-item">
                <div>
                    <p><strong>User:</strong> <@${member.user_id}></p>
                    <p><strong>Reason:</strong> ${member.reason}</p>
                    <p><strong>Flagged:</strong> ${formatDate(member.flagged_at)}</p>
                </div>
                <button class="remove-flag-btn" onclick="removeFlag('${currentGuild}', '${member.user_id}')">Remove</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load security settings:', error);
    }
}

async function saveRaidSettings() {
    if (!currentGuild) return;
    
    const config = {
        enabled: document.getElementById('raid-enabled').checked,
        join_threshold: parseInt(document.getElementById('raid-threshold').value),
        time_window: parseInt(document.getElementById('raid-window').value)
    };
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/security/raid`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        showModal('Success', 'Raid protection settings saved!');
    } catch (error) {
        console.error('Failed to save raid settings:', error);
        showModal('Error', 'Failed to save settings');
    }
}

async function saveAccountSettings() {
    if (!currentGuild) return;
    
    const config = {
        enabled: document.getElementById('account-enabled').checked,
        min_age_days: parseInt(document.getElementById('account-age').value)
    };
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/security/account`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        showModal('Success', 'Account age settings saved!');
    } catch (error) {
        console.error('Failed to save account settings:', error);
        showModal('Error', 'Failed to save settings');
    }
}

async function removeFlag(guildId, userId) {
    if (!confirm('Remove this flag?')) return;
    
    try {
        await fetch(`${API_BASE}/guilds/${guildId}/security/flags/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        
        loadSecuritySettings();
    } catch (error) {
        console.error('Failed to remove flag:', error);
    }
}
