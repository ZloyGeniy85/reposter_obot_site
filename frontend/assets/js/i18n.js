(function () {
    const SUPPORTED_LANGS = ['ru', 'en', 'ar', 'hi', 'fr', 'es'];
    const RTL_LANGS = ['ar'];
    const STORAGE_KEY = 'reposter_lang';
    const LOCALES_PATH = 'locales/';

    const cache = {};

    function detectDefaultLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

        const browserLang = (navigator.language || 'ru').slice(0, 2).toLowerCase();
        if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

        return 'ru';
    }

    async function loadLocale(lang) {
        if (cache[lang]) return cache[lang];
        const res = await fetch(`${LOCALES_PATH}${lang}.json`);
        if (!res.ok) throw new Error(`Locale "${lang}" not found`);
        const data = await res.json();
        cache[lang] = data;
        return data;
    }

    function applyTranslations(dict, lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

        document.title = dict.meta_title;
        setMeta('description', dict.meta_description);
        setMeta('keywords', dict.meta_keywords);
        setMeta('og:title', dict.og_title, true);
        setMeta('og:description', dict.og_description, true);

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    function setMeta(name, content, isProperty) {
        if (!content) return;
        const attr = isProperty ? 'property' : 'name';
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    async function setLanguage(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) lang = 'ru';
        try {
            const dict = await loadLocale(lang);
            applyTranslations(dict, lang);
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (err) {
            console.error('i18n error:', err);
            if (lang !== 'ru') await setLanguage('ru');
        }
    }

    function initSwitcher() {
        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSwitcher();
        setLanguage(detectDefaultLang());
    });

    // Expose for debugging / manual calls if needed
    window.ReposterI18n = { setLanguage, SUPPORTED_LANGS };
})();
