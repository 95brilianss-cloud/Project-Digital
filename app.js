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
        this.updatePanel();
    },
    
    updatePanel() {
        const panel = document.getElementById('debugPanel');
        if (!panel || panel.style.display === 'none') return;
        
        const colors = {
            ERROR: '#f44',
            WARN: '#fa0',
            INFO: '#0af',
            SUCCESS: '#0f0'
        };
        
        panel.innerHTML = this.logs.map(l => 
            `<div style="color: ${colors[l.type] || '#0f0'}; margin-bottom: 4px;">
                [${l.time}] ${l.type}: ${l.message}
            </div>`
        ).join('');
        panel.scrollTop = panel.scrollHeight;
    },
    
    error(msg, data) {
        this.log('ERROR', msg, data);
        const el = document.getElementById('debugError');
        if (el) el.textContent = msg;
    },
    
    info(msg, data) {
        this.log('INFO', msg, data);
    },
    
    success(msg, data) {
        this.log('SUCCESS', msg, data);
    }
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
        
        // Data areas (sama dengan GAS)
        this.AREAS_DATA = {
            TURBINE: {
                "Steam Inlet Turbine": [
                    "MPS Inlet 30-TP-6101 PI-6114 (kg/cm2)",
                    "MPS Inlet 30-TP-6101 TI-6153 (°C)",
                    "MPS Inlet 30-TP-6101 PI-6116 (kg/cm2)",
                    "LPS Extrac 30-TP-6101 PI-6123 (kg/cm2)",
                    "Gland Steam TI-6156 (°C)",
                    "MPS Inlet 30-TP-6101 PI-6108 (Kg/cm2)",
                    "Exhaust Steam PI-6111 (kg/cm2)",
                    "Gland Steam PI-6118 (Kg/cm2)"
                ],
                "Low Pressure Steam": [
                    "LPS from U-6101 PI-6104 (kg/cm2)",
                    "LPS from U-6101 TI-6102 (°C)",
                    "LPS Header PI-6106 (Kg/cm2)",
                    "LPS Header TI-6107 (°C)"
                ],
                "Lube Oil": [
                    "Lube Oil 30-TK-6102 LI-6104 (%)",
                    "Lube Oil 30-TK-6102 TI-6125 (°C)",
                    "Lube Oil 30-C-6101 (On/Off)",
                    "Lube Oil 30-EH-6102 (On/Off)",
                    "Lube Oil Cartridge FI-6143 (%)",
                    "Lube Oil Cartridge PI-6148 (mmH2O)",
                    "Lube Oil Cartridge PI-6149 (mmH2O)",
                    "Lube Oil PI-6145 (kg/cm2)",
                    "Lube Oil E-6104 (A/B)",
                    "Lube Oil TI-6127 (°C)",
                    "Lube Oil FIL-6101 (A/B)",
                    "Lube Oil PDI-6146 (Kg/cm2)",
                    "Lube Oil PI-6143 (Kg/cm2)",
                    "Lube Oil TI-6144 (°C)",
                    "Lube Oil TI-6146 (°C)",
                    "Lube Oil TI-6145 (°C)",
                    "Lube Oil FG-6144 (%)",
                    "Lube Oil FG-6146 (%)",
                    "Lube Oil TI-6121 (°C)",
                    "Lube Oil TI-6116 (°C)",
                    "Lube Oil FG-6121 (%)",
                    "Lube Oil FG-6116 (%)"
                ],
                "Control Oil": [
                    "Control Oil 30-TK-6103 LI-6106 (%)",
                    "Control Oil 30-TK-6103 TI-6128 (°C)",
                    "Control Oil P-6106 (A/B)",
                    "Control Oil FIL-6103 (A/B)",
                    "Control Oil PI-6152 (Bar)"
                ],
                "Shaft Line": [
                    "Jacking Oil 30-P-6105 PI-6158 (Bar)",
                    "Jacking Oil 30-P-6105 PI-6161 (Bar)",
                    "Electrical Turning Gear U-6103 (Remote/Running/Stop)",
                    "EH-6101 (ON/OFF)"
                ],
                "Condenser 30-E-6102": [
                    "LG-6102 (%)",
                    "30-P-6101 (A/B)",
                    "30-P-6101 Press Suction",
                    "30-P-6101 Press Discharge",
                    "30-P-6101 Load (amp)"
                ],
                "Ejector": [
                    "J-6101 PI-6126 A (Kg/cm2)",
                    "J-6101 PI-6127 B (Kg/cm2)",
                    "J-6102 PI-6128 A (Kg/cm2)",
                    "J-6102 PI-6129 B (Kg/cm2)",
                    "J-6104 PI-6131 (Kg/cm2)",
                    "J-6104 PI-6138 (Kg/cm2)",
                    "PI-6172 (kg/cm2)",
                    "LPS Extrac 30-TP-6101 TI-6155 (°C)",
                    "from U-6102 TI-6104 (°C)"
                ],
                "Generator Cooling Water": [
                    "Air Cooler PI-6124 A (Kg/cm2)",
                    "Air Cooler PI-6124 B (Kg/cm2)",
                    "Air Cooler TI-6113 A (°C)",
                    "Air Cooler TI-6113 B (°C)",
                    "Air Cooler PI-6125 A (Kg/cm2)",
                    "Air Cooler PI-6125 B (Kg/cm2)",
                    "Air Cooler TI-6114 A (°C)",
                    "Air Cooler TI-6114 B (°C)"
                ],
                "Condenser Cooling Water": [
                    "Condenser PI-6135 A (Kg/cm2)",
                    "Condenser PI-6135 B (Kg/cm2)",
                    "Condenser TI-6118 A (°C)",
                    "Condenser TI-6118 B (°C)",
                    "Condenser PI-6136 A (Kg/cm2)",
                    "Condenser PI-6136 B (Kg/cm2)",
                    "Condenser TI-6119 A (°C)",
                    "Condenser TI-6119 B (°C)"
                ],
                "BFW System": [
                    "Condensate Tank TK-6201 (%)",
                    "Condensate Tank TI-6216 (°C)",
                    "P-6202 (A/B)",
                    "P-6202 Press Suction",
                    "P-6202 Press Discharge",
                    "P-6202 Load (amp)",
                    "30-C-6202 A (ON/OFF)",
                    "30-C-6202 A (Ampere)",
                    "30-C-6202 B (ON/OFF)",
                    "30-C-6202 B (Ampere)",
                    "30-C-6202 PCV-6216 (%)",
                    "30-C-6202 PI-6107 (kg/cm2)",
                    "Condensate Drum 30-D-6201 LI-6209 (%)",
                    "Condensate Drum 30-D-6201 PI-6218 (kg/cm2)",
                    "Condensate Drum 30-D-6201 TI-6215 (°C)",
                    "Deaerator LI-6202 (%)",
                    "Deaerator TI-6201 (°C)",
                    "30-P-6201 (A/B)",
                    "30-P-6201 Press Suction",
                    "30-P-6201 Press Discharge",
                    "30-P-6201 Load (amp)"
                ],
                "Chemical Dosing": [
                    "30-TK-6205 LI-6204 (%)",
                    "30-TK-6205 30-P-6205 (A/B)",
                    "30-TK-6205 Press Disch (kg/cm2)",
                    "30-TK-6205 Stroke (%)",
                    "30-TK-6206 LI-6206 (%)",
                    "30-TK-6206 30-P-6206 (A/B)",
                    "30-TK-6206 Press Disch (kg/cm2)",
                    "30-TK-6206 Stroke (%)",
                    "30-TK-6207 LI-6208 (%)",
                    "30-TK-6207 30-P-6207 (A/B)",
                    "30-TK-6207 Press Disch (kg/cm2)",
                    "30-TK-6207 Stroke (%)"
                ]
            },
            CT: {
                "BASIN SA": [
                    "D-6511 LEVEL BASIN",
                    "D-6511 BLOWDOWN",
                    "D-6511 PH BASIN",
                    "D-6511 TRASSAR (A/M)",
                    "TK-6511 LEVEL ACID",
                    "FIL-6511 (A/B)",
                    "30-P-6511 A PRESS (kg/cm2)",
                    "30-P-6511 B PRESS (kg/cm2)",
                    "30-P-6511 C PRESS (kg/cm2)",
                    "MT-6511 A STATUS",
                    "MT-6511 B STATUS",
                    "MT-6511 C STATUS",
                    "MT-6511 D STATUS"
                ],
                "BASIN SU": [
                    "D-6521 LEVEL BASIN",
                    "D-6521 BLOWDOWN",
                    "D-6521 PH BASIN",
                    "D-6521 TRASSAR (A/M)",
                    "TK-6521 LEVEL ACID",
                    "FIL-6521 (A/B)",
                    "30-P-6521 A PRESS (kg/cm2)",
                    "30-P-6521 B PRESS (kg/cm2)",
                    "30-P-6521 C PRESS (kg/cm2)",
                    "MT-6521 A STATUS",
                    "MT-6521 B STATUS",
                    "MT-6521 C STATUS",
                    "MT-6521 D STATUS"
                ],
                "LH & TH": [
                    "LH C-6701 A",
                    "LH C-6701 B",
                    "LH C-6702 A",
                    "LH C-6702 B",
                    "TH C-6701 A",
                    "TH C-6701 B",
                    "TH C-6702 A",
                    "TH C-6702 B"
                ],
                "COMPRESSOR": [
                    "C-6701 A STATUS",
                    "C-6701 A PRESSURE",
                    "C-6701 A TEMP",
                    "C-6701 A FLOW",
                    "C-6701 B STATUS",
                    "C-6701 B PRESSURE",
                    "C-6701 B TEMP",
                    "C-6701 B FLOW",
                    "C-6702 A STATUS",
                    "C-6702 A PRESSURE",
                    "C-6702 A TEMP",
                    "C-6702 A FLOW",
                    "C-6702 B STATUS",
                    "C-6702 B PRESSURE",
                    "C-6702 B TEMP",
                    "C-6702 B FLOW"
                ]
            },
            OLI: {
                "OLI GEARBOX SA": ["MT-6511 A", "MT-6511 B", "MT-6511 C", "MT-6511 D"],
                "OLI GEARBOX SU": ["MT-6521 B", "MT-6521 C", "MT-6521 D"]
            }
        };

        this.init();
    }

    async init() {
        try {
            Debug.info('Initializing app v' + CONFIG.APP_VERSION);
            const urlEl = document.getElementById('debugApiUrl');
            if (urlEl) urlEl.textContent = CONFIG.GAS_URL.substring(0, 50) + '...';
            
            // Inisialisasi DB dengan retry
            await this.initDBWithRetry();
            
            this.generateAnomaliId();
            this.updateStatus();
            this.loadAnomaliList();
            
            window.addEventListener('online', () => {
                Debug.info('Connection restored');
                this.showToast('🌐 Koneksi kembali! Menyinkronkan...', 'success');
                this.syncData();
            });
            
            window.addEventListener('offline', () => {
                Debug.warn('Connection lost');
                this.showToast('📴 Mode offline', 'warning');
            });
            
            Debug.success('App initialized successfully');
            
        } catch (error) {
            Debug.error('Init failed: ' + error.message);
            this.showToast('Error inisialisasi: ' + error.message, 'error');
        }
    }

    // Inisialisasi DB dengan retry mechanism
    async initDBWithRetry(maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.initDB();
                this.dbInitialized = true;
                Debug.success('IndexedDB initialized successfully');
                return;
            } catch (error) {
                Debug.error(`DB init attempt ${i + 1} failed: ${error.message}`);
                if (i === maxRetries - 1) {
                    throw new Error('Gagal menginisialisasi database lokal setelah ' + maxRetries + ' percobaan');
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    initDB() {
        return new Promise((resolve, reject) => {
            Debug.info('Opening IndexedDB...');
            
            if (!window.indexedDB) {
                reject(new Error('Browser tidak mendukung IndexedDB'));
                return;
            }

            const request = indexedDB.open(CONFIG.DB_NAME, 1);
            
            request.onerror = (event) => {
                const error = event.target.error;
                Debug.error('IndexedDB error', error);
                reject(new Error('Gagal membuka database: ' + (error ? error.message : 'Unknown error')));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.db.onerror = (event) => {
                    Debug.error('Database error', event.target.error);
                };
                Debug.info('IndexedDB opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                Debug.info('Upgrading IndexedDB schema...');
                const db = event.target.result;
                
                if (db.objectStoreNames.contains('pending')) {
                    db.deleteObjectStore('pending');
                }
                if (db.objectStoreNames.contains('drafts')) {
                    db.deleteObjectStore('drafts');
                }
                
                const pendingStore = db.createObjectStore('pending', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                pendingStore.createIndex('type', 'type', { unique: false });
                
                const draftsStore = db.createObjectStore('drafts', { keyPath: 'key' });
                draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
                
                Debug.success('IndexedDB schema created');
            };
            
            request.onblocked = (event) => {
                Debug.error('IndexedDB blocked', 'Database blocked by another tab');
                reject(new Error('Database diblokir oleh tab lain. Tutup tab lain dan coba lagi.'));
            };
        });
    }

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
        
        const pageId = pageMap[page] || 'page' + page.charAt(0).toUpperCase() + page.slice(1);
        const element = document.getElementById(pageId);
        if (element) element.classList.add('active');
        
        const navMap = { home: 0, laporan: 1, anomali: 2, dashboard: 3 };
        if (navMap[page] !== undefined) {
            document.querySelectorAll('.nav-item')[navMap[page]].classList.add('active');
        }
        
        if (page === 'home') this.updateStatus();
        if (page === 'anomali') this.loadAnomaliList();
        if (page === 'dashboard') this.refreshDashboard();
        
        window.scrollTo(0, 0);
    }

    // ================== AREA SELECTION ==================
    showAreaSelection(mode) {
        this.currentMode = mode;
        const areas = this.AREAS_DATA[mode];
        
        const titleEl = document.getElementById('areaSelectionTitle');
        if (titleEl) {
            titleEl.textContent = mode === 'TURBINE' ? '⚙️ Pilih Area Turbine' : 
                                 mode === 'CT' ? '🏭 Pilih Area CT' : '🛢️ Pilih Area Oli';
        }
        
        const container = document.getElementById('areaList');
        if (!container) return;
        container.innerHTML = '';
        
        Object.keys(areas).forEach((areaName) => {
            const div = document.createElement('div');
            div.className = 'area-item';
            div.innerHTML = `
                <span>${areaName}</span>
                <span style="color: var(--text-muted); font-size: 13px;">
                    ${areas[areaName].length} parameter
                </span>
            `;
            div.onclick = () => this.selectArea(areaName, areas[areaName]);
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

    // ================== PARAMETER INPUT ==================
    showParameter() {
        const param = this.currentParams[this.currentParamIndex];
        const total = this.currentParams.length;
        const progress = ((this.currentParamIndex / total) * 100).toFixed(0);
        
        const counterEl = document.getElementById('inputCounter');
        if (counterEl) counterEl.textContent = `Parameter ${this.currentParamIndex + 1}/${total}`;
        
        const progressEl = document.getElementById('inputProgress');
        if (progressEl) progressEl.style.width = progress + '%';
        
        const nameEl = document.getElementById('paramName');
        if (nameEl) nameEl.textContent = param;
        
        const unitMatch = param.match(/\(([^)]+)\)$/);
        const unit = unitMatch ? unitMatch[1] : '-';
        const unitEl = document.getElementById('paramUnit');
        if (unitEl) unitEl.textContent = unit;
        
        const prevValue = this.paramData[param] || this.getPreviousValue(param);
        const inputEl = document.getElementById('paramInput');
        if (inputEl) {
            inputEl.value = prevValue || '';
            inputEl.classList.remove('error');
        }
        
        const prevEl = document.getElementById('paramPrev');
        if (prevEl) {
            prevEl.textContent = prevValue ? `Data sebelumnya: ${prevValue}` : 'Data sebelumnya: -';
        }
        
        const errorEl = document.getElementById('paramError');
        if (errorEl) errorEl.classList.remove('show');
        
        const quickActions = document.getElementById('quickActions');
        if (quickActions) {
            const hasQuickOptions = param.includes('(On/Off)') || 
                                   param.includes('(A/B)') || 
                                   param.includes('STATUS') ||
                                   param.includes('(Remote/Running/Stop)');
            quickActions.style.display = hasQuickOptions ? 'flex' : 'none';
        }
        
        setTimeout(() => {
            const input = document.getElementById('paramInput');
            if (input) input.focus();
        }, 100);
    }

    setQuickValue(val) {
        const input = document.getElementById('paramInput');
        if (input) {
            input.value = val;
            input.classList.remove('error');
        }
        const errorEl = document.getElementById('paramError');
        if (errorEl) errorEl.classList.remove('show');
    }

    nextParameter() {
        const param = this.currentParams[this.currentParamIndex];
        const input = document.getElementById('paramInput');
        const value = input ? input.value.trim() : '';
        
        if (!value) {
            if (input) input.classList.add('error');
            const errorEl = document.getElementById('paramError');
            if (errorEl) errorEl.classList.add('show');
            this.showToast('Silakan isi nilai parameter', 'warning');
            return;
        }
        
        this.paramData[param] = value;
        
        const errKeywords = ["RUSAK", "BROKEN", "MATI", "LEAK", "ERROR", "UPPER", "KERUSAKAN", "ABNORMAL"];
        const isAbnormal = errKeywords.some(k => value.toUpperCase().includes(k));
        
        if (isAbnormal) {
            this.savePendingAnomali(param, value);
        }
        
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

    // ================== SAVE FUNCTIONS ==================
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
        const idEl = document.getElementById('anomaliId');
        
        const payload = {
            type: 'ANOMALI',
            id: idEl ? idEl.value : 'ANM-' + Date.now(),
            area: formData.get('area'),
            description: formData.get('description'),
            photo: this.photoData,
            status: 'OPEN',
            timestamp: new Date().toISOString()
        };
        
        await this.saveToApiOrQueue(payload, 'Anomali');
        this.generateAnomaliId();
        this.photoData = null;
        const previewEl = document.getElementById('photoPreview');
        if (previewEl) previewEl.classList.add('hidden');
        e.target.reset();
        this.loadAnomaliList();
    }

    // ================== API & SYNC ==================
    async saveToApiOrQueue(payload, typeName) {
        this.showLoading(true);
        Debug.info(`Saving ${typeName}...`, payload);
        
        try {
            if (navigator.onLine) {
                Debug.info('Online mode - attempting API sync');
                const result = await this.syncWithRetry(payload);
                if (result.success) {
                    this.showToast(`✅ ${typeName} berhasil disimpan ke server!`, 'success');
                    Debug.success(`${typeName} saved to API`);
                } else {
                    throw new Error(result.error || 'API Error');
                }
            } else {
                Debug.warn('Offline mode - saving to local queue');
                await this.queueForSync(payload);
                this.showToast(`📴 ${typeName} disimpan lokal (offline)`, 'warning');
            }
        } catch (error) {
            Debug.error(`API save failed: ${error.message}. Falling back to local queue.`);
            
            try {
                await this.queueForSync(payload);
                this.showToast(`⚠️ ${typeName} disimpan lokal (akan sync nanti)`, 'warning');
            } catch (localError) {
                Debug.error(`CRITICAL: Local save also failed: ${localError.message}`);
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

    // ================== PERBAIKAN: SYNC WITH RETRY ==================
    async syncWithRetry(data, attempt = 1) {
        try {
            Debug.info(`API call attempt ${attempt}/${CONFIG.MAX_RETRIES}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            // Gunakan POST dengan JSON payload (sesuai GAS doPost)
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                redirect: 'follow', // Penting untuk GAS redirect
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            Debug.info('API Response:', result);
            
            // Cek status dari GAS
            if (result.status === 'error') {
                throw new Error(result.message || 'API returned error status');
            }
            
            return { success: true, data: result };

        } catch (error) {
            Debug.error(`Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                const delay = CONFIG.RETRY_DELAY * attempt;
                Debug.info(`Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                return this.syncWithRetry(data, attempt + 1);
            }
            
            return { success: false, error: error.message };
        }
    }

    async queueForSync(data) {
        Debug.info('Queueing data for sync...', { type: data.type, timestamp: data.timestamp });
        
        if (!this.dbInitialized || !this.db) {
            Debug.error('Database not initialized, attempting re-init...');
            try {
                await this.initDBWithRetry();
            } catch (error) {
                throw new Error('Database tidak tersedia: ' + error.message);
            }
        }

        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(['pending'], 'readwrite');
                const store = tx.objectStore('pending');
                
                const record = {
                    data: data,
                    created: new Date().toISOString(),
                    retries: 0,
                    lastError: null
                };
                
                const request = store.add(record);
                
                request.onsuccess = (event) => {
                    const id = event.target.result;
                    Debug.success(`Data queued successfully with ID: ${id}`);
                    resolve(id);
                };
                
                request.onerror = (event) => {
                    const error = event.target.error;
                    Debug.error('Queue add error', error);
                    reject(new Error('Gagal menambahkan ke antrian: ' + (error ? error.message : 'Unknown error')));
                };
                
                tx.oncomplete = () => {
                    Debug.info('Transaction completed successfully');
                };
                
                tx.onerror = (event) => {
                    Debug.error('Transaction error', event.target.error);
                };
                
                tx.onabort = (event) => {
                    Debug.error('Transaction aborted', event.target.error);
                    reject(new Error('Transaksi dibatalkan'));
                };
                
            } catch (error) {
                Debug.error('Exception in queueForSync', error);
                reject(new Error('Exception: ' + error.message));
            }
        });
    }

    async syncData() {
        if (!navigator.onLine) {
            this.showToast('📴 Tidak ada koneksi!', 'error');
            return;
        }

        if (!this.dbInitialized || !this.db) {
            Debug.error('Cannot sync - database not initialized');
            this.showToast('❌ Database belum siap', 'error');
            return;
        }

        Debug.info('Starting sync process...');
        
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
                        const delTx = this.db.transaction(['pending'], 'readwrite');
                        delTx.objectStore('pending').delete(item.id);
                        success++;
                        Debug.success(`Item ${item.id} synced and removed from queue`);
                    } else {
                        const updateTx = this.db.transaction(['pending'], 'readwrite');
                        const updateStore = updateTx.objectStore('pending');
                        item.retries = (item.retries || 0) + 1;
                        item.lastError = result.error;
                        item.lastAttempt = new Date().toISOString();
                        updateStore.put(item);
                        
                        failed++;
                        Debug.error(`Item ${item.id} failed: ${result.error}`);
                    }
                } catch (err) {
                    failed++;
                    Debug.error(`Exception syncing item ${item.id}: ${err.message}`);
                }
            }
            
            const msg = `✅ ${success} sukses, ❌ ${failed} gagal`;
            this.showToast(msg, success > 0 ? 'success' : 'warning');
            this.updateStatus();
        };
        
        request.onerror = (event) => {
            Debug.error('Failed to get pending items', event.target.error);
            this.showToast('❌ Gagal membaca data pending', 'error');
        };
    }

    // ================== TEST CONNECTION ==================
    async testConnection() {
        this.showToast('🧪 Testing API...', 'info');
        Debug.info('Testing API connection...');
        
        try {
            // Test dengan POST request sederhana
            const testPayload = {
                type: 'TEST',
                timestamp: new Date().toISOString()
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            Debug.success('API test successful', result);
            
            const statusEl = document.getElementById('debugStatus');
            if (statusEl) statusEl.textContent = '✅ Connected';
            this.showToast('✅ API Connected!', 'success');
            
        } catch (err) {
            Debug.error('API test failed', err.message);
            
            const statusEl = document.getElementById('debugStatus');
            if (statusEl) statusEl.textContent = '❌ Failed: ' + err.message;
            
            let errorMsg = '❌ API Error: ' + err.message;
            if (err.message.includes('Failed to fetch')) {
                errorMsg += ' (CORS/Network issue - pastikan URL GAS benar)';
            }
            
            this.showToast(errorMsg, 'error');
        }
    }

    // ================== HELPER FUNCTIONS ==================
    generateAnomaliId() {
        const id = 'ANM-' + Date.now().toString(36).toUpperCase();
        const el = document.getElementById('anomaliId');
        if (el) el.value = id;
    }

    previewPhoto(input) {
        if (input.files && input.files[0]) {
            if (input.files[0].size > 5 * 1024 * 1024) {
                this.showToast('❌ Foto max 5MB!', 'error');
                return;
            }
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

    getPreviousValue(param) {
        return null;
    }

    savePendingAnomali(param, value) {
        Debug.info('Abnormal value detected', { param, value });
    }

    async loadAnomaliList() {
        try {
            // Gunakan POST untuk getAnomali juga (lebih reliable dengan GAS)
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'GET_ANOMALI' })
            });
            
            const result = await response.json();
            if (result.status === 'success' && result.result) {
                this.renderAnomaliList(result.result);
            } else {
                // Fallback ke GET jika POST tidak support
                const getResponse = await fetch(`${CONFIG.GAS_URL}?action=getAnomali`, {
                    method: 'GET',
                    redirect: 'follow'
                });
                const data = await getResponse.json();
                this.renderAnomaliList(data);
            }
        } catch (err) {
            Debug.error('Load anomali failed', err.message);
        }
    }

    renderAnomaliList(anomalies) {
        const container = document.getElementById('anomaliList');
        if (!container) return;
        
        if (!anomalies || anomalies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>Belum ada anomali</p>
                </div>`;
            return;
        }
        
        container.innerHTML = anomalies.map(a => `
            <div class="anomali-item">
                <div class="anomali-header">
                    <span class="anomali-id">${a.id}</span>
                    <span class="status-badge status-${(a.status || 'OPEN').toLowerCase().replace(' ', '-')}">
                        ${a.status || 'OPEN'}
                    </span>
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
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'GET_DASHBOARD' })
            });
            
            const result = await response.json();
            if (result.status === 'success' && result.result) {
                const data = result.result;
                const openEl = document.getElementById('dashOpen');
                const progressEl = document.getElementById('dashProgress');
                const closedEl = document.getElementById('dashClosed');
                
                if (openEl) openEl.textContent = data.open || 0;
                if (progressEl) progressEl.textContent = data.progress || 0;
                if (closedEl) closedEl.textContent = data.closed || 0;
            }
            
            this.loadAnomaliList();
            
        } catch (err) {
            Debug.error('Dashboard refresh failed', err.message);
        }
    }

    updateStatus() {
        const onlineEl = document.getElementById('onlineStatus');
        if (onlineEl) onlineEl.textContent = navigator.onLine ? '✅ Online' : '❌ Offline';
        
        if (!this.dbInitialized || !this.db) {
            const pendingEl = document.getElementById('pendingCount');
            if (pendingEl) pendingEl.textContent = 'DB Error';
            
            const badge = document.getElementById('pendingBadge');
            if (badge) {
                badge.textContent = '!';
                badge.classList.remove('hidden');
                badge.style.background = 'var(--warning)';
            }
            return;
        }
        
        try {
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
                
                Debug.info(`Pending count updated: ${count}`);
            };
            
            request.onerror = (event) => {
                Debug.error('Failed to count pending items', event.target.error);
            };
        } catch (error) {
            Debug.error('Error in updateStatus', error);
        }
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
}

// Export untuk module (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurbineApp;
}
