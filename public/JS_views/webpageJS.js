"use strict"

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
      selectedDates = [formattedStartDate, formattedEndDate];

      console.log(selectedDates); 

      var saveDateBtn = document.getElementById("saveDateBtn");

      // Remove the current class
      saveDateBtn.classList.remove("black-btn");

      // Add the new class
      saveDateBtn.classList.add("accepted-btn");

      //Change button text
      saveDateBtn.innerHTML="Date saved";
      document.getElementById("datepicker1").disabled = true;
      document.getElementById("datepicker2").disabled = true;
      saveDateBtn.disabled=true;
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
      rectangle: {
          shapeOptions: {
              fill: false,
              color: 'red', // You can set the color as needed
          }
      },
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

 var convertedEast=0;
 var convertedNorth=0;
 var convertedSouth=0;
 var convertedWest=0;

 // Event listener for the button click
 document.getElementById('drawButton').addEventListener('click', function() { 
     // Add Leaflet Draw controls to the map
     map.addControl(drawControl);
      //Handle rectangle creation
      map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;
            console.log(type)
            console.log(layer)
            const bounds = layer.getBounds();

            // Extract coordinates from the bounds object
            const southWest = bounds.getSouthWest(); // returns LatLng object
            const northEast = bounds.getNorthEast(); // returns LatLng object

            // Define the source and destination coordinate systems
            const sourceCRS = 'EPSG:4326';
            const destCRS = 'EPSG:3857';

            // Define the projection transformations
            proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
            proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');

            // Perform the coordinate transformation
            const convertedSouthWest = proj4(sourceCRS, destCRS, [southWest.lng, southWest.lat]);
            const convertedNorthEast = proj4(sourceCRS, destCRS, [northEast.lng, northEast.lat]);

            //Extract LatLng from converted object
            convertedSouth = convertedSouthWest[1];
            convertedWest = convertedSouthWest[0];
            convertedNorth = convertedNorthEast[1];
            convertedEast = convertedNorthEast[0];

            console.log('Converted South West (EPSG:3857):', convertedSouthWest);
            console.log('Converted North East (EPSG:3857):', convertedNorthEast);

            var uploadRecBtn = document.getElementById("uploadRectangle");
            var drawBtn = document.getElementById("drawButton");

            // Remove the current class
            drawBtn.classList.remove("black-btn");
      
            // Add the new class
            drawBtn.classList.add("accepted-btn");
      
            //Change button text
            drawBtn.innerHTML="Drawn";

            // Remove the current class from drawBtn
            uploadRecBtn.classList.remove("black-btn");

            // Add the new class for drawBtn (light grey)
            uploadRecBtn.classList.add("light-grey-btn");
            
            uploadRecBtn.disabled=true;
            drawBtn.disabled=true;
            map.removeControl(drawControl)

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

                // Define the source and destination coordinate systems
                const sourceCRS = 'EPSG:4326';
                const destCRS = 'EPSG:3857';

                // Define the projection transformations
                proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
                proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');
                
                const convertedSouthWest = proj4(sourceCRS, destCRS, [bbox[0], bbox[1]]);
                const convertedNorthEast = proj4(sourceCRS, destCRS, [bbox[2], bbox[3]]);

                //Extract LatLng from converted object
                convertedSouth = convertedSouthWest[1];
                convertedWest = convertedSouthWest[0];
                convertedNorth = convertedNorthEast[1];
                convertedEast = convertedNorthEast[0];

                console.log('Converted South West (EPSG:3857):', convertedSouthWest);
                console.log('Converted North East (EPSG:3857):', convertedNorthEast);
         
              var uploadRecBtn = document.getElementById("uploadRectangle");
              var drawBtn = document.getElementById("drawButton");

            // Remove the current class
            uploadRecBtn.classList.remove("black-btn");
      
            // Add the new class
            uploadRecBtn.classList.add("accepted-btn");
      
            //Change button text
            uploadRecBtn.innerHTML="Uploaded";
            uploadRecBtn.disabled=true;

            // Remove the current class from drawBtn
            drawBtn.classList.remove("black-btn");

            // Add the new class for drawBtn (light grey)
            drawBtn.classList.add("light-grey-btn");

            drawBtn.disabled=true;



            } catch (error) {
                console.error("Error parsing or processing GeoJSON:", error);
            }
        };
        reader.readAsText(file);
    }
});


async function createDatacube() {
  console.log("Creating Image");
  startRotation();
  try {
    // Include converted bounds in the satelliteImage request
    const response = await fetch(`/satelliteImage?date=${selectedDates}&south=${convertedSouth}&west=${convertedWest}&north=${convertedNorth}&east=${convertedEast}`);
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
        const maxRed = georaster.maxs[2]/2;
        const maxGreen = georaster.maxs[1]/2;
        const maxBlue = georaster.maxs[0]/2;
        console.log(maxRed,maxGreen,maxBlue);

        const overAllMax= Math.max(maxRed,maxGreen,maxBlue)


        // available color scales can be found by running console.log(chroma.brewer);
        console.log(georaster)
        
        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,

          pixelValuesToColorFn: function(pixelValues) {

            // scale to 0 - 1 used by chroma
            var scaledRed = (pixelValues[2])*(255/maxRed);
            var scaledGreen = (pixelValues[1])*(255/maxGreen);
            var scaledBlue = (pixelValues[0])*(255/maxBlue);

            var color = chroma.rgb(scaledRed ,scaledGreen,scaledBlue).hex();

            return color;
          },
          resolution: 512
        });  
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        stopRotation();
        
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

function startRotation() {
  var logo = document.getElementById('logo');
  logo.classList.add('rotate');
}

function stopRotation() {
  var logo = document.getElementById('logo');
  logo.classList.remove('rotate');
}
