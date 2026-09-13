/**
 * Orca Gymnastics - Google Apps Script Client API Integration
 */

window.orcaGas = (function () {
  let gasWebAppUrl = localStorage.getItem('orca_gas_webapp_url') || '';

  function setWebAppUrl(url) {
    gasWebAppUrl = url.trim();
    localStorage.setItem('orca_gas_webapp_url', gasWebAppUrl);
  }

  function getWebAppUrl() {
    return gasWebAppUrl;
  }

  async function syncAllDataFromGoogleSheet() {
    if (!gasWebAppUrl) return null;
    try {
      const res = await fetch(`${gasWebAppUrl}?action=getAllData`);
      const data = await res.json();
      if (data.status === 'success') {
        if (data.users && data.users.length) localStorage.setItem('orca_users', JSON.stringify(data.users));
        if (data.children && data.children.length) localStorage.setItem('orca_children', JSON.stringify(data.children));
        if (data.bookings && data.bookings.length) localStorage.setItem('orca_bookings', JSON.stringify(data.bookings));
        if (data.auditLogs && data.auditLogs.length) localStorage.setItem('orca_audit_logs', JSON.stringify(data.auditLogs));
        return data;
      }
    } catch (e) {
      console.warn('Google Sheets sync notice:', e);
    }
    return null;
  }

  async function postToGas(action, payload) {
    if (!gasWebAppUrl) return null;
    try {
      const response = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data: payload })
      });
      return await response.json();
    } catch (e) {
      console.error('GAS post error:', e);
      return null;
    }
  }

  return {
    setWebAppUrl,
    getWebAppUrl,
    syncAllDataFromGoogleSheet,
    postToGas
  };
})();
