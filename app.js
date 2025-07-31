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
        totalDebt: "Total Debt",
        creditBalance: "Credit Balance",
        iTookCookie: "I took a cookie",
        addPayment: "I paid",
        clearEverything: "I Paid Everything",
        undo: "Undo",
        debtLimitReached: `Cannot exceed ₪${maxDebt} debt limit`,
        creditLimitReached: `Cannot exceed ₪${maxDebt} credit balance`
    },
    he: {
        title: "עוגי",
        subtitle: "מערכת תשלום עצמי לעוגיות",
        totalDebt: "חוב כולל",
        creditBalance: "יתרה",
        iTookCookie: "לקחתי עוגייה",
        addPayment: "שילמתי",
        clearEverything: "שילמתי הכל",
        undo: "בטל",
        debtLimitReached: `לא ניתן לעבור חוב של ₪${maxDebt}`,
        creditLimitReached: `לא ניתן לעבור יתרה של ₪${maxDebt}`
    },
    ar: {
        title: "كعكي",
        subtitle: "نظام دفع ذاتي للكوكيز",
        totalDebt: "اجمالي الدين",
        creditBalance: "رصيد",
        iTookCookie: "أخذت كوكي",
        addPayment: "دفعت",
        clearEverything: "دفعت كل شيء",
        undo: "تراجع",
        debtLimitReached: `لا يمكن تجاوز حد الدين ₪${maxDebt}`,
        creditLimitReached: `لا يمكن تجاوز رصيد ائتماني ₪${maxDebt}`
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

    const debtAmountElement = document.getElementById('debtAmount');
    if (!debtAmountElement) return;

    isEditing = true;
    const currentValue = Math.abs(totalDebt);

    debtAmountElement.contentEditable = true;
    debtAmountElement.classList.add('editing');
    debtAmountElement.textContent = currentValue;
    debtAmountElement.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(debtAmountElement);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finishEditing() {
        if (!isEditing) return;
        isEditing = false;
        debtAmountElement.contentEditable = false;
        debtAmountElement.classList.remove('editing');

        const newValue = parseFloat(debtAmountElement.textContent);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= maxDebt) {
            const oldDebt = totalDebt;
            totalDebt = totalDebt >= 0 ? newValue : -newValue;
            addToHistory('edit', totalDebt - oldDebt, `Manual edit to ₪${totalDebt}`);
            saveDebtToCookies();
        }
        updateDisplay();
    }

    // Add event listeners immediately
    debtAmountElement.onblur = finishEditing;
    debtAmountElement.onkeydown = function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        }
    };
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
        if (totalDebt >= 0) {
            debtLabel.textContent = translate('totalDebt');

            if (totalDebt === 0) {
                display.className = 'debt-display no-debt';
            } else if (totalDebt <= 5) {
                display.className = 'debt-display low-debt';
            } else {
                display.className = 'debt-display';
            }

            const progressPercent = Math.min((totalDebt / maxDebt) * 100, 100);
            progressFill.style.width = progressPercent + '%';
        } else {
            debtLabel.textContent = translate('creditBalance');
            display.className = 'debt-display positive';
            progressFill.style.width = '0%';
        }
    }
}

function addCookie(cookieType, price) {
    if (totalDebt + price > maxDebt) {
        alert(translate('debtLimitReached'));
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
        alert(translate('creditLimitReached'));
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
    // window.open('BIT_OR_PAYBOX_LINK', '_blank');

    alert('Payment link coming soon!');
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
