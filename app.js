// ============================================
// TURBINE LOGSHEET PWA - Debug Version
// ============================================

class TurbineApp {
  constructor() {
    this.currentMode = 'TURBINE';
    this.db = null;
    this.pendingSync = [];
    this.photoData = null;
    this.debugLogs = [];
    
    // Data konstanta
    this.AREAS_TURBINE = {
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
    };

    this.AREAS_CT = {
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
    };

    this.AREAS_OLI = {
      "OLI GEARBOX SA": ["MT-6511 A", "MT-6511 B", "MT-6511 C", "MT-6511 D"],
      "OLI GEARBOX SU": ["MT-6521 B", "MT-6521 C", "MT-6521 D"]
    };

    this.init();
  }

  log(type, message, data) {
    const entry = {
      time: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.stringify(data).substring(0, 500) : null
    };
    this.debugLogs.push(entry);
    console.log(`[${type}] ${message}`, data || '');
    
    // Keep only last 50 logs
    if (this.debugLogs.length > 50) this.debugLogs.shift();
  }

  async init() {
    try {
      this.log('INFO', 'Initializing app...');
      
      // Check config
      if (!window.CONFIG || !CONFIG.API_URL) {
        throw new Error('CONFIG not found! Pastikan config.js sudah diload.');
      }
      
      this.log('INFO', 'API URL:', CONFIG.API_URL);
      
      await this.initDB();
      this.renderLogsheetFields();
      this.generateAnomaliId();
      this.updateStatus();
      this.loadAnomaliList();
      
      // Event listeners
      window.addEventListener('online', () => {
        this.log('INFO', 'Connection restored');
        this.showToast('Koneksi kembali! Menyinkronkan...', 'success');
        this.syncData();
      });
      
      window.addEventListener('offline', () => {
        this.log('WARN', 'Connection lost');
        this.showToast('Mode offline', 'warning');
      });
      
      this.loadDraft();
      this.log('INFO', 'App initialized successfully');
      
    } catch (error) {
      this.log('ERROR', 'Init failed:', error.message);
      this.showToast('Error init: ' + error.message, 'error');
    }
  }

