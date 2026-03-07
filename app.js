// ============================================
// TURBINE LOGSHEET PWA - Main App
// ============================================

class TurbineApp {
  constructor() {
    this.currentMode = 'TURBINE';
    this.db = null;
    this.pendingSync = [];
    this.photoData = null;
    
    // Data konstanta (dari GAS)
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

  async init() {
    await this.initDB();
    this.renderLogsheetFields();
    this.generateAnomaliId();
    this.updateStatus();
    this.loadAnomaliList();
    
    // Auto sync when online
    window.addEventListener('online', () => {
      this.showToast('Koneksi kembali! Menyinkronkan...', 'success');
      this.syncData();
    });
    
    // Load draft if exists
    this.loadDraft();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('drafts', { keyPath: 'key' });
      };
    });
  }

  // Navigation
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page${page.charAt(0).toUpperCase() + page.slice(1)}`).classList.add('active');
    event.target.closest('.nav-item').classList.add('active');
    
    if (page === 'home') this.updateStatus();
    if (page === 'anomali') this.loadAnomaliList();
  }

  // Mode switcher
  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(mode === 'TURBINE' ? 'Turbine' : mode === 'CT' ? 'CT' : 'Oli'));
    });
    this.renderLogsheetFields();
    this.loadDraft();
  }

  renderLogsheetFields() {
    const container = document.getElementById('logsheetFields');
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

  // Save functions
  async saveLogsheet(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((val, key) => { if(val) data[key] = val; });
    
    const payload = {
      type: 'LOGSHEET',
      mode: this.currentMode,
      data: data,
      area: this.currentMode,
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
    this.loadAnomaliList();
  }

  async saveToApiOrQueue(payload, typeName) {
    this.showLoading(true);
    
    try {
      if (navigator.onLine) {
        const response = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          this.showToast(`${typeName} berhasil disimpan!`, 'success');
          this.clearDraft();
        } else {
          throw new Error(result.message);
        }
      } else {
        await this.queueForSync(payload);
        this.showToast(`${typeName} disimpan lokal (offline)`, 'warning');
      }
    } catch (error) {
      console.error('Save error:', error);
      await this.queueForSync(payload);
      this.showToast(`${typeName} disimpan lokal (error)`, 'warning');
    } finally {
      this.showLoading(false);
      this.updateStatus();
    }
  }

  async queueForSync(data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['pending'], 'readwrite');
      const store = tx.objectStore('pending');
      store.add({ data, created: new Date().toISOString() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async syncData() {
    if (!navigator.onLine) {
      this.showToast('Tidak ada koneksi!', 'error');
      return;
    }
    
    this.showLoading(true);
    const tx = this.db.transaction(['pending'], 'readonly');
    const store = tx.objectStore('pending');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const pending = request.result;
      let success = 0, failed = 0;
      
      for (const item of pending) {
        try {
          const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
          
          const result = await response.json();
          if (result.status === 'success') {
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
      
      this.showLoading(false);
      this.showToast(`Sync: ${success} sukses, ${failed} gagal`, success > 0 ? 'success' : 'warning');
      this.updateStatus();
    };
  }

  // Draft management
  autoSaveDraft() {
    clearTimeout(this.draftTimeout);
    this.draftTimeout = setTimeout(() => this.saveDraft(), 2000);
  }

  saveDraft() {
    const inputs = document.querySelectorAll('#logsheetForm input');
    const draft = {};
    inputs.forEach(input => { if(input.value) draft[input.name] = input.value; });
    
    const tx = this.db.transaction(['drafts'], 'readwrite');
    tx.objectStore('drafts').put({ 
      key: `draft_${this.currentMode}`, 
      data: draft,
      saved: new Date().toISOString()
    });
    
    this.showToast('Draft disimpan', 'success');
  }

  loadDraft() {
    const tx = this.db.transaction(['drafts'], 'readonly');
    const store = tx.objectStore('drafts');
    const request = store.get(`draft_${this.currentMode}`);
    
    request.onsuccess = () => {
      if (request.result) {
        const draft = request.result.data;
        Object.entries(draft).forEach(([key, val]) => {
          const input = document.querySelector(`input[name="${key}"]`);
          if (input) input.value = val;
        });
      }
    };
  }

  clearDraft() {
    const tx = this.db.transaction(['drafts'], 'readwrite');
    tx.objectStore('drafts').delete(`draft_${this.currentMode}`);
  }

  // Anomali functions
  generateAnomaliId() {
    const id = 'ANM-' + Date.now().toString(36).toUpperCase();
    document.getElementById('anomaliId').value = id;
  }

  previewPhoto(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoData = e.target.result;
        const preview = document.getElementById('photoPreview');
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  async loadAnomaliList() {
    try {
      if (navigator.onLine) {
        const response = await fetch(`${CONFIG.API_URL}?action=getAnomali`);
        const data = await response.json();
        this.renderAnomaliList(data);
      } else {
        document.getElementById('anomaliList').innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📴</div>
            <p>Mode offline - tidak bisa load data</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('Load anomali error:', err);
    }
  }

  renderAnomaliList(anomalies) {
    const container = document.getElementById('anomaliList');
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
          <span class="status-badge status-${(a.status || 'open').toLowerCase().replace(' ', '-')}">
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

  // UI Helpers
  updateStatus() {
    document.getElementById('onlineStatus').textContent = navigator.onLine ? 'Yes' : 'No';
    
    const tx = this.db.transaction(['pending'], 'readonly');
    const store = tx.objectStore('pending');
    const request = store.count();
    
    request.onsuccess = () => {
      const count = request.result;
      document.getElementById('pendingCount').textContent = count;
      const badge = document.getElementById('pendingBadge');
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    };
  }

  showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  async testConnection() {
    this.showToast('Testing connection...', 'info');
    try {
      const response = await fetch(`${CONFIG.API_URL}?action=test`);
      const result = await response.json();
      this.showToast(`API OK: ${result.message}`, 'success');
    } catch (err) {
      this.showToast('API Error: ' + err.message, 'error');
    }
  }
}

// Initialize app
const app = new TurbineApp();
