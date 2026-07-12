const SECTIONS = ['experiments', 'blog', 'talks', 'community'];
const ALL_TABS = [...SECTIONS, 'about'];

let sectionData = {};
let activeTab = 'experiments';
let activeFilter = null;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function handleAvatarInteraction(target) {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
    target.style.transform = 'scale(0.95)';
    setTimeout(() => {
        target.style.transform = '';
    }, 150);
}

async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }
    return response.json();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    if (!month) return year;
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function createCardHTML(item) {
    const dateMarkup = item.date ? `<time class="item-date" datetime="${item.date}">${formatDate(item.date)}</time>` : '';
    const tagString = item.tags.join('|');

    return `
        <article class="item" data-tags="${tagString}">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                <div class="item-header">
                    <h3>${item.title}</h3>
                    ${dateMarkup}
                </div>
                <p>${item.description}</p>
                <div class="tags">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </a>
        </article>
    `;
}

function renderFeatured(featured) {
    const container = document.getElementById('featured');
    container.innerHTML = `
        <p class="section-label">Featured</p>
        <article class="featured-card">
            <a href="${featured.link}" target="_blank" rel="noopener noreferrer">
                <h2>${featured.title}</h2>
                <p>${featured.description}</p>
                <div class="tags">
                    ${featured.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </a>
        </article>
    `;
}

function renderNow(now) {
    const container = document.getElementById('now');
    container.innerHTML = `
        <p class="section-label">Now <span class="now-updated">(updated ${now.updated})</span></p>
        <ul class="now-list">
            ${now.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
}

function renderAbout(about) {
    const container = document.getElementById('about');
    container.innerHTML = `
        <div class="about-content">
            <p class="about-bio">${about.bio}</p>
            <div class="skills-grid">
                ${about.skills.map(group => `
                    <div class="skill-group">
                        <h3>${group.category}</h3>
                        <ul>
                            ${group.items.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSection(sectionName) {
    const sectionElement = document.getElementById(sectionName);
    const items = sectionData[sectionName] || [];

    if (items.length === 0) {
        sectionElement.innerHTML = '<p class="empty-state">No items to show right now.</p>';
        return;
    }

    sectionElement.innerHTML = items.map(createCardHTML).join('');
    applyFilter();
}

function collectTags() {
    const tags = new Set();
    SECTIONS.forEach(section => {
        (sectionData[section] || []).forEach(item => {
            item.tags.forEach(tag => tags.add(tag));
        });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function renderFilterTags() {
    const filterTags = document.getElementById('filter-tags');
    const tags = collectTags();

    filterTags.innerHTML = `
        <button class="filter-tag active" data-tag="" type="button" aria-pressed="true">All</button>
        ${tags.map(tag => `<button class="filter-tag" data-tag="${tag}" type="button" aria-pressed="false">${tag}</button>`).join('')}
    `;

    filterTags.querySelectorAll('.filter-tag').forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.tag || null;
            filterTags.querySelectorAll('.filter-tag').forEach(btn => {
                const isActive = btn === button;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });
            applyFilter();
        });
    });
}

function applyFilter() {
    if (activeTab === 'about') return;

    const sectionElement = document.getElementById(activeTab);
    const items = sectionElement.querySelectorAll('.item');

    items.forEach(item => {
        if (!activeFilter) {
            item.hidden = false;
            return;
        }
        const itemTags = (item.dataset.tags || '').split('|');
        item.hidden = !itemTags.includes(activeFilter);
    });

    const visibleCount = Array.from(items).filter(item => !item.hidden).length;
    let emptyState = sectionElement.querySelector('.filter-empty');
    if (visibleCount === 0) {
        if (!emptyState) {
            emptyState = document.createElement('p');
            emptyState.className = 'empty-state filter-empty';
            emptyState.textContent = 'No items match this filter.';
            sectionElement.appendChild(emptyState);
        }
    } else if (emptyState) {
        emptyState.remove();
    }
}

function setFilterBarVisibility() {
    const filterBar = document.getElementById('filter-bar');
    filterBar.hidden = activeTab === 'about';
}

function openTab(tabName, tabButton = null) {
    if (!ALL_TABS.includes(tabName)) return;

    activeTab = tabName;

    ALL_TABS.forEach(name => {
        const panel = document.getElementById(name);
        const tab = document.getElementById(`tab-${name}`);
        const isActive = name === tabName;

        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;

        if (tab) {
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        }
    });

    if (tabButton) {
        tabButton.focus();
    }

    setFilterBarVisibility();
    applyFilter();
    history.pushState(null, '', `#${tabName}`);
}

function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash && ALL_TABS.includes(hash)) {
        const tabButton = document.getElementById(`tab-${hash}`);
        if (tabButton) {
            openTab(hash, tabButton);
        }
    }
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => openTab(tab.dataset.tab, tab));

        tab.addEventListener('keydown', event => {
            const tabs = Array.from(document.querySelectorAll('.tab'));
            const index = tabs.indexOf(event.currentTarget);
            let nextIndex = index;

            if (event.key === 'ArrowRight') {
                nextIndex = (index + 1) % tabs.length;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = tabs.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            openTab(tabs[nextIndex].dataset.tab, tabs[nextIndex]);
        });
    });
}

