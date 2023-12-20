"use strict"

const OpenEO_JSON = {
    "name":"",
    "coordinates":{
        "swLat":0.0,
        "swLng":0.0,
        "neLat":0.0,
        "neLng":0.0      
    },
    "date":{
        "date_start":"YYYY-MM-DD",
        "date_end": "YYYY-MM-DD"
    }   


};


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
            const bounds = layer.getBounds();
            // Extract coordinates from the bounds object
            const southWest = bounds.getSouthWest(); // returns LatLng object
            const northEast = bounds.getNorthEast(); // returns LatLng object
            OpenEO_JSON.coordinates.swLat = southWest.lat; 
            OpenEO_JSON.coordinates.swLng = southWest.lng;
            OpenEO_JSON.coordinates.neLat = northEast.lat;
            OpenEO_JSON.coordinates.neLng = northEast.lng;
            console.log(OpenEO_JSON);


        if (type === 'rectangle') {
            drawnItems.addLayer(layer);
        }
        });
 });


 //Option to choose a geojson in any format and adds it to the map
 document.getElementById('uploadRectangle').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
});

document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (file) {
        // Read GeoJSON file
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const geojsonData = JSON.parse(e.target.result);
                //Using Turf.js to create bounding box for OpenEO Request
                var bbox = turf.bbox(geojsonData);
                var bboxPolygon = turf.bboxPolygon(bbox);
                L.geoJSON(geojsonData).addTo(map);
                L.geoJSON(bboxPolygon).addTo(map);
                OpenEO_JSON.coordinates.swLat = bbox[1]; 
                OpenEO_JSON.coordinates.swLng = bbox[0];
                OpenEO_JSON.coordinates.neLat = bbox[3];
                OpenEO_JSON.coordinates.neLng = bbox[2];
                console.log(OpenEO_JSON)
                //console.log(bbox[0])
            } catch (error) {
                console.error("Error parsing or processing GeoJSON:", error);
            }
        };
        reader.readAsText(file);
    }
});