const loginScreen = document.getElementById("loginScreen");
const serverScreen = document.getElementById("serverScreen");
const dashboardApp = document.getElementById("dashboardApp");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const serverOptions = document.querySelectorAll(".server-option:not(.locked)");
const selectedServer = document.getElementById("selectedServer");

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("pageTitle");

const toast = document.getElementById("toast");

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 2200);
}

loginBtn.addEventListener("click", () => {
    loginScreen.classList.add("hidden");
    serverScreen.classList.remove("hidden");
});

serverOptions.forEach(server => {
    server.addEventListener("click", () => {
        const serverName = server.dataset.server;

        selectedServer.textContent = serverName;

        serverScreen.classList.add("hidden");
        dashboardApp.classList.remove("hidden");

        showToast(`Loaded ${serverName}`);
    });
});

logoutBtn.addEventListener("click", () => {
    dashboardApp.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    showToast("Logged out");
});

function openPage(pageId) {
    pages.forEach(page => page.classList.remove("active-page"));
    navItems.forEach(item => item.classList.remove("active"));

    const targetPage = document.getElementById(pageId);
    const targetNav = document.querySelector(`[data-page="${pageId}"]`);

    if (targetPage) {
        targetPage.classList.add("active-page");
    }

    if (targetNav) {
        targetNav.classList.add("active");
    }

    pageTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
}

navItems.forEach(item => {
    item.addEventListener("click", () => {
        openPage(item.dataset.page);
    });
});

document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.jump);
    });
});

/* Ticket Preview */

const ticketTitle = document.getElementById("ticketTitle");
const ticketDesc = document.getElementById("ticketDesc");
const ticketButton = document.getElementById("ticketButton");

const previewTicketTitle = document.getElementById("previewTicketTitle");
const previewTicketDesc = document.getElementById("previewTicketDesc");
const previewTicketButton = document.getElementById("previewTicketButton");

function updateTicketPreview() {
    previewTicketTitle.textContent = ticketTitle.value || "Support Tickets";
    previewTicketDesc.textContent = ticketDesc.value || "Need help? Click the button below to open a ticket.";
    previewTicketButton.textContent = ticketButton.value || "Create Ticket";
}

[ticketTitle, ticketDesc, ticketButton].forEach(input => {
    input.addEventListener("input", updateTicketPreview);
});

/* Application Questions */

const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionList = document.getElementById("questionList");

addQuestionBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "question-row";

    row.innerHTML = `
        <input placeholder="Enter application question" />
        <button type="button">✕</button>
    `;

    questionList.appendChild(row);
});

questionList.addEventListener("click", event => {
    if (event.target.tagName === "BUTTON") {
        event.target.closest(".question-row").remove();
    }
});

/* Save Buttons */

document.getElementById("saveTicketBtn").addEventListener("click", () => {
    showToast("Ticket panel saved");
});

document.getElementById("saveAppBtn").addEventListener("click", () => {
    showToast("Application panel saved");
});

document.getElementById("saveSecurityBtn").addEventListener("click", () => {
    showToast("Security settings saved");
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    showToast("Settings saved");
});

/* Application Approve / Deny Demo */

document.querySelectorAll(".approve-btn").forEach(button => {
    button.addEventListener("click", () => {
        button.closest(".app-row").remove();
        showToast("Application approved");
    });
});

document.querySelectorAll(".deny-btn").forEach(button => {
    button.addEventListener("click", () => {
        button.closest(".app-row").remove();
        showToast("Application denied");
    });
});