function showStaticIntro() {
    document.getElementById('typewriter').hidden = true;
    document.getElementById('intro-static').hidden = false;
}

function startTypewriter() {
    if (prefersReducedMotion() || typeof Typewriter === 'undefined') {
        showStaticIntro();
        return;
    }

    const stringSplitter = string => {
        const splitter = new GraphemeSplitter();
        return splitter.splitGraphemes(string);
    };

    const typewriter = new Typewriter('#typewriter', {
        loop: false,
        delay: 20,
        cursor: '▋',
        stringSplitter
    });

    typewriter
        .typeString('Hey! 👋<br>')
        .pauseFor(150)
        .typeString("I'm <span class='highlight'>Alessandro</span> aka <span class='highlight'>appersiano</span>")
        .pauseFor(150)
        .typeString(' and I am a <br>')
        .pauseFor(100)
        .typeString('<span class="highlight">Creative Software and Product Engineer</span>')
        .typeString(' based in Milan 🇮🇹.')
        .callFunction(() => {
            const additionalText = document.createElement('div');
            additionalText.className = 'fade-in';
            additionalText.innerHTML = `
                <br><br>
                I love to create digital products and experiment with technologies.
                <br>
                Currently building <span class="highlight">Stage Timer</span>, a fullscreen countdown app for speakers and live events.
            `;
            document.getElementById('typewriter').appendChild(additionalText);
        })
        .start();
}

function setupTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    html.setAttribute('data-theme', initialTheme);
    themeToggle.setAttribute('aria-label', initialTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.setAttribute('aria-label', newTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
}

function setupAvatar() {
    const avatar = document.querySelector('.avatar');
    avatar.addEventListener('click', event => {
        event.preventDefault();
        handleAvatarInteraction(event.currentTarget);
    });
    avatar.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAvatarInteraction(event.currentTarget);
        }
    });
}

async function initializeSections() {
    try {
        const [featured, now, about, ...sections] = await Promise.all([
            loadJSON('data/featured.json'),
            loadJSON('data/now.json'),
            loadJSON('data/about.json'),
            ...SECTIONS.map(section => loadJSON(`data/${section}.json`))
        ]);

        SECTIONS.forEach((section, index) => {
            sectionData[section] = sections[index].items;
            renderSection(section);
        });

        renderFeatured(featured);
        renderNow(now);
        renderAbout(about);
        renderFilterTags();
        setFilterBarVisibility();
    } catch (error) {
        console.error('Error loading site data:', error);
        document.querySelector('.sections').insertAdjacentHTML(
            'beforeend',
            '<p class="empty-state">Unable to load content. Please try again later.</p>'
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    setupTheme();
    setupAvatar();
    setupTabs();
    startTypewriter();
    initializeSections();
    handleHashNavigation();
});

window.addEventListener('hashchange', handleHashNavigation);
