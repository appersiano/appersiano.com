/**
 * Interactive particle field with a gravitational nucleus.
 * Pointer warps the field; clicks pulse energy outward.
 */
export function createField(canvas, options = {}) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d', { alpha: true });

    const state = {
        w: 0,
        h: 0,
        dpr: 1,
        particles: [],
        pointer: { x: 0, y: 0, active: false },
        nucleus: { x: 0, y: 0, r: 84 },
        pulse: 0,
        energy: 0,
        running: false,
        raf: 0,
        colors: options.colors || ['#3ddcff', '#7cf0ff', '#ff8f5c', '#f2f5f8']
    };

    function readColors() {
        const styles = getComputedStyle(document.documentElement);
        state.colors = [
            styles.getPropertyValue('--field-a').trim() || '#3ddcff',
            styles.getPropertyValue('--field-b').trim() || '#7cf0ff',
            styles.getPropertyValue('--field-c').trim() || '#ff8f5c',
            styles.getPropertyValue('--text').trim() || '#f2f5f8'
        ];
    }

    function countForViewport() {
        if (prefersReduced) return 90;
        const area = state.w * state.h;
        if (area < 500000) return 180;
        if (area < 1200000) return 320;
        return 460;
    }

    function spawnParticle(i, total) {
        const angle = (i / total) * Math.PI * 2 + Math.random() * 0.4;
        const orbit = 110 + Math.random() * Math.min(state.w, state.h) * 0.38;
        return {
            angle,
            orbit,
            orbitTarget: orbit,
            speed: 0.0012 + Math.random() * 0.0028,
            size: 0.7 + Math.random() * 2.2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.008 + Math.random() * 0.02,
            color: state.colors[i % state.colors.length],
            alpha: 0.25 + Math.random() * 0.55,
            vx: 0,
            vy: 0,
            x: state.nucleus.x + Math.cos(angle) * orbit,
            y: state.nucleus.y + Math.sin(angle) * orbit
        };
    }

    function rebuild() {
        readColors();
        const total = countForViewport();
        state.particles = Array.from({ length: total }, (_, i) => spawnParticle(i, total));
    }

    function resize() {
        state.dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.w = window.innerWidth;
        state.h = window.innerHeight;
        canvas.width = Math.floor(state.w * state.dpr);
        canvas.height = Math.floor(state.h * state.dpr);
        canvas.style.width = `${state.w}px`;
        canvas.style.height = `${state.h}px`;
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        const nucleusEl = document.getElementById('nucleus');
        if (nucleusEl) {
            const rect = nucleusEl.getBoundingClientRect();
            state.nucleus.x = rect.left + rect.width / 2;
            state.nucleus.y = rect.top + rect.height / 2;
            state.nucleus.r = rect.width / 2;
        } else {
            state.nucleus.x = state.w / 2;
            state.nucleus.y = state.h * 0.38;
        }

        rebuild();
    }

    function setPointer(x, y, active) {
        state.pointer.x = x;
        state.pointer.y = y;
        state.pointer.active = active;
    }

    function burst(strength = 1) {
        state.pulse = Math.min(1.8, state.pulse + strength);
        state.energy = Math.min(1, state.energy + 0.45 * strength);
    }

    function tick() {
        if (!state.running) return;

        ctx.clearRect(0, 0, state.w, state.h);

        const nx = state.nucleus.x;
        const ny = state.nucleus.y;
        const px = state.pointer.x;
        const py = state.pointer.y;
        const pointerOn = state.pointer.active;

        state.pulse *= 0.92;
        state.energy *= 0.985;

        // Soft nucleus glow
        const glow = ctx.createRadialGradient(nx, ny, 8, nx, ny, 180 + state.pulse * 80);
        glow.addColorStop(0, hexAlpha(state.colors[0], 0.2 + state.energy * 0.2));
        glow.addColorStop(0.45, hexAlpha(state.colors[1], 0.06));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nx, ny, 220 + state.pulse * 90, 0, Math.PI * 2);
        ctx.fill();

        for (const p of state.particles) {
            p.angle += p.speed * (1 + state.energy * 1.8);
            p.wobble += p.wobbleSpeed;

            const wobbleR = Math.sin(p.wobble) * 10;
            let tx = nx + Math.cos(p.angle) * (p.orbit + wobbleR);
            let ty = ny + Math.sin(p.angle) * (p.orbit * 0.72 + wobbleR);

            if (pointerOn) {
                const dx = tx - px;
                const dy = ty - py;
                const dist = Math.hypot(dx, dy) || 1;
                const force = Math.max(0, 1 - dist / 240) * 42;
                // swirl + soft push
                tx += (-dy / dist) * force * 0.55 + (dx / dist) * force * 0.2;
                ty += (dx / dist) * force * 0.55 + (dy / dist) * force * 0.2;
            }

            if (state.pulse > 0.02) {
                const dx = tx - nx;
                const dy = ty - ny;
                const dist = Math.hypot(dx, dy) || 1;
                tx += (dx / dist) * state.pulse * 28;
                ty += (dy / dist) * state.pulse * 28;
            }

            p.vx += (tx - p.x) * 0.045;
            p.vy += (ty - p.y) * 0.045;
            p.vx *= 0.82;
            p.vy *= 0.82;
            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.fillStyle = hexAlpha(p.color, p.alpha * (0.65 + state.energy * 0.35));
            ctx.arc(p.x, p.y, p.size * (1 + state.pulse * 0.35), 0, Math.PI * 2);
            ctx.fill();
        }

        // sparse connective threads near pointer
        if (pointerOn) {
            ctx.strokeStyle = hexAlpha(state.colors[0], 0.12);
            ctx.lineWidth = 1;
            let links = 0;
            for (let i = 0; i < state.particles.length && links < 28; i++) {
                const p = state.particles[i];
                const dist = Math.hypot(p.x - px, p.y - py);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                    links++;
                }
            }
        }

        state.raf = requestAnimationFrame(tick);
    }

    function hexAlpha(color, alpha) {
        if (!color) return `rgba(61,220,255,${alpha})`;
        if (color.startsWith('rgba') || color.startsWith('rgb')) {
            return color.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
                const parts = inner.split(',').map(s => s.trim());
                return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
            });
        }
        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length !== 6) return `rgba(61,220,255,${alpha})`;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function start() {
        if (state.running) return;
        state.running = true;
        state.raf = requestAnimationFrame(tick);
    }

    function stop() {
        state.running = false;
        cancelAnimationFrame(state.raf);
    }

    function destroy() {
        stop();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('scroll', onScroll, { passive: true });
    }

    let resizeTimer = 0;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 80);
    }

    function onPointerMove(e) {
        setPointer(e.clientX, e.clientY, true);
    }

    function onPointerLeave() {
        state.pointer.active = false;
    }

    function onScroll() {
        const nucleusEl = document.getElementById('nucleus');
        if (!nucleusEl) return;
        const rect = nucleusEl.getBoundingClientRect();
        state.nucleus.x = rect.left + rect.width / 2;
        state.nucleus.y = rect.top + rect.height / 2;
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    resize();
    if (!prefersReduced) start();
    else {
        // static soft glow only
        ctx.clearRect(0, 0, state.w, state.h);
        const glow = ctx.createRadialGradient(
            state.nucleus.x, state.nucleus.y, 10,
            state.nucleus.x, state.nucleus.y, 220
        );
        glow.addColorStop(0, hexAlpha(state.colors[0], 0.25));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, state.w, state.h);
    }

    return {
        burst,
        resize,
        readColors,
        destroy,
        get nucleus() {
            return state.nucleus;
        }
    };
}
