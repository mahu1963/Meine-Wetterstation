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
// Chart.js Setup
// ---------------------------------------------------------
const ctxWeek = document.getElementById("chartWeek").getContext("2d");
const chartWeek = new Chart(ctxWeek, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Temperatur (Woche)",
      data: [],
      borderColor: "#ffcc33",
      backgroundColor: "rgba(255, 204, 51, 0.15)",
      tension: 0.3,
      pointRadius: 0
    }]
  },
  options: {
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { beginAtZero: false, ticks: { color: "#ccc" } }
    }
  }
});

const ctxYear = document.getElementById("chartYear").getContext("2d");
const chartYear = new Chart(ctxYear, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Temperatur (Jahr)",
      data: [],
      borderColor: "#66aaff",
      backgroundColor: "rgba(102,170,255,0.15)",
      tension: 0.25,
      pointRadius: 0
    }]
  },
  options: {
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { beginAtZero: false, ticks: { color: "#ccc" } }
    }
  }
});

// ---------------------------------------------------------
// Smooth Number Animation (Easing)
// ---------------------------------------------------------
function animateNumber(el, from, to, duration = 600, suffix = "", decimals = 1) {
  const start = performance.now();
  const ease = x => 1 - Math.pow(1 - x, 3);

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = ease(progress);
    const value = from + (to - from) * eased;

    el.textContent = value.toFixed(decimals) + suffix;

    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------
// ESP32 LIVE-DATEN
// ---------------------------------------------------------
onValue(ref(db, "weather/live"), snap => {
  const d = snap.val();
  if (!d) return;

  const tempEl = document.getElementById("live-temp");
  const humEl  = document.getElementById("live-hum");
  const presEl = document.getElementById("live-pres");

  animateNumber(tempEl, Number(tempEl.textContent || 0), Number(d.temp), 600, "", 1);
  animateNumber(humEl,  Number(humEl.textContent  || 0), Number(d.humidity), 600, "", 0);
  animateNumber(presEl, Number(presEl.textContent || 0), Number(d.pressure), 600, "", 1);

  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Stand: --";
});

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
// SVG-Icon Setter
// ---------------------------------------------------------
function setSvgIcon(imgEl, iconCode) {
  const modern = getModernIcon(iconCode);
  imgEl.src = `/icons/${modern}.svg`;
}

// ---------------------------------------------------------
// OpenWeather – SVG Icons + Werte
// ---------------------------------------------------------
onValue(ref(db, "weather/openweather/raw"), snap => {
  const raw = snap.val();
  if (!raw) return;

  const data = JSON.parse(raw);

  document.getElementById("ow-temp").innerText = data.main.temp.toFixed(1);
  document.getElementById("ow-humidity").innerText = data.main.humidity;
  document.getElementById("ow-pressure").innerText = data.main.pressure;
  document.getElementById("ow-wind").innerText = data.wind.speed;
  document.getElementById("ow-clouds").innerText = data.clouds.all;
  document.getElementById("ow-desc").innerText = data.weather[0].description;

  const dt = new Date(data.dt * 1000);
  document.getElementById("ow-time").innerText =
    dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const sr = new Date(data.sys.sunrise * 1000);
  const ss = new Date(data.sys.sunset * 1000);

  document.getElementById("ow-sunrise").innerText =
    sr.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  document.getElementById("ow-sunset").innerText =
    ss.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const icon = data.weather[0].icon;
  setSvgIcon(document.getElementById("ow-icon"), icon);
  setSvgIcon(document.getElementById("icon-top"), icon);
});

// ---------------------------------------------------------
// Verlauf Woche – Live-Chart
// ---------------------------------------------------------
onValue(ref(db, "weather/history/week"), snap => {
  const data = snap.val();
  if (!data) return;

  const entries = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

  chartWeek.data.labels = entries.map(e =>
    new Date(e.timestamp * 1000).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit"
    })
  );

  chartWeek.data.datasets[0].data = entries.map(e => e.temp);

  chartWeek.update();
});

// ---------------------------------------------------------
// Verlauf Jahr – Live-Chart
// ---------------------------------------------------------
onValue(ref(db, "weather/history/year"), snap => {
  const data = snap.val();
  if (!data) return;

  const entries = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

  chartYear.data.labels = entries.map(e =>
    new Date(e.timestamp * 1000).toLocaleDateString("de-DE", {
      month: "2-digit"
    })
  );

  chartYear.data.datasets[0].data = entries.map(e => e.temp);

  chartYear.update();
});

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
