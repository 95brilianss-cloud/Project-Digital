// ================== KONFIGURASI UTAMA ==================

const CONFIG = {
    // 🔴 HAPUS SPASI DI AKHIR! Harus: /exec (tanpa spasi)
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyVXzCsgx9ieN65f90b2WOb-JndAAPc15Y1BPnibk6aKjQXqOgNXqvTsea2z49HTegN/exec',
    
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SYNC_INTERVAL: 30000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.0.2', // Update versi setelah fix
    
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

// ================== SANITASI & VALIDASI ==================
// Urutan yang benar: Sanitasi dulu, validasi kemudian

// 1. Hapus semua whitespace (spasi, tab, newline, non-breaking space)
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\s+/g, '');

// 2. Hapus trailing slash berlebihan
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\/+$/, '');

// 3. Validasi URL tidak kosong
if (!CONFIG.GAS_URL || CONFIG.GAS_URL === '') {
    console.error('❌ FATAL ERROR: GAS_URL kosong!');
    alert('Error: URL GAS belum diisi!');
    throw new Error('GAS_URL is empty');
}

// 4. Validasi format URL GAS
if (!CONFIG.GAS_URL.includes('script.google.com')) {
    console.error('❌ FATAL ERROR: Bukan URL Google Apps Script!');
    alert('Error: URL bukan dari Google Apps Script!');
    throw new Error('Invalid GAS_URL domain');
}

// 5. Validasi akhiran .exec
if (!CONFIG.GAS_URL.endsWith('/exec')) {
    console.warn('⚠️ WARNING: URL seharusnya diakhiri dengan /exec');
    // Auto-fix jika ada typo kecil
    if (CONFIG.GAS_URL.endsWith('/exec/')) {
        CONFIG.GAS_URL = CONFIG.GAS_URL.slice(0, -1);
        console.log('✅ Auto-fixed trailing slash');
    }
}

// Debug info
console.log('✅ CONFIG loaded successfully');
console.log('🔗 GAS_URL:', CONFIG.GAS_URL);
console.log('🔗 Length:', CONFIG.GAS_URL.length);
console.log('🔗 Last 10 chars:', CONFIG.GAS_URL.slice(-10)); // Harus berakhir dengan /exec
console.log('📱 Version:', CONFIG.APP_VERSION);

// Export untuk module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
