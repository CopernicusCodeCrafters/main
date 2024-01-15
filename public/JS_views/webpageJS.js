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

 //Add Leaflet Map 
 var map = L.map('map').setView([51.96269732749698,7.625025563711631], 13);
 // Define base layers
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
 });
var googleSatLayer =  L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    attribution: 'Google Satellite',
    maxZoom: 20,
    minZoom:2,
    subdomains:['mt0','mt1','mt2','mt3']
 }); 
// Add base layers to the map
osmLayer.addTo(map);  // Default base layer

// Create an object to store base layers with custom names
var baseLayers = {
    'OpenStreetMap': osmLayer,
    'Google Satellite': googleSatLayer
};
  // Add Leaflet Scale Control
  L.control.scale(
    {imperial: false,}
  ).addTo(map);

// Add layer control to the map
L.control.layers(baseLayers).addTo(map);

// Add Leaflet Control Geocoder
var geocoder = L.Control.geocoder({
  defaultMarkGeocode: false
})
  .on('markgeocode', function (e) {
      map.fitBounds(e.geocode.bbox);
  })
  .addTo(map);


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
    // Remove the existing layers
    map.eachLayer(function(layer){
        if (layer !== map  && !(layer instanceof L.TileLayer)) {
        map.removeLayer(layer)};
    });
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

async function checkInputs () {
   // Get the values of the datePickers
   var date1Value = document.getElementById('endDate').value;
   var date2Value = document.getElementById('startDate').value;

   // Check if an AoI is given
   var AoIgiven = false;

   // Check if something is drawn
   if (drawnItems.getLayers().length > 0) {
       AoIgiven = true;
   }

   // Check if something is uploaded
   var fileInputValue = document.getElementById('fileInput').value;
   if (fileInputValue !== '') {
       AoIgiven = true;
   }
    // Check if both Dateinputs are not empty
    if (date1Value !== '' && date2Value !== '' && AoIgiven) {
      // when date Inputs full call createDatacube()
      createDatacube();
      switchToClassificationTab(); 
    } else {
      alert("Please fill in all the values")
    }
}

function switchToClassificationTab() {
  // Use Bootstrap JavaScript method to show the classification tab
  $('#optionsTabs a[href="#classification"]').tab('show');
}


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
