console.log("app.js wurde geladen!");
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
// Offline Fallback
// ---------------------------------------------------------
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "null");
}

// ---------------------------------------------------------
// OpenWeather Icon Mapping
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
// OpenWeather Icon Loader
// ---------------------------------------------------------
async function loadOpenWeatherIcon() {
  const apiKey = "27602f1bbb8e3dd3587a1da6e3de24b6";
  const lat = 47.4;
  const lon = 16.2;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const iconCode = data.weather[0].icon;
    const modern = getModernIcon(iconCode);

    document.getElementById("live-icon").innerHTML =
      `<img src="https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/${modern}.svg"
            style="width:90px;height:90px;">`;

  } catch (err) {
    console.error("Fehler beim Laden des OpenWeather-Icons:", err);
  }
}

// ---------------------------------------------------------
// Live Rendering
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  document.getElementById("live-temp").textContent =
    d.temp ? d.temp.toFixed(1) : "--.-";

  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";

  loadOpenWeatherIcon();
}

// ---------------------------------------------------------
// Firebase Listener – LIVE
// ---------------------------------------------------------
onValue(ref(db, "weather/live"), snap => {
  console.log("Firebase Live-Daten empfangen:", snap.val());
  const d = snap.val();
  renderLive(d);
});

// Offline fallback
const offlineLive = loadLocal("live");
if (offlineLive) renderLive(offlineLive);

// ---------------------------------------------------------
// OpenWeather aus Firebase laden
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

    const icon = data.weather[0].icon;
    const modern = getModernIcon(icon);

    document.getElementById("ow-icon").src =
      "https://cdn.jsdelivr.net/npm/@bybas/weather-icons/production/fill/all/" + modern + ".svg";

    document.getElementById("ow-desc").textContent =
      data.weather[0].description;
  });
}

loadOpenWeather();

// ---------------------------------------------------------
// Tages-Min/Max
// ---------------------------------------------------------
function loadTodayMinMax() {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

  const minRef = ref(db, `weather/day/${key}/temp/min`);
  const maxRef = ref(db, `weather/day/${key}/temp/max`);

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
// History (Woche)
// ---------------------------------------------------------
async function loadWeekHistory() {
  const weekRef = ref(db, "weather/history/week");

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

let weekChart = null;

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
// History (Jahr)
// ---------------------------------------------------------
async function loadYearHistory() {
  const yearRef = ref(db, "weather/history/year");

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

let yearChart = null;

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

// ---------------------------------------------------------
// Lottie Animationen
// ---------------------------------------------------------
function initLottie() {
  const sunrise = document.getElementById("sunrise-anim");
  const sunset = document.getElementById("sunset-anim");

  if (!sunrise || !sunset) {
    setTimeout(initLottie, 300);
    return;
  }

  // Neue funktionierende Animationen
  lottie.loadAnimation({
    container: sunrise,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "https://lottie.host/0e6c2f2c-0c3d-4f5a-9f8a-8b5b6f1c6e8f/8xJt8Q2gqP.json"
  });

  lottie.loadAnimation({
    container: sunset,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "https://lottie.host/7b8b1c6d-4e3f-4e2a-9c3f-1b2a3d4e5f6a/3Qp9sYt7uL.json"
  });
}
