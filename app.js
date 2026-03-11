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
// ESP32 LIVE-DATEN
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  const temp =
    d.temp ??
    d.temperature ??
    d.temp_c ??
    d.t ??
    null;

  document.getElementById("live-temp").textContent =
    temp !== null ? Number(temp).toFixed(1) : "--.-";

  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";
}

onValue(ref(db, "weather/history/live"), snap => {
  const d = snap.val();
  renderLive(d);
});

// ---------------------------------------------------------
// Live-Icon oben (aus OpenWeather abgeleitet)
// ---------------------------------------------------------
function setLiveIcon(iconCode) {
  const code = iconCode.replace("n", "d");
  document.getElementById("icon-top").src =
    `https://openweathermap.org/img/wn/${code}@2x.png`;
}

// ---------------------------------------------------------
// OpenWeather – Icon-Mapping (modernes SVG)
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
// OpenWeather – aktuelle Daten aus Firebase
// ---------------------------------------------------------
function loadOpenWeather() {
  const owRef = ref(db, "weather/openweather");

  onValue(owRef, snap => {
    if (!snap.exists()) return;

    const raw = snap.val().raw;
    const data = JSON.parse(raw);

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

    const desc =
      data.weather?.[0]?.description ||
      data.weather?.[0]?.main ||
      data.description ||
      "--";

    document.getElementById("ow-desc").textContent = desc;

    let iconCode = data.weather[0].icon;

    // Live-Icon oben
    setLiveIcon(iconCode);

    // Modernes SVG-Icon
    const modern = getModernIcon(iconCode);
    document.getElementById("ow-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/" +
      modern +
      ".svg";

    // Sunrise/Sunset Icons
    document.getElementById("sunrise-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/sunrise.svg";
    document.getElementById("sunset-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/sunset.svg";
  });
}

loadOpenWeather();

// ---------------------------------------------------------
// OpenWeather – WEEK HISTORY (Chart)
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
      responsive: true
    }
  });
}

loadWeekHistory();

// ---------------------------------------------------------
// OpenWeather – YEAR HISTORY (Chart)
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
// OpenWeather – Monats- und Jahresstatistik
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

    getVal(`weather/openweather/history/year/min`),
    getVal(`weather/openweather/history/year/max`),
    getVal(`weather/openweather/history/year/sum`),
    getVal(`weather/openweather/history/year/count`)
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
