// === Einstellungen ===
const ESP_URL = "http://192.168.1.200";   // Deine ESP-IP
const DATA_URL = ESP_URL + "/data";       // z.B. /data oder /json – anpassen falls nötig

// === DOM Elemente ===
const tempStats = document.getElementById("tempStats");
const humStats = document.getElementById("humStats");
const presStats = document.getElementById("presStats");

// === Charts ===
let tempChart, humChart, presChart;

// === Daten holen ===
async function loadData() {
    try {
        const res = await fetch(DATA_URL + "?t=" + Date.now());
        const data = await res.json();

        updateLiveValues(data);
        updateCharts(data);

    } catch (err) {
        console.error("ESP nicht erreichbar:", err);
    }
}

// === Live-Werte aktualisieren ===
function updateLiveValues(d) {
    tempStats.innerHTML = `Aktuell: <b>${d.temp}°C</b> — Min: ${d.tempMin}°C — Max: ${d.tempMax}°C`;
    humStats.innerHTML  = `Aktuell: <b>${d.hum}%</b> — Min: ${d.humMin}% — Max: ${d.humMax}%`;
    presStats.innerHTML = `Aktuell: <b>${d.pres} hPa</b> — Min: ${d.presMin} — Max: ${d.presMax}`;
}

// === Charts zeichnen ===
function updateCharts(d) {
    const labels = d.history.time;
    
    // Temperatur
    if (!tempChart) {
        tempChart = new Chart(document.getElementById("tempChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Temperatur (°C)",
                    data: d.history.temp,
                    borderColor: "#ff7043",
                    tension: 0.3
                }]
            }
        });
    } else {
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = d.history.temp;
        tempChart.update();
    }

    // Feuchtigkeit
    if (!humChart) {
        humChart = new Chart(document.getElementById("humChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Feuchtigkeit (%)",
                    data: d.history.hum,
                    borderColor: "#42a5f5",
                    tension: 0.3
                }]
            }
        });
    } else {
        humChart.data.labels = labels;
        humChart.data.datasets[0].data = d.history.hum;
        humChart.update();
    }

    // Luftdruck
    if (!presChart) {
        presChart = new Chart(document.getElementById("presChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Luftdruck (hPa)",
                    data: d.history.pres,
                    borderColor: "#66bb6a",
                    tension: 0.3
                }]
            }
        });
    } else {
        presChart.data.labels = labels;
        presChart.data.datasets[0].data = d.history.pres;
        presChart.update();
    }
}

// === Tabs & Dropdown ===
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
    });
});

// Dropdown
document.querySelectorAll(".dropdown").forEach(drop => {
    const menu = drop.querySelector(".dropdown-menu");
    drop.addEventListener("click", () => {
        menu.classList.toggle("show");
    });
});

// === Dark Mode ===
document.getElementById("darkToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// === Live-Daten alle 10 Sekunden ===
loadData();
setInterval(loadData, 10000);
