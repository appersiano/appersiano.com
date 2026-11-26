(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animeApi = window.anime || {};
    const { animate, createTimeline, stagger } = animeApi;

    const canAnimate = Boolean(animate) && !prefersReducedMotion;

    function handleAvatarClick(event) {
        event.preventDefault();

        if ('vibrate' in navigator) {
            navigator.vibrate(40);
        }

        const avatar = event.currentTarget;
        if (!canAnimate) {
            avatar.style.transform = 'scale(0.95)';
            setTimeout(() => {
                avatar.style.transform = '';
            }, 150);
            return;
        }

        animate(avatar, {
            scale: [
                { to: 0.92, duration: 90, ease: 'inQuad' },
                { to: 1.06, duration: 220, ease: 'outBack(1.8)' },
                { to: 1, duration: 280, ease: 'outElastic(1, 0.55)' }
            ]
        });
    }

    async function loadSectionData(section) {
        try {
            const response = await fetch(`data/${section}.json`);
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error(`Error loading ${section} data:`, error);
            return [];
        }
    }

    function createCardHTML(item) {
        return `
            <div class="item">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="tags">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </a>
            </div>
        `;
    }

    async function initializeSections() {
        const sections = ['experiments', 'blog', 'talks', 'community'];

        for (const section of sections) {
            const items = await loadSectionData(section);
            const sectionElement = document.getElementById(section);
            sectionElement.innerHTML = items.map(createCardHTML).join('');
        }
    }

    function moveTabIndicator(tabButton, instant = false) {
        const indicator = document.querySelector('.tab-indicator');
        const tabs = document.querySelector('.tabs');
        if (!indicator || !tabButton || !tabs) return;

        const tabRect = tabButton.getBoundingClientRect();
        const tabsRect = tabs.getBoundingClientRect();
        const left = tabRect.left - tabsRect.left + tabs.scrollLeft;
        const width = tabRect.width;

        if (!canAnimate || instant) {
            indicator.style.opacity = '1';
            indicator.style.width = `${width}px`;
            indicator.style.transform = `translateX(${left}px)`;
            return;
        }

        animate(indicator, {
            opacity: 1,
            width: `${width}px`,
            x: left,
            duration: 380,
            ease: 'outExpo'
        });
    }

    function animateSectionItems(sectionId) {
        const items = document.querySelectorAll(`#${sectionId} .item`);
        if (!items.length) return;

        if (!canAnimate) {
            items.forEach(item => {
                item.style.opacity = '1';
                item.style.transform = 'none';
            });
            return;
        }

        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(16px)';
        });

        animate(items, {
            opacity: [0, 1],
            y: [16, 0],
            delay: stagger(55, { start: 40 }),
            duration: 520,
            ease: 'outExpo'
        });
    }

    function openTab(evt, tabName) {
        const sections = document.getElementsByClassName('section');
        for (const section of sections) {
            section.classList.remove('active');
        }

        const tabs = document.getElementsByClassName('tab');
        for (const tab of tabs) {
            tab.classList.remove('active');
        }

        document.getElementById(tabName).classList.add('active');

        let activeTab = null;
        if (evt && evt.currentTarget) {
            activeTab = evt.currentTarget;
            activeTab.classList.add('active');
            history.pushState(null, null, `#${tabName}`);
        } else {
            activeTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
            if (activeTab) activeTab.classList.add('active');
        }

        if (activeTab) moveTabIndicator(activeTab);
        requestAnimationFrame(() => animateSectionItems(tabName));
    }

    function handleHashNavigation() {
        const hash = window.location.hash.slice(1);
        const validTabs = ['experiments', 'blog', 'talks', 'community'];
        if (hash && validTabs.includes(hash)) {
            openTab(null, hash);
        }
    }

    function revealAfterTypewriter() {
        const social = document.querySelector('.social-links');
        const sections = document.querySelector('.sections');
        if (!social || !sections) return;

        social.style.visibility = 'visible';
        sections.style.visibility = 'visible';

        if (!canAnimate) {
            social.style.opacity = '1';
            sections.style.opacity = '1';
            const active = document.querySelector('.section.active');
            if (active) animateSectionItems(active.id);
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) moveTabIndicator(activeTab, true);
            return;
        }

        const socialLinks = social.querySelectorAll('a');

        createTimeline({ defaults: { ease: 'outExpo' } })
            .add(social, {
                opacity: [0, 1],
                y: [24, 0],
                duration: 560
            }, 0)
            .add(socialLinks, {
                opacity: [0, 1],
                y: [18, 0],
                scale: [0.85, 1],
                delay: stagger(70),
                duration: 480
            }, 80)
            .add(sections, {
                opacity: [0, 1],
                y: [28, 0],
                duration: 640,
                onComplete: () => {
                    const active = document.querySelector('.section.active');
                    if (active) animateSectionItems(active.id);
                    const activeTab = document.querySelector('.tab.active');
                    if (activeTab) moveTabIndicator(activeTab);
                }
            }, 220);
    }

    function startHeroMotion() {
        const avatar = document.querySelector('.avatar');
        const ring = document.querySelector('.avatar-ring');
        const brand = document.querySelector('.brand');
        const typewriterEl = document.getElementById('typewriter');

        const kickTypewriter = () => {
            if (typewriterEl) typewriterEl.style.opacity = '1';
            startTypewriter();
        };

        if (!canAnimate) {
            if (avatar) {
                avatar.style.opacity = '1';
                avatar.style.transform = 'none';
            }
            if (ring) ring.style.opacity = '1';
            if (brand) {
                brand.style.opacity = '1';
                brand.style.transform = 'none';
            }
            kickTypewriter();
            return;
        }

        createTimeline({ defaults: { ease: 'outExpo' } })
            .add(avatar, {
                opacity: [0, 1],
                scale: [0.82, 1],
                y: [18, 0],
                duration: 780
            }, 80)
            .add(ring, {
                opacity: [0, 1],
                scale: [0.92, 1],
                duration: 700
            }, 180)
            .add(brand, {
                opacity: [0, 1],
                y: [22, 0],
                duration: 700,
                onComplete: kickTypewriter
            }, 260);

        // Ambient drifting orbs
        document.querySelectorAll('.atmosphere .orb').forEach((orb, index) => {
            const distance = 18 + index * 10;
            animate(orb, {
                x: [
                    { to: distance, duration: 7000 + index * 900 },
                    { to: -distance * 0.6, duration: 8000 + index * 700 },
                    { to: 0, duration: 6500 + index * 500 }
                ],
                y: [
                    { to: -distance * 0.8, duration: 7500 + index * 600 },
                    { to: distance * 0.5, duration: 8500 + index * 800 },
                    { to: 0, duration: 7000 + index * 400 }
                ],
                ease: 'inOutSine',
                loop: true
            });
        });
    }

    function startTypewriter() {
        if (typeof Typewriter === 'undefined' || typeof GraphemeSplitter === 'undefined') {
            const el = document.getElementById('typewriter');
            if (el) {
                el.innerHTML = `
                    Ciao!<br>
                    Sono <span class="highlight">Alessandro</span>, aka <span class="highlight">appersiano</span>.
                    <div class="fade-in" style="opacity:1">
                        <br>
                        Sono un <span class="highlight">AI Product &amp; Software Engineer</span>.
                        Mi piace sviluppare prodotti digitali e sperimentare con tutte le tecnologie.
                        Ho organizzato in passato Community Events con <span class="highlight">GDG Milano</span>.
                        <br>
                        Se vuoi contattarmi per una consulenza → <a class="work-link" href="https://etnatech.it" target="_blank" rel="noopener noreferrer">etnatech.it</a>.
                    </div>
                `;
            }
            revealAfterTypewriter();
            return;
        }

        const stringSplitter = string => {
            const splitter = new GraphemeSplitter();
            return splitter.splitGraphemes(string);
        };

        const typewriter = new Typewriter('#typewriter', {
            loop: false,
            delay: prefersReducedMotion ? 1 : 22,
            cursor: '▋',
            stringSplitter
        });

        const run = prefersReducedMotion
            ? typewriter.typeString(
                'Ciao!<br>Sono <span class="highlight">Alessandro</span>, aka <span class="highlight">appersiano</span>.'
            )
            : typewriter
                .typeString('Ciao!<br>')
                .pauseFor(220)
                .typeString(
                    "Sono <span class='highlight'>Alessandro</span>, aka <span class='highlight'>appersiano</span>."
                );

        run.callFunction(() => {
            const cursor = document.querySelector('.Typewriter__cursor');
            if (cursor) cursor.remove();

            const additionalText = document.createElement('div');
            additionalText.className = 'fade-in';
            additionalText.innerHTML = `
                <br>
                Sono un <span class="highlight">AI Product &amp; Software Engineer</span>.
                Mi piace sviluppare prodotti digitali e sperimentare con tutte le tecnologie.
                Ho organizzato in passato Community Events con <span class="highlight">GDG Milano</span>.
                <br>
                Se vuoi contattarmi per una consulenza → <a class="work-link" href="https://etnatech.it" target="_blank" rel="noopener noreferrer">etnatech.it</a>.
            `;
            document.getElementById('typewriter').appendChild(additionalText);

            if (canAnimate && animate) {
                animate(additionalText, {
                    opacity: [0, 1],
                    y: [12, 0],
                    duration: 600,
                    ease: 'outExpo',
                    onComplete: revealAfterTypewriter
                });
            } else {
                additionalText.style.opacity = '1';
                revealAfterTypewriter();
            }
        }).start();
    }

    function setupTheme() {
        const themeToggle = document.querySelector('.theme-toggle');
        const html = document.documentElement;
        const themeIcon = themeToggle.querySelector('i');

        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);

            if (canAnimate) {
                animate(themeToggle, {
                    rotate: [0, 180],
                    duration: 420,
                    ease: 'outBack(1.5)'
                });
            }
        });

        function updateThemeIcon(theme) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    window.openTab = openTab;
    window.handleAvatarClick = handleAvatarClick;

    document.addEventListener('DOMContentLoaded', async () => {
        setupTheme();
        await initializeSections();
        handleHashNavigation();
        startHeroMotion();

        window.addEventListener('hashchange', handleHashNavigation);
        window.addEventListener('resize', () => {
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) moveTabIndicator(activeTab, true);
        });

        if (canAnimate) {
            document.addEventListener('mouseover', event => {
                const item = event.target.closest('.item');
                if (!item || item.dataset.hovering === '1') return;
                item.dataset.hovering = '1';
                animate(item, {
                    y: -4,
                    duration: 280,
                    ease: 'outQuad'
                });
            });
            document.addEventListener('mouseout', event => {
                const item = event.target.closest('.item');
                if (!item) return;
                if (event.relatedTarget && item.contains(event.relatedTarget)) return;
                item.dataset.hovering = '0';
                animate(item, {
                    y: 0,
                    duration: 320,
                    ease: 'outQuad'
                });
            });
        }
    });
})();
