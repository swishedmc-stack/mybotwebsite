const CLIENT_ID = 'YOUR_BOT_CLIENT_ID';
const REDIRECT_URI = `${window.location.origin}/callback`;
const API_BASE = 'http://localhost:5000/api';

let currentUser = null;
let currentGuild = null;
let currentTicket = null;
let currentApp = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupEventListeners();
});

function initAuth() {
    const token = localStorage.getItem('discord_token');
    
    if (token) {
        fetchUserData(token);
    } else {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) exchangeCodeForToken(code);
        else showLoginPage();
    }
}

function showLoginPage() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('server-select-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
}

function showServerSelect() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('server-select-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('server-select-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
}

function discordLogin() {
    const url = `https://discord.com/api/oauth2/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('identify guilds')}`;
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
        
        await loadGuilds(token);
        showServerSelect();
    } catch (error) {
        console.error('User fetch failed:', error);
        localStorage.removeItem('discord_token');
        showLoginPage();
    }
}

async function loadGuilds(token) {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const guilds = await response.json();
        const grid = document.getElementById('servers-grid');
        grid.innerHTML = '';
        
        guilds.forEach(guild => {
            const card = document.createElement('div');
            card.className = 'server-card';
            card.innerHTML = `
                <div class="server-card-banner"></div>
                <div class="server-card-icon">${guild.name.charAt(0).toUpperCase()}</div>
                <div class="server-card-content">
                    <div class="server-card-name">${guild.name}</div>
                    <div class="server-card-members">${guild.member_count || '?'} members</div>
                    <div class="server-card-buttons">
                        <button class="btn btn-primary manage-btn" data-guild="${guild.id}">Manage</button>
                        <button class="btn btn-secondary">Invite</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.manage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentGuild = e.target.dataset.guild;
                loadGuildDashboard();
            });
        });
    } catch (error) {
        console.error('Failed to load guilds:', error);
    }
}

async function loadGuildDashboard() {
    const guildName = document.querySelector(`[data-guild="${currentGuild}"]`)?.parentElement?.querySelector('.server-card-name')?.textContent || 'Server';
    document.getElementById('current-guild-name').textContent = guildName;
    
    showDashboard();
    loadTickets();
    loadApplications();
    loadSecuritySettings();
}

function setupEventListeners() {
    document.getElementById('discord-login')?.addEventListener('click', discordLogin);
    
    document.getElementById('logout-btn-top')?.addEventListener('click', logout);
    document.getElementById('logout-btn-dashboard')?.addEventListener('click', logout);
    
    document.getElementById('back-to-servers')?.addEventListener('click', () => {
        currentGuild = null;
        showServerSelect();
    });

    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const section = e.currentTarget.dataset.section;
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
            
            if (section === 'tickets') loadTickets();
            if (section === 'applications') loadApplications();
            if (section === 'security') loadSecuritySettings();
        });
    });

    document.getElementById('tickets-list')?.addEventListener('click', (e) => {
        const item = e.target.closest('.ticket-item');
        if (item) showTicketDetail(item.dataset.id);
    });

    document.getElementById('applications-list')?.addEventListener('click', (e) => {
        const item = e.target.closest('.app-item');
        if (item) showAppDetail(item.dataset.id);
    });

    document.getElementById('close-ticket-detail')?.addEventListener('click', closeTicketDetail);
    document.getElementById('close-app-detail')?.addEventListener('click', closeAppDetail);
    document.getElementById('download-btn')?.addEventListener('click', downloadTranscript);
    document.getElementById('close-btn')?.addEventListener('click', closeTicket);
    document.getElementById('approve-app-btn')?.addEventListener('click', approveApp);
    document.getElementById('deny-app-btn')?.addEventListener('click', denyApp);
    document.getElementById('save-raid-btn')?.addEventListener('click', saveRaidSettings);
    document.getElementById('save-account-btn')?.addEventListener('click', saveAccountSettings);
}

function logout() {
    localStorage.removeItem('discord_token');
    currentUser = null;
    currentGuild = null;
    showLoginPage();
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
        const open = data.filter(t => t.status === 'open').length;
        const closed = data.filter(t => t.status === 'closed').length;
        
        document.getElementById('open-count').textContent = open;
        document.getElementById('closed-count').textContent = closed;
        
        const list = document.getElementById('tickets-list');
        list.innerHTML = '';
        
        if (open === 0) {
            list.innerHTML = '<div class="empty-state">No open tickets</div>';
            return;
        }
        
        data.filter(t => t.status === 'open').forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'ticket-item';
            item.dataset.id = ticket.ticket_id;
            item.innerHTML = `
                <h4>#${ticket.ticket_id}</h4>
                <p>User: ${ticket.user_id}</p>
                <p>Created: ${formatDate(ticket.created_at)}</p>
            `;
            list.appendChild(item);
        });
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
        
        document.getElementById('ticket-id').textContent = `#${ticket.ticket_id}`;
        
        const content = document.getElementById('ticket-content');
        content.innerHTML = `
            <div class="messages">
                ${ticket.messages.map(msg => `
                    <div class="message">
                        <strong>${msg.author}</strong>
                        <p>${msg.content}</p>
                        <small>${new Date(msg.timestamp * 1000).toLocaleTimeString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('tickets-list').style.display = 'none';
        document.getElementById('ticket-detail').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load ticket:', error);
    }
}

function closeTicketDetail() {
    currentTicket = null;
    document.getElementById('tickets-list').style.display = 'flex';
    document.getElementById('ticket-detail').classList.add('hidden');
}

async function closeTicket() {
    if (!currentTicket || !currentGuild || !confirm('Close this ticket?')) return;
    
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
        URL.revokeObjectURL(url);
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
        const pending = data.filter(a => a.status === 'pending').length;
        const approved = data.filter(a => a.status === 'approved').length;
        const denied = data.filter(a => a.status === 'denied').length;
        
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('approved-count').textContent = approved;
        document.getElementById('denied-count').textContent = denied;
        
        const list = document.getElementById('applications-list');
        list.innerHTML = '';
        
        if (pending === 0) {
            list.innerHTML = '<div class="empty-state">No pending applications</div>';
            return;
        }
        
        data.filter(a => a.status === 'pending').forEach(app => {
            const item = document.createElement('div');
            item.className = 'app-item';
            item.dataset.id = app.app_id;
            item.innerHTML = `
                <h4>Application #${app.app_id}</h4>
                <p>User: ${app.user_id}</p>
                <p>Submitted: ${formatDate(app.submitted_at)}</p>
            `;
            list.appendChild(item);
        });
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
        
        document.getElementById('app-user-name').textContent = `User: ${app.user_id}`;
        
        const content = document.getElementById('app-content');
        content.innerHTML = app.responses.map(r => `
            <div class="response">
                <h4>${r.question}</h4>
                <p>${r.response}</p>
            </div>
        `).join('');
        
        document.getElementById('applications-list').style.display = 'none';
        document.getElementById('app-detail').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load application:', error);
    }
}

function closeAppDetail() {
    currentApp = null;
    document.getElementById('applications-list').style.display = 'flex';
    document.getElementById('app-detail').classList.add('hidden');
}

async function approveApp() {
    if (!currentApp || !currentGuild) return;
    
    const feedback = document.getElementById('app-feedback').value;
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/applications/${currentApp}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`,
                'Content-Type': 'application/json'
            },
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
    
    const feedback = document.getElementById('app-feedback').value;
    
    try {
        await fetch(`${API_BASE}/guilds/${currentGuild}/applications/${currentApp}/deny`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`,
                'Content-Type': 'application/json'
            },
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
        const raidResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/raid`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        const raid = await raidResponse.json();
        document.getElementById('raid-toggle').checked = raid.enabled;
        document.getElementById('raid-threshold').value = raid.join_threshold;
        document.getElementById('raid-window').value = raid.time_window;
        
        const accountResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/account`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        const account = await accountResponse.json();
        document.getElementById('account-toggle').checked = account.enabled;
        document.getElementById('account-days').value = account.min_age_days;
        
        const flagResponse = await fetch(`${API_BASE}/guilds/${currentGuild}/security/flags`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('discord_token')}` }
        });
        const flagged = await flagResponse.json();
        const list = document.getElementById('flagged-list');
        list.innerHTML = '';
        
        if (flagged.length === 0) {
            list.innerHTML = '<div class="empty-state">No flagged members</div>';
        } else {
            flagged.forEach(member => {
                const item = document.createElement('div');
                item.className = 'flagged-item';
                item.innerHTML = `
                    <div>
                        <p><strong>User:</strong> ${member.user_id}</p>
                        <p><strong>Reason:</strong> ${member.reason}</p>
                        <p><strong>Flagged:</strong> ${formatDate(member.flagged_at)}</p>
                    </div>
                    <button class="btn btn-danger" onclick="removeFlag('${currentGuild}', '${member.user_id}')">Remove</button>
                `;
                list.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Failed to load security settings:', error);
    }
}

async function saveRaidSettings() {
    if (!currentGuild) return;
    
    const config = {
        enabled: document.getElementById('raid-toggle').checked,
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
        alert('Raid settings saved!');
    } catch (error) {
        console.error('Failed to save raid settings:', error);
    }
}

async function saveAccountSettings() {
    if (!currentGuild) return;
    
    const config = {
        enabled: document.getElementById('account-toggle').checked,
        min_age_days: parseInt(document.getElementById('account-days').value)
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
        alert('Account settings saved!');
    } catch (error) {
        console.error('Failed to save account settings:', error);
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
