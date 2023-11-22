"use strict"


console.log("webpageJS")
 //Add Leaflet Map 
 var map = L.map('map').setView([51.305915044598834,10.21774343122064], 6);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
 }).addTo(map);

 // Add Leaflet Draw controls
 var drawnItems = new L.FeatureGroup();
 map.addLayer(drawnItems);

 var drawControl = new L.Control.Draw({
     draw: {
         rectangle: true,
         polyline: false,
         circle: false,
         marker: false,
         polygon: false,
         circlemarker: false
     },
     edit: {
     featureGroup: drawnItems
     }
 });
 // Event listener for the button click
 document.getElementById('drawButton').addEventListener('click', function() {
     // Add Leaflet Draw controls to the map
     map.addControl(drawControl);
      //Handle rectangle creation
      map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'rectangle') {
            drawnItems.addLayer(layer);
        }
        });
 });

// Add event listener for the upload button click
document.getElementById('uploadRectangle').addEventListener('click', function(){
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        // Read GeoJSON file
        const reader = new FileReader();
        reader.onload = function (e) {
            const geojsonData = JSON.parse(e.target.result);
            var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
            var bbox = turf.bbox(line);
            var bboxPolygon = turf.bboxPolygon(bbox);
            L.geoJSON(geojsonData).addTo(map);
            L.geoJSON(bboxPolygon).addTo(map);
        };

        reader.readAsText(file);
    }
});