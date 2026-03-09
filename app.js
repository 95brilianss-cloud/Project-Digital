class TurbineApp {
    constructor() {
        this.db = null;
        this.isSyncing = false;
        this.init();
    }

    async init() {
        try {
            await this.initDB();
            this.bindEvents();
            this.setupAutoSync(); // Menjalankan cek periodik
            this.updateUIStatus();
            if (navigator.onLine) this.syncAll();
        } catch (err) {
            this.showToast('Gagal inisialisasi system', 'danger');
        }
    }

    // --- Database & Sync Logic ---
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            request.onerror = () => reject();
        });
    }

    setupAutoSync() {
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) this.syncAll();
        }, CONFIG.SYNC_INTERVAL);
    }

    // --- Communication Logic ---
    async saveToServer(payload) {
        try {
            // Kita kirim sebagai text/plain agar tidak memicu CORS Preflight
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                mode: 'no-cors', // Penting untuk Google Apps Script
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            // Karena no-cors, kita tidak bisa membaca isi JSON response secara langsung
            // Namun, jika fetch tidak throw error, kita asumsikan data sampai di server
            return { success: true }; 
        } catch (error) {
            console.error('Fetch Error:', error);
            return { success: false, error: error.message };
        }
    }

    async handleSubmit(sheetName, formData) {
        const payload = {
            targetSheet: sheetName, // Misal: CONFIG.SHEETS.TURBINE
            data: formData,
            timestamp: new Date().toLocaleString('id-ID'),
            version: CONFIG.APP_VERSION
        };

        this.showLoading(true);

        if (navigator.onLine) {
            const result = await this.saveToServer(payload);
            if (result.success) {
                this.showToast('✅ Berhasil dikirim ke Cloud', 'success');
                this.showLoading(false);
                return true;
            }
        }

        // Simpan lokal jika offline atau fetch gagal
        await this.saveLocal(payload);
        this.showToast('💾 Offline: Tersimpan di Antrean', 'warning');
        this.showLoading(false);
        this.updateUIStatus();
        return true;
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

        for (const item of items) {
            const { id, ...payload } = item;
            const result = await this.saveToServer(payload);
            
            if (result.success) {
                const delTx = this.db.transaction('pending', 'readwrite');
                await delTx.objectStore('pending').delete(id);
            }
        }

        this.updateUIStatus();
        this.isSyncing = false;
    }

    // --- UI Helpers ---
    showToast(msg, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.className = 'toast', 3000);
    }

    updateUIStatus() {
        const tx = this.db.transaction('pending', 'readonly');
        const req = tx.objectStore('pending').count();
        req.onsuccess = () => {
            const el = document.getElementById('pendingCount');
            if (el) el.textContent = req.result > 0 ? `${req.result} tertunda` : 'Sinkron';
        };
    }

    showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = show ? 'block' : 'none';
    }

    bindEvents() {
        window.addEventListener('online', () => this.syncAll());
    }
}

// Inisialisasi
const App = new TurbineApp();
