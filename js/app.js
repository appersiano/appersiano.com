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
    return date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
}

function renderOffers(offers) {
    const container = document.getElementById('offers');
    container.innerHTML = offers.map(offer => `
        <article class="offer${offer.featured ? ' is-featured' : ''} reveal">
            ${offer.featured ? '<p class="offer-badge">Più richiesto</p>' : ''}
            <div class="offer-top">
                <h3 class="offer-name">${offer.name}</h3>
                <p class="offer-duration">${offer.duration}</p>
            </div>
            <p class="offer-summary">${offer.summary}</p>
            <ul class="offer-includes">
                ${offer.includes.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <p class="offer-fit">${offer.fit}</p>
        </article>
    `).join('');
}

function renderCases(cases) {
    const container = document.getElementById('cases');
    container.innerHTML = cases.map(item => `
        <article class="case reveal">
            <div>
                <h3 class="case-title">${item.title}</h3>
                <p class="case-client">${item.client}</p>
            </div>
            <div class="case-body">
                <p><span class="case-label">Problema</span>${item.problem}</p>
                <p><span class="case-label">Lavoro</span>${item.work}</p>
                <p><span class="case-label">Risultato</span>${item.result}</p>
                <a class="case-link" href="${item.link}" target="_blank" rel="noopener noreferrer">${item.linkLabel}</a>
            </div>
        </article>
    `).join('');
}

function renderNow(now) {
    document.getElementById('now-updated').textContent = `Aggiornato ${now.updated}`;
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

async function initialize() {
    document.getElementById('year').textContent = String(new Date().getFullYear());

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
        offers.innerHTML = '<p class="offer-summary">Contenuti temporaneamente non disponibili. Scrivimi su LinkedIn.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initialize);
