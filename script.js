let chart24 = null;
let chartWeek = null;
let chartYear = null;

const ESP_URL = "http://esp32.local/data.json";
const WS_URL  = "ws://esp32.local/ws";
const GITHUB_URL = "data.json";

document.addEventListener("DOMContentLoaded", () => {
    initModeToggle();
    initWebSocket();
    loadData();
    setInterval(loadData, 60000);
});

function initWebSocket() {
    try {
        const ws = new WebSocket(WS_URL);
        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            updateUI(data, true);
        };
    } catch (e) {
        console.warn("WebSocket nicht verfügbar.");
    }
}

async function loadData() {
    try {
        const live = await fetchJSON(ESP_URL);
        updateUI(live, true);
    } catch (err) {
        console.warn("ESP32 offline – nutze GitHub-Backup.");
        try {
            const backup = await fetchJSON(GITHUB_URL);
            updateUI(backup, false);
        } catch (err2) {
            console.error("Backup-Daten konnten nicht geladen werden.");
        }
    }
}

async function fetchJSON(url) {
    const res = await fetch(url + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
}

function updateUI(data, local) {
    const t = Number(data?.current?.temperature);
    const h = Number(data?.current?.humidity);
    const p = Number(data?.current?.pressure);

    document.getElementById("temp").innerText =
        isFinite(t) ? t.toFixed(1) + " °C" : "-- °C";

    document.getElementById("hum").innerText =
        isFinite(h) ? h.toFixed(1) + " %" : "-- %";

    document.getElementById("press").innerText =
        isFinite(p) ? p.toFixed(1) + " hPa" : "-- hPa";

    document.getElementById("lastUpdate").innerText =
        "Quelle: " + (local ? "ESP32 (live)" : "GitHub (Backup)");

    draw24hChart(data?.history?.last24h ?? []);
    drawWeekChart(data?.history?.week ?? []);
    drawYearChart(data?.history?.year ?? []);
}

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
                borderColor: "#00eaff",
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });
}

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
                { label: "Min", data: values.map(v => v.min), backgroundColor: "#2196f3" },
                { label: "Max", data: values.map(v => v.max), backgroundColor: "#f44336" }
            ]
        },
        options: { responsive: true }
    });
}

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
                { label: "Min", data: values.map(v => v.min), borderColor: "#03a9f4", tension: 0.3 },
                { label: "Max", data: values.map(v => v.max), borderColor: "#e91e63", tension: 0.3 }
            ]
        },
        options: { responsive: true }
    });
}

function initModeToggle() {
    const btn = document.getElementById("modeToggle");
    btn.addEventListener("click", () => {
        document.body.classList.toggle("light");
        btn.innerText = document.body.classList.contains("light") ? "☾" : "☀";
    });
}
