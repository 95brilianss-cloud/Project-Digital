// ================== KONFIGURASI ==================
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyXXXXXXXXXXXXXXXX/exec', // GANTI DENGAN URL ANDA!
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.3.2',
    DEBUG: true
};

// Sanitasi URL
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\s+/g, '').replace(/\/+$/, '');

// ================== DEBUG LOGGER ==================
const Debug = {
    logs: [],
    
    log(type, message, data) {
        if (!CONFIG.DEBUG && type === 'INFO') return;
        
        const entry = {
            time: new Date().toLocaleTimeString(),
            type,
            message,
            data: data ? JSON.stringify(data).substring(0, 200) : null
        };
        this.logs.push(entry);
        if (this.logs.length > 50) this.logs.shift();
        
        console.log(`[${type}] ${message}`, data || '');
    },
    
    error(msg, data) { this.log('ERROR', msg, data); },
    info(msg, data) { this.log('INFO', msg, data); },
    success(msg, data) { this.log('SUCCESS', msg, data); }
};

// ================== APP CLASS ==================
class TurbineApp {
    constructor() {
        this.currentMode = 'TURBINE';
        this.currentArea = null;
        this.db = null;
        this.photoData = null;
        this.currentParamIndex = 0;
        this.currentParams = [];
        this.paramData = {};
        this.dbInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            Debug.info('Initializing app v' + CONFIG.APP_VERSION);
            await this.initDB();
            
            this.setupEventListeners();
            this.generateAnomaliId();
            this.updateStatus();
            
            window.addEventListener('online', () => {
                Debug.info('Online - syncing...');
                this.showToast('🌐 Online! Menyinkronkan...', 'success');
                this.syncData();
            });
            
            window.addEventListener('offline', () => {
                this.showToast('📴 Mode offline', 'warning');
            });
            
            Debug.success('App initialized');
        } catch (error) {
            Debug.error('Init failed: ' + error.message);
        }
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            
            request.onerror = () => reject(new Error('DB failed'));
            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.dbInitialized = true;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    const store = db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // ================== API METHODS (PERBAIKAN UTAMA) ==================
    
