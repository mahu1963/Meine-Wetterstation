import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "DEIN_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  databaseURL: "https://DEIN_PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "…",
  appId: "…"
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
// OpenWeather – Icons
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

function setSvgIcon(imgEl, iconCode) {
  imgEl.src = `/icons/${getModernIcon(iconCode)}.svg`;
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

  const icon = data.weather[0].icon;
  setSvgIcon(document.getElementById("ow-icon"), icon);
  setSvgIcon(document.getElementById("icon-top"), icon);
});
