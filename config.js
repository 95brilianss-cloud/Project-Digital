// ================== KONFIGURASI UTAMA ==================

const CONFIG = {
    // URL Web App dari Google Apps Script (Deploy → Web app)
    // 🔴 PASTIKAN TIDAK ADA SPASI SETELAH /exec
    GAS_URL: 'https://script.google.com/macros/s/AKfycbx2uj3lIFQFKHV4TEDFN-7H1wK6d6IO6-g80S0HOBgVCYIiAF0z7pfpBRTncPO0geFK/exec',
    
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SYNC_INTERVAL: 30000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.0.1', // Update versi setelah fix
    
    DEBUG: true,
    
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

// ================== SANITASI & VALIDASI OTOMATIS ==================
// Hapus spasi/karakter tersembunyi dari URL
CONFIG.GAS_URL = CONFIG.GAS_URL.trim();

// Validasi ketat
if (!CONFIG.GAS_URL || CONFIG.GAS_URL === '') {
    console.error('❌ FATAL ERROR: GAS_URL kosong!');
    alert('Error: URL GAS belum diisi!');
}

if (CONFIG.GAS_URL.includes(' ')) {
    console.error('❌ FATAL ERROR: GAS_URL mengandung spasi!');
    alert('Error: URL GAS mengandung spasi. Periksa config.js!');
    throw new Error('Invalid GAS_URL: contains spaces');
}

// Pastikan tidak ada trailing slash yang berlebihan
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\/+$/, '');

// Debug info
console.log('✅ CONFIG loaded successfully');
console.log('🔗 GAS_URL:', CONFIG.GAS_URL);
console.log('📱 Version:', CONFIG.APP_VERSION);

// Export untuk module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
