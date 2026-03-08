// ================== KONFIGURASI ==================
const CONFIG = {
    // Pastikan URL diakhiri dengan /exec
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyUAZdKUPO38jeTkD7iTF2cNWg7_0ocaEOhd3GiLIXxPWOgKQMcpgLFdmlbgGejr_1P/exec',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.5.0'
};

// ================== APP CLASS ==================
class TurbineApp {
    constructor() {
        this.db = null;
        this.isSyncing = false;
        this.init();
    }

    async init() {
        console.log(`🚀 TurbineApp v${CONFIG.APP_VERSION} Initializing...`);
        try {
            await this.initDB();
            this.bindEvents();
            this.updateUIStatus();
            // Coba sinkronisasi otomatis saat startup jika online
            if (navigator.onLine) this.syncAll();
        } catch (err) {
            this.showToast('Gagal inisialisasi database', 'danger');
        }
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onerror = () => reject();
        });
    }

    bindEvents() {
        window.addEventListener('online', () => {
            this.showToast('🌐 Kembali Online. Sinkronisasi...', 'success');
            this.syncAll();
        });
        
        window.addEventListener('offline', () => {
            this.showToast('📴 Mode Offline Aktif', 'warning');
        });
    }

    // 🟢 PERBAIKAN: Gunakan POST untuk keamanan data besar (CORS Handling)
    async saveToServer(payload) {
        try {
            // Google Apps Script memerlukan mode: 'no-cors' jika POST tanpa preflight, 
            // tapi kita akan gunakan 'cors' karena script GAS kita sudah diset 'Anyone'.
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                mode: 'cors', 
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                    // Menggunakan text/plain menghindari preflight OPTIONS yang sering gagal di GAS
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return { success: result.status === 'success', data: result };
        } catch (error) {
            console.error('Fetch Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ================== LOGIKA PENGIRIMAN ==================

    async handleSubmit(type, data) {
        const payload = {
            type: type,
            ...data,
            timestamp: new Date().toISOString(),
            device_info: navigator.userAgent.slice(0, 50)
        };

        this.showLoading(true);

        if (navigator.onLine) {
            const result = await this.saveToServer(payload);
            if (result.success) {
                this.showToast('✅ Data terkirim ke Spreadsheet', 'success');
                this.showLoading(false);
                return true;
            }
        }

        // Jika offline atau gagal kirim, simpan ke IndexedDB
        await this.saveLocal(payload);
        this.showToast('💾 Offline: Data disimpan di memori HP', 'warning');
        this.showLoading(false);
        this.updateUIStatus();
        return true;
    }

    async saveLocal(payload) {
        const tx = this.db.transaction('pending', 'readwrite');
        await tx.objectStore('pending').add(payload);
    }

    async syncAll() {
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;

        const tx = this.db.transaction('pending', 'readonly');
        const items = await tx.objectStore('pending').getAll();

        if (items.length === 0) {
            this.isSyncing = false;
            return;
        }

        let successCount = 0;
        for (const item of items) {
            const { id, ...payload } = item; // Pisahkan ID auto-increment
            const result = await this.saveToServer(payload);
            
            if (result.success) {
                const delTx = this.db.transaction('pending', 'readwrite');
                await delTx.objectStore('pending').delete(id);
                successCount++;
            }
        }

        if (successCount > 0) {
            this.showToast(`🔄 ${successCount} data tersinkronisasi`, 'success');
            this.updateUIStatus();
        }
        this.isSyncing = false;
    }

    // ================== UI CONTROL ==================

    updateUIStatus() {
        const tx = this.db.transaction('pending', 'readonly');
        const request = tx.objectStore('pending').count();
        request.onsuccess = () => {
            const count = request.result;
            const badge = document.getElementById('pendingBadge');
            const countText = document.getElementById('pendingCount');
            
            if (badge) {
                badge.textContent = count;
                badge.classList.toggle('hidden', count === 0);
            }
            if (countText) countText.textContent = `${count} item pending`;
        };
    }

    showLoading(status) {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = status ? 'flex' : 'none';
    }

    showToast(msg, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.className = 'toast', 3000);
    }
}
