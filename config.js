// ================== KONFIGURASI UTAMA ==================
// GANTI URL GOOGLE APPS SCRIPT ANDA DI SINI SAJA

const CONFIG = {
    // 🔴 GANTI URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA
    GAS_URL: 'https://script.google.com/macros/s/AKfycbxShqFQUgVQyZTZsHltB05QgG-gdPCtl9tZC_bM1mtzcJzRZGNPKiyxVUvsqKDM4ZSs/exec',
    
    // Pengaturan App
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SYNC_INTERVAL: 30000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '2.0.0',
    
    // Debug Mode (true untuk development, false untuk production)
    DEBUG: true
};

// Export untuk module (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
