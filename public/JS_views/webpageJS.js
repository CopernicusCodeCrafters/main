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

var selectedDates = [];

//Function for date-picker
$(document).ready(function () {
    $('#datepicker1').datepicker();
    $('#datepicker2').datepicker();
});

function getSelectedDates() {
  var startDate = $('#datepicker1').datepicker('getUTCDate');
  var endDate = $('#datepicker2').datepicker('getUTCDate');

  if (startDate && endDate) {
      // Format dates as YYYY-MM-DD
      var formattedStartDate = formatDate(startDate);
      var formattedEndDate = formatDate(endDate);

      // Store dates in an array
      var date = [formattedStartDate, formattedEndDate];

      console.log(date); // You can use the 'date' array as needed
  } else {
      alert('Please select both start and end dates.');
  }
}

// Function to format date using Bootstrap-datepicker's format
function formatDate(date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

console.log("webpageJS")
 //Add Leaflet Map 
 var map = L.map('map').setView([51.96269732749698,7.625025563711631], 13);
 L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
 maxZoom: 20,
 minZoom:2,
 subdomains:['mt0','mt1','mt2','mt3']
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


async function createDatacube() {
  console.log("Creating Image");
  try {
    // fetch the tif image
    const response = await fetch('/satelliteImage');
    const blob = await response.blob();
    console.log("warum")

    /*const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'satelliteImage.tif';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);*/
    
    // read arraybuffer
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;

      try {
        // transform arrayBuffer to georaster
        const georaster = await parseGeoraster(arrayBuffer);
        const min = georaster.mins[0];
        const max = georaster.maxs[0];
        const range = georaster.ranges[0];

            // available color scales can be found by running console.log(chroma.brewer);
            console.log(chroma.brewer);
            var scale = chroma.scale(['red', 'green', 'blue']);
        console.log(georaster)
        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,
          pixelValuesToColorFn: function(pixelValues) {
            var pixelValue = pixelValues[0]; // there's just one band in this raster
            

            // if there's zero wind, don't return a color
            if (pixelValue === 0) return null;

            // scale to 0 - 1 used by chroma
            var scaledPixelValue = (pixelValue - min) / range;

            var color = scale(scaledPixelValue).hex();

            return color;
          },
          resolution: 512
        });
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        
        
      } catch (error) {
        console.log("Error connecting);", error);
        console.log(error);
      }
    };

    reader.readAsArrayBuffer(blob);
  } catch (error) {
    console.log(error);
  }
}
