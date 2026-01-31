// ==UserScript==
// @name         Bahn.expert EVN Harvester - Pro
// @version      14.6
// @description  Extrahiert EVNs und bietet HTML-Report sowie Excel-CSV Download an.
// @author       DeinName
// @match        https://bahn.expert/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:130px;height:80px;font-size:1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || "Station";
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
            const destination = container.innerText.split('\n')[2] || "Unbekannt";

            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;
            container.scrollIntoView({ block: "center" });
            container.click();

            await new Promise(r => setTimeout(r, document.hidden ? 1800 : 1000));
            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            reportData.push({ time, train, dest: destination, evns: [...new Set(matches)] });

            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "🚀<br>SCAN STARTEN";
        
        // Beide Formate ausgeben
        exportHTML(stationName, startTime, reportData);
        exportCSV(stationName, reportData);
    };

    function exportHTML(station, dateObj, data) {
        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 15px; }
            .header { background: #003366; color: white; padding: 12px; border-radius: 4px; font-weight: bold; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f2f2f2; color: #003366; }
            .evn { background: #eeeeee; color: black; border: 1px solid #ccc; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-weight: bold; display: inline-block; margin: 1px; }
        </style></head><body>
        <div class="header">Bahnhof: ${station} | ${dateObj.toLocaleString('de-DE')}</div>
        <table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th>EVNs</th></tr></thead><tbody>`;
// ==UserScript==
// @name         Bahn.expert EVN Harvester - PRO 17.5 (CSV)
// @version      17.5
// @description  Pro-Version mit HTML-Report UND CSV-Export für Excel.
// @author       DeinName
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "<span style='font-size:1.4rem'>📊</span><br>PRO SCAN + CSV";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:linear-gradient(135deg, #004d00 0%, #002200 100%);
                 color:white;font-weight:bold;border:2px solid #00ff00;border-radius:12px;cursor:pointer;
                 width:120px;height:120px;font-size:0.85rem;box-shadow:0 10px 30px rgba(0,0,0,0.5);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || "Freiburg Hbf";
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.5";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;

            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const trainName = container.querySelector('span[class*="train"]')?.innerText || "Zug";
            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Gleis & Fahrtnummer
            let track = lines.find(l => l.startsWith("Gleis") || l.startsWith("Pl."))?.replace(/Gleis|Pl\./g, "").trim() || 
                        lines.find(l => /^\d{1,2}$/.test(l)) || "";
            let fahrtNrs = lines.filter(l => /^\d{3,5}$/.test(l.replace(/\s/g, "")) && l !== trainName && !l.includes(":"));

            // Ziel-Logik (Endziel-Fokus)
            let dests = Array.from(container.querySelectorAll('[class*="destination"]')).map(el => el.innerText);
            if (dests.length === 0) {
                let pot = lines.filter(l => l.length > 3 && !/\d/.test(l[0]) && !l.includes("Gleis") && !l.includes("Einstieg"));
                dests = pot.length > 0 ? [pot[pot.length-1]] : ["Unbekannt"];
            }

            container.scrollIntoView({ block: "center" });
            container.click();
            const isLong = trainName.includes("ICE") || trainName.includes("IC");
            await new Promise(r => setTimeout(r, isLong ? 3000 : 1500));

            let evnMatches = [...new Set(container.innerHTML.match(/\d{4}\s\d{3}/g) || [])];
            
            reportData.push({
                time,
                train: trainName,
                nr: fahrtNrs.join(" / "),
                dest: dests.join(" / "),
                track: track,
                evns: evnMatches
            });

            container.click();
            await new Promise(r => setTimeout(r, 300));
        }

        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "📊<br>PRO SCAN + CSV";

        exportHTML(stationName, startTime, reportData);
        exportCSV(stationName, reportData);
    };

    function exportCSV(station, data) {
        // CSV Header: Zeit;Zug;Nummer;Ziel;Gleis;EVN1;EVN2...
        let csvContent = "\uFEFF"; // UTF-8 BOM für Excel
        csvContent += "Zeit;Zug;Fahrtnummer;Ziel;Gleis;Fahrzeugnummern\r\n";

        data.forEach(item => {
            let row = [
                item.time,
                item.train,
                item.nr,
                item.dest,
                item.track,
                item.evns.join(", ")
            ].map(text => `"${text}"`).join(";");
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVN_Daten_${station.replace(/\s/g, '_')}.csv`;
        a.click();
    }

    function exportHTML(station, dateObj, data) {
        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; background: #f0f2f5; }
            .header { background: #004d00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #e8f5e9; color: #004d00; }
            .train { font-weight: bold; color: #000; }
            .nr { color: #d32f2f; font-size: 0.85em; font-weight: bold; }
            .track { background: #004d00; color: white; padding: 2px 6px; border-radius: 3px; float: right; }
            .evn { background: #333; color: white; padding: 2px 5px; border-radius: 3px; font-family: monospace; margin: 1px; display: inline-block; }
        </style></head><body>
        <div class="header"><h2>PRO REPORT: ${station}</h2>${dateObj.toLocaleString()}</div>
        <table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th>EVNs & Gleis</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr>
                <td><b>${item.time}</b></td>
                <td><div class="train">${item.train}</div><div class="nr">${item.nr}</div></td>
                <td><b>${item.dest}</b></td>
                <td><span class="track">Gl. ${item.track}</span>${evns}</td>
            </tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `PRO_Report_${station.replace(/\s/g, '_')}.html`;
        a.click();
    }
})();
