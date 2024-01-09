"use strict"

//const cons = require("consolidate");

//Create GeoJSON FeatureCollection for all Options
var geoJSONData = {
    type: "FeatureCollection",
    features: []
}; 

//Add Leaflet Map 
 var map = L.map('map').setView([51.305915044598834,10.21774343122064], 6);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
 }).addTo(map);

 /**
  * function to implement datepicker and limit date selection
  */
 $(document).ready(function () {
        // Initialize the first datepicker
        $('#startDate').datepicker({
            format: 'yyyy-mm-dd',
            autoclose: true,
            todayHighlight: true,
            endDate: new Date()
 });
        // Initialize the second datepicker with the startDate option
        $('#endDate').datepicker({
            format: 'yyyy-mm-dd',
            autoclose: true,
            todayHighlight: true,
            endDate: new Date()
          });

         // Update the startDate of the second datepicker when the first datepicker changes
        $('#startDate').on('changeDate', function (e) {
            // Calculate one day later
            var startDate = new Date(e.date);
            startDate.setDate(startDate.getDate() + 1);
  
        // Set the new startDate for the second datepicker
            $('#endDate').datepicker('setStartDate', startDate);
        });
    });

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

 // Set maximum allowed area in square meters
 var maxAllowedArea = 20000;

 // Event listener for the button "Activate Draw"
 document.getElementById('drawButton').addEventListener('click', function() {
    // Remove the existing drawn shape before adding a new one
    drawnItems.clearLayers(); 
    // Add Leaflet Draw controls to the map
     map.addControl(drawControl);
    //variable for drawControl
     var drawingEnabled = true; 
      //Handle rectangle creation
      map.on('draw:created', function (e) {
            var layer = e.layer;
            var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]) / 1000000;

        if (drawingEnabled) {
            //limit leafletDraw to size given in maxAllowedArea
            if (area > maxAllowedArea) {
                alert('The drawn area exceeds the maximum allowed area.');
            } else {
            drawnItems.addLayer(layer);
            console.log("LayerTest")

            // Convert the drawn layer to GeoJSON and add it to the FeatureCollection
            var feature = layer.toGeoJSON();
            geoJSONData.features.push(feature);
            //Test
            console.log(geoJSONData); 
            console.log("Test")

            //limit to one draw
            drawingEnabled = false; 
            }
        }
        });
        map.on('draw:deleted', function (e) {
            drawingEnabled = true;
          });
 });

 //Option to choose a geojson in any format and adds it to the map
 document.getElementById('uploadButton').addEventListener('click', function () {
    // Remove the existing drawn shape before adding a new one
    drawnItems.clearLayers();
    map.removeControl(drawControl)
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
            } catch (error) {
                console.error("Error parsing or processing GeoJSON:", error);
            }
        };
        reader.readAsText(file);
    }
});