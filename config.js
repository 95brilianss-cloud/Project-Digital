const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwQfOX5Z4yC6Tp2BXEz5EAfif2YxswSZJsVqDxJcBALdL_dpv0MltfKf8rg52PT0gqt/exec',
    MAX_RETRIES: 3,
    RETRY_DELAY: 3000,
    SYNC_INTERVAL: 60000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.5.0',
    DEBUG: true,
    // Nama sheet harus sama persis dengan tab di Google Sheets
    SHEETS: {
        TURBINE: "Log_TP",
        CT: "Log_CT",
        OLI: "Log_OLI"
    }
};

(function sanitizeConfig() {
    try {
        CONFIG.GAS_URL = CONFIG.GAS_URL.trim().replace(/\s+/g, '').replace(/\/+$/, '');
        if (!CONFIG.GAS_URL.endsWith('/exec')) {
            CONFIG.GAS_URL += '/exec';
        }
        if (CONFIG.DEBUG) console.log("✅ Config Ready. Target:", CONFIG.GAS_URL);
    } catch (err) {
        console.error("❌ Config Error:", err);
    }
})();
