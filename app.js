// Simple debt tracking with browser storage
let totalDebt = 0;
let currentLanguage = 'he';
let actionHistory = [];
let longPressTimer;
let isEditing = false;

// Browser cookie functions
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function loadDebtFromCookies() {
    const savedDebt = getCookie('cookieDebt');
    if (savedDebt !== null) {
        totalDebt = parseFloat(savedDebt);
    }
}

function saveDebtToCookies() {
    setCookie('cookieDebt', totalDebt.toFixed(1), 365);
}

// Translation data
const translations = {
    en: {
        title: "Cookie Tracker",
        subtitle: "Trust-based cookie debt system",
        totalDebt: "Total Debt",
        creditBalance: "Credit Balance",
        iTookCookie: "I took a cookie",
        addPayment: "I payed",
        clearEverything: "I Paid Everything",
        undo: "Undo",
        debtLimitReached: "Cannot exceed ₪20 debt limit",
        creditLimitReached: "Cannot exceed ₪20 credit balance"
    },
    he: {
        title: "מעקב עוגיות",
        subtitle: "מערכת תשלום עצמי לעוגיות",
        totalDebt: "חוב כולל",
        creditBalance: "יתרה",
        iTookCookie: "לקחתי עוגייה",
        addPayment: "שילמתי",
        clearEverything: "שילמתי הכל",
        undo: "בטל",
        debtLimitReached: "לא ניתן לעבור חוב של ₪20",
        creditLimitReached: "לא ניתן לעבור יתרה של ₪20"
    },
    ar: {
        title: "حساب الكوكيز",
        subtitle: "نظام دفع ذاتي للكوكيز",
        totalDebt: "اجمالي الدين",
        creditBalance: "رصيد",
        iTookCookie: "أخذت كوكي",
        addPayment: "دفعت",
        clearEverything: "دفعت كل شيء",
        undo: "تراجع",
        debtLimitReached: "لا يمكن تجاوز حد الدين ₪20",
        creditLimitReached: "لا يمكن تجاوز رصيد ائتماني ₪20"
    }
};

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

function clearLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function editDebtAmount() {
    if (isEditing) return;
    
    const debtAmountElement = document.getElementById('debtAmount');
    if (!debtAmountElement) return;
    
    isEditing = true;
    const currentValue = Math.abs(totalDebt).toFixed(1);
    
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
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 99.9) {
            const oldDebt = totalDebt;
            totalDebt = totalDebt >= 0 ? newValue : -newValue;
            addToHistory('edit', totalDebt - oldDebt, `Manual edit to ₪${totalDebt.toFixed(1)}`);
            saveDebtToCookies();
        }
        updateDisplay();
    }
    
    // Add event listeners immediately
    debtAmountElement.onblur = finishEditing;
    debtAmountElement.onkeydown = function(e) {
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
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('debtDisplay');
    const debtAmountElement = document.getElementById('debtAmount');
    const progressFill = document.getElementById('debtProgressFill');
    
    if (!display || !debtAmountElement || !progressFill) return;
    
    const t = translations[currentLanguage] || translations['en'];
    
    debtAmountElement.textContent = Math.abs(totalDebt).toFixed(1);
    
    const debtLabel = display.querySelector('.debt-text span');
    if (debtLabel) {
        if (totalDebt >= 0) {
            debtLabel.textContent = t.totalDebt;
            
            if (totalDebt === 0) {
                display.className = 'debt-display no-debt';
            } else if (totalDebt <= 5) {
                display.className = 'debt-display low-debt';
            } else {
                display.className = 'debt-display';
            }
            
            const progressPercent = Math.min((totalDebt / 20) * 100, 100);
            progressFill.style.width = progressPercent + '%';
        } else {
            debtLabel.textContent = t.creditBalance;
            display.className = 'debt-display positive';
            progressFill.style.width = '0%';
        }
    }
}

function addCookie(cookieType, price) {
    if (totalDebt + price > 20.0) {
        const t = translations[currentLanguage];
        alert(t.debtLimitReached || "Cannot exceed ₪20.0 debt limit");
        return;
    }
    
    totalDebt += price;
    addToHistory('cookie', price, `${cookieType} (₪${price})`);
    console.log(`Added ${cookieType} (₪${price}). New total: ₪${totalDebt.toFixed(1)}`);
    saveDebtToCookies();
    updateDisplay();
}

function addPayment(amount) {
    if (!amount) return;
    
    amount = Math.round(amount * 10) / 10;
    const newDebt = totalDebt - amount;
    
    if (newDebt < -99.9) {
        const t = translations[currentLanguage];
        alert(t.creditLimitReached || "Cannot exceed ₪99.9 credit balance");
        return;
    }
    
    totalDebt = newDebt;
    addToHistory('payment', -amount, `Payment ₪${amount}`);
    console.log(`Payment of ₪${amount}. New total: ₪${totalDebt.toFixed(1)}`);
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

// Initialize
loadDebtFromCookies();
setLanguage('he');
updateUndoButton();
