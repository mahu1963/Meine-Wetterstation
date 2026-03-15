// --------------------------------------------------
// OpenWeather Icon-URL
// --------------------------------------------------
function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

// --------------------------------------------------
// Firebase (Browser-Version)
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation-default-rtdb.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------------------------------------------------
// LIVE-DATEN
// --------------------------------------------------
onValue(ref(db, "/weather/live"), snap => {
  const v = snap.val();
  if (!v) return;

  document.getElementById("live-temp").textContent =
    v.temp != null ? v.temp.toFixed(1) : "--";

  document.getElementById("live-hum").textContent =
    v.humidity != null ? v.humidity.toFixed(0) : "--";

  document.getElementById("live-pres").textContent =
    v.pressure != null ? v.pressure.toFixed(1) : "--";

  if (v.timestamp) {
    const d = new Date(v.timestamp * 1000);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    document.getElementById("timestamp").textContent = `Stand: ${hh}:${mm}`;
  }

  if (v.icon) {
    document.getElementById("icon-top").src = iconUrl(v.icon);
  }
});

// --------------------------------------------------
// FORECAST (5 Stunden)
// --------------------------------------------------
onValue(ref(db, "/weather/forecast/5h"), snap => {
  const data = snap.val();
  if (!data) return;

  for (let i = 0; i < 5; i++) {
    const item = data[i];
    if (!item) continue;

    const tempEl = document.getElementById(`fc-temp-${i}`);
    if (tempEl) {
      tempEl.textContent =
        item.temp != null ? item.temp.toFixed(1) + " °C" : "-- °C";
    }

    const iconEl = document.getElementById(`fc-icon-${i}`);
    if (iconEl && item.icon) {
      iconEl.src = iconUrl(item.icon);
    }
  }
});

// --------------------------------------------------
// SONNENAUF-/UNTERGANG
// --------------------------------------------------
onValue(ref(db, "/weather/sun"), snap => {
  const v = snap.val();
  if (!v) return;

  document.getElementById("sunrise").textContent = v.sunrise || "--:--";
  document.getElementById("sunset").textContent = v.sunset || "--:--";
});

// --------------------------------------------------
// HILFSFUNKTION: Durchschnitt berechnen
// --------------------------------------------------
function calcAverage(arr) {
  if (!arr || !Array.isArray(arr)) return null;

  const values = arr.map(e => e.temp).filter(t => t != null);
  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

// --------------------------------------------------
// WOCHE / MONAT / JAHR – DURCHSCHNITT + CHARTS
// --------------------------------------------------
onValue(ref(db, "/weather/history/week"), snap => {
  const arr = snap.val();
  const avg = calcAverage(arr);

  document.getElementById("week-avg").textContent =
    avg != null ? avg.toFixed(1) + " °C" : "--.- °C";

  updateChart("weekChart", arr, "Woche (°C)");
});

onValue(ref(db, "/weather/history/month"), snap => {
  const arr = snap.val();
  const avg = calcAverage(arr);

  document.getElementById("month-avg").textContent =
    avg != null ? avg.toFixed(1) + " °C" : "--.- °C";

  updateChart("monthChart", arr, "Monat (°C)");
});

onValue(ref(db, "/weather/history/year"), snap => {
  const arr = snap.val();
  const avg = calcAverage(arr);

  document.getElementById("year-avg").textContent =
    avg != null ? avg.toFixed(1) + " °C" : "--.- °C";

  updateChart("yearChart", arr, "Jahr (°C)");
});

// --------------------------------------------------
// CHARTS (Variante B: mit Timestamp)
// --------------------------------------------------
function updateChart(canvasId, arr, label) {
  if (!arr || !Array.isArray(arr)) return;

  const labels = arr.map(e =>
    new Date(e.ts * 1000).toLocaleDateString()
  );

  const temps = arr.map(e => e.temp);

  new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: temps,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxRotation: 0, minRotation: 0 } }
      }
    }
  });
}
