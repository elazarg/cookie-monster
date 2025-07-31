// Language detection and dropdown functions
function detectDeviceLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.toLowerCase().substring(0, 2);

    // Check if we support the detected language
    if (translations[langCode]) {
        return langCode;
    }

    // Default to English if not supported
    return 'en';
}

// Simple debt tracking with browser storage
let totalDebt = 0;
let currentLanguage = 'he';
let actionHistory = [];
let longPressTimer;
let isEditing = false;

const maxDebt = 20.0;

// Browser cookie functions
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + '=';
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1] ?? null;
}

function loadDebtFromCookies() {
    const savedDebt = getCookie('cookieDebt');
    if (savedDebt !== null) {
        totalDebt = parseFloat(savedDebt);
    }
}

function saveDebtToCookies() {
    setCookie('cookieDebt', totalDebt, 365);
}

// Translation data
const translations = {
    en: {
        title: "Cookie Monster",
        subtitle: "Trust-based cookie debt system",
        totalDebt: "Debt",
        creditBalance: "Credit Balance",
        iTookCookie: "I took a cookie",
        addPayment: "I paid",
        clearEverything: "I Paid Everything",
        undo: "Undo",
    },
    he: {
        title: "עוגי",
        subtitle: "מערכת תשלום עצמי לעוגיות",
        totalDebt: "חוב",
        creditBalance: "יתרה",
        iTookCookie: "לקחתי עוגיה",
        addPayment: "שילמתי",
        clearEverything: "שילמתי הכל",
        undo: "ביטול",
    },
    ar: {
        title: "كعكي",
        subtitle: "نظام دفع ذاتي للكوكيز",
        totalDebt: "الدين",
        creditBalance: "رصيد",
        iTookCookie: "أخذت كوكي",
        addPayment: "دفعت",
        clearEverything: "دفعت كل شيء",
        undo: "تراجع",
    }
};

function translate(key) {
    return translations[currentLanguage]?.[key] ?? translations.en[key] ?? key;
}

function addToHistory(action, amount, description) {
    actionHistory.push({
        action: action,
        amount: amount,
        description: description,
        previousDebt: totalDebt - amount
    });
    updateUndoButton();
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.disabled = actionHistory.length === 0;
    }
}

function undoLastAction() {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory.pop();
    totalDebt = lastAction.previousDebt;

    console.log(`Undid: ${lastAction.description}`);
    saveDebtToCookies();
    updateDisplay();
    updateUndoButton();
}

function handleLongPress(event) {
    if (event) event.preventDefault();
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        editDebtAmount();
    }, 800);
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
    input.setAttribute('maxlength', '5');  // Not enforced by all browsers, but safe
    input.setAttribute('min', '-9999');
    input.setAttribute('max', '9999');

    // Replace span with input
    oldSpan.replaceWith(input);
    input.focus();
    
    input.addEventListener('beforeinput', function (e) {
        if (e.inputType.startsWith('delete')) return; // always allow deletes

        const selection = input.selectionStart;
        const value = input.value;
        const proposed =
            value.slice(0, selection) + e.data + value.slice(input.selectionEnd);

        if (proposed.length > 4) {
            e.preventDefault();
        }
    });

    input.select();

    function finish() {
        if (!isEditing) return;
        isEditing = false;

        let newValue = parseInt(input.value);
        if (!isNaN(newValue)) {
            const oldDebt = totalDebt;
            totalDebt = newValue;
            addToHistory('edit', totalDebt - oldDebt, `Manual edit to ₪${totalDebt}`);
            saveDebtToCookies();
        }

        // Replace input back with span
        const newSpan = document.createElement('span');
        newSpan.id = 'debtAmount';
        newSpan.textContent = Math.abs(totalDebt);
        newSpan.setAttribute('aria-live', 'polite');
        newSpan.className = oldSpan.className;

        input.replaceWith(newSpan);
        updateDisplay();
    }
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', function (e) {
        // Prevent 'e', '+', and other non-digit characters
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

function flashDebtError() {
    const display = document.getElementById('debtDisplay');
    if (!display) return;

    display.classList.add('error');
    setTimeout(() => display.classList.remove('error'), 400);
}

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

    // Close dropdown properly - remove BOTH class AND inline style
    const dropdown = document.getElementById('languageDropdown');
    const options = document.getElementById('langOptions');
    dropdown.classList.remove('open');
    options.style.display = 'none';

    updateDisplay();
}

function toggleLanguageDropdown(event) {
    event.stopPropagation(); // Prevent immediate closing
    const dropdown = document.getElementById('languageDropdown');
    const options = document.getElementById('langOptions');

    if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        options.style.display = 'none';
    } else {
        dropdown.classList.add('open');
        options.style.display = 'block';
    }
}

function updateDisplay() {
    const display = document.getElementById('debtDisplay');
    const debtAmountElement = document.getElementById('debtAmount');
    const progressFill = document.getElementById('debtProgressFill');

    if (!display || !debtAmountElement || !progressFill) return;

    debtAmountElement.textContent = Math.abs(totalDebt);

    const debtLabel = display.querySelector('.debt-text span');
    if (debtLabel) {
        if (totalDebt > 0) {
            const intensity = Math.min(totalDebt / maxDebt, 1);
            const background = `rgba(255, 0, 0, ${0.05 + intensity * 0.35})`;
            const border = `rgba(255, 0, 0, ${0.3 + intensity * 0.5})`;

            display.style.background = background;
            display.style.borderColor = border;
            display.className = 'debt-display';  // base class only
        } else if (totalDebt === 0) {
            display.style.background = 'var(--debt-none-bg)';
            display.style.borderColor = 'var(--debt-none-border)';
            display.className = 'debt-display no-debt';
        } else {
            display.style.background = 'var(--debt-none-bg)';
            display.style.borderColor = 'var(--debt-none-border)';
            display.className = 'debt-display positive';
        }
    }
}

function addCookie(cookieType, price) {
    if (totalDebt + price > maxDebt) {
        flashDebtError();
        return;
    }

    totalDebt += price;
    addToHistory('cookie', price, `${cookieType} (₪${price})`);
    console.log(`Added ${cookieType} (₪${price}). New total: ₪${totalDebt}`);
    saveDebtToCookies();
    updateDisplay();
}

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
    console.log(`Payment of ₪${amount}. New total: ₪${totalDebt}`);
    saveDebtToCookies();
    updateDisplay();
}

function clearEverything() {
    const t = translations[currentLanguage];
    totalDebt = 0;
    actionHistory = [];
    saveDebtToCookies();
    updateDisplay();
    updateUndoButton();
}

function openPaymentApp() {
    // Replace with actual Bit/PayBox link when ready
    window.open('https://www.bitpay.co.il/app/me/BF427070-1BCE-B33D-61C7-05D6AB9DE241D263', '_blank');
    // alert('Payment link coming soon!');
}

// Initialize
loadDebtFromCookies();
setLanguage(detectDeviceLanguage());
updateUndoButton();
// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
