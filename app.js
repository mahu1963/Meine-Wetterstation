// ---------------------------------------------------------
// Firebase Setup
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "593494014586",
  appId: "1:593494014586:web:cad0037363543e946059c3",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------
// Dark Mode
// ---------------------------------------------------------
const toggle = document.getElementById("dark-toggle");

toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkmode", document.body.classList.contains("dark"));
});

if (localStorage.getItem("darkmode") === "true") {
  document.body.classList.add("dark");
}

// ---------------------------------------------------------
// Offline Fallback
// ---------------------------------------------------------
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "null");
}

// ---------------------------------------------------------
// Animierte Icons (Lottie)
// ---------------------------------------------------------
const icons = {
  sunny: "icons/sunny.json",
  partly_cloudy: "icons/cloudy.json",
  cloudy: "icons/cloudy.json",
  rain: "icons/rain.json",
  rain_showers: "icons/rain.json",
  drizzle: "icons/rain.json",
  snow: "icons/snow.json",
  fog: "icons/cloudy.json",
  thunderstorm: "icons/thunder.json",
  hail: "icons/thunder.json",
  unknown: "icons/cloudy.json"
};

let liveAnim = null;

function setLiveIcon(iconName) {
  if (!icons[iconName]) iconName = "unknown";

  if (liveAnim) liveAnim.destroy();

  liveAnim = lottie.loadAnimation({
    container: document.getElementById("live-icon"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: icons[iconName]
  });
}

// ---------------------------------------------------------
// Live Rendering
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  // Temperatur
  document.getElementById("live-temp").textContent =
    d.temp ? d.temp.toFixed(1) : "--.-";

  // Feuchte
  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  // Druck
  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  // Zeitstempel
  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";
}

// ---------------------------------------------------------
// Stunden Forecast Rendering
// ---------------------------------------------------------
function renderHours(hours) {
  const container = document.getElementById("hours-container");
  container.innerHTML = "";

  hours.forEach(h => {
    const box = document.createElement("div");
    box.className = "hour-box";
    box.innerHTML = `
      <div>${h.timestamp.substring(11,16)}</div>
      <div>${h.temperatur.toFixed(1)}°</div>
      <div>${h.icon}</div>
    `;
    container.appendChild(box);
  });
}

// ---------------------------------------------------------
// Tages Forecast Rendering
// ---------------------------------------------------------
function renderDays(days) {
  const container = document.getElementById("days-container");
  container.innerHTML = "";

  days.forEach(d => {
    const box = document.createElement("div");
    box.className = "day-box";
    box.innerHTML = `
      <h3>${d.datum}</h3>
      <div>${d.icon}</div>
      <div>${d.t_min.toFixed(1)}° / ${d.t_max.toFixed(1)}°</div>
      <div>Wind: ${d.wind.toFixed(1)} km/h</div>
      <div>Regen: ${d.regen.toFixed(1)} mm</div>
    `;
    container.appendChild(box);
  });
}

// ---------------------------------------------------------
// Diagramme (Chart.js)
// ---------------------------------------------------------
let chartTemp, chartWind, chartRain;

function createCharts(hours) {
  const labels = hours.map(h => h.timestamp.substring(11,16));

  const temps = hours.map(h => h.temperatur);
  const winds = hours.map(h => h.wind);
  const rains = hours.map(h => h.regen);

  if (chartTemp) chartTemp.destroy();
  if (chartWind) chartWind.destroy();
  if (chartRain) chartRain.destroy();

  chartTemp = new Chart(document.getElementById("chart-temp"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperatur (°C)",
        data: temps,
        borderColor: "#ff5722",
        fill: false
      }]
    }
  });

  chartWind = new Chart(document.getElementById("chart-wind"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Wind (km/h)",
        data: winds,
        borderColor: "#2196f3",
        fill: false
      }]
    }
  });

  chartRain = new Chart(document.getElementById("chart-rain"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Regen (mm)",
        data: rains,
        backgroundColor: "#4caf50"
      }]
    }
  });
}

// ---------------------------------------------------------
// Firebase Listener
// ---------------------------------------------------------

