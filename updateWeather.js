// Firebase laden
const db = firebase.database();

// -------------------------------
// LIVE Wetter
// -------------------------------
function loadLive() {
    db.ref("weather/live").on("value", snap => {
        const d = snap.val();
        if (!d) return;

        document.getElementById("live").innerHTML = `
            <div class="live-box">
                <h3>Aktuell</h3>
                <p>${d.temp}°C</p>
                <p>${d.humidity}%</p>
                <p>${d.pressure} hPa</p>
                <img src="https://openweathermap.org/img/wn/${d.icon}.png">
            </div>
        `;
    });
}

// -------------------------------
// 5h Forecast Kacheln
// -------------------------------
function loadForecastBoxes() {
    db.ref("weather/forecast/5h").on("value", snap => {
        const arr = snap.val();
        if (!arr) return;

        let html = "";

        arr.forEach(e => {
            const t = new Date(e.ts * 1000);
            const time = t.toLocaleTimeString("de-DE", { hour: "2-digit" });

            html += `
                <div class="forecast-box">
                    <p>${time}</p>
                    <img src="https://openweathermap.org/img/wn/${e.icon}.png">
                    <p>${e.temp}°C</p>
                </div>
            `;
        });

        document.getElementById("forecast5h").innerHTML = html;
    });
}

// -------------------------------
// Forecast Diagramm
// -------------------------------
let forecastChart = null;

function drawForecastChart(data) {
    const labels = data.map(e => {
        const t = new Date(e.ts * 1000);
        return t.toLocaleTimeString("de-DE", { hour: "2-digit" });
    });

    const temps = data.map(e => e.temp);

    const icons = data.map(e => {
        const img = new Image();
        img.src = `https://openweathermap.org/img/wn/${e.icon}.png`;
        return img;
    });

    const ctx = document.getElementById("forecastChart");

    if (forecastChart) forecastChart.destroy();

    forecastChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Temperatur",
                    data: temps,
                    borderColor: "#4ea3ff",
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 14,
                    pointStyle: icons
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#ccc" } }
            },
            scales: {
                x: { ticks: { color: "#ccc" } },
                y: { ticks: { color: "#ccc" } }
            }
        }
    });
}

// -------------------------------
// Forecast Loader (5h / 24h / 48h)
// -------------------------------
function loadForecast(type) {
    db.ref("weather/forecast/" + type).once("value", snap => {
        const arr = snap.val();
        if (!arr) return;

        drawForecastChart(arr);
    });
}

// -------------------------------
// INIT
// -------------------------------
loadLive();
loadForecastBoxes();
loadForecast("5h");
