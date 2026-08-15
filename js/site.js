(function () {
    'use strict';

    var root = document.documentElement;
    var body = document.body;
    var themeToggle = document.querySelector('.theme-toggle');
    var menuToggle = document.querySelector('.menu-toggle');
    var primaryMenu = document.querySelector('.primary-menu');

    function readStoredTheme() {
        try { return localStorage.getItem('needham-theme'); } catch (error) { return null; }
    }

    function setTheme(theme, persist) {
        root.dataset.theme = theme;
        if (persist) {
            try { localStorage.setItem('needham-theme', theme); } catch (error) { /* Theme still works for this visit. */ }
        }
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', theme === 'dark' ? '切换到浅色主题' : '切换到深色主题');
            themeToggle.setAttribute('title', theme === 'dark' ? '切换到浅色主题' : '切换到深色主题');
        }
        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#11120f' : '#f3f1eb');
    }

    setTheme(root.dataset.theme || 'light', false);

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
        });
    }

    var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (systemTheme) {
        var syncSystemTheme = function (event) {
            if (!readStoredTheme()) setTheme(event.matches ? 'dark' : 'light', false);
        };
        if (systemTheme.addEventListener) systemTheme.addEventListener('change', syncSystemTheme);
    }

    function closeMenu() {
        body.classList.remove('menu-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            var willOpen = !body.classList.contains('menu-open');
            body.classList.toggle('menu-open', willOpen);
            menuToggle.setAttribute('aria-expanded', String(willOpen));
        });
    }

    if (primaryMenu) {
        primaryMenu.addEventListener('click', function (event) {
            if (event.target.closest('a')) closeMenu();
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeMenu();
    });

    var progressBar = document.querySelector('.reading-progress span');
    var article = document.querySelector('[data-article]');
    if (progressBar && article) {
        var updateProgress = function () {
            var rect = article.getBoundingClientRect();
            var articleTop = window.scrollY + rect.top;
            var readable = Math.max(1, article.offsetHeight - window.innerHeight);
            var value = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readable));
            progressBar.style.width = (value * 100).toFixed(2) + '%';
        };
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
    }

    var toc = document.querySelector('[data-toc]');
    if (toc && article) {
        var headings = Array.prototype.slice.call(article.querySelectorAll('h2, h3'));
        headings.forEach(function (heading, index) {
            if (!heading.id) heading.id = 'section-' + (index + 1);
            var item = document.createElement('li');
            var link = document.createElement('a');
            item.dataset.level = heading.tagName.slice(1);
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            item.appendChild(link);
            toc.appendChild(item);
        });

        if (headings.length && 'IntersectionObserver' in window) {
            var tocLinks = Array.prototype.slice.call(toc.querySelectorAll('a'));
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    tocLinks.forEach(function (link) {
                        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                });
            }, { rootMargin: '-18% 0px -70% 0px' });
            headings.forEach(function (heading) { observer.observe(heading); });
        }
    }

    var lightbox = document.querySelector('.lightbox');
    var lightboxLinks = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    if (lightbox && lightboxLinks.length && typeof lightbox.showModal === 'function') {
        var lightboxImage = lightbox.querySelector('img');
        var counter = lightbox.querySelector('.lightbox-counter');
        var currentIndex = 0;

        var showPhoto = function (index) {
            currentIndex = (index + lightboxLinks.length) % lightboxLinks.length;
            var link = lightboxLinks[currentIndex];
            var source = link.querySelector('img');
            lightboxImage.src = link.href;
            lightboxImage.alt = source ? source.alt : '';
            counter.textContent = String(currentIndex + 1).padStart(2, '0') + ' / ' + String(lightboxLinks.length).padStart(2, '0');
        };

        lightboxLinks.forEach(function (link, index) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                showPhoto(index);
                lightbox.showModal();
            });
        });

        lightbox.querySelector('.lightbox-close').addEventListener('click', function () { lightbox.close(); });
        lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { showPhoto(currentIndex - 1); });
        lightbox.querySelector('.lightbox-next').addEventListener('click', function () { showPhoto(currentIndex + 1); });
        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) lightbox.close();
        });
        lightbox.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
            if (event.key === 'ArrowRight') showPhoto(currentIndex + 1);
        });
    }

    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').catch(function () { /* Offline support is optional. */ });
        });
    }
}());
