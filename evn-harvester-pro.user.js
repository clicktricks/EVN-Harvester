// ==UserScript==
// @name         Bahn.expert EVN Harvester - PRO 17.7
// @version      17.7
// @description  Pro-Version: Tab-Progress, ICE-Loading-Fix, HTML & CSV Export.
// @author       NiNi77
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const originalTitle = document.title;
    const btn = document.createElement('button');
    btn.innerHTML = "<span style='font-size:1.4rem'>📊</span><br>PRO SCAN + CSV";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:linear-gradient(135deg, #004d00 0%, #002200 100%);
                 color:white;font-weight:bold;border:2px solid #00ff00;border-radius:12px;cursor:pointer;
                 width:125px;height:125px;font-size:0.85rem;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:all 0.3s;`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || "Bahnhof";
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Fehler: Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.5";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const currentCount = i + 1;
            const totalCount = containers.length;

            // --- TAB TITEL & BUTTON UPDATE ---
            document.title = `(${currentCount}/${totalCount}) ${stationName}`;
            btn.innerHTML = `⏳<br>${currentCount} / ${totalCount}`;

            const trainName = container.querySelector('span[class*="train"]')?.innerText || "Zug";
            const isLong = trainName.includes("ICE") || trainName.includes("IC") || trainName.includes("EC") || trainName.includes("NJ");

            container.scrollIntoView({ block: "center", behavior: "smooth" });
            container.click();

            // PRO-WARTEZEIT: ICEs brauchen Zeit zum Laden der vielen Wagen
            await new Promise(r => setTimeout(r, isLong ? 3500 : 1600));

            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            // Gleis & Fahrtnummer
            let track = lines.find(l => l.startsWith("Gleis") || l.startsWith("Pl."))?.replace(/Gleis|Pl\./g, "").trim() || 
                        lines.find(l => /^\d{1,2}$/.test(l)) || "";
            
            let fahrtNrs = lines.filter(l => /^\d{3,5}$/.test(l.replace(/\s/g, "")) && l !== trainName && !l.includes(":"));

            // Ziel-Logik
            let dests = Array.from(container.querySelectorAll('[class*="destination"]')).map(el => el.innerText);
            if (dests.length === 0) {
                let pot = lines.filter(l => l.length > 3 && !/\d/.test(l[0]) && !l.includes("Gleis") && !l.includes("Einstieg"));
                dests = pot.length > 0 ? [pot[pot.length - 1]] : ["Ziel"];
            }

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
            await new Promise(r => setTimeout(r, 400));
        }

        // Titel zurücksetzen
        document.title = "✅ SCAN FERTIG!";
        setTimeout(() => { document.title = originalTitle; }, 5000);
        
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "📊<br>PRO SCAN + CSV";

        exportHTML(stationName, startTime, reportData);
        exportCSV(stationName, reportData);
    };

    function exportCSV(station, data) {
        let csvContent = "\uFEFF"; // UTF-8 BOM für Excel
        csvContent += "Zeit;Zug;Fahrtnummer;Ziel;Gleis;Fahrzeugnummern\r\n";

        data.forEach(item => {
            let row = [item.time, item.train, item.nr, item.dest, item.track, item.evns.join(", ")]
                      .map(text => `"${text}"`).join(";");
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
            body { font-family: 'Segoe UI', sans-serif; padding: 25px; background: #f4f4f4; }
            .header { background: #004d00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
            th { background: #e8f5e9; color: #004d00; text-transform: uppercase; font-size: 0.8em; }
            .train { font-weight: bold; color: #000; font-size: 1.1em; }
            .nr { color: #d32f2f; font-size: 0.9em; font-weight: bold; margin-top: 3px; }
            .dest { font-weight: bold; color: #004d00; }
            .track-box { background: #004d00; color: white; padding: 3px 7px; border-radius: 4px; font-weight: bold; float: right; }
            .evn { background: #333; color: white; padding: 3px 6px; border-radius: 4px; font-family: monospace; display: inline-block; margin: 2px; font-size: 0.9em; }
        </style></head><body>
        <div class="header"><h2>🚉 PRO EVN REPORT: ${station}</h2>Erstellt am ${dateObj.toLocaleString()}</div>
        <table><thead><tr><th>Zeit</th><th>Zug & Nr.</th><th>Ziel</th><th>EVNs & Gleis</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr>
                <td style="width:80px"><b>${item.time}</b></td>
                <td><div class="train">${item.train}</div><div class="nr">${item.nr}</div></td>
                <td class="dest">${item.dest}</td>
                <td><span class="track-box">Gl. ${item.track}</span>${evns || "---"}</td>
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
