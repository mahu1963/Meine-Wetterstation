// app.js (ESM)

// ---------------- Firebase v9 ----------------
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------- ICON MAP (SVG) ----------------
function iconUrl(code) {
  const map = {
    "01d": "clear-day.svg",
    "01n": "clear-night.svg",

    "02d": "partly-cloudy-day.svg",
    "02n": "partly-cloudy-night.svg",

    "03d": "cloudy.svg",
    "03n": "cloudy.svg",

    "04d": "overcast.svg",
    "04n": "overcast.svg",

    "09d": "rain.svg",
    "09n": "rain.svg",

    "10d": "rain.svg",
    "10n": "rain.svg",

    "11d": "thunderstorm.svg",
    "11n": "thunderstorm.svg",

    "13d": "snow.svg",
    "13n": "snow.svg",

    "50d": "mist.svg",
    "50n": "mist.svg"
  };

  return `icons/${map[code] || "cloudy.svg"}`;
}

// ---------------- LIVE-DATEN ----------------
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
    document.getElementById("timestamp").textContent =
      `Stand: ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  if (v.icon) {
    document.getElementById("icon-top").src = iconUrl(v.icon);
  }
});

// ---------------- FORECAST 5h ----------------
for (let i = 0; i < 5; i++) {
  get(ref(db, `/weather/forecast/5h/${i}`)).then(snap => {
    const v = snap.val();
    if (!v) return;

    const tempEl = document.getElementById(`ft${i}`);
    const iconEl = document.getElementById(`f${i}`);

    if (tempEl && v.temp != null) {
      tempEl.textContent = `${v.temp.toFixed(1)}°C`;
    }

    if (iconEl && v.icon) {
      iconEl.src = iconUrl(v.icon);
    }
  });
}

// ---------------- HISTORY / CHARTS ----------------
function loadHistory(path, cb) {
  get(ref(db, path)).then(snap => {
    const val = snap.val();
    if (!val) return;

    const arr = Object.values(val).sort((a, b) => a.timestamp - b.timestamp);
    cb(arr);
  });
}

function buildChart(ctx, label, arr, valueKey = "temp") {
  const labels = arr.map(e =>
    new Date(e.timestamp * 1000).toLocaleDateString("de-AT")
  );
  const data = arr.map(e => e[valueKey] ?? 0);

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: "#4fc3f7",
        backgroundColor: "rgba(79,195,247,0.15)",
        tension: 0.25,
        pointRadius: 0
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#ccc" }, grid: { color: "#222" } },
        y: { ticks: { color: "#ccc" }, grid: { color: "#222" } }
      }
    }
  });
}

// Woche (Temperatur)
loadHistory("/weather/history/week", arr => {
  const ctx = document.getElementById("chartWeek")?.getContext("2d");
  if (!ctx) return;
  buildChart(ctx, "Temperatur (Woche)", arr, "temp");
});

// Jahr (Temperatur)
loadHistory("/weather/history/year", arr => {
  const ctx = document.getElementById("chartYear")?.getContext("2d");
  if (!ctx) return;
  buildChart(ctx, "Temperatur (Jahr)", arr, "temp");
});

// Regen (Woche)
loadHistory("/weather/history/week", arr => {
  const ctx = document.getElementById("chartRain")?.getContext("2d");
  if (!ctx) return;
  buildChart(ctx, "Regen (mm)", arr, "rain");
});

// Wind (Woche)
loadHistory("/weather/history/week", arr => {
  const ctx = document.getElementById("chartWind")?.getContext("2d");
  if (!ctx) return;
  buildChart(ctx, "Wind (km/h)", arr, "wind");
});

// ---------------- Monat / Jahr Stats ----------------
function calcStats(path, minEl, maxEl, avgEl) {
  loadHistory(path, arr => {
    const temps = arr.map(e => e.temp).filter(t => t != null);
    if (temps.length === 0) return;

    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;

    document.getElementById(minEl).textContent = `${min.toFixed(1)} °C`;
    document.getElementById(maxEl).textContent = `${max.toFixed(1)} °C`;
    document.getElementById(avgEl).textContent = `${avg.toFixed(1)} °C`;
  });
}

calcStats("/weather/history/month", "minMonth", "maxMonth", "avgMonth");
calcStats("/weather/history/year", "minYear", "maxYear", "avgYear");
