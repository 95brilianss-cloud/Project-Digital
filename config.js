// ================== KONFIGURASI UTAMA ==================
// 🔴 GANTI URL INI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA

const CONFIG = {
    // URL Web App dari Google Apps Script (Deploy → Web app)
    GAS_URL: 'https://script.google.com/macros/s/AKfycbw2hvmrr3GG8MJ55nbycfJ_j9OcLcuVsv0QMhvod4HfBCdgQTJToJ7fGkeWuIGTNRus/exec',
    
    // Pengaturan App
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SYNC_INTERVAL: 30000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.0.0',
    
    // Debug Mode
    DEBUG: true,
    
    // Sheet names (harus sama dengan SHEET_NAMES di GAS)
    SHEETS: {
        TURBINE: "Log_TP",
        CT: "Log_CT",
        OLI: "Log_OLI",
        TPM: "Data_TPM",
        PAGI: "Laporan_Pagi",
        SORE: "Laporan_Sore",
        MALAM: "Laporan_Malam"
    }
};

// Export untuk module (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
