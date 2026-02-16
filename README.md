
# EVN-Harvester 
EVN-Harvester is a userscript for the webpage bahn.expert, that can be used with Tampermonkey. EVN Harvester collects details from timetables at bahn.expert and creates a list from the found data.
Take a look at the images below for a first impression. 
It has been tested with Firefox 147.02 .Works with all modern browsers supporting Tampermonkey on desktop and mobile devices.


What it does:

Automatic Scanning: Clicks through all departures and collects data.

EVN Collection: Extracts vehicle numbers for all train parts.

Tab-Progress: Shows the current status (e.g., 7/98) directly in the browser tab title.


How to use the extension:

  Prerequisites:

        Install the Tampermonkey extension.

        Go to settings on bahn.expert and ensure EVN display is ACTIVE (blue toggle).
        Also activate "Linie und Fahrtnummer" if you want it to be included.
       
        
   <img width="513" height="878" alt="necessary settings" src="https://github.com/user-attachments/assets/dd9a466a-8993-4642-9124-76f82d14295b" />

        

        You might have to allow Popups for bahn.expert in your browser (needed for the file download).

  Installation:

        Copy the code from evn-harvester.user.js into a new Tampermonkey script.

  Operation:

        Open any station on bahn.expert.

        Click the "🚀 SCAN STARTEN"  button.

        Wait for the scan to finish (watch the progress in the tab title).

        The files will download automatically once the scan reaches 100%.




<img width="1863" height="1000" alt="page for scan" src="https://github.com/user-attachments/assets/97d0a685-e110-465f-9160-989763d8ff59" />

<img width="1851" height="608" alt="results example" src="https://github.com/user-attachments/assets/dac356cb-ff9d-4dad-9067-c545b1fcaad4" />

