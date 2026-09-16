// API client for AWS Anomaly Detection backend
// The FastAPI backend exposes:
// 1. POST /api/reading
// 2. GET /api/readings/{station_id}
// 3. GET /api/alerts

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchStationReadings(stationId) {
  try {
    const res = await fetch(`${API_BASE}/api/readings/${stationId}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // Graceful fallback during offline or startup
    console.debug(`fetchStationReadings for ${stationId} failed:`, err.message);
    return null;
  }
}

export async function fetchAlerts() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.debug('fetchAlerts failed:', err.message);
    return null;
  }
}

export async function postReading(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/reading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('postReading failed:', err.message);
    throw err;
  }
}
