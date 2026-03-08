/**
 * KONFIGURASI UTAMA - Turbine Logsheet PWA
 * Versi: 3.5.0
 */

const CONFIG = {
    // URL API dari Google Apps Script Deployment
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwQfOX5Z4yC6Tp2BXEz5EAfif2YxswSZJsVqDxJcBALdL_dpv0MltfKf8rg52PT0gqt/exec',
    
    // Pengaturan Sinkronisasi & Ketahanan Koneksi
    MAX_RETRIES: 3,             // Maksimal percobaan kirim ulang jika gagal
    RETRY_DELAY: 3000,          // Jeda waktu (ms) sebelum mencoba lagi
    SYNC_INTERVAL: 60000,       // Cek data pending setiap 60 detik
    TIMEOUT: 30000,             // Batas waktu tunggu server (30 detik)
    
    // Pengaturan Database Lokal (IndexedDB)
    DB_NAME: 'TurbineLogDB',
    DB_VERSION: 1,
    
    // Metadata Aplikasi
    APP_VERSION: '3.5.0',
    DEBUG: true,
    
    // Pemetaan Nama Sheet di Google Spreadsheet
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

// ================== SANITASI & VALIDASI MESIN ==================

(function sanitizeConfig() {
    try {
        if (typeof CONFIG.GAS_URL !== 'string') throw "GAS_URL harus berupa string";

        // 1. Bersihkan spasi dan karakter aneh
        CONFIG.GAS_URL = CONFIG.GAS_URL.trim().replace(/\s+/g, '');

        // 2. Koreksi trailing slash
        CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\/+$/, '');

        // 3. Validasi Keamanan & Format
        if (!CONFIG.GAS_URL.startsWith('https://')) {
            throw "GAS_URL harus menggunakan protokol HTTPS";
        }

        if (!CONFIG.GAS_URL.includes('script.google.com')) {
            throw "Domain URL tidak valid (Bukan Google Script)";
        }

        // 4. Pastikan berakhir dengan /exec
        if (!CONFIG.GAS_URL.endsWith('/exec')) {
            // Jika berakhir /exec/ (dengan slash), sudah dibersihkan di step 2
            // Jika tidak ada /exec sama sekali, tampilkan peringatan keras
            console.error('❌ CRITICAL: URL tidak berakhir dengan /exec. API mungkin gagal.');
        }

        if (CONFIG.DEBUG) {
            console.log(`%c [CONFIG] v${CONFIG.APP_VERSION} Loaded `, 'background: #222; color: #bada55; font-weight: bold;');
            console.log('Target API:', CONFIG.GAS_URL);
        }

    } catch (err) {
        console.error('❌ CONFIG ERROR:', err);
        // Tampilkan pesan error ke user jika di browser
        if (typeof window !== 'undefined') {
            alert('Konfigurasi Aplikasi Rusak: ' + err);
        }
    }
})();

// Export untuk berbagai lingkungan
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
