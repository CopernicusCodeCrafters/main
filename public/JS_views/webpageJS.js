"use strict"

var selectedDates = [];
var selectedBands = [];

$(document).ready(function () {
  var today = new Date();
  var minDate = new Date(2015, 0, 1); // Minimum date: January 1, 2015


  $('#datepicker1').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    startDate: minDate,
    endDate: today // Restrict datepicker1 to today
  });

  $('#datepicker2').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    startDate: today, // Start datepicker2 from today
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) // Set end date 2 weeks after today
  });
});

// Event listener for the change event on datepicker1
$('#datepicker1').on('changeDate', function (e) {
  // Calculate two weeks later
  var endDate = new Date(e.date);
  endDate.setDate(endDate.getDate() + 30); // 14 days to allow for a 14-day span

  // Set the new startDate for the second datepicker
  $('#datepicker2').datepicker('setStartDate', e.date);

  // Set the new endDate for the second datepicker
  $('#datepicker2').datepicker('setEndDate', endDate);
});

function getSelectedDates() {
  var startDate = $('#datepicker1').datepicker('getDate');
  var endDate = $('#datepicker2').datepicker('getDate');

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

    // Change button text
    saveDateBtn.innerHTML = "Date saved";
    document.getElementById("datepicker1").disabled = true;
    document.getElementById("datepicker2").disabled = true;
    saveDateBtn.disabled = true;
  } else {
    alert('Please select both start and end dates.');
  }
}



function getSelectedBands() {
  var selectedBandsString = $('#bandspicker').val();

  // Split the string into an array using a comma as the delimiter
  selectedBands = selectedBandsString.split(',').map(function (band) {
    // Remove leading and trailing whitespaces from each band
    return band.trim();
  });

  var bandsBtn = document.getElementById("bandsBtn");

  bandsBtn.classList.remove("black-btn");

  // Add the new class
  bandsBtn.classList.add("accepted-btn");

  bandsBtn.innerHTML = "Bands saved";

  bandsBtn.disabled = true;

  console.log("Selected Bands (before):", selectedBands);
}

$(document).ready(function () {
  // Initialize Bootstrap Select
  $('#bandsPicker').selectpicker();


  // Handle selection changes
  $('#bandsPicker').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    var selectedOptions = $('#bandsPicker').find(':selected');

    // Transform selected options data-subtext to custom format (e.g., B01, B02, etc.)
    selectedBands = selectedOptions ? selectedOptions.map(function () {
      return 'B' + $(this).data('subtext').slice(-2);
    }).toArray() : [];

    console.log(selectedBands); // You can use this array as needed
  });
});





// Function to format date using Bootstrap-datepicker's format
function formatDate(date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

//Add Leaflet Map 
var map = L.map('map').setView([51.96269732749698, 7.625025563711631], 13);
// Define base layers
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'OpenStreetMap'
});
var googleSatLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: 'Google Satellite',
  maxZoom: 20,
  minZoom: 2,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
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
  { imperial: false, }
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

var convertedEast = 0;
var convertedNorth = 0;
var convertedSouth = 0;
var convertedWest = 0;


// Set maximum allowed area in square meters
var maxAllowedArea = 20000;

// Event listener for the button "Activate Draw"
document.getElementById('drawButton').addEventListener('click', function () {
  // Remove the existing drawn shape before adding a new one
  drawnItems.clearLayers();
  // Add Leaflet Draw controls to the map
  map.addControl(drawControl);
  //variable for drawControl
  var drawingEnabled = true;
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

    var uploadRecBtn = document.getElementById("uploadButton");
    var drawBtn = document.getElementById("drawButton");

    // Remove the current class
    drawBtn.classList.remove("black-btn");

    // Add the new class
    drawBtn.classList.add("accepted-btn");

    //Change button text
    drawBtn.innerHTML = "Drawn";

    // Remove the current class from drawBtn
    uploadRecBtn.classList.remove("black-btn");

    // Add the new class for drawBtn (light grey)
    uploadRecBtn.classList.add("light-grey-btn");

    uploadRecBtn.disabled = true;
    drawBtn.disabled = true;
    map.removeControl(drawControl)

    if (type === 'rectangle') {
      drawnItems.addLayer(layer);
      console.log("LayerTest")

    }
  })
});
map.on('draw:deleted', function (e) {
  drawingEnabled = true;
});

//Option to choose a geojson in any format and adds it to the map
document.getElementById('uploadButton').addEventListener('click', function () {
  // Remove the existing layers
  map.eachLayer(function (layer) {
    if (layer !== map && !(layer instanceof L.TileLayer)) {
      map.removeLayer(layer)
    };
  });
  map.removeControl(drawControl)
  const fileInput = document.getElementById('fileInput');
  fileInput.click();
});


async function convertGeoPackageToGeoJSON(file) {
  const formData = new FormData();
    formData.append('upload', file, file.name);

    try {
        const response = await fetch('http://ogre.adc4gis.com/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const convertedGeoJSON = await response.json();
        // proceed with normal geojson usage
        processGeoJSON(convertedGeoJSON);
    } catch (error) {
        console.error('Error during GeoPackage to GeoJSON conversion:', error); //This throws an error but does work
    }
}


document.getElementById('fileInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  console.log(file);
  if (file) {
    // Read GeoJSON file
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        var geojsonData;
        if (file.name.endsWith('.geojson')){
          geojsonData = JSON.parse(e.target.result);
          processGeoJSON(geojsonData);
          // Read Geopackage File 
        } else {
          convertGeoPackageToGeoJSON(file);
        }      
      } catch (error) {
        stopRotation();
        console.error("Error parsing or processing GeoJSON:", error);
      }
    };
    reader.readAsText(file);
  }
});

function processGeoJSON(geojsonData){
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
  uploadRecBtn.innerHTML = "Uploaded";
  uploadRecBtn.disabled = true;

  // Remove the current class from drawBtn
  drawBtn.classList.remove("black-btn");

  // Add the new class for drawBtn (light grey)
  drawBtn.classList.add("light-grey-btn");

  drawBtn.disabled = true;

}

async function checkInputs() {
  // Get the values of the datePickers
  var date1Value = $('#datepicker1').val();
  var date2Value = $('#datepicker2').val();
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
  //startRotation();
  try {
    // Include converted bounds in the satelliteImage request
    const response = await fetch(`/satelliteImage?date=${selectedDates}&south=${convertedSouth}&west=${convertedWest}&north=${convertedNorth}&east=${convertedEast}&bands=${selectedBands}`);
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
        const maxRed = georaster.maxs[2] / 2;
        const maxGreen = georaster.maxs[1] / 2;
        const maxBlue = georaster.maxs[0] / 2;
        console.log(maxRed, maxGreen, maxBlue);

        const overAllMax = 5700 / 2 //Math.max(maxRed,maxGreen,maxBlue)/2


        // available color scales can be found by running console.log(chroma.brewer);
        console.log(georaster)

        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,

          pixelValuesToColorFn: function (pixelValues) {

            // scale to 0 - 1 used by chroma
            var scaledRed = (pixelValues[2]) * (255 / overAllMax);
            var scaledGreen = (pixelValues[1]) * (255 / overAllMax);
            var scaledBlue = (pixelValues[0]) * (255 / overAllMax);

            var color = chroma.rgb(scaledRed, scaledGreen, scaledBlue).hex();

            return color;
          },
          resolution: 512
        });
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        //stopRotation();

      } catch (error) {
        //stopRotation();
        console.log("Error connecting);", error);
        console.log(error);
      }
    };

    reader.readAsArrayBuffer(blob);
  } catch (error) {
    stopRotation();
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