// LIVE
onValue(ref(db, "weather/live"), snap => {
  const d = snap.val();
  saveLocal("live", d);
  renderLive(d);
});

// OFFLINE FALLBACK LIVE
const offlineLive = loadLocal("live");
if (offlineLive) renderLive(offlineLive);

// STUNDEN
onValue(ref(db, "weather/forecast/stunden"), snap => {
  const data = Object.values(snap.val());
  saveLocal("hours", data);
  renderHours(data);
  createCharts(data);
});

// OFFLINE FALLBACK STUNDEN
const offlineHours = loadLocal("hours");
if (offlineHours) {
  renderHours(offlineHours);
  createCharts(offlineHours);
}

// TAGE
onValue(ref(db, "weather/forecast_daily"), snap => {
  const data = Object.values(snap.val());
  saveLocal("days", data);
  renderDays(data);
});

// OFFLINE FALLBACK TAGE
const offlineDays = loadLocal("days");
if (offlineDays) renderDays(offlineDays);

// ---------------------------------------------------------
// Tages-Min/Max
// ---------------------------------------------------------
function loadTodayMinMax() {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

  const minRef = ref(db, `weather/day/${key}/min`);
  const maxRef = ref(db, `weather/day/${key}/max`);

  onValue(minRef, snap => {
    document.getElementById("minToday").textContent =
      snap.exists() ? snap.val().toFixed(1) + "°C" : "-";
  });

  onValue(maxRef, snap => {
    document.getElementById("maxToday").textContent =
      snap.exists() ? snap.val().toFixed(1) + "°C" : "-";
  });
}

loadTodayMinMax();

// ---------------------------------------------------------
// Monats- und Jahresstatistik
// ---------------------------------------------------------
async function loadMonthYearStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = `${year}-${month}`;

  const getVal = async p => (await get(ref(db, p))).val();

  const [
    minM, maxM, sumM, countM,
    minY, maxY, sumY, countY
  ] = await Promise.all([
    getVal(`weather/month/${key}/min`),
    getVal(`weather/month/${key}/max`),
    getVal(`weather/month/${key}/sum`),
    getVal(`weather/month/${key}/count`),
    getVal(`weather/year/${year}/min`),
    getVal(`weather/year/${year}/max`),
    getVal(`weather/year/${year}/sum`),
    getVal(`weather/year/${year}/count`)
  ]);

  document.getElementById("minMonth").textContent = minM ? minM.toFixed(1) + "°C" : "-";
  document.getElementById("maxMonth").textContent = maxM ? maxM.toFixed(1) + "°C" : "-";
  document.getElementById("avgMonth").textContent =
    sumM && countM ? (sumM / countM).toFixed(1) + "°C" : "-";

  document.getElementById("minYear").textContent = minY ? minY.toFixed(1) + "°C" : "-";
  document.getElementById("maxYear").textContent = maxY ? maxY.toFixed(1) + "°C" : "-";
  document.getElementById("avgYear").textContent =
    sumY && countY ? (sumY / countY).toFixed(1) + "°C" : "-";
}

loadMonthYearStats();

// ---------------------------------------------------------
// Wochen-History Diagramme
// ---------------------------------------------------------
function loadHistory(path, callback) {
  const r = ref(db, path);
  onValue(r, snap => {
    const data = snap.val();
    if (!data) return;

    const labels = [];
    const temps = [];
    const winds = [];
    const rains = [];

    Object.keys(data).forEach(key => {
      const entry = data[key];
      labels.push(key);
      temps.push(entry.temperatur);
      winds.push(entry.wind);
      rains.push(entry.regen);
    });

    callback(labels, temps, winds, rains);
  });
}

function createChart(canvasId, labels, data, label, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color + "33",
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      },
      plugins: {
        legend: { labels: { color: "#fff" } }
      }
    }
  });
}

loadHistory("weather/history/week", (labels, temps, winds, rains) => {
  createChart("chart-temp", labels, temps, "Temperatur (°C)", "#ffcc00");
  createChart("chart-wind", labels, winds, "Wind (m/s)", "#00e5ff");
  createChart("chart-rain", labels, rains, "Regen (mm)", "#4a90e2");
});
