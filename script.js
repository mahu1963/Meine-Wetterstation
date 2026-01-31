async function loadData() {
    const url = "https://mahu1963.github.io/Meine-Wetterstation/data.json";

    try {
        const res = await fetch(url);
        const data = await res.json();

        document.getElementById("temp").innerText = data.t.toFixed(1) + " °C";
        document.getElementById("hum").innerText  = data.h.toFixed(1) + " %";
        document.getElementById("press").innerText = data.p.toFixed(1) + " hPa";

        drawChart(data.hist);

    } catch (e) {
        console.error("Fehler beim Laden:", e);
    }
}

function drawChart(hist) {
    const ctx = document.getElementById("chart24");

    const labels = hist.map(h => {
        const d = new Date(h.ts * 1000);
        return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
    });

    const temps = hist.map(h => h.t);

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Temperatur (°C)",
                data: temps,
                borderColor: "#007aff",
                backgroundColor: "rgba(0,122,255,0.15)",
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            scales: {
                x: { display: false },
                y: { beginAtZero: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

loadData();
setInterval(loadData, 60000);
