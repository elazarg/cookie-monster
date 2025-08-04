/**
 * Cookie Debt Tracker - Translations
 * 
 * To add a new language:
 * 1. Add a new language code (like 'es', 'fr', 'de') to the translations object below
 * 2. Copy one of the existing language objects
 * 3. Translate all the text values
 * 4. Keep the keys (like 'title', 'subtitle') exactly the same
 * 
 * Language codes should be 2 letters following ISO 639-1 standard:
 * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 */

const translations = {
    // English
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

    // Hebrew - עברית
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

    // Arabic - العربية
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

    // To add a new language, copy this template and translate the values:
    /*
    // [Language Name] - [Native Name]
    xx: {
        title: "Cookie Monster",
        subtitle: "Trust-based cookie debt system",
        totalDebt: "Debt",
        creditBalance: "Credit Balance",
        iTookCookie: "I took a cookie",
        addPayment: "I paid",
        clearEverything: "I Paid Everything",
        undo: "Undo",
    },
    */
};
