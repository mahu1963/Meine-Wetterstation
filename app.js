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

// Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------- Icon-Helfer ----------------
function iconUrl(code) {
  return `icons/${code}.png`;
}

// ---------------- LIVE-DATEN ----------------
onValue(ref(db, "/weather/live"), snap => {
  const v = snap.val();
  if (!v) return;

  document.getElementById("live-temp").textContent = v.temp.toFixed(1);
  document.getElementById("live-hum").textContent = v.humidity.toFixed(0);
  document.getElementById("live-pres").textContent = v.pressure.toFixed(1);

  const d = new Date(v.timestamp * 1000);
  document.getElementById("timestamp").textContent =
    `Stand: ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  document.getElementById("icon-top").src = iconUrl(v.icon);
});

// ---------------- FORECAST 5h ----------------
for (let i = 0; i < 5; i++) {
  get(ref(db, `/weather/forecast/5h/${i}`)).then(snap => {
    const v = snap.val();
    if (!v) return;

    document.getElementById(`ft${i}`).textContent = `${v.temp.toFixed(1)}°C`;
    document.getElementById(`f${i}`).src = iconUrl(v.icon);
  });
}

// ---------------- CHARTS ----------------
function loadHistory(path, cb) {
  get(ref(db, path)).then(snap => {
    const val = snap.val();
    if (!val) return;
    const arr = Object.values(val).sort((a, b) => a.timestamp - b.timestamp);
    cb(arr);
  });
}

function buildChart(ctx, label, arr) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: arr.map(e => new Date(e.timestamp * 1000).toLocaleDateString("de-AT")),
      datasets: [{
        label,
        data: arr.map(e => e.temp),
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

// Woche
loadHistory("/weather/history/week", arr => {
  buildChart(
    document.getElementById("chartWeek").getContext("2d"),
    "Temperatur (Woche)",
    arr
  );
});

// Jahr
loadHistory("/weather/history/year", arr => {
  buildChart(
    document.getElementById("chartYear").getContext("2d"),
    "Temperatur (Jahr)",
    arr
  );
});

// ---------------- Monat / Jahr Stats ----------------
function calcStats(path, minEl, maxEl, avgEl) {
  loadHistory(path, arr => {
    const temps = arr.map(e => e.temp);
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
