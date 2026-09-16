export const STATIONS = [
  {
    id: "AWS_001",
    name: "Bengaluru Central",
    district: "Bengaluru Urban",
    lat: 12.9716,
    lng: 77.5946,
    elevation: "920m",
    status: "normal", // 'normal' | 'anomaly'
    latestReading: {
      temperature: 24.8,
      humidity: 62.0,
      pressure: 1012.4,
      wind_speed: 3.6,
      timestamp: "2026-09-13T16:58:00Z",
      anomaly: { is_anomaly: false, score: 0.142, reason: "normal" },
    },
  },
  {
    id: "AWS_002",
    name: "Mysuru Heritage",
    district: "Mysuru",
    lat: 12.2958,
    lng: 76.6394,
    elevation: "763m",
    status: "anomaly",
    latestReading: {
      temperature: 68.5,
      humidity: 45.0,
      pressure: 1010.2,
      wind_speed: 4.1,
      timestamp: "2026-09-13T16:59:12Z",
      anomaly: {
        is_anomaly: true,
        score: -0.215,
        reason: "temperature out of range (68.5 °C)",
      },
    },
  },
  {
    id: "AWS_003",
    name: "Mangaluru Coast",
    district: "Dakshina Kannada",
    lat: 12.9141,
    lng: 74.856,
    elevation: "22m",
    status: "normal",
    latestReading: {
      temperature: 30.2,
      humidity: 86.0,
      pressure: 1008.9,
      wind_speed: 6.4,
      timestamp: "2026-09-13T16:57:40Z",
      anomaly: { is_anomaly: false, score: 0.118, reason: "normal" },
    },
  },
  {
    id: "AWS_004",
    name: "Hubli Junction",
    district: "Dharwad",
    lat: 15.3647,
    lng: 75.124,
    elevation: "671m",
    status: "anomaly",
    latestReading: {
      temperature: 28.4,
      humidity: 0.0,
      pressure: 1011.5,
      wind_speed: 3.9,
      timestamp: "2026-09-13T16:58:25Z",
      anomaly: {
        is_anomaly: true,
        score: -0.188,
        reason: "sensor dropout (humidity at 0%)",
      },
    },
  },
  {
    id: "AWS_005",
    name: "Belagavi Foothills",
    district: "Belagavi",
    lat: 15.8497,
    lng: 74.4977,
    elevation: "762m",
    status: "normal",
    latestReading: {
      temperature: 22.9,
      humidity: 78.5,
      pressure: 1013.1,
      wind_speed: 2.8,
      timestamp: "2026-09-13T16:56:50Z",
      anomaly: { is_anomaly: false, score: 0.155, reason: "normal" },
    },
  },
];

// Generate 50 realistic historical time-series readings for a given station
export function generateMockReadings(stationId) {
  const readings = [];
  const now = new Date();

  // Baseline profiles per station
  const baseProfile = {
    AWS_001: { t: 24.0, h: 60.0, p: 1012.0, w: 3.5 },
    AWS_002: { t: 26.0, h: 55.0, p: 1010.0, w: 4.0 },
    AWS_003: { t: 30.5, h: 85.0, p: 1008.0, w: 6.0 },
    AWS_004: { t: 29.0, h: 42.0, p: 1011.0, w: 4.2 },
    AWS_005: { t: 23.0, h: 75.0, p: 1013.0, w: 2.9 },
  }[stationId] || { t: 25.0, h: 60.0, p: 1012.0, w: 3.5 };

  for (let i = 49; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30000); // 30 sec intervals
    const timeStr = time.toTimeString().substring(0, 8);

    let temp = +(baseProfile.t + Math.sin(i / 5) * 2 + (Math.random() - 0.5) * 0.8).toFixed(1);
    let hum = +(baseProfile.h + Math.cos(i / 6) * 5 + (Math.random() - 0.5) * 1.5).toFixed(1);
    let press = +(baseProfile.p + Math.sin(i / 10) * 1.2 + (Math.random() - 0.5) * 0.4).toFixed(1);
    let wind = +(baseProfile.w + Math.cos(i / 4) * 1.5 + (Math.random() - 0.5) * 0.5).toFixed(1);

    let is_anomaly = false;
    let score = +(0.12 + Math.random() * 0.08).toFixed(3);
    let reason = "normal";

    // Inject anomalies for visual demonstrations
    if (i === 15) {
      temp = +(temp + 26.0).toFixed(1);
      is_anomaly = true;
      score = -0.192;
      reason = `temperature spike (+26.0 °C jump)`;
    } else if (i === 32 && (stationId === "AWS_002" || stationId === "AWS_004")) {
      hum = 0.0;
      is_anomaly = true;
      score = -0.174;
      reason = "sensor dropout (humidity at 0%)";
    } else if (i === 0 && stationId === "AWS_002") {
      temp = 68.5;
      is_anomaly = true;
      score = -0.215;
      reason = "temperature out of range (68.5 °C)";
    } else if (i === 0 && stationId === "AWS_004") {
      hum = 0.0;
      is_anomaly = true;
      score = -0.188;
      reason = "sensor dropout (humidity at 0%)";
    }

    readings.push({
      id: 50 - i,
      station_id: stationId,
      timestamp: time.toISOString(),
      displayTime: timeStr,
      temperature: temp,
      humidity: Math.max(0, hum),
      pressure: press,
      wind_speed: Math.max(0, wind),
      anomaly: {
        is_anomaly,
        score,
        reason,
      },
    });
  }

  return readings;
}

export const MOCK_ALERTS = [
  {
    id: 108,
    station_id: "AWS_002",
    timestamp: "2026-09-13T16:59:12Z",
    is_anomaly: true,
    score: -0.215,
    reason: "temperature out of range (68.5 °C)",
  },
  {
    id: 107,
    station_id: "AWS_004",
    timestamp: "2026-09-13T16:58:25Z",
    is_anomaly: true,
    score: -0.188,
    reason: "sensor dropout (humidity at 0%)",
  },
  {
    id: 106,
    station_id: "AWS_001",
    timestamp: "2026-09-13T16:45:00Z",
    is_anomaly: true,
    score: -0.164,
    reason: "stuck sensor (temperature constant at 25.0 °C for >= 5 readings)",
  },
  {
    id: 105,
    station_id: "AWS_003",
    timestamp: "2026-09-13T16:32:10Z",
    is_anomaly: true,
    score: -0.149,
    reason: "wind speed spike (32.4 m/s)",
  },
  {
    id: 104,
    station_id: "AWS_005",
    timestamp: "2026-09-13T16:15:44Z",
    is_anomaly: true,
    score: -0.138,
    reason: "pressure out of range (935 hPa)",
  },
  {
    id: 103,
    station_id: "AWS_002",
    timestamp: "2026-09-13T15:52:19Z",
    is_anomaly: true,
    score: -0.177,
    reason: "temperature spike (+24.8 °C jump)",
  },
  {
    id: 102,
    station_id: "AWS_004",
    timestamp: "2026-09-13T15:20:05Z",
    is_anomaly: true,
    score: -0.155,
    reason: "sensor dropout (humidity at 0%)",
  },
];
