const ESP_URL = "http://192.168.1.200"; // ggf. anpassen

let lastTemp = null;
let lastHum = null;
let lastPres = null;

let minTemp = null, maxTemp = null;
let minHum = null, maxHum = null;
let minPres = null, maxPres = null;

const history = [];
const HISTORY_MAX = 20;

function trendSymbol(current, last) {
  if (last === null) return "→";
  if (current > last + 0.1) return "↑";
  if (current < last - 0.1) return "↓";
  return "→";
}

function updateMinMax(value, min, max) {
  if (value == null || isNaN(value)) return [min, max];
  if (min === null || value < min) min = value;
  if (max === null || value > max) max = value;
  return [min, max];
}

function addHistoryEntry(t, h, p) {
  const ts = new Date().toLocaleTimeString();
  history.unshift({ t, h, p, ts });
  if (history.length > HISTORY_MAX) history.pop();

  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.ts} – ${entry.t.toFixed(1)} °C, ${entry.h.toFixed(1)} %, ${entry.p.toFixed(1)} hPa`;
    list.appendChild(li);
  });
}

async function loadData() {
  const statusBox = document.getElementById("statusBox");

  try {
    const response = await fetch(ESP_URL);
    const data = await response.json();

    const t = Number(data.temperature);
    const h = Number(data.humidity);
    const p = Number(data.pressure);

    document.getElementById("temp").innerText = t.toFixed(1);
    document.getElementById("hum").innerText = h.toFixed(1);
    document.getElementById("pres").innerText = p.toFixed(1);

    [minTemp, maxTemp] = updateMinMax(t, minTemp, maxTemp);
    [minHum, maxHum]   = updateMinMax(h, minHum, maxHum);
    [minPres, maxPres] = updateMinMax(p, minPres, maxPres);

    if (minTemp !== null) document.getElementById("tempMin").innerText = minTemp.toFixed(1);
    if (maxTemp !== null) document.getElementById("tempMax").innerText = maxTemp.toFixed(1);
    if (minHum !== null)  document.getElementById("humMin").innerText  = minHum.toFixed(1);
    if (maxHum !== null)  document.getElementById("humMax").innerText  = maxHum.toFixed(1);
    if (minPres !== null) document.getElementById("presMin").innerText = minPres.toFixed(1);
    if (maxPres !== null) document.getElementById("presMax").innerText = maxPres.toFixed(1);

    document.getElementById("tempTrend").innerText = trendSymbol(t, lastTemp);
    document.getElementById("humTrend").innerText  = trendSymbol(h, lastHum);
    document.getElementById("presTrend").innerText = trendSymbol(p, lastPres);

    lastTemp = t;
    lastHum  = h;
    lastPres = p;

    addHistoryEntry(t, h, p);

    if (data.fallback_ap) {
      statusBox.textContent = "⚠ AP‑Modus aktiv (Router offline)";
      statusBox.style.color = "orange";
    } else if (!data.github_ok) {
      statusBox.textContent = "⚠ GitHub Upload fehlgeschlagen";
      statusBox.style.color = "red";
    } else {
      statusBox.textContent = "✅ GitHub Upload OK";
      statusBox.style.color = "lightgreen";
    }

  } catch (e) {
    statusBox.textContent = "❌ ESP nicht erreichbar";
    statusBox.style.color = "red";
  }
}

setInterval(loadData, 5000);
loadData();
