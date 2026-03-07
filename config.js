// ============================================
// ⚠️  GANTI INI SAJA SAAT DEPLOY ULANG!
// ============================================

const CONFIG = {
  // 🔄 URL Google Apps Script Web App Anda
  // Cara dapat: Deploy → Manage Deployments → Web App → Copy URL
  API_URL: 'https://script.google.com/macros/s/AKfycbxShqFQUgVQyZTZsHltB05QgG-gdPCtl9tZC_bM1mtzcJzRZGNPKiyxVUvsqKDM4ZSs/exec',
  
  // Versi app (untuk cache busting)
  VERSION: '1.0.0',
  
  // Nama database IndexedDB
  DB_NAME: 'TurbineLogDB',
  
  // Debug mode (true = console log lengkap)
  DEBUG: true
};

// Biarkan kode di bawah ini!
if (typeof module !== 'undefined') module.exports = CONFIG;
