// ================== KONFIGURASI UTAMA ==================
// 🔴 PASTIKAN URL INI SAMA PERSIS DENGAN URL DEPLOYMENT WEB APP

const CONFIG = {
    // GANTI DENGAN URL WEB APP ANDA YANG BARU
    GAS_URL: 'https://script.google.com/macros/s/AKfycbzxK-di8aKtiowJfU8h-wlCN5ng0sbp_f1DXAp9Xfixugr4Ocdd4WUFsbNiWtVMHV17/exec',
    
    // Pengaturan App
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SYNC_INTERVAL: 30000,
    TIMEOUT: 30000, // Increased timeout untuk GAS
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '2.1.0', // Update version
    
    // Debug Mode
    DEBUG: true,
    
    // CORS Mode - penting untuk GAS
    CORS_MODE: 'cors'
};

// Export untuk module (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
