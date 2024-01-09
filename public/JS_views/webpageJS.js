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

var geoJSONData={
    type:"FeatureCollection",
    features:[]
}

console.log("webpageJS")
 //Add Leaflet Map 
 var map = L.map('map').setView([51.96269732749698,7.625025563711631], 13);
 L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
 maxZoom: 20,
 minZoom:2,
 subdomains:['mt0','mt1','mt2','mt3']
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

            // Update the startDate and endDate options of the datepickers when the first datepicker changes
    $('#startDate').on('changeDate', function (e) {
        // Calculate two weeks later
        var endDate = new Date(e.date);
        endDate.setDate(endDate.getDate() + 13); // 13 days to allow for a 14-day span
  
        // Set the new startDate for the second datepicker
        $('#endDate').datepicker('setStartDate', e.date);
        
        // Set the new endDate for the second datepicker
        $('#endDate').datepicker('setEndDate', endDate);
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
            var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0])/100000

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