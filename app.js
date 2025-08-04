/**
 * @typedef {Object} Translation
 * @property {string} title
 * @property {string} subtitle
 * @property {string} totalDebt
 * @property {string} creditBalance
 * @property {string} iTookCookie
 * @property {string} addPayment
 * @property {string} clearEverything
 * @property {string} undo
 */

/**
 * @typedef {Object} HistoryAction
 * @property {'cookie' | 'payment' | 'edit'} action
 * @property {number} amount
 * @property {string} description
 * @property {number} previousDebt
 */

/**
 * @typedef {'en' | 'he' | 'ar'} LanguageCode
 */

// App state
/** @type {number} */
let totalDebt = 0;
/** @type {LanguageCode} */
let currentLanguage = 'he';
/** @type {HistoryAction[]} */
let actionHistory = [];

// UI state
/** @type {number | undefined} */
let longPressTimer;
/** @type {boolean} */
let isEditing = false;

// Constants
const maxDebt = 20.0;
const LONG_PRESS_DELAY = 800;
const ERROR_FLASH_DURATION = 400;
const MAX_INPUT_LENGTH = 4;
const INPUT_BOUNDS = { min: -9999, max: 9999 };

// Utility functions
/**
 * @param {keyof Translation} key
 * @returns {string}
 */
function translate(key) {
    return translations[currentLanguage]?.[key] ?? translations.en[key] ?? key;
}
function loadDebtFromStorage() {
    const savedDebt = localStorage.getItem('cookieDebt');
    if (savedDebt !== null) {
        totalDebt = parseFloat(savedDebt);
    }
}

function saveDebtToStorage() {
    localStorage.setItem('cookieDebt', totalDebt.toString());
}

// Language detection
/**
 * @returns {LanguageCode}
 */
function detectDeviceLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.toLowerCase().substring(0, 2);

    if (translations[langCode]) {
        return langCode;
    }

    return 'en';
}

// Note: translations object is imported from translations.js

/**
 * @param {HistoryAction['action']} action
 * @param {number} amount
 * @param {string} description
 */
function addToHistory(action, amount, description) {
    actionHistory.push({
        action,
        amount,
        description,
        previousDebt: totalDebt - amount
    });
    updateUndoButton();
}

function undoLastAction() {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory.pop();
    if (lastAction) {
        totalDebt = lastAction.previousDebt;
    }

    saveDebtToStorage();
    updateDisplay();
    updateUndoButton();
}

// UI Functions
function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.disabled = actionHistory.length === 0;
    }
}

function updateDisplay() {
    const display = document.getElementById('debtDisplay');
    const debtAmountElement = document.getElementById('debtAmount');
    const progressFill = document.getElementById('debtProgressFill');

    if (!display || !debtAmountElement || !progressFill) return;

    debtAmountElement.textContent = Math.abs(totalDebt).toString();

    const debtLabel = display.querySelector('.debt-text span');
    if (debtLabel) {
        if (totalDebt > 0) {
            debtLabel.textContent = translate('totalDebt');
            const intensity = Math.min(totalDebt / maxDebt, 1);
            display.style.background = `rgba(255, 0, 0, ${0.05 + intensity * 0.35})`;
            display.style.borderColor = `rgba(255, 0, 0, ${0.3 + intensity * 0.5})`;
            display.className = 'debt-display';
        } else if (totalDebt === 0) {
            debtLabel.textContent = translate('totalDebt');
            display.style.background = 'var(--debt-none-bg)';
            display.style.borderColor = 'var(--debt-none-border)';
            display.className = 'debt-display no-debt';
        } else {
            debtLabel.textContent = translate('creditBalance');
            display.style.background = 'var(--debt-none-bg)';
            display.style.borderColor = 'var(--debt-none-border)';
            display.className = 'debt-display positive';
        }
    }
}

function flashDebtError() {
    const display = document.getElementById('debtDisplay');
    if (!display) return;

    display.classList.add('error');
    setTimeout(() => display.classList.remove('error'), ERROR_FLASH_DURATION);
}

/**
 * @param {Event} [event]
 */
function handleLongPress(event) {
    if (event) event.preventDefault();
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        editDebtAmount();
    }, LONG_PRESS_DELAY);
}

/**
 * @param {HTMLInputElement} input
 * @param {() => void} finish
 */
function setupDebtInput(input, finish) {
    input.addEventListener('beforeinput', function (e) {
        if (e.inputType.startsWith('delete')) return;

        const selection = input.selectionStart ?? 0;
        const value = input.value;
        const proposed = value.slice(0, selection) + (e.data ?? '') + value.slice(input.selectionEnd ?? selection);

        if (proposed.length > MAX_INPUT_LENGTH) {
            e.preventDefault();
        }
    });

    input.addEventListener('blur', finish);
    
    input.addEventListener('keydown', function (e) {
        if (e.key.toLowerCase() === 'e' || e.key === '+' || e.key === ',') {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            finish();
        }
    });
}

function editDebtAmount() {
    if (isEditing) return;

    const oldSpan = document.getElementById('debtAmount');
    if (!oldSpan) return;

    isEditing = true;
    const currentValue = totalDebt.toString();

    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.pattern = "-?[0-9]{1,4}";
    input.value = currentValue;
    input.className = 'debt-input';
    input.setAttribute('aria-label', 'Edit debt amount');
    input.setAttribute('maxlength', '5');
    input.setAttribute('min', INPUT_BOUNDS.min.toString());
    input.setAttribute('max', INPUT_BOUNDS.max.toString());

    oldSpan.replaceWith(input);
    input.focus();

    function finish() {
        if (!isEditing) return;
        isEditing = false;

        const newValue = parseInt(input.value);
        if (!isNaN(newValue)) {
            const oldDebt = totalDebt;
            totalDebt = newValue;
            addToHistory('edit', totalDebt - oldDebt, `Manual edit to ₪${totalDebt}`);
            saveDebtToStorage();
        }

        const newSpan = document.createElement('span');
        newSpan.id = 'debtAmount';
        newSpan.textContent = Math.abs(totalDebt).toString();
        newSpan.setAttribute('aria-live', 'polite');
        newSpan.className = oldSpan.className;

        input.replaceWith(newSpan);
        updateDisplay();
    }

    setupDebtInput(input, finish);
    input.select();
}

// Language/i18n functions
/**
 * @param {LanguageCode} lang
 */
function setLanguage(lang) {
    currentLanguage = lang;

    if (lang === 'he' || lang === 'ar') {
        document.dir = 'rtl';
    } else {
        document.dir = 'ltr';
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    const dropdown = document.getElementById('languageDropdown');
    const options = document.getElementById('langOptions');
    dropdown?.classList.remove('open');
    if (options) {
        options.style.display = 'none';
    }

    updateDisplay();
}

/**
 * @param {Event} event
 */
function toggleLanguageDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('languageDropdown');
    const options = document.getElementById('langOptions');

    if (dropdown?.classList.contains('open')) {
        dropdown.classList.remove('open');
        if (options) {
            options.style.display = 'none';
        }
    } else {
        dropdown?.classList.add('open');
        if (options) {
            options.style.display = 'block';
        }
    }
}

// Business logic functions
/**
 * @param {string} cookieType
 * @param {number} price
 */
function addCookie(cookieType, price) {
    if (totalDebt + price > maxDebt) {
        flashDebtError();
        return;
    }

    totalDebt += price;
    addToHistory('cookie', price, `${cookieType} (₪${price})`);
    saveDebtToStorage();
    updateDisplay();
}

/**
 * @param {number} amount
 */
function addPayment(amount) {
    if (!amount) return;

    amount = Math.round(amount);
    const newDebt = totalDebt - amount;

    if (newDebt < -maxDebt) {
        flashDebtError();
        return;
    }

    totalDebt = newDebt;
    addToHistory('payment', -amount, `Payment ₪${amount}`);
    saveDebtToStorage();
    updateDisplay();
}

function clearEverything() {
    totalDebt = 0;
    actionHistory = [];
    saveDebtToStorage();
    updateDisplay();
    updateUndoButton();
}

function openPaymentApp() {
    window.open('https://www.bitpay.co.il/app/me/BF427070-1BCE-B33D-61C7-05D6AB9DE241D263', '_blank');
}

// Initialization
loadDebtFromStorage();
setLanguage(detectDeviceLanguage());
updateUndoButton();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
