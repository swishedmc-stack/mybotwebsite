let currentGuild = null;

document.addEventListener("DOMContentLoaded", () => {
    showLoginPage();
    setupEventListeners();
});

function showLoginPage() {
    document.getElementById("login-container").classList.remove("hidden");
    document.getElementById("server-select-container").classList.add("hidden");
    document.getElementById("dashboard-container").classList.add("hidden");
}

function showServerSelect() {
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("server-select-container").classList.remove("hidden");
    document.getElementById("dashboard-container").classList.add("hidden");

    loadDemoServers();
}

function showDashboard() {
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("server-select-container").classList.add("hidden");
    document.getElementById("dashboard-container").classList.remove("hidden");
}

function setupEventListeners() {
    document.getElementById("discord-login")?.addEventListener("click", () => {
        showServerSelect();
    });

    document.getElementById("logout-btn-top")?.addEventListener("click", showLoginPage);
    document.getElementById("logout-btn-dashboard")?.addEventListener("click", showLoginPage);

    document.getElementById("back-to-servers")?.addEventListener("click", showServerSelect);

    document.querySelectorAll(".nav-link").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".content-section").forEach(section => {
                section.classList.remove("active");
            });

            document.getElementById(`${btn.dataset.section}-section`).classList.add("active");
        });
    });

    document.getElementById("save-raid-btn")?.addEventListener("click", () => {
        alert("Raid settings saved!");
    });

    document.getElementById("save-account-btn")?.addEventListener("click", () => {
        alert("Account settings saved!");
    });
}

function loadDemoServers() {
    const grid = document.getElementById("servers-grid");

    grid.innerHTML = `
        <div class="server-card">
            <div class="server-card-banner"></div>
            <div class="server-card-icon">R</div>
            <div class="server-card-content">
                <div class="server-card-name">Random Code Server</div>
                <div class="server-card-members">Owner Access</div>
                <div class="server-card-buttons">
                    <button class="btn btn-primary manage-btn" data-name="Random Code Server">Manage</button>
                    <button class="btn btn-secondary">Invite</button>
                </div>
            </div>
        </div>

        <div class="server-card">
            <div class="server-card-banner"></div>
            <div class="server-card-icon">S</div>
            <div class="server-card-content">
                <div class="server-card-name">Support Server</div>
                <div class="server-card-members">Administrator</div>
                <div class="server-card-buttons">
                    <button class="btn btn-primary manage-btn" data-name="Support Server">Manage</button>
                    <button class="btn btn-secondary">Invite</button>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll(".manage-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentGuild = btn.dataset.name;
            document.getElementById("current-guild-name").textContent = currentGuild;
            loadDemoDashboard();
            showDashboard();
        });
    });
}

function loadDemoDashboard() {
    document.getElementById("open-count").textContent = "3";
    document.getElementById("closed-count").textContent = "12";
    document.getElementById("pending-count").textContent = "2";
    document.getElementById("approved-count").textContent = "8";
    document.getElementById("denied-count").textContent = "4";

    document.getElementById("tickets-list").innerHTML = `
        <div class="ticket-item">
            <h4>#1 Support Ticket</h4>
            <p>User: David</p>
            <p>Created: Today</p>
        </div>

        <div class="ticket-item">
            <h4>#2 Billing Question</h4>
            <p>User: TestUser</p>
            <p>Created: Yesterday</p>
        </div>
    `;

    document.getElementById("applications-list").innerHTML = `
        <div class="app-item">
            <h4>Application #1</h4>
            <p>User: David</p>
            <p>Status: Pending</p>
        </div>

        <div class="app-item">
            <h4>Application #2</h4>
            <p>User: TestUser</p>
            <p>Status: Pending</p>
        </div>
    `;

    document.getElementById("flagged-list").innerHTML = `
        <div class="flagged-item">
            <div>
                <p><strong>User:</strong> SuspiciousUser</p>
                <p><strong>Reason:</strong> New account joined too fast</p>
                <p><strong>Flagged:</strong> Today</p>
            </div>
            <button class="btn btn-danger">Remove</button>
        </div>
    `;
}