    async syncWithRetry(data, attempt = 1) {
        Debug.info(`API attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            // METHOD 1: POST dengan JSON
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data), // Kirim sebagai JSON string
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();
            Debug.info('Response:', responseText.substring(0, 200));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = JSON.parse(responseText);
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            return { success: true, data: result.result };

        } catch (error) {
            Debug.error(`Attempt ${attempt} failed:`, error.message);
            
            // Fallback ke GET jika ini attempt terakhir
            if (attempt === CONFIG.MAX_RETRIES) {
                Debug.info('Trying GET fallback...');
                return this.syncViaGet(data);
            }
            
            // Retry dengan delay
            await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY * attempt));
            return this.syncWithRetry(data, attempt + 1);
        }
    }

    async syncViaGet(data) {
        try {
            // Konversi data ke query params (untuk data kecil saja)
            const params = new URLSearchParams({
                action: 'saveData',
                data: JSON.stringify(data)
            });
            
            const url = `${CONFIG.GAS_URL}?${params.toString()}`;
            
            // Cek panjang URL (max 2000 chars)
            if (url.length > 2000) {
                throw new Error('Data too large for GET method');
            }
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Accept': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            return { success: true, data: result.result };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ================== SAVE METHODS ==================
    
    async saveToApiOrQueue(payload, typeName) {
        this.showLoading(true);
        Debug.info(`Saving ${typeName}...`);
        
        try {
            if (navigator.onLine) {
                const result = await this.syncWithRetry(payload);
                
                if (result.success) {
                    this.showToast(`✅ ${typeName} tersimpan!`, 'success');
                    Debug.success('Saved to API');
                } else {
                    throw new Error(result.error);
                }
            } else {
                await this.queueForSync(payload);
                this.showToast(`📴 ${typeName} disimpan lokal`, 'warning');
            }
        } catch (error) {
            Debug.error('API failed, saving local:', error.message);
            await this.queueForSync(payload);
            this.showToast(`⚠️ ${typeName} disimpan lokal`, 'warning');
        } finally {
            this.showLoading(false);
            this.updateStatus();
            
            if (typeName === 'Logsheet') this.navigate('home');
        }
    }

    async queueForSync(data) {
        if (!this.db) throw new Error('DB not ready');
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['pending'], 'readwrite');
            const store = tx.objectStore('pending');
            
            const record = {
                data: data,
                created: new Date().toISOString(),
                retries: 0
            };
            
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async syncData() {
        if (!navigator.onLine || !this.db) return;
        
        const tx = this.db.transaction(['pending'], 'readonly');
        const store = tx.objectStore('pending');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const pending = request.result;
            if (pending.length === 0) return;
            
            Debug.info(`Syncing ${pending.length} items...`);
            let success = 0, failed = 0;
            
            for (const item of pending) {
                try {
                    const result = await this.syncWithRetry(item.data);
                    
                    if (result.success) {
                        const delTx = this.db.transaction(['pending'], 'readwrite');
                        delTx.objectStore('pending').delete(item.id);
                        success++;
                    } else {
                        failed++;
                    }
                } catch (err) {
                    failed++;
                }
            }
            
            this.showToast(`✅ ${success} sukses, ❌ ${failed} gagal`, success > 0 ? 'success' : 'warning');
            this.updateStatus();
        };
    }

    // ================== FORM HANDLING ==================
    
    showAreaSelection(mode) {
        this.currentMode = mode;
        const areas = {
            TURBINE: {
                "Steam Inlet Turbine": ["MPS Inlet PI-6114", "MPS Inlet TI-6153"],
                "Low Pressure Steam": ["LPS from U-6101 PI-6104", "LPS from U-6101 TI-6102"],
                "Lube Oil": ["Lube Oil LI-6104", "Lube Oil TI-6125"],
                "Control Oil": ["Control Oil LI-6106", "Control Oil TI-6128"],
                "Shaft Line": ["Jacking Oil PI-6158", "EH-6101"],
                "Condenser 30-E-6102": ["LG-6102", "30-P-6101"],
                "Ejector": ["J-6101 PI-6126 A", "J-6101 PI-6127 B"],
                "Generator Cooling Water": ["Air Cooler PI-6124 A", "Air Cooler TI-6113 A"],
                "Condenser Cooling Water": ["Condenser PI-6135 A", "Condenser TI-6118 A"],
                "BFW System": ["Condensate Tank TK-6201", "P-6202"],
                "Chemical Dosing": ["30-TK-6205 LI-6204", "30-TK-6205 Stroke"]
            },
            CT: {
                "BASIN SA": ["D-6511 LEVEL", "MT-6511 A STATUS"],
                "BASIN SU": ["D-6521 LEVEL", "MT-6521 A STATUS"],
                "LH & TH": ["LH C-6701 A", "TH C-6701 A"],
                "COMPRESSOR": ["C-6701 A STATUS", "C-6701 A PRESSURE"]
            },
            OLI: {
                "OLI GEARBOX SA": ["MT-6511 A", "MT-6511 B"],
                "OLI GEARBOX SU": ["MT-6521 B", "MT-6521 C"]
            }
        };

        const container = document.getElementById('areaList');
        if (!container) return;
        
        container.innerHTML = '';
        Object.keys(areas[mode]).forEach((areaName) => {
            const div = document.createElement('div');
            div.className = 'area-item';
            div.innerHTML = `<span>${areaName}</span><span>${areas[mode][areaName].length} parameter</span>`;
            div.onclick = () => this.selectArea(areaName, areas[mode][areaName]);
            container.appendChild(div);
        });
        
        this.navigate('areaSelection');
    }

    selectArea(areaName, params) {
        this.currentArea = areaName;
        this.currentParams = params;
        this.currentParamIndex = 0;
        this.paramData = {};
        this.showParameter();
        this.navigate('input');
    }

    showParameter() {
        const param = this.currentParams[this.currentParamIndex];
        const total = this.currentParams.length;
        const progress = ((this.currentParamIndex / total) * 100).toFixed(0);
        
        document.getElementById('inputCounter').textContent = `${this.currentParamIndex + 1}/${total}`;
        document.getElementById('inputProgress').style.width = progress + '%';
        document.getElementById('paramName').textContent = param;
        
        const input = document.getElementById('paramInput');
        input.value = this.paramData[param] || '';
        input.focus();
    }

    setQuickValue(val) {
        document.getElementById('paramInput').value = val;
    }

    nextParameter() {
        const param = this.currentParams[this.currentParamIndex];
        const value = document.getElementById('paramInput').value.trim();
        
        if (!value) {
            this.showToast('Isi nilai parameter', 'warning');
            return;
        }
        
        this.paramData[param] = value;
        this.currentParamIndex++;
        
        if (this.currentParamIndex >= this.currentParams.length) {
            this.saveLogsheet();
        } else {
            this.showParameter();
        }
    }

    prevParameter() {
        if (this.currentParamIndex > 0) {
            this.currentParamIndex--;
            this.showParameter();
        } else {
            this.showAreaSelection(this.currentMode);
        }
    }

    async saveLogsheet() {
        const payload = {
            type: 'LOGSHEET',
            mode: this.currentMode,
            area: this.currentArea,
            data: this.paramData,
            timestamp: new Date().toISOString()
        };
        
        await this.saveToApiOrQueue(payload, 'Logsheet');
    }

    async saveLaporan(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const payload = {
            type: 'LAPORAN',
            shift: formData.get('shift'),
            area: formData.get('area'),
            detail: formData.get('detail'),
            timestamp: new Date().toISOString()
        };
        
        await this.saveToApiOrQueue(payload, 'Laporan');
        e.target.reset();
    }

    async saveAnomali(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const payload = {
            type: 'ANOMALI',
            id: document.getElementById('anomaliId').value,
            area: formData.get('area'),
            description: formData.get('description'),
            photo: this.photoData,
            status: 'OPEN',
            timestamp: new Date().toISOString()
        };
        
        await this.saveToApiOrQueue(payload, 'Anomali');
        this.generateAnomaliId();
        this.photoData = null;
        document.getElementById('photoPreview').classList.add('hidden');
        e.target.reset();
    }

    // ================== UI METHODS ==================
    
    navigate(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        const pageMap = {
            home: 'pageHome',
            logsheet: 'pageAreaSelection',
            laporan: 'pageLaporan',
            anomali: 'pageAnomali',
            dashboard: 'pageDashboard',
            input: 'pageInput',
            areaSelection: 'pageAreaSelection'
        };
        
        const el = document.getElementById(pageMap[page]);
        if (el) el.classList.add('active');
        
        if (page === 'home') this.updateStatus();
    }

    generateAnomaliId() {
        const id = 'ANM-' + Date.now().toString(36).toUpperCase();
        const el = document.getElementById('anomaliId');
        if (el) el.value = id;
    }

    previewPhoto(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.photoData = e.target.result;
                const preview = document.getElementById('photoPreview');
                if (preview) {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    updateStatus() {
        const onlineEl = document.getElementById('onlineStatus');
        if (onlineEl) onlineEl.textContent = navigator.onLine ? '✅ Online' : '❌ Offline';
        
        if (!this.db) return;
        
        const tx = this.db.transaction(['pending'], 'readonly');
        const store = tx.objectStore('pending');
        const request = store.count();
        
        request.onsuccess = () => {
            const count = request.result;
            const pendingEl = document.getElementById('pendingCount');
            if (pendingEl) pendingEl.textContent = count + ' items';
        };
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.toggle('active', show);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('logsheetForm')?.addEventListener('submit', (e) => this.saveLaporan(e));
        document.getElementById('anomaliForm')?.addEventListener('submit', (e) => this.saveAnomali(e));
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            const pages = ['home', 'laporan', 'anomali', 'dashboard'];
            item.addEventListener('click', () => this.navigate(pages[index]));
        });
    }
}

// Initialize
const app = new TurbineApp();
