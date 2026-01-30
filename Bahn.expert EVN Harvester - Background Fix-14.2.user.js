// ==UserScript==
// @name         Bahn.expert EVN Harvester - Name Fix
// @version      14.4
// @description  Zuverlässige Bahnhofserkennung und EVN-Extraktion.
// @author       DeinName
// @match        https://bahn.expert/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:30px;right:30px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:150px;height:90px;font-size:1.1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        // --- VERBESSERTE NAMENSSUCHE ---
        let stationName = document.querySelector('h1')?.innerText || 
                          document.querySelector('input[aria-label="Suche"]')?.value ||
                          document.title.replace('Abfahrten ', '').replace(' - bahn.expert', '');
        
        // Falls immer noch leer, kurz nachfragen
        if (!stationName || stationName.includes("Abfahrten")) {
            stationName = prompt("Bahnhofsname konnte nicht automatisch erkannt werden. Bitte eingeben:", "Nimburg(Baden)");
        }
        if (!stationName) return; // Abbruch falls Abbrechen geklickt wurde

        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const train = container.innerText.split('\n')[0] || "Zug";
            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            
            // Zielbahnhof extrahieren
            const lines = container.innerText.split('\n');
            const destination = lines[2] || lines[1] || "Unbekannt";

            btn.innerHTML = `⏳<br>${i+1} / ${containers.length}`;
            document.title = `(${i+1}/${containers.length}) ${train}`;

            container.scrollIntoView({ block: "center", behavior: "instant" });
            container.click();

            const waitTime = document.hidden ? 1600 : 900;
            await new Promise(r => setTimeout(r, waitTime));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            if (matches.length === 0) { 
                await new Promise(r => setTimeout(r, 600)); 
                matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            }

            reportData.push({ time, train, dest: destination, evns: [...new Set(matches)] });
            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

        document.title = "✅ Fertig!";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "🚀<br>SCAN STARTEN";
        
        generateReport(stationName, startTime.toLocaleDateString('de-DE'), startTime.toLocaleTimeString('de-DE'), reportData);
    };

    function generateReport(station, date, scanTime, data) {
        const reportWindow = window.open("", "_blank");
        let html = `<html><head><title>EVN Report - ${station}</title><style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
            .header { background: #003366; color: white; padding: 15px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background: #f2f2f2; color: #003366; border-bottom: 2px solid #003366; }
            .evn { background: #eeeeee; color: black; border: 1px solid #ccc; padding: 2px 8px; border-radius: 3px; font-family: monospace; font-weight: bold; margin: 2px; display: inline-block; }
            .dest { color: #003366; font-weight: bold; }
        </style></head><body>
        <div class="header">Bahnhof: ${station} | Datum: ${date} | Zeit: ${scanTime}</div>
        <table><thead><tr><th>Abfahrt</th><th>Zug</th><th>Zielbahnhof</th><th>Waggon-EVNs</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr><td><b>${item.time}</b></td><td>${item.train}</td><td class="dest">${item.dest}</td><td>${evns || "---"}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;
        reportWindow.document.write(html);
        reportWindow.document.close();
    }
})();
