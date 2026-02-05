// -------------------------------------------------------------
//  Wetterstation – Professionelle script.js
// -------------------------------------------------------------

// -------------------------
// Globale Variablen
// -------------------------
let chart24 = null;
let chartWeek = null;
let chartYear = null;

const ESP_URL = "http://esp32.local/data.json";  // ESP32 Live-Daten
const GITHUB_URL = "data.json";                  // Backup-Datei im Repo

// -------------------------
// Start
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
    initModeToggle();
    loadData();
    setInterval(loadData, 60_000); // alle 60 Sekunden aktualisieren
});

// -------------------------
// Daten laden (ESP → Fallback GitHub)
// -------------------------
async function loadData() {
    try {
        console.log("Hole Live-Daten vom ESP32…");
        const live = await fetchJSON(ESP_URL);
        updateUI(live, true);
    } catch (err) {
        console.warn("ESP32 nicht erreichbar – nutze GitHub-Backup.");
        try {
            const backup = await fetchJSON(GITHUB_URL);
            updateUI(backup, false);
        } catch (err2) {
            console.error("Fehler beim Laden der Backup-Daten:", err2);
        }
    }
}

// -------------------------
// JSON laden (mit Fehlerbehandlung)
// -------------------------
async function fetchJSON(url) {
    const res = await fetch(url + "?t=" + Date.now()); // Cache umgehen
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
}

// -------------------------
// UI aktualisieren
// -------------------------
function updateUI(data, local) {

    console.log("Empfangene Daten:", data);

    // Neue JSON-Struktur
    const t = Number(data?.current?.temperature);
    const h = Number(data?.current?.humidity);
    const p = Number(data?.current?.pressure);

    document.getElementById("temp").innerText =
        isFinite(t) ? t.toFixed(1) + " °C" : "-- °C";

    document.getElementById("hum").innerText =
        isFinite(h) ? h.toFixed(1) + " %" : "-- %";

    document.getElementById("press").innerText =
        isFinite(p) ? p.toFixed(1) + " hPa" : "-- hPa";

    const src = local ? "ESP32 (live)" : "GitHub (Backup)";
    document.getElementById("lastUpdate").innerText = "Quelle: " + src;

    // History-Daten aus neuer Struktur
    draw24hChart(data?.history?.last24h ?? []);
    drawWeekChart(data?.history?.week ?? []);
    drawYearChart(data?.history?.year ?? []);
}

// -------------------------------------------------------------
// Chart: 24 Stunden
// -------------------------------------------------------------
function draw24hChart(values) {
    const ctx = document.getElementById("chart24");

    if (chart24) chart24.destroy();

    chart24 = new Chart(ctx, {
        type: "line",
        data: {
            labels: values.map(v => new Date(v.time * 1000).toLocaleTimeString()),
            datasets: [{
                label: "Temperatur (°C)",
                data: values.map(v => v.temperature),
                borderColor: "#ff5722",
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });
}

// -------------------------------------------------------------
// Chart: Woche (Min/Max)
// -------------------------------------------------------------
function drawWeekChart(values) {
    const ctx = document.getElementById("chartWeek");

    if (chartWeek) chartWeek.destroy();

    chartWeek = new Chart(ctx, {
        type: "bar",
        data: {
            labels: values.map(v =>
                new Date(v.dayStamp * 1000).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Min",
                    data: values.map(v => v.min),
                    backgroundColor: "#2196f3"
                },
                {
                    label: "Max",
                    data: values.map(v => v.max),
                    backgroundColor: "#f44336"
                }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });
}

// -------------------------------------------------------------
// Chart: Jahr (Min/Max)
// -------------------------------------------------------------
function drawYearChart(values) {
    const ctx = document.getElementById("chartYear");

    if (chartYear) chartYear.destroy();

    chartYear = new Chart(ctx, {
        type: "line",
        data: {
            labels: values.map(v =>
                ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][v.month]
            ),
            datasets: [
                {
                    label: "Min",
                    data: values.map(v => v.min),
                    borderColor: "#03a9f4",
                    tension: 0.3
                },
                {
                    label: "Max",
                    data: values.map(v => v.max),
                    borderColor: "#e91e63",
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });
}

// -------------------------------------------------------------
// Dark/Light Mode
// -------------------------------------------------------------
function initModeToggle() {
    const btn = document.getElementById("modeToggle");

    btn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        btn.innerText = document.body.classList.contains("dark") ? "☀" : "☾";
    });
}
