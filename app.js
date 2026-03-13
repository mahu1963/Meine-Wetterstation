// ---------------------------------------------------------
// Firebase Setup (v10 Browser SDK)
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.firebasestorage.app",
  messagingSenderId: "593494014586",
  appId: "1:593494014586:web:cad0037363543e946059c3",
  measurementId: "G-139QB1TEMD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------
// Smooth Number Animation
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

function safeNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
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

  animateNumber(tempEl, safeNumber(tempEl.textContent), Number(d.temp), 600, "", 1);
  animateNumber(humEl,  safeNumber(humEl.textContent), Number(d.humidity), 600, "", 0);
  animateNumber(presEl, safeNumber(presEl.textContent), Number(d.pressure), 600, "", 1);

  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Stand: --";
});

// ---------------------------------------------------------
// OpenWeather – Icons (PNG von OpenWeather)
// ---------------------------------------------------------
function setSvgIcon(imgEl, iconCode) {
  imgEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ---------------------------------------------------------
// OpenWeather – Werte
// ---------------------------------------------------------
onValue(ref(db, "weather/openweather/raw"), snap => {
  const data = snap.val();
  if (!data) return;

  document.getElementById("ow-temp").innerText = data.main.temp.toFixed(1);
  document.getElementById("ow-humidity").innerText = data.main.humidity;
  document.getElementById("ow-pressure").innerText = data.main.pressure;
  document.getElementById("ow-wind").innerText = data.wind.speed;
  document.getElementById("ow-clouds").innerText = data.clouds.all;
  document.getElementById("ow-desc").innerText = data.weather[0].description;

  document.getElementById("ow-time").innerText =
    new Date(data.dt * 1000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

document.getElementById("ow-sunrise").innerText =
  new Date(data.sys.sunrise * 1000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

document.getElementById("ow-sunset").innerText =
  new Date(data.sys.sunset * 1000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

// Sunrise & Sunset Icons setzen
document.getElementById("sunrise-icon").src =
  "https://openweathermap.org/img/wn/01d.png";

document.getElementById("sunset-icon").src =
  "https://openweathermap.org/img/wn/01n.png";
  
  document.getElementById("sunset-icon").src =
  "https://openweathermap.org/img/wn/01n.png";
  const icon = data.weather[0].icon;
  setSvgIcon(document.getElementById("ow-icon"), icon);
  setSvgIcon(document.getElementById("icon-top"), icon);
});
 
// Sunrise & Sunset Icons setzen (schöne Version)
document.getElementById("sunrise-icon").src = "/icons/sunrise.svg";
document.getElementById("sunset-icon").src = "/icons/sunset.svg";
// ---------------------------------------------------------
// Charts (Woche & Jahr)
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
