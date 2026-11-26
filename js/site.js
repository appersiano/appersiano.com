import { animate, stagger, scroll, inView } from 'https://cdn.jsdelivr.net/npm/motion@14.14.0/+esm';
import { createField } from './field.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SECTIONS = ['experiments', 'blog', 'talks', 'community'];

const field = createField(document.getElementById('field'));

function setupTheme() {
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');
    const icon = toggle.querySelector('i');

    const apply = theme => {
        root.setAttribute('data-theme', theme);
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        try {
            localStorage.setItem('theme', theme);
        } catch (e) { /* ignore */ }
        field.readColors();
        field.resize();
    };

    apply(root.getAttribute('data-theme') || 'dark');

    toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
        if (!prefersReduced) {
            animate(toggle, { rotate: [0, 180] }, { type: 'spring', stiffness: 260, damping: 16 });
        }
    });
}

function setupTopbar() {
    const topbar = document.querySelector('.topbar');
    const onScroll = () => {
        topbar.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function setupMagnetic() {
    if (prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('pointermove', e => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            animate(el, { x: x * 0.28, y: y * 0.28 }, { type: 'spring', stiffness: 320, damping: 22 });
        });

        el.addEventListener('pointerleave', () => {
            animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 220, damping: 18 });
        });
    });
}

