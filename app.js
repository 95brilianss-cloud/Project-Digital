// ================== KONFIGURASI ==================
const CONFIG = {
    // 🔴 GANTI DENGAN URL GAS ANDA YANG BARU DEPLOY
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwQfOX5Z4yC6Tp2BXEz5EAfif2YxswSZJsVqDxJcBALdL_dpv0MltfKf8rg52PT0gqt/exec',
    
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 30000,
    DB_NAME: 'TurbineLogDB',
    APP_VERSION: '3.4.0',
    DEBUG: true
};

// Sanitasi URL
CONFIG.GAS_URL = CONFIG.GAS_URL.replace(/\s+/g, '').replace(/\/+$/, '');

// Validasi
if (!CONFIG.GAS_URL.includes('script.google.com')) {
    alert('❌ URL GAS tidak valid!');
}

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
        
        console.log(`[${entry.time}] ${type}: ${message}`, data || '');
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
            
            // Auto-sync saat online
            window.addEventListener('online', () => {
                Debug.info('Online detected, syncing...');
                this.showToast('🌐 Online! Menyinkronkan...', 'success');
                this.syncData();
            });
            
            window.addEventListener('offline', () => {
                this.showToast('📴 Mode offline aktif', 'warning');
            });
            
            Debug.success('App initialized successfully');
        } catch (error) {
            Debug.error('Init failed:', error.message);
            this.showToast('Error inisialisasi: ' + error.message, 'error');
        }
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            
            request.onerror = () => reject(new Error('DB failed to open'));
            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.dbInitialized = true;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending')) {
                    const store = db.createObjectStore('pending', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // ================== API METHODS (GET ONLY) ==================
    
    async syncWithRetry(data, attempt = 1) {
        Debug.info(`API GET attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
        
        try {
            // Buat query string dari data
            const jsonData = JSON.stringify(data);
            
            // Cek panjang data (GET limit ~2000 chars)
            if (jsonData.length > 1500) {
                Debug.warn('Data terlalu besar untuk GET, gunakan local queue');
                throw new Error('Data too large for GET method');
            }
            
            const params = new URLSearchParams({
                action: 'saveData',
                data: jsonData
            });
            
            const url = `${CONFIG.GAS_URL}?${params.toString()}`;
            Debug.info('Fetching:', url.substring(0, 150) + '...');
            
            // Fetch dengan timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const responseText = await response.text();
            Debug.info('Response:', responseText.substring(0, 200));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }
            
            const result = JSON.parse(responseText);
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            Debug.success('Sync successful');
            return { success: true, data: result.result };

        } catch (error) {
            Debug.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                const delay = CONFIG.RETRY_DELAY * attempt;
                Debug.info(`Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                return this.syncWithRetry(data, attempt + 1);
            }
            
            return { success: false, error: error.message };
        }
    }

    // ================== SAVE METHODS ==================
    
    async saveToApiOrQueue(payload, typeName) {
        this.showLoading(true);
        Debug.info(`Saving ${typeName}...`, payload);
        
        try {
            if (navigator.onLine) {
                const result = await this.syncWithRetry(payload);
                
                if (result.success) {
                    this.showToast(`✅ ${typeName} berhasil disimpan ke server!`, 'success');
                    Debug.success(`${typeName} saved to API`);
                } else {
                    // Gagal setelah retry, simpan lokal
                    throw new Error(result.error);
                }
            } else {
                // Offline mode
                Debug.warn('Offline mode - saving to local');
                await this.queueForSync(payload);
                this.showToast(`📴 ${typeName} disimpan lokal (offline)`, 'warning');
            }
        } catch (error) {
            Debug.error('API save failed:', error.message);
            
            // Fallback ke local storage
            try {
                await this.queueForSync(payload);
                this.showToast(`⚠️ ${typeName} disimpan lokal (akan sync nanti)`, 'warning');
            } catch (localError) {
                Debug.error('CRITICAL: Local save also failed:', localError);
                this.showToast(`❌ Gagal menyimpan: ${localError.message}`, 'error');
            }
        } finally {
            this.showLoading(false);
            this.updateStatus();
            
            if (typeName === 'Logsheet') {
                this.navigate('home');
            }
        }
    }

    async queueForSync(data) {
        if (!this.db) throw new Error('Database not ready');
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['pending'], 'readwrite');
            const store = tx.objectStore('pending');
            
            const record = {
                data: data,
                created: new Date().toISOString(),
                retries: 0
            };
            
            const request = store.add(record);
            
            request.onsuccess = (e) => {
                Debug.success('Data queued with ID:', e.target.result);
                resolve(e.target.result);
            };
            
            request.onerror = (e) => {
                Debug.error('Queue failed:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    async syncData() {
        if (!navigator.onLine || !this.db) {
            Debug.info('Cannot sync: offline or no DB');
            return;
        }
        
        const tx = this.db.transaction(['pending'], 'readonly');
        const store = tx.objectStore('pending');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const pending = request.result;
            Debug.info(`Found ${pending.length} pending items`);
            
            if (pending.length === 0) {
                this.showToast('✅ Tidak ada data pending', 'success');
                return;
            }
            
            let success = 0, failed = 0;
            
            for (const item of pending) {
                try {
                    Debug.info(`Syncing item ${item.id}...`);
                    const result = await this.syncWithRetry(item.data);
                    
                    if (result.success) {
                        // Hapus dari queue jika sukses
                        const delTx = this.db.transaction(['pending'], 'readwrite');
                        delTx.objectStore('pending').delete(item.id);
                        success++;
                    } else {
                        // Update retry count
                        const updateTx = this.db.transaction(['pending'], 'readwrite');
                        const updateStore = updateTx.objectStore('pending');
                        item.retries++;
                        item.lastError = result.error;
                        updateStore.put(item);
                        failed++;
                    }
                } catch (err) {
                    Debug.error(`Exception syncing item ${item.id}:`, err);
                    failed++;
                }
            }
            
            const msg = `✅ ${success} sukses, ❌ ${failed} gagal`;
            this.showToast(msg, success > 0 ? 'success' : 'warning');
            this.updateStatus();
        };
    }

    // ================== FORM & NAVIGATION ==================
    
    navigate(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
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
        
        const navMap = { home: 0, laporan: 1, anomali: 2, dashboard: 3 };
        if (navMap[page] !== undefined) {
            document.querySelectorAll('.nav-item')[navMap[page]].classList.add('active');
        }
        
        if (page === 'home') this.updateStatus();
    }

    showAreaSelection(mode) {
        this.currentMode = mode;
        const areas = {
            TURBINE: {
                "Steam Inlet Turbine": ["MPS Inlet 30-TP-6101 PI-6114 (kg/cm2)", "MPS Inlet 30-TP-6101 TI-6153 (°C)"],
                "Low Pressure Steam": ["LPS from U-6101 PI-6104 (kg/cm2)", "LPS from U-6101 TI-6102 (°C)"],
                "Lube Oil": ["Lube Oil 30-TK-6102 LI-6104 (%)", "Lube Oil 30-TK-6102 TI-6125 (°C)"],
                "Control Oil": ["Control Oil 30-TK-6103 LI-6106 (%)", "Control Oil 30-TK-6103 TI-6128 (°C)"],
                "Shaft Line": ["Jacking Oil 30-P-6105 PI-6158 (Bar)", "EH-6101 (ON/OFF)"],
                "Condenser 30-E-6102": ["LG-6102 (%)", "30-P-6101 (A/B)"],
                "Ejector": ["J-6101 PI-6126 A (Kg/cm2)", "J-6102 PI-6128 A (Kg/cm2)"],
                "Generator Cooling Water": ["Air Cooler PI-6124 A (Kg/cm2)", "Air Cooler TI-6113 A (°C)"],
                "Condenser Cooling Water": ["Condenser PI-6135 A (Kg/cm2)", "Condenser TI-6118 A (°C)"],
                "BFW System": ["Condensate Tank TK-6201 (%)", "P-6202 (A/B)"],
                "Chemical Dosing": ["30-TK-6205 LI-6204 (%)", "30-TK-6205 Stroke (%)"]
            },
            CT: {
                "BASIN SA": ["D-6511 LEVEL BASIN", "MT-6511 A STATUS"],
                "BASIN SU": ["D-6521 LEVEL BASIN", "MT-6521 A STATUS"],
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
            div.innerHTML = `<span>${areaName}</span><span style="color: var(--text-muted);">${areas[mode][areaName].length} parameter</span>`;
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
        
        // Show/hide quick actions
        const quickActions = document.getElementById('quickActions');
        if (quickActions) {
            const hasQuick = param.includes('(On/Off)') || param.includes('(A/B)') || param.includes('STATUS');
            quickActions.style.display = hasQuick ? 'flex' : 'none';
        }
    }

    setQuickValue(val) {
        document.getElementById('paramInput').value = val;
    }

    nextParameter() {
        const param = this.currentParams[this.currentParamIndex];
        const value = document.getElementById('paramInput').value.trim();
        
        if (!value) {
            this.showToast('Silakan isi nilai parameter', 'warning');
            document.getElementById('paramInput').classList.add('error');
            return;
        }
        
        this.paramData[param] = value;
        document.getElementById('paramInput').classList.remove('error');
        
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
        this.showToast('✅ Laporan disimpan!', 'success');
    }

    async saveAnomali(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = document.getElementById('anomaliId').value;
        
        const payload = {
            type: 'ANOMALI',
            id: id,
            area: formData.get('area'),
            description: formData.get('description'),
            status: 'OPEN',
            timestamp: new Date().toISOString()
        };
        
        // Note: Photo tidak dikirim via GET karena terlalu besar
        // Simpan photo ke local storage atau gunakan metode lain
        
        await this.saveToApiOrQueue(payload, 'Anomali');
        this.generateAnomaliId();
        e.target.reset();
        this.loadAnomaliList();
    }

    generateAnomaliId() {
        const id = 'ANM-' + Date.now().toString(36).toUpperCase();
        const el = document.getElementById('anomaliId');
        if (el) el.value = id;
    }

    // ================== DATA LOADING ==================
    
    async loadAnomaliList() {
        try {
            const url = `${CONFIG.GAS_URL}?action=getAnomali`;
            const response = await fetch(url, { method: 'GET', mode: 'cors' });
            const result = await response.json();
            
            if (result.status === 'success') {
                this.renderAnomaliList(result.result);
            }
        } catch (err) {
            Debug.error('Failed to load anomali:', err);
            this.renderAnomaliList([]);
        }
    }

    renderAnomaliList(anomalies) {
        const container = document.getElementById('anomaliList');
        if (!container) return;
        
        if (!anomalies || anomalies.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Belum ada anomali</p></div>';
            return;
        }
        
        container.innerHTML = anomalies.map(a => `
            <div class="anomali-item">
                <div class="anomali-header">
                    <span class="anomali-id">${a.id}</span>
                    <span class="status-badge status-${(a.status || 'OPEN').toLowerCase()}">${a.status || 'OPEN'}</span>
                </div>
                <div class="anomali-desc">${a.description}</div>
                <div class="anomali-meta">
                    <span>👤 ${a.reporter || 'Unknown'}</span>
                    <span>📅 ${new Date(a.timestamp).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
        `).join('');
    }

    async refreshDashboard() {
        try {
            const url = `${CONFIG.GAS_URL}?action=getDashboard`;
            const response = await fetch(url, { method: 'GET', mode: 'cors' });
            const result = await response.json();
            
            if (result.status === 'success') {
                const data = result.result;
                document.getElementById('dashOpen').textContent = data.open || 0;
                document.getElementById('dashProgress').textContent = data.progress || 0;
                document.getElementById('dashClosed').textContent = data.closed || 0;
            }
        } catch (err) {
            Debug.error('Dashboard refresh failed:', err);
        }
    }

    // ================== UI HELPERS ==================
    
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
            
            const badge = document.getElementById('pendingBadge');
            if (badge) {
                badge.textContent = count;
                badge.classList.toggle('hidden', count === 0);
            }
        };
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.toggle('active', show);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) {
            alert(message); // Fallback
            return;
        }
        
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            const pages = ['home', 'laporan', 'anomali', 'dashboard'];
            item.addEventListener('click', () => this.navigate(pages[index]));
        });
        
        // Forms
        document.getElementById('laporanForm')?.addEventListener('submit', (e) => this.saveLaporan(e));
        document.getElementById('anomaliForm')?.addEventListener('submit', (e) => this.saveAnomali(e));
    }
}

// Initialize app
const app = new TurbineApp();
