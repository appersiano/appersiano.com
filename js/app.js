/* Swap this to Cal.com / Calendly when available — single source for every CTA. */
const BOOKING_URL = 'https://linkedin.com/in/alessandro-persiano';

async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }
    return response.json();
}

function formatMonthYear(dateStr) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    if (!month) return year;
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function bookingUrl(intent) {
    if (!intent) return BOOKING_URL;
    return `${BOOKING_URL}?intent=${encodeURIComponent(intent)}`;
}

function wireBookingLinks(root = document) {
    root.querySelectorAll('[data-book-call]').forEach(link => {
        const intent = link.getAttribute('data-book-intent') || '';
        link.href = bookingUrl(intent);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    });
}

function renderOffers(offers) {
    const container = document.getElementById('offers');
    container.innerHTML = offers.map(offer => {
        const intent = offer.name.toLowerCase().replace(/\s+/g, '-');
        return `
        <article class="offer${offer.featured ? ' is-featured' : ''} reveal">
            ${offer.featured ? '<p class="offer-badge">Most requested</p>' : ''}
            <div class="offer-top">
                <h3 class="offer-name">${offer.name}</h3>
                <p class="offer-duration">${offer.duration}</p>
            </div>
            <p class="offer-summary">${offer.summary}</p>
            <ul class="offer-includes">
                ${offer.includes.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <p class="offer-fit">${offer.fit}</p>
            <a class="btn btn-primary offer-cta" data-book-call data-book-intent="${intent}" href="#">Request ${offer.name}</a>
        </article>
    `;
    }).join('');

    wireBookingLinks(container);
}

function renderCases(cases) {
    const container = document.getElementById('cases-list');
    container.innerHTML = cases.map(item => `
        <article class="case reveal">
            <div>
                <h3 class="case-title">${item.title}</h3>
                <p class="case-client">${item.client}</p>
            </div>
            <div class="case-body">
                <p><span class="case-label">Problem</span>${item.problem}</p>
                <p><span class="case-label">Work</span>${item.work}</p>
                <p><span class="case-label">Result</span>${item.result}</p>
                <a class="case-link" href="${item.link}" target="_blank" rel="noopener noreferrer">${item.linkLabel}</a>
            </div>
        </article>
    `).join('');
}

function renderNow(now) {
    document.getElementById('now-updated').textContent = `Updated ${now.updated}`;
    document.getElementById('now-list').innerHTML = now.items
        .map(item => `<li class="reveal">${item}</li>`)
        .join('');
}

function renderSelected(selected) {
    document.getElementById('community-line').textContent = selected.community;

    document.getElementById('talks-list').innerHTML = selected.talks.map(talk => `
        <li class="reveal">
            <a href="${talk.link}" target="_blank" rel="noopener noreferrer">
                ${talk.title}
                <span class="selected-meta">${talk.venue} · ${formatMonthYear(talk.date)}</span>
            </a>
        </li>
    `).join('');

    document.getElementById('writing-list').innerHTML = selected.writing.map(post => `
        <li class="reveal">
            <a href="${post.link}" target="_blank" rel="noopener noreferrer">
                ${post.title}
                <span class="selected-meta">${formatMonthYear(post.date)}</span>
            </a>
        </li>
    `).join('');
}

function setupReveal() {
    const nodes = document.querySelectorAll('.reveal, .section-intro, .method-steps li, .closing h2, .closing > p, .closing .cta-group');
    nodes.forEach(node => node.classList.add('reveal'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        nodes.forEach(node => node.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
}

function setupTheme() {
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    const labelFor = theme => (theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

    const applyTheme = theme => {
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            /* ignore quota / private mode */
        }
        toggle.setAttribute('aria-label', labelFor(theme));
        toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    };

    const current = root.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'dark' : 'light');

    toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });
}

async function initialize() {
    document.getElementById('year').textContent = String(new Date().getFullYear());
    setupTheme();
    wireBookingLinks();

    try {
        const [offers, cases, now, selected] = await Promise.all([
            loadJSON('data/offers.json'),
            loadJSON('data/cases.json'),
            loadJSON('data/now.json'),
            loadJSON('data/selected.json')
        ]);

        renderOffers(offers.items);
        renderCases(cases.items);
        renderNow(now);
        renderSelected(selected);
        setupReveal();
    } catch (error) {
        console.error('Error loading site data:', error);
        const offers = document.getElementById('offers');
        offers.innerHTML = `
            <p class="offer-summary">Content temporarily unavailable.</p>
            <a class="btn btn-primary" data-book-call href="#">Book a call</a>
        `;
        wireBookingLinks(offers);
    }
}

document.addEventListener('DOMContentLoaded', initialize);