function setupHeroIntro() {
    const nucleus = document.querySelector('.nucleus');
    const copy = document.querySelector('.stage-copy');
    const cue = document.querySelector('.scroll-cue');
    const hint = document.querySelector('.hint');

    if (prefersReduced) return;

    animate(
        nucleus,
        { opacity: [0, 1], scale: [0.7, 1] },
        { type: 'spring', stiffness: 160, damping: 16 }
    );

    animate(
        copy.children,
        { opacity: [0, 1], y: [28, 0] },
        { delay: stagger(0.08, { start: 0.25 }), duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    );

    animate(cue, { opacity: [0, 1] }, { delay: 0.8, duration: 0.6 });
    animate(hint, { opacity: [0, 0.75] }, { delay: 1, duration: 0.6 });
}

function setupNucleus() {
    const nucleus = document.getElementById('nucleus');
    if (!nucleus) return;

    nucleus.addEventListener('click', () => {
        field.burst(1.4);
        if ('vibrate' in navigator) navigator.vibrate(30);

        if (!prefersReduced) {
            animate(
                nucleus,
                { scale: [1, 0.92, 1.06, 1] },
                { type: 'spring', stiffness: 280, damping: 12 }
            );
        }
    });

    nucleus.addEventListener('pointerenter', () => field.burst(0.35));
}

function setupScrollEffects() {
    const fill = document.querySelector('.scroll-meter-fill');
    const stage = document.getElementById('stage');
    const cue = document.querySelector('.scroll-cue');
    const hint = document.querySelector('.hint');

    scroll(progress => {
        if (fill) fill.style.transform = `scaleX(${progress})`;
    });

    if (!prefersReduced && stage) {
        scroll(
            animate(stage, { opacity: [1, 0.25] }, { ease: 'linear' }),
            { target: stage, offset: ['start start', 'end start'] }
        );
    }

    const fadeChrome = () => {
        const past = window.scrollY > window.innerHeight * 0.55;
        if (cue) cue.style.opacity = past ? '0' : '1';
        if (hint) hint.style.opacity = past ? '0' : '0.75';
        if (cue) cue.style.pointerEvents = past ? 'none' : 'auto';
    };
    fadeChrome();
    window.addEventListener('scroll', fadeChrome, { passive: true });
}

async function loadSectionData(section) {
    try {
        const response = await fetch(`data/${section}.json`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        return [];
    }
}

function itemTemplate(item, index, section) {
    const tags = (item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
    return `
        <button class="item" type="button"
            data-section="${section}"
            data-index="${index}"
            data-title="${escapeAttr(item.title)}"
            data-description="${escapeAttr(item.description)}"
            data-link="${escapeAttr(item.link)}"
            data-tags="${escapeAttr((item.tags || []).join('|'))}">
            <p class="item-index">${String(index + 1).padStart(2, '0')} / ${section}</p>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="tags">${tags}</div>
        </button>
    `;
}

function escapeAttr(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function initializePanels() {
    for (const section of SECTIONS) {
        const items = await loadSectionData(section);
        const panel = document.getElementById(section);
        panel.innerHTML = items.map((item, i) => itemTemplate(item, i, section)).join('');
    }
}

function moveTabInk(tab, instant = false) {
    const tabs = document.querySelector('.tabs');
    const ink = document.querySelector('.tab-ink');
    if (!tabs || !ink || !tab) return;

    const tabsRect = tabs.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - tabsRect.left + tabs.scrollLeft;
    const width = tabRect.width;

    if (prefersReduced || instant) {
        ink.style.width = `${width}px`;
        ink.style.transform = `translateX(${left}px)`;
        return;
    }

    animate(
        ink,
        { width, x: left },
        { type: 'spring', stiffness: 380, damping: 32 }
    );
}

function openTab(tabName, { push = true } = {}) {
    const nextTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (!nextTab) return;

    document.querySelectorAll('.tab').forEach(tab => {
        const active = tab.dataset.tab === tabName;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    SECTIONS.forEach(id => {
        const panel = document.getElementById(id);
        const active = id === tabName;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
    });

    moveTabInk(nextTab);
    // Next frame so the newly shown panel is measurable/animatable
    requestAnimationFrame(() => animatePanelItems(tabName));

    if (push) history.pushState(null, '', `#${tabName}`);
}

function animatePanelItems(sectionId) {
    const items = [...document.querySelectorAll(`#${sectionId} .item`)];
    if (!items.length) return;

    if (prefersReduced) {
        items.forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'none';
        });
        return;
    }

    animate(
        items,
        { opacity: [0, 1], y: [18, 0] },
        { delay: stagger(0.05), duration: 0.55, ease: [0.22, 1, 0.36, 1] }
    );
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => openTab(tab.dataset.tab));
    });

    const hash = window.location.hash.slice(1);
    const initial = SECTIONS.includes(hash) ? hash : 'experiments';
    openTab(initial, { push: false });

    window.addEventListener('hashchange', () => {
        const next = window.location.hash.slice(1);
        if (SECTIONS.includes(next)) openTab(next, { push: false });
    });

    window.addEventListener('resize', () => {
        const active = document.querySelector('.tab.active');
        if (active) moveTabInk(active, true);
    });
}

function setupDetail() {
    const detail = document.getElementById('detail');
    const card = detail.querySelector('.detail-card');
    const backdrop = detail.querySelector('.detail-backdrop');
    const closeBtn = detail.querySelector('.detail-close');
    const title = detail.querySelector('.detail-title');
    const body = detail.querySelector('.detail-body');
    const kicker = detail.querySelector('.detail-kicker');
    const tags = detail.querySelector('.detail-tags');
    const link = detail.querySelector('.detail-link');

    let openFrom = null;

    async function openDetail(btn) {
        openFrom = btn;
        kicker.textContent = `${btn.dataset.section} · ${String(Number(btn.dataset.index) + 1).padStart(2, '0')}`;
        title.textContent = btn.dataset.title;
        body.textContent = btn.dataset.description;
        link.href = btn.dataset.link;
        tags.innerHTML = (btn.dataset.tags || '')
            .split('|')
            .filter(Boolean)
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('');

        detail.hidden = false;
        document.body.style.overflow = 'hidden';

        if (prefersReduced) return;

        const from = btn.getBoundingClientRect();
        const to = card.getBoundingClientRect();

        animate(
            backdrop,
            { opacity: [0, 1] },
            { duration: 0.25 }
        );

        animate(
            card,
            {
                opacity: [0, 1],
                y: [Math.max(-40, from.top - to.top) * 0.2, 0],
                scale: [0.92, 1]
            },
            { type: 'spring', stiffness: 280, damping: 24 }
        );
    }

    async function closeDetail() {
        if (detail.hidden) return;

        if (!prefersReduced) {
            await animate(
                card,
                { opacity: 0, scale: 0.96, y: 12 },
                { duration: 0.22 }
            );
            animate(backdrop, { opacity: 0 }, { duration: 0.2 });
        }

        detail.hidden = true;
        document.body.style.overflow = '';
        if (openFrom) openFrom.focus();
        openFrom = null;
    }

    document.addEventListener('click', e => {
        const btn = e.target.closest('.item');
        if (btn) openDetail(btn);
    });

    backdrop.addEventListener('click', closeDetail);
    closeBtn.addEventListener('click', closeDetail);
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeDetail();
    });
}

function setupClosingReveal() {
    if (prefersReduced) return;

    inView('.closing', () => {
        animate(
            '.closing > *',
            { opacity: [0, 1], y: [24, 0] },
            { delay: stagger(0.08), duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        );
    }, { margin: '-10% 0px' });

    inView('.work-meta', () => {
        animate(
            '.work-meta > *',
            { opacity: [0, 1], y: [18, 0] },
            { delay: stagger(0.06), duration: 0.55, ease: [0.22, 1, 0.36, 1] }
        );
    }, { once: true });
}

document.getElementById('year').textContent = String(new Date().getFullYear());

setupTheme();
setupTopbar();
setupMagnetic();
setupHeroIntro();
setupNucleus();
setupScrollEffects();
setupDetail();
setupClosingReveal();

await initializePanels();
setupTabs();

// Recenter field after layout settles
requestAnimationFrame(() => field.resize());