  initDB() {
    return new Promise((resolve, reject) => {
      this.log('INFO', 'Opening IndexedDB:', CONFIG.DB_NAME);
      
      const request = indexedDB.open(CONFIG.DB_NAME, 1);
      
      request.onerror = () => {
        this.log('ERROR', 'IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.log('INFO', 'IndexedDB opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        this.log('INFO', 'Creating IndexedDB schema...');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
          this.log('INFO', 'Created pending store');
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'key' });
          this.log('INFO', 'Created drafts store');
        }
      };
    });
  }

  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const pageId = `page${page.charAt(0).toUpperCase() + page.slice(1)}`;
    document.getElementById(pageId)?.classList.add('active');
    
    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    const pageIndex = ['home', 'logsheet', 'laporan', 'anomali'].indexOf(page);
    if (navItems[pageIndex]) navItems[pageIndex].classList.add('active');
    
    if (page === 'home') this.updateStatus();
    if (page === 'anomali') this.loadAnomaliList();
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      const isActive = (mode === 'TURBINE' && btn.textContent.includes('Turbine')) ||
                       (mode === 'CT' && btn.textContent.includes('CT')) ||
                       (mode === 'OLI' && btn.textContent.includes('Oli'));
      btn.classList.toggle('active', isActive);
    });
    this.renderLogsheetFields();
    this.loadDraft();
  }

  renderLogsheetFields() {
    const container = document.getElementById('logsheetFields');
    if (!container) return;
    
    const areas = this.currentMode === 'TURBINE' ? this.AREAS_TURBINE : 
                  this.currentMode === 'CT' ? this.AREAS_CT : this.AREAS_OLI;
    
    container.innerHTML = Object.entries(areas).map(([areaName, params]) => `
      <div class="area-section">
        <div class="area-title">${areaName}</div>
        ${params.map(param => `
          <div class="form-group">
            <label class="form-label">${param}</label>
            <input type="text" class="form-input" name="${param}" placeholder="Masukkan nilai..." onchange="app.autoSaveDraft()">
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  async saveLogsheet(e) {
    e.preventDefault();
    this.log('INFO', 'Saving logsheet...');
    
    const formData = new FormData(e.target);
    const data = {};
    let filledCount = 0;
    
    formData.forEach((val, key) => { 
      if(val) {
        data[key] = val;
        filledCount++;
      }
    });
    
    if (filledCount === 0) {
      this.showToast('Isi minimal 1 field!', 'warning');
      return;
    }
    
    const payload = {
      type: 'LOGSHEET',
      mode: this.currentMode,
      data: data,
      area: this.currentMode,
      timestamp: new Date().toISOString()
    };
    
    this.log('INFO', 'Payload:', payload);
    await this.saveToApiOrQueue(payload, 'Logsheet');
  }

  async saveLaporan(e) {
    e.preventDefault();
    this.log('INFO', 'Saving laporan...');
    
    const formData = new FormData(e.target);
    
    const payload = {
      type: 'LAPORAN',
      shift: formData.get('shift'),
      area: formData.get('area'),
      detail: formData.get('detail'),
      timestamp: new Date().toISOString()
    };
    
    this.log('INFO', 'Laporan payload:', payload);
    await this.saveToApiOrQueue(payload, 'Laporan');
    e.target.reset();
  }

  async saveAnomali(e) {
    e.preventDefault();
    this.log('INFO', 'Saving anomali...');
    
    const formData = new FormData(e.target);
    
    const payload = {
      type: 'ANOMALI',
      id: document.getElementById('anomaliId').value,
      area: formData.get('area'),
      description: formData.get('description'),
      photo: this.photoData || null,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    };
    
    this.log('INFO', 'Anomali payload:', { ...payload, photo: payload.photo ? '<<BASE64>>' : null });
    await this.saveToApiOrQueue(payload, 'Anomali');
    
    this.generateAnomaliId();
    this.photoData = null;
    const preview = document.getElementById('photoPreview');
    if (preview) preview.classList.add('hidden');
    e.target.reset();
    this.loadAnomaliList();
  }

  async saveToApiOrQueue(payload, typeName) {
    this.showLoading(true);
    this.log('INFO', `Attempting to save ${typeName}...`);
    
    try {
      // Check online status
      if (!navigator.onLine) {
        this.log('WARN', 'Device is offline, queueing...');
        await this.queueForSync(payload);
        this.showToast(`${typeName} disimpan lokal (offline)`, 'warning');
        return;
      }
      
      // Try API call with timeout
      this.log('INFO', 'Calling API:', CONFIG.API_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      this.log('INFO', 'Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }
      
      this.log('INFO', 'API result:', result);
      
      if (result.status === 'success') {
        this.showToast(`${typeName} berhasil disimpan! ✅`, 'success');
        this.clearDraft();
      } else {
        throw new Error(result.message || 'Unknown API error');
      }
      
    } catch (error) {
      this.log('ERROR', 'Save failed:', error.message);
      console.error('Full error:', error);
      
      // Queue for retry
      await this.queueForSync(payload);
      this.showToast(`${typeName} disimpan lokal (error: ${error.message.substring(0, 50)})`, 'warning');
    } finally {
      this.showLoading(false);
      this.updateStatus();
    }
  }

  async queueForSync(data) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          throw new Error('Database not initialized');
        }
        
        const tx = this.db.transaction(['pending'], 'readwrite');
        const store = tx.objectStore('pending');
        
        const item = {
          data: data,
          created: new Date().toISOString(),
          retries: 0
        };
        
        const request = store.add(item);
        
        request.onsuccess = () => {
          this.log('INFO', 'Queued for sync, ID:', request.result);
          resolve();
        };
        
        request.onerror = () => {
          this.log('ERROR', 'Queue failed:', request.error);
          reject(request.error);
        };
        
      } catch (error) {
        this.log('ERROR', 'Queue error:', error.message);
        reject(error);
      }
    });
  }

  async syncData() {
    if (!navigator.onLine) {
      this.showToast('Tidak ada koneksi!', 'error');
      return;
    }
    
    if (!this.db) {
      this.showToast('Database belum siap!', 'error');
      return;
    }
    
    this.showLoading(true);
    this.log('INFO', 'Starting sync...');
    
    try {
      const tx = this.db.transaction(['pending'], 'readonly');
      const store = tx.objectStore('pending');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const pending = request.result;
        this.log('INFO', `Found ${pending.length} pending items`);
        
        if (pending.length === 0) {
          this.showToast('Tidak ada data pending', 'success');
          this.showLoading(false);
          return;
        }
        
        let success = 0, failed = 0;
        
        for (const item of pending) {
          try {
            this.log('INFO', `Syncing item ${item.id}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(CONFIG.API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'success') {
              // Delete from queue
              const delTx = this.db.transaction(['pending'], 'readwrite');
              delTx.objectStore('pending').delete(item.id);
              success++;
              this.log('INFO', `Item ${item.id} synced successfully`);
            } else {
              throw new Error(result.message);
            }
            
          } catch (err) {
            this.log('ERROR', `Sync failed for item ${item.id}:`, err.message);
            failed++;
            
            // Update retry count
            item.retries = (item.retries || 0) + 1;
            const updateTx = this.db.transaction(['pending'], 'readwrite');
            const updateStore = updateTx.objectStore('pending');
            updateStore.put(item);
          }
        }
        
        this.showLoading(false);
        this.showToast(`Sync: ${success} sukses, ${failed} gagal`, success > 0 ? 'success' : 'warning');
        this.updateStatus();
      };
      
      request.onerror = () => {
        throw request.error;
      };
      
    } catch (error) {
      this.log('ERROR', 'Sync error:', error.message);
      this.showToast('Sync error: ' + error.message, 'error');
      this.showLoading(false);
    }
  }

  // Draft management
  autoSaveDraft() {
    clearTimeout(this.draftTimeout);
    this.draftTimeout = setTimeout(() => this.saveDraft(), 2000);
  }

  saveDraft() {
    if (!this.db) return;
    
    const inputs = document.querySelectorAll('#logsheetForm input');
    const draft = {};
    inputs.forEach(input => { if(input.value) draft[input.name] = input.value; });
    
    const tx = this.db.transaction(['drafts'], 'readwrite');
    tx.objectStore('drafts').put({ 
      key: `draft_${this.currentMode}`, 
      data: draft,
      saved: new Date().toISOString()
    });
    
    this.log('INFO', 'Draft saved');
  }

  loadDraft() {
    if (!this.db) return;
    
    const tx = this.db.transaction(['drafts'], 'readonly');
    const store = tx.objectStore('drafts');
    const request = store.get(`draft_${this.currentMode}`);
    
    request.onsuccess = () => {
      if (request.result) {
        const draft = request.result.data;
        this.log('INFO', 'Loading draft:', Object.keys(draft).length, 'fields');
        Object.entries(draft).forEach(([key, val]) => {
          const input = document.querySelector(`input[name="${key}"]`);
          if (input) input.value = val;
        });
      }
    };
  }

  clearDraft() {
    if (!this.db) return;
    const tx = this.db.transaction(['drafts'], 'readwrite');
    tx.objectStore('drafts').delete(`draft_${this.currentMode}`);
  }

  // Anomali functions
  generateAnomaliId() {
    const id = 'ANM-' + Date.now().toString(36).toUpperCase();
    const el = document.getElementById('anomaliId');
    if (el) el.value = id;
  }

  previewPhoto(input) {
    if (input.files && input.files[0]) {
      this.log('INFO', 'Processing photo:', input.files[0].name);
      
      // Check size (max 5MB)
      if (input.files[0].size > 5 * 1024 * 1024) {
        this.showToast('Foto terlalu besar! Max 5MB', 'error');
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
        this.log('INFO', 'Photo loaded, size:', this.photoData.length);
      };
      reader.onerror = () => {
        this.log('ERROR', 'Photo read failed');
        this.showToast('Gagal membaca foto', 'error');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  async loadAnomaliList() {
    const container = document.getElementById('anomaliList');
    if (!container) return;
    
    try {
      if (!navigator.onLine) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📴</div>
            <p>Mode offline - tidak bisa load data</p>
          </div>
        `;
        return;
      }
      
      this.log('INFO', 'Loading anomali list...');
      const response = await fetch(`${CONFIG.API_URL}?action=getAnomali`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.log('INFO', `Loaded ${data.length} anomali`);
      this.renderAnomaliList(data);
      
    } catch (err) {
      this.log('ERROR', 'Load anomali failed:', err.message);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <p>Error: ${err.message}</p>
        </div>
      `;
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
        </div>
      `;
      return;
    }
    
    container.innerHTML = anomalies.map(a => `
      <div class="anomali-item">
        <div class="anomali-header">
          <span class="anomali-id">${a.id}</span>
          <span class="status-badge status-${(a.status || 'OPEN').toLowerCase().replace(/\s+/g, '-')}">
            ${a.status || 'OPEN'}
          </span>
        </div>
        <div class="anomali-desc">${this.escapeHtml(a.description)}</div>
        <div class="anomali-meta">
          <span>👤 ${this.escapeHtml(a.reporter || 'Unknown')}</span>
          <span>📅 ${a.timestamp ? new Date(a.timestamp).toLocaleDateString('id-ID') : '-'}</span>
        </div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // UI Helpers
  updateStatus() {
    const onlineStatus = document.getElementById('onlineStatus');
    const lastSync = document.getElementById('lastSync');
    const pendingCount = document.getElementById('pendingCount');
    const pendingBadge = document.getElementById('pendingBadge');
    
    if (onlineStatus) onlineStatus.textContent = navigator.onLine ? 'Yes ✅' : 'No ❌';
    
    if (!this.db) {
      if (pendingCount) pendingCount.textContent = 'DB Error';
      return;
    }
    
    const tx = this.db.transaction(['pending'], 'readonly');
    const store = tx.objectStore('pending');
    const request = store.count();
    
    request.onsuccess = () => {
      const count = request.result;
      if (pendingCount) pendingCount.textContent = count;
      if (pendingBadge) {
        pendingBadge.textContent = count;
        pendingBadge.classList.toggle('hidden', count === 0);
      }
    };
    
    request.onerror = () => {
      if (pendingCount) pendingCount.textContent = 'Error';
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
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  async testConnection() {
    this.showToast('Testing API...', 'info');
    this.log('INFO', 'Testing connection to:', CONFIG.API_URL);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${CONFIG.API_URL}?action=test`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      this.log('INFO', 'Test response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      this.log('INFO', 'Test result:', result);
      
      this.showToast(`✅ API OK: ${result.message || 'Connected'}`, 'success');
      
    } catch (err) {
      this.log('ERROR', 'Test failed:', err.message);
      this.showToast(`❌ API Error: ${err.message}`, 'error');
    }
  }
  
  // Debug function - call from console: app.showDebug()
  showDebug() {
    console.table(this.debugLogs);
    alert(this.debugLogs.map(l => `[${l.type}] ${l.message}`).join('\n'));
  }
}

// Initialize
const app = new TurbineApp();
