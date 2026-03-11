// ---------------------------------------------------------
// ESP32 LIVE-DATEN
// ---------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Setup
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
// LIVE-DATEN RENDERN
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  // Temperatur (ESP32)
  const temp =
    d.temp ??
    d.temperature ??
    d.temp_c ??
    d.t ??
    null;

  document.getElementById("live-temp").textContent =
    temp !== null ? Number(temp).toFixed(1) : "--.-";

  // Feuchte
  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  // Druck
  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  // Timestamp
  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";
}

// ---------------------------------------------------------
// ESP32 LIVE-LISTENER
// ---------------------------------------------------------
onValue(ref(db, "weather/history/live"), snap => {
  const d = snap.val();
  console.log("ESP32 Live:", d);
  renderLive(d);
});

// ---------------------------------------------------------
// LIVE ICON (oben) — farbig erzwingen
// ---------------------------------------------------------
export function setLiveIcon(iconCode) {
  // Nacht → Tag (farbig)
  const code = iconCode.replace("n", "d");

  document.getElementById("icon-top").src =
    `https://openweathermap.org/img/wn/${code}@2x.png`;
}
// ---------------------------------------------------------
// OPENWEATHER – ICON-MAPPING (für modernes SVG-Icon)
// ---------------------------------------------------------
function getModernIcon(iconCode) {
  const map = {
    "01d": "clear-day",
    "01n": "clear-night",
    "02d": "partly-cloudy-day",
    "02n": "partly-cloudy-night",
    "03d": "cloudy",
    "03n": "cloudy",
    "04d": "overcast",
    "04n": "overcast",
    "09d": "rain",
    "09n": "rain",
    "10d": "rain",
    "10n": "rain",
    "11d": "thunderstorm",
    "11n": "thunderstorm",
    "13d": "snow",
    "13n": "snow",
    "50d": "mist",
    "50n": "mist"
  };

  return map[iconCode] || "cloudy";
}

// ---------------------------------------------------------
// OPENWEATHER – AKTUELLE DATEN LADEN
// ---------------------------------------------------------
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

function loadOpenWeather() {
  const owRef = ref(db, "weather/openweather");

  onValue(owRef, snap => {
    if (!snap.exists()) return;

    const raw = snap.val().raw;
    const data = JSON.parse(raw);

    // Basiswerte
    document.getElementById("ow-temp").textContent = data.main.temp.toFixed(1);
    document.getElementById("ow-humidity").textContent = data.main.humidity;
    document.getElementById("ow-pressure").textContent = data.main.pressure;
    document.getElementById("ow-wind").textContent = data.wind.speed;
    document.getElementById("ow-clouds").textContent = data.clouds.all;

    const time = new Date(data.dt * 1000);
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    document.getElementById("ow-sunrise").textContent =
      sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    document.getElementById("ow-sunset").textContent =
      sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    document.getElementById("ow-time").textContent = time.toLocaleString();

    // Beschreibung robust
    const desc =
      data.weather?.[0]?.description ||
      data.weather?.[0]?.main ||
      data.description ||
      "--";

    document.getElementById("ow-desc").textContent = desc;

    // Icon-Code
    let iconCode = data.weather[0].icon;

    // Live-Icon oben farbig erzwingen (n → d)
    setLiveIcon(iconCode);

    // PNG-Icon unten (OpenWeather-Original, aber auch n→d möglich)
    const colorCode = iconCode.replace("n", "d");
    document.getElementById("icon-bottom").src =
      `https://openweathermap.org/img/wn/${colorCode}@2x.png`;

    // Modernes SVG-Icon
    const modern = getModernIcon(iconCode);
    document.getElementById("ow-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/" +
      modern +
      ".svg";

    // Sunrise/Sunset Icons (fixe SVGs)
    document.getElementById("sunrise-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/sunrise.svg";

    document.getElementById("sunset-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/sunset.svg";
  });
}

loadOpenWeather();
// ---------------------------------------------------------
// OPENWEATHER – WEEK HISTORY (für Wochen-Chart)
// ---------------------------------------------------------
let weekChart = null;

function loadWeekHistory() {
  const weekRef = ref(db, "weather/openweather/history/week");

  onValue(weekRef, snap => {
    if (!snap.exists()) return;

    const data = snap.val();
    const labels = [];
    const temps = [];

    const entries = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

    entries.forEach(entry => {
      const date = new Date(entry.timestamp * 1000);
      labels.push(date.toLocaleString());
      temps.push(entry.temp);
    });

    drawWeekChart(labels, temps);
  });
}

function drawWeekChart(labels, temps) {
  const ctx = document.getElementById("chartWeek").getContext("2d");

  if (weekChart) weekChart.destroy();

  weekChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperatur (°C)",
        data: temps,
        borderColor: "#ff6600",
        backgroundColor: "rgba(255, 102, 0, 0.2)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true },
        y: { display: true }
      }
    }
  });
}

loadWeekHistory();
// ---------------------------------------------------------
// OPENWEATHER – YEAR HISTORY (für Jahres-Chart)
// ---------------------------------------------------------
let yearChart = null;

function loadYearHistory() {
  const yearRef = ref(db, "weather/openweather/history/year");

  onValue(yearRef, snap => {
    if (!snap.exists()) return;

    const data = snap.val();
    const labels = [];
    const temps = [];

    const entries = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

    entries.forEach(entry => {
      const date = new Date(entry.timestamp * 1000);
      labels.push(date.toLocaleDateString());
      temps.push(entry.temp);
    });

    drawYearChart(labels, temps);
  });
}

function drawYearChart(labels, temps) {
  const ctx = document.getElementById("chartYear").getContext("2d");

  if (yearChart) yearChart.destroy();

  yearChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperatur (°C)",
        data: temps,
        borderColor: "#33cc33",
        backgroundColor: "rgba(51, 204, 51, 0.2)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true
    }
  });
}

loadYearHistory();
// ---------------------------------------------------------
// OPENWEATHER – MONATS- UND JAHRESSTATISTIK
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
    getVal(`weather/openweather/history/month/${key}/min`),
    getVal(`weather/openweather/history/month/${key}/max`),
    getVal(`weather/openweather/history/month/${key}/sum`),
    getVal(`weather/openweather/history/month/${key}/count`),

    getVal(`weather/openweather/history/year/${year}/min`),
    getVal(`weather/openweather/history/year/${year}/max`),
    getVal(`weather/openweather/history/year/${year}/sum`),
    getVal(`weather/openweather/history/year/${year}/count`)
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
