
# EVN-Harvester 
EVN-Harvester is a userscript for the webpage bahn.expert, that can be used with Tampermonkey. EVN Harvester collects details from timetables at bahn.expert and creates a list from the found data.
Take a look at the images below for a first impression. 
It has been tested with Firefox 147.02 .Works with all modern browsers supporting Tampermonkey on desktop and mobile devices.


What it does:

Automatic Scanning: Clicks through all departures and collects data.

EVN Collection: Extracts vehicle numbers for all train parts.

Tab-Progress: Shows the current status (e.g., 7/98) directly in the browser tab title.

Trip numbers are highlighted in red, and track numbers are also included. 

   

How to use the extension:

  Prerequisites:

        Install the Tampermonkey extension.

        Go to settings on bahn.expert and ensure EVN display is ACTIVE (blue toggle).

        Allow Popups for bahn.expert in your browser (needed for the file download).

  Installation:

        Copy the code from LITE or PRO into a new Tampermonkey script.

  Operation:

        Open any station on bahn.expert.

        Click the "🚀 SCAN STARTEN" (Lite) or "📊 PRO SCAN" (Pro) button.

        Wait for the scan to finish (watch the progress in the tab title).

        The files will download automatically once the scan reaches 100%.

Versions:

LITE: Creates a clean, well-formatted HTML report.

PRO: Creates the HTML report AND a CSV file (perfect for Excel/Google Sheets).



<img width="1863" height="1000" alt="page for scan" src="https://github.com/user-attachments/assets/97d0a685-e110-465f-9160-989763d8ff59" />


<img width="1865" height="1000" alt="results" src="https://github.com/user-attachments/assets/68664484-1d64-44b1-a503-22ca4778cd90" />
