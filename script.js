const ESP_URL = "http://192.168.0.52/"; // <- Deine ESP-IP

async function loadData() {
    try {
        const response = await fetch(ESP_URL);
        const data = await response.json();

        // Aktuelle Werte
        document.getElementById("temp").textContent = data.t.toFixed(1) + " °C";
        document.getElementById("hum").textContent  = data.h.toFixed(1) + " %";
        document.getElementById("press").textContent = data.p.toFixed(1) + " hPa";

        // Wochenwerte (Index 0 = heute)
        const today = data.week[0];

        document.getElementById("minT").textContent = today.minT.toFixed(1);
        document.getElementById("maxT").textContent = today.maxT.toFixed(1);
        document.getElementById("minH").textContent = today.minH.toFixed(1);
        document.getElementById("maxH").textContent = today.maxH.toFixed(1);
        document.getElementById("minP").textContent = today.minP.toFixed(1);
        document.getElementById("maxP").textContent = today.maxP.toFixed(1);

    } catch (err) {
        console.log("Fehler beim Laden:", err);
    }
}

setInterval(loadData, 5000);
loadData();
