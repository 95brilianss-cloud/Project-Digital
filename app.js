// ================== KONFIGURASI ==================
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyUAZdKUPO38jeTkD7iTF2cNWg7_0ocaEOhd3GiLIXxPWOgKQMcpgLFdmlbgGejr_1P/exec',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.4.1',
    DEBUG: true
};

// Sanitasi URL
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\s+/g, '').replace(/\/+$/, '');

// ================== DEBUG ==================
const Debug = {
    log: function(type, msg, data) {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] ${type}: ${msg}`, data || '');
    },
    info: function(msg, data) { this.log('INFO', msg, data); },
    error: function(msg, data) { this.log('ERROR', msg, data); },
    success: function(msg, data) { this.log('SUCCESS', msg, data); }
};

// ================== APP ==================
class TurbineApp {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        Debug.info('App v' + CONFIG.APP_VERSION);
        await this.initDB();
        this.updateStatus();
        
        // Sync saat online
        window.addEventListener('online', () => {
            this.showToast('🌐 Online - syncing...', 'success');
            this.syncAll();
        });
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            request.onerror = () => reject(new Error('DB failed'));
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    // 🔴 PERBAIKAN UTAMA: Gunakan GET 100%
    async saveToServer(data) {
        Debug.info('Saving via GET...');
        
        try {
            // Convert data ke JSON string
            const jsonStr = JSON.stringify(data);
            
            // Cek panjang (limit URL ~2000 chars)
            if (jsonStr.length > 1800) {
                throw new Error('Data too large');
            }
            
            // Buat URL dengan query params
            const params = new URLSearchParams({
                action: 'saveData',
                data: jsonStr
            });
            
            const url = `${CONFIG.GAS_URL}?${params.toString()}`;
            Debug.info('URL:', url.substring(0, 100) + '...');
            
            // FETCH DENGAN GET (BUKAN POST!)
            const response = await fetch(url, {
                method: 'GET',  // ✅ GET, bukan POST!
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const result = await response.json();
            Debug.info('Response:', result);
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            return { success: true, data: result.result };
            
        } catch (error) {
            Debug.error('Save failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Save dengan retry
    async saveWithRetry(data, attempt = 1) {
        const result = await this.saveToServer(data);
        
        if (result.success) {
            return result;
        }
        
        if (attempt < CONFIG.MAX_RETRIES) {
            Debug.info(`Retry ${attempt + 1}...`);
            await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY));
            return this.saveWithRetry(data, attempt + 1);
        }
        
        return result;
    }

    // ================== FORM HANDLERS ==================
    
    async submitLogsheet(formData) {
        const payload = {
            type: 'LOGSHEET',
            mode: formData.mode || 'TURBINE',
            area: formData.area,
            data: formData.params,
            timestamp: new Date().toISOString()
        };
        
        this.showLoading(true);
        
        if (navigator.onLine) {
            const result = await this.saveWithRetry(payload);
            
            if (result.success) {
                this.showToast('✅ Data tersimpan ke server!', 'success');
            } else {
                // Gagal, simpan ke local
                await this.saveLocal(payload);
                this.showToast('⚠️ Disimpan lokal (server error)', 'warning');
            }
        } else {
            // Offline
            await this.saveLocal(payload);
            this.showToast('📴 Disimpan lokal (offline)', 'warning');
        }
        
        this.showLoading(false);
        this.updateStatus();
    }

    async submitLaporan(shift, area, detail) {
        const payload = {
            type: 'LAPORAN',
            shift: shift,
            area: area,
            detail: detail,
            timestamp: new Date().toISOString()
        };
        
        const result = await this.saveWithRetry(payload);
        return result.success;
    }

    async submitAnomali(id, area, description) {
        const payload = {
            type: 'ANOMALI',
            id: id,
            area: area,
            description: description,
            status: 'OPEN',
            timestamp: new Date().toISOString()
        };
        
        const result = await this.saveWithRetry(payload);
        return result.success;
    }

    // ================== LOCAL STORAGE ==================
    
    async saveLocal(data) {
        if (!this.db) return;
        
        const tx = this.db.transaction(['pending'], 'readwrite');
        const store = tx.objectStore('pending');
        await store.add({ data: data, created: Date.now() });
        Debug.info('Saved to local queue');
    }

    async syncAll() {
        if (!navigator.onLine || !this.db) return;
        
        const tx = this.db.transaction(['pending'], 'readonly');
        const store = tx.objectStore('pending');
        const items = await store.getAll();
        
        Debug.info(`Syncing ${items.length} items...`);
        
        let success = 0;
        
        for (const item of items) {
            const result = await this.saveToServer(item.data);
            
            if (result.success) {
                // Hapus dari queue
                const delTx = this.db.transaction(['pending'], 'readwrite');
                delTx.objectStore('pending').delete(item.id);
                success++;
            }
        }
        
        if (success > 0) {
            this.showToast(`✅ ${success} data tersinkronisasi!`, 'success');
            this.updateStatus();
        }
    }

    // ================== UI HELPERS ==================
    
    updateStatus() {
        if (!this.db) return;
        
        const tx = this.db.transaction(['pending'], 'readonly');
        const store = tx.objectStore('pending');
        const count = store.count();
        
        count.onsuccess = () => {
            const el = document.getElementById('pendingCount');
            if (el) el.textContent = count.result + ' pending';
        };
    }

    showLoading(show) {
        const el = document.getElementById('loadingOverlay');
        if (el) el.classList.toggle('active', show);
    }

    showToast(msg, type = 'info') {
        const el = document.getElementById('toast');
        if (el) {
            el.textContent = msg;
            el.className = `toast ${type} show`;
            setTimeout(() => el.classList.remove('show'), 3000);
        }
    }
}

// Init
const app = new TurbineApp();
