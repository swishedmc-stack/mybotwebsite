const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');

function openPage(pageId) {
    pages.forEach(page => page.classList.remove('active-page'));
    navItems.forEach(item => item.classList.remove('active'));

    const page = document.getElementById(pageId);
    const nav = document.querySelector(`[data-page="${pageId}"]`);

    if (page) page.classList.add('active-page');
    if (nav) nav.classList.add('active');

    pageTitle.textContent =
        pageId.charAt(0).toUpperCase() + pageId.slice(1);
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        openPage(item.dataset.page);
    });
});

const addQuestionButton = document.getElementById('addQuestion');
const questionList = document.getElementById('questionList');

if (addQuestionButton) {
    addQuestionButton.addEventListener('click', () => {
        const row = document.createElement('div');

        row.className = 'question-row';

        row.innerHTML = `
            <input placeholder="Enter application question" />
            <button type="button">✕</button>
        `;

        questionList.appendChild(row);
    });
}

if (questionList) {
    questionList.addEventListener('click', event => {
        if (event.target.tagName === 'BUTTON') {
            event.target.closest('.question-row').remove();
        }
    });
}
