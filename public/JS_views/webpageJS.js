"use strict"

let selectedDates = [];
let selectedBands = [];
let model = '';

$(document).ready(function () {
  let today = new Date();
  let minDate = new Date(2015, 0, 1); // Minimum date: January 1, 2015


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
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 365) // Set end date 
  });
});

// Event listener for the change event on datepicker1
$('#datepicker1').on('changeDate', function (e) {
  // Calculate two weeks later
  let endDate = new Date(e.date);
  endDate.setDate(endDate.getDate() + 365); // 14 days to allow for a 14-day span

  // Set the new startDate for the second datepicker
  $('#datepicker2').datepicker('setStartDate', e.date);

  // Set the new endDate for the second datepicker
  $('#datepicker2').datepicker('setEndDate', endDate);
});

function getSelectedDates() {
  let startDate = $('#datepicker1').datepicker('getDate');
  let endDate = $('#datepicker2').datepicker('getDate');

  if (startDate && endDate) {
    // Format dates as YYYY-MM-DD
    let formattedStartDate = formatDate(startDate);
    let formattedEndDate = formatDate(endDate);

    // Store dates in an array
    selectedDates = [formattedStartDate, formattedEndDate];


    console.log(selectedDates);

    let saveDateBtn = document.getElementById("saveDateBtn");

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
  let selectedBandsString = $('#bandspicker').val();

  // Split the string into an array using a comma as the delimiter
  selectedBands = selectedBandsString.split(',').map(function (band) {
    // Remove leading and trailing whitespaces from each band
    return band.trim();
  });

  let bandsBtn = document.getElementById("bandsBtn");

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
    let selectedOptions = $('#bandsPicker').find(':selected');

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
let map = L.map('map').setView([51.96269732749698, 7.625025563711631], 13);
// Define base layers
let osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'OpenStreetMap'
});
let googleSatLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: 'Google Satellite',
  maxZoom: 20,
  minZoom: 2,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});
// Add base layers to the map
osmLayer.addTo(map);  // Default base layer

// Create an object to store base layers with custom names
let baseLayers = {
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
let geocoder = L.Control.geocoder({
  defaultMarkGeocode: false
})
  .on('markgeocode', function (e) {
    map.fitBounds(e.geocode.bbox);
  })
  .addTo(map);




// Add Leaflet Draw controls
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
let drawControl = new L.Control.Draw({
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
var south;
var west;
var north;
var east;



// Set maximum allowed area in square meters
let maxAllowedArea = 20000;

// Event listener for the button "Activate Draw"
document.getElementById('drawButton').addEventListener('click', function () {
  // Remove the existing drawn shape before adding a new one
  drawnItems.clearLayers();
  // Add Leaflet Draw controls to the map
  map.addControl(drawControl);
  //letiable for drawControl
  let drawingEnabled = true;
  //Handle rectangle creation
  map.on('draw:created', function (e) {
    let type = e.layerType,
      layer = e.layer;
    console.log(type)
    console.log(layer)
    let bounds = layer.getBounds();
    console.log(bounds)

    // Extract coordinates from the bounds object
    let southWest = bounds.getSouthWest(); // returns LatLng object
    let northEast = bounds.getNorthEast(); // returns LatLng object

    south = southWest.lat;
    west = southWest.lng;
    north = northEast.lat;
    east = northEast.lng;

    // Define the source and destination coordinate systems
    let sourceCRS = 'EPSG:4326';
    let destCRS = 'EPSG:3857';

    // Define the projection transformations
    proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');

    // Perform the coordinate transformation
    let convertedSouthWest = proj4(sourceCRS, destCRS, [southWest.lng, southWest.lat]);
    let convertedNorthEast = proj4(sourceCRS, destCRS, [northEast.lng, northEast.lat]);

    //Extract LatLng from converted object
    convertedSouth = convertedSouthWest[1];
    convertedWest = convertedSouthWest[0];
    convertedNorth = convertedNorthEast[1];
    convertedEast = convertedNorthEast[0];

    console.log('Converted South West (EPSG:3857):', convertedSouthWest);
    console.log('Converted North East (EPSG:3857):', convertedNorthEast);

    let uploadRecBtn = document.getElementById("uploadButton");
    let drawBtn = document.getElementById("drawButton");
    let refreshDrawBtn = document.getElementById("refreshDrawBtn")

    //Remove the current class
    uploadRecBtn.classList.remove("black-btn");
    drawBtn.classList.remove("black-btn");
    refreshDrawBtn.classList.remove("light-grey-btn")

    // Add the new class
    uploadRecBtn.classList.add("light-grey-btn");
    drawBtn.classList.add("accepted-btn");
    refreshDrawBtn.classList.add("black-btn")

    //Change button text
    drawBtn.innerHTML = "Drawn";

    //Change disabled functions
    uploadRecBtn.disabled = true;
    drawBtn.disabled = true;
    refreshDrawBtn.disabled = false;

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
  let fileInput = document.getElementById('fileInput');
  fileInput.click();
});


//Refresh-Button (Enable the Leafletdraw to improve the Area of Interest)
document.getElementById('refreshDrawBtn').addEventListener('click', function () {

  let uploadRecBtn = document.getElementById("uploadButton");
  let drawBtn = document.getElementById("drawButton");
  let refreshDrawBtn = document.getElementById("refreshDrawBtn")

  //Remove the current class
  uploadRecBtn.classList.remove(uploadRecBtn.classList);
  drawBtn.classList.remove(drawBtn.classList);
  refreshDrawBtn.classList.remove(refreshDrawBtn.classList)

  // Add the new class
  uploadRecBtn.classList.add("black-btn");
  drawBtn.classList.add("black-btn");
  refreshDrawBtn.classList.add("light-grey-btn")

  //Change disabled functions
  uploadRecBtn.disabled = false;
  drawBtn.disabled = false;
  refreshDrawBtn.disabled = true;

  //Change button text
  drawBtn.innerHTML = "Draw"
  uploadRecBtn.innerHTML = "Upload";

  // Remove the existing drawn shape
  drawnItems.clearLayers();

});

async function convertGeoPackageToGeoJSON(file) {
  let formData = new FormData();
  formData.append('upload', file, file.name);

  try {
    let response = await fetch('http://ogre.adc4gis.com/convert', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    let convertedGeoJSON = await response.json();
    // proceed with normal geojson usage
    processGeoJSON(convertedGeoJSON);
  } catch (error) {
    console.error('Error during GeoPackage to GeoJSON conversion:', error); //This throws an error but does work
  }
}


document.getElementById('fileInput').addEventListener('change', function (e) {
  let file = e.target.files[0];
  console.log(file);
  if (file) {
    // Read GeoJSON file
    let reader = new FileReader();
    reader.onload = function (e) {
      try {
        let geojsonData;
        if (file.name.endsWith('.geojson')) {
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

function processGeoJSON(geojsonData) {
  //Using Turf.js to create bounding box for OpenEO Request
  let bbox = turf.bbox(geojsonData);
  let bboxPolygon = turf.bboxPolygon(bbox);
  L.geoJSON(geojsonData).addTo(map);
  L.geoJSON(bboxPolygon).addTo(map);

  // Define the source and destination coordinate systems
  let sourceCRS = 'EPSG:4326';
  let destCRS = 'EPSG:3857';

  // Define the projection transformations
  proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
  proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');

  let convertedSouthWest = proj4(sourceCRS, destCRS, [bbox[0], bbox[1]]);
  let convertedNorthEast = proj4(sourceCRS, destCRS, [bbox[2], bbox[3]]);

  //Extract LatLng from converted object
  convertedSouth = convertedSouthWest[1];
  convertedWest = convertedSouthWest[0];
  convertedNorth = convertedNorthEast[1];
  convertedEast = convertedNorthEast[0];


  south = bbox[1];
  west = bbox[0];
  north = bbox[3];
  east = bbox[2];

  console.log('Converted South West (EPSG:3857):', convertedSouthWest);
  console.log('Converted North East (EPSG:3857):', convertedNorthEast);

  let uploadRecBtn = document.getElementById("uploadRectangle");
  let drawBtn = document.getElementById("drawButton");
  let refreshDrawBtn = document.getElementById("refreshDrawBtn");

  // Remove the current class
  uploadRecBtn.classList.remove("black-btn");
  drawBtn.classList.remove("black-btn");
  refreshDrawBtn.classList.remove("light-grey-btn");

  // Add the new class
  uploadRecBtn.classList.add("accepted-btn");
  drawBtn.classList.add("light-grey-btn");
  refreshDrawBtn.classList.add("black-btn");

  //Change button text
  uploadRecBtn.innerHTML = "Uploaded";

  //Change disabled functions
  uploadRecBtn.disabled = true;
  drawBtn.disabled = true;
  refreshDrawBtn = false;
}

async function checkInputs() {
  // Get the values of the datePickers
  let date1Value = $('#datepicker1').val();
  let date2Value = $('#datepicker2').val();

  let submitBtn = document.getElementById("submitBtn");

  let AoIgiven = true;
  let bandsGiven = false;

  // Check if something is drawn
  if (drawnItems.getLayers().length > 0) {
    AoIgiven = true;
  }

  // Check if something is uploaded
  let fileInputValue = document.getElementById('fileInput').value;
  if (fileInputValue !== '') {
    AoIgiven = true;
  }
  // Check if more than 0 Bands are selected
  let bandsInputCheck = document.getElementById("bandsPicker").value;
  if (bandsInputCheck != "") {
    bandsGiven = true;
  }
  // Check if both Dateinputs are not empty
  if (date1Value !== '' && date2Value !== '' && AoIgiven && bandsGiven) {
    // when date Inputs full call createDatacube()

    await createDatacube();
    switchToClassificationTab()
    submitBtn.classList.remove("black-btn");
    submitBtn.classList.add("green-btn");
    submitBtn.innerHTML = "Submitted";
    submitBtn.disabled = true;
  } else {
    alert("Please fill in all the values")
  }
}

function switchToClassificationTab() {
  $('#optionsTabs a[href="#classification"]').tab('show');
}

function selectTrainingModel(event, model) {
  event.preventDefault();
  document.getElementById("trainingModelDropdown").textContent = model;
}

async function checkInputsClassifications(){
   // Get the values of the datePickers
   let date1Value = $('#datepicker1').val();
   let date2Value = $('#datepicker2').val();
   
   // Check if an AoI is given
   let AoIgiven = false;
   let bandsGiven = false;
 
   // Check if something is drawn
   if (drawnItems.getLayers().length > 0 || demoValue == true ) {
     AoIgiven = true;
   }
 
   // Check if something is uploaded
   let fileInputValue = document.getElementById('fileInput').value;
   if (fileInputValue !== '') {
     AoIgiven = true;
   }
   // Check if more than 0 Bands are selected
   let bandsInputCheck = document.getElementById("bandsPicker").value;
   if (bandsInputCheck != ""){
     bandsGiven = true;
   }
   let input = document.getElementById('trainingModelDropdown');
   model = input.textContent;
   console.log("Model:", model)

   // Check if both Dateinputs are not empty . bandsgiven deleted
   if (date1Value !== '' && date2Value !== '' && AoIgiven  && model != '') {
     // when date Inputs full call createDatacube()
     await createClassification();
   } else {
     alert("Please fill in all the values")
   }
}

async function createDatacube() {
  console.log("Creating Image");
  startRotation();

  try {
    // Include converted bounds in the satelliteImage request
    let response = await fetch(`/satelliteImage?date=${selectedDates}&south=${convertedSouth}&west=${convertedWest}&north=${convertedNorth}&east=${convertedEast}&bands=${selectedBands}`);
    let blob = await response.blob();

    // read arraybuffer
    let reader = new FileReader();
    reader.onload = async () => {
      let arrayBuffer = reader.result;

      try {
        // transform arrayBuffer to georaster
        let georaster = await parseGeoraster(arrayBuffer);
        let maxRed = georaster.maxs[2] / 2;
        let maxGreen = georaster.maxs[1] / 2;
        let maxBlue = georaster.maxs[0] / 2;
        console.log(maxRed, maxGreen, maxBlue);

        let overAllMax = 5700 / 2 //Math.max(maxRed,maxGreen,maxBlue)/2


        // available color scales can be found by running console.log(chroma.brewer);
        console.log(georaster)

        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,
          zIndex: 10,

          pixelValuesToColorFn: function (pixelValues) {

            // scale to 0 - 1 used by chroma
            let scaledRed = (pixelValues[2]) * (255 / overAllMax);
            let scaledGreen = (pixelValues[1]) * (255 / overAllMax);
            let scaledBlue = (pixelValues[0]) * (255 / overAllMax);

            let color = chroma.rgb(scaledRed, scaledGreen, scaledBlue).hex();

            return color;
          },
          resolution: 512
        });
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        stopRotation();

      } catch (error) {
        stopRotation();
        alert("Error")
        console.log("Error connecting);", error);
        console.log(error);
      }
    };

    reader.readAsArrayBuffer(blob);
  } catch (error) {
    alert("Error")
    stopRotation();
    console.log(error);
  }
  stopRotation();
}



async function createClassification() {
  console.log("Creating Classification");
  startRotation();
  try {
    console.log(model)
    let response = await fetch(`/getClassification?date=${selectedDates}&south=${convertedSouth}&west=${convertedWest}&north=${convertedNorth}&east=${convertedEast}&bands=${selectedBands}&model=${model}`);
    let blob = await response.blob();
    
    //Download Classification 
    let downloadButton = document.getElementById('downloadButton');
    downloadButton.removeAttribute('disabled');
    downloadButton.classList.remove('light-grey-btn');
    downloadButton.classList.add('black-btn');

    document.getElementById('downloadButton').addEventListener('click', function() {
      let downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'satelliteImage.tif';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });

    // read arraybuffer
    let reader = new FileReader();
    reader.onload = async () => {
      let arrayBuffer = reader.result;

      try {
        // transform arrayBuffer to georaster
        let georaster = await parseGeoraster(arrayBuffer);

        let overAllMax = 5700 / 2 //Math.max(maxRed,maxGreen,maxBlue)/2


        // available color scales can be found by running console.log(chroma.brewer);
        console.log(georaster)

        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,
          zIndex:15,


          pixelValuesToColorFn: function (pixelValues) {
            // Assuming "class" is at index 0 in pixelValues array
            var classValue = pixelValues[0];
            // Define colors dynamically based on class values
            var color = getColorForClass(classValue);
            return color;
          },
          resolution: 512
        });
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        stopRotation();

      } catch (error) {
        stopRotation();
        console.log("Error connecting;", error);
        alert("Error")
      }
      stopRotation();
    };
    reader.readAsArrayBuffer(blob);

    
    let legend = L.control({ position: "topleft" });
    legend.onAdd = function (map) {
      let div = L.DomUtil.create("div", "legend");
      div.innerHTML += "<h4>Legende</h4>";

      getSpecificModel(String(model)).then(model => {
        let nameClass = model.class;
        console.log("nameClass (keys):", Object.keys(nameClass));
        console.log("nameClass (values):", Object.values(nameClass));

        // Correctly loop through class entries and get colors
        Object.entries(nameClass).forEach(([key, value]) => {
          let color = getColorForClass(value); // Make sure this function uses value correctly
          div.innerHTML += `<i style="background: ${color}"></i><span>${key}</span><br>`;
        });
      });

      return div; // Make sure this is outside the async call if the div needs to be immediately returned
    };

    legend.addTo(map);
  } catch (error) {
    stopRotation();
    alert(Error)
    console.log(error);
  }
}

let layer1;
let demoValue;
function simulateUserInput() {
  demoValue = true;
  // Simulate date input
  $('#datepicker1').val('2021-06-01');
  $('#datepicker2').val('2021-06-15');

  document.getElementById("datepicker1").disabled = true;
  document.getElementById("datepicker2").disabled = true;

  let saveDateBtn = document.getElementById("saveDateBtn");

  // Remove the current class
  saveDateBtn.classList.remove("black-btn");


    // Add the new class
    saveDateBtn.classList.add("accepted-btn");
  
    let startDate = '2021-06-01';
    let endDate = '2021-06-15';

      // Format dates as YYYY-MM-DD
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
  
      // Store dates in an array
    selectedDates = [formattedStartDate, formattedEndDate];
  
    
  let bandsPicker = $('#bandsPicker');

  // Array of indices of bands to be selected (0-indexed)
  let selectedBandsIndices = [1, 2, 3]; // Bands 2, 3, and 4

  // Loop through the indices and set the selected property for each option
  selectedBandsIndices.forEach(index => {
    bandsPicker.find('option').eq(index).prop('selected', true);
  });

  // Trigger the change event to ensure that the Bootstrap Select is updated
  bandsPicker.selectpicker('refresh');

  // Assign selected bands to your variable if needed
  selectedBands = ['B02', 'B03', 'B04']

  let modelName = 'Test';  // Replace with the desired model name


  // Trigger a click event on the corresponding dropdown item
  let dropdownItem = $(`#trainingModelOptions a:contains(${modelName})`);
  dropdownItem.trigger('click');


  // Coordinates for the corners of the rectangle
  var northEast1 = L.latLng(51.954226919876916, 7.6094913482666025);
  var southWest1 = L.latLng(51.937555584581446, 7.577991485595704);

  // Create a LatLngBounds object
  let bounds = L.latLngBounds(southWest1, northEast1);


  // Add a rectangle to the map
  layer1 = L.rectangle(bounds, {color: "red", weight: 3, fill : false}).addTo(map);


  bounds = layer1.getBounds();
  console.log(bounds)

  // Extract coordinates from the bounds object
  let southWest = bounds.getSouthWest(); // returns LatLng object
  let northEast = bounds.getNorthEast(); // returns LatLng object

  south = southWest.lat;
  west = southWest.lng;
  north = northEast.lat;
  east = northEast.lng;

  // Define the source and destination coordinate systems
  let sourceCRS = 'EPSG:4326';
  let destCRS = 'EPSG:3857';

  // Define the projection transformations
  proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
  proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');

  // Perform the coordinate transformation
  let convertedSouthWest = proj4(sourceCRS, destCRS, [southWest.lng, southWest.lat]);
  let convertedNorthEast = proj4(sourceCRS, destCRS, [northEast.lng, northEast.lat]);

  //Extract LatLng from converted object
  convertedSouth = convertedSouthWest[1];
  convertedWest = convertedSouthWest[0];
  convertedNorth = convertedNorthEast[1];
  convertedEast = convertedNorthEast[0];

  console.log('Converted South West (EPSG:3857):', convertedSouthWest);
  console.log('Converted North East (EPSG:3857):', convertedNorthEast);

  let uploadRecBtn = document.getElementById("uploadButton");
  let drawBtn = document.getElementById("drawButton");
  let refreshDrawBtn = document.getElementById("refreshDrawBtn")

  //Remove the current class
  uploadRecBtn.classList.remove("black-btn");
  drawBtn.classList.remove("black-btn");
  refreshDrawBtn.classList.remove("light-grey-btn")

  // Add the new class
  uploadRecBtn.classList.add("light-grey-btn");
  drawBtn.classList.add("accepted-btn");
  refreshDrawBtn.classList.add("black-btn")
  //Change button text
  drawBtn.innerHTML = "Drawn";

  //Change disabled functions
  uploadRecBtn.disabled = true;
  drawBtn.disabled = true;
  refreshDrawBtn.disabled = false;

  drawnItems.getLayers().length = 1

  map.removeControl(drawControl)

  // Optionally, fit the map to the rectangle bounds

  //map.removeLayer(layer);




  const lowCCButton = document.getElementById("leastCloudCoverage");
  const agg = document.getElementById("aggregate");
  const select = document.getElementById("selectAvailable");
  lowCCButton.classList.remove("black-btn");
  lowCCButton.classList.add("accepted-btn");
  agg.classList.remove("black-btn");
  agg.classList.remove("light-grey-btn");
  select.classList.remove("black-btn");
  select.classList.remove("light-grey-btn");
}

var randomColors = generateRandomColors();
function generateRandomColors() {
  let colors = [];

  // Funktion, um eine zufällige Farbe zu generieren
  function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Array mit 10 verschiedenen zufälligen Farben füllen
  for (let i = 0; i < 100; i++) {
    let newColor;

    // Überprüfen, ob die generierte Farbe bereits im Array vorhanden ist
    do {
      newColor = getRandomColor();
    } while (colors.includes(newColor));

    // Neue Farbe dem Array hinzufügen
    colors.push(newColor);
  }

  return colors;
}

function getColorForClass(classValue) {
  // Define colors dynamically based on class values
  var classColors = {
    1: randomColors[0],
    2: randomColors[1],
    3: randomColors[2],
    4: randomColors[3],
    5: randomColors[4],
    6: randomColors[5],
    7: randomColors[6],
    8: randomColors[7],
    // Add more class-color mappings as needed
  };

  // Default color for unknown class
  var defaultColor = chroma('gray').hex();

  // Return the color based on the class value or default color if not found
  return classColors[classValue] || defaultColor;
}


function startRotation() {
  let logo = document.getElementById('logo');
  logo.classList.add('rotate');
  let wave = document.getElementById('wave');
  wave.classList.toggle('show');
}

function stopRotation() {
  let logo = document.getElementById('logo');
  logo.classList.remove('rotate');
  let wave = document.getElementById('wave');
  wave.classList.remove('show');
}

function checkInputsForEarthSearch() {
  var date1Value = $('#datepicker1').val();
  var date2Value = $('#datepicker2').val();
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

    let lowerLeftLong = west;
    let lowerLeftLat = south;
    let upperRightLong = east;
    let upperRightLat = north;

    // Url for request with filter parameters for earth search v1
    // Transform dates into earth-search v1 compatible
    // const startDate = selectedDates[0] + "T00:00:00.000Z";
    // const endDate = selectedDates[1] + "T23:59:59.999Z";
    // const apiUrl = `https://earth-search.aws.element84.com/v1/search?bbox=${lowerLeftLong},${lowerLeftLat},${upperRightLong},${upperRightLat}&datetime=${startDate}/${endDate}&collections=sentinel-2-l2a&limit=10000&sortby=properties.eo:cloud_cover`;
    // console.log(apiUrl);
    // fetch(apiUrl)

    //URL for earth-search v0 (As openeocubes uses), but discontinued
    const datetime = selectedDates[0] + "/" + selectedDates[1];
    const bbox = [lowerLeftLong, lowerLeftLat, upperRightLong, upperRightLat];
    const apiUrl = "https://earth-search.aws.element84.com/v0/search";

    return `${apiUrl}?datetime=${datetime}&collection=sentinel-s2-l2a-cogs&bbox=[${bbox}]&sortby=properties.eo:cloud_cover&limit=1000`;
  } else {
    alert("Please fill in all the values");
  }
}


document.addEventListener("DOMContentLoaded", async function () {

  const lowCCButton = document.getElementById("leastCloudCoverage");
  const agg = document.getElementById("aggregate");
  const select = document.getElementById("selectAvailable");
  const refreshButton = document.getElementById("refreshImageBtn");
  var startingTime;
  var endTime;

  document.getElementById("leastCloudCoverage").addEventListener("click", async function () {

    startingTime = selectedDates[0];
    endTime = selectedDates[1];

    const httpRequestUrl = checkInputsForEarthSearch();
    console.log(httpRequestUrl);

    fetch(httpRequestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // Parse response body as JSON
      })
      .then(data => {
        const validImages = data.features.filter(item => item.properties['eo:cloud_cover'] < 30 && item.properties['eo:cloud_cover'] != 0);
        if (validImages.length === 0) {
          alert("There are no valid images available! Select another time period or change the AOI")
        } else {
          // Return formatted date, so it can be used for the openeocubes request again
          console.log(data);
          const timestamp = data.features[0].properties.datetime; //rigth now returns the image in the timeframe with the least cloud cover
          const date = new Date(timestamp);
          const formattedDate = date.toISOString().split('T')[0];
          console.log(formattedDate);
          selectedDates[0] = formattedDate;
          selectedDates[1] = formattedDate;

          lowCCButton.classList.remove("black-btn");
          lowCCButton.classList.add("accepted-btn");

          agg.classList.remove("black-btn");
          agg.classList.add("light-grey-btn");

          select.classList.remove("black-btn");
          select.classList.add("light-grey-btn");

          refreshButton.classList.remove("light-grey-btn");
          refreshButton.classList.add("black-btn");

          lowCCButton.disabled = true;
          agg.disabled = true;
          select.disabled = true;
          refreshButton.disabled = false;
        }
      })
      .catch(error => {
        // Handle fetch errors here
        console.error('Fetch error:', error);
      });
  });

  document.getElementById("aggregate").addEventListener("click", async function () {

    startingTime = selectedDates[0];
    endTime = selectedDates[1];

    const httpRequestUrl = checkInputsForEarthSearch();

    console.log(httpRequestUrl);

    fetch(httpRequestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // Parse response body as JSON
      })
      .then(data => {
        // Return formatted date, so it can be used for the openeocubes request again
        const validImages = data.features.filter(item => item.properties['eo:cloud_cover'] < 30 && item.properties['eo:cloud_cover'] != 0);
        console.log(validImages);
        if (validImages.length === 0) {
          alert("There are no valid images available! Select another time period or change the AOI")
        } else {

          lowCCButton.classList.remove("black-btn");
          lowCCButton.classList.add("light-grey-btn");

          agg.classList.remove("black-btn");
          agg.classList.add("accepted-btn");

          select.classList.remove("black-btn");
          select.classList.add("light-grey-btn");

          refreshButton.classList.remove("light-grey-btn");
          refreshButton.classList.add("black-btn");

          lowCCButton.disabled = true;
          agg.disabled = true;
          select.disabled = true;
          refreshButton.disabled = false;
        }
      });
  });

  document.getElementById("selectAvailable").addEventListener("click", async function () {

    startingTime = selectedDates[0];
    endTime = selectedDates[1];

    const httpRequestUrl = checkInputsForEarthSearch();
    console.log(httpRequestUrl);

    fetch(httpRequestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // Parse response body as JSON
      })
      .then(data => {
        // Return formatted date, so it can be used for the openeocubes request again
        const validImages = data.features.filter(item => item.properties['eo:cloud_cover'] < 30 && item.properties['eo:cloud_cover'] != 0);
        console.log(validImages);

        if (validImages.length === 0) {
          alert("There are no valid images available! Select another time period or change the AOI")
        } else {
          console.log(data);
          document.getElementById("popup").style.display = "block";

          const table = document.createElement("table");
          const headerRow = table.insertRow();
          headerRow.innerHTML = "<th>Time</th><th>Cloud Cover (%)</th>";


          data.features.filter(item => item.properties['eo:cloud_cover'] < 30 && item.properties['eo:cloud_cover'] != 0).forEach(item => {
            const row = table.insertRow();
            const timeCell = row.insertCell(0);
            const cloudCoverCell = row.insertCell(1);

            const date = new Date(item.properties.datetime);
            const formattedDate = date.toISOString().split('T')[0];

            timeCell.textContent = formattedDate;
            cloudCoverCell.textContent = item.properties['eo:cloud_cover'] + "%";

            row.addEventListener("click", function () {
              const previouslySelectedRow = table.querySelector(".selected");
              if (previouslySelectedRow) {
                previouslySelectedRow.classList.remove("selected");
              }
              // Add selection to the clicked row
              row.classList.add("selected");

              // Handle item selection here
              console.log(`Selected: ${formattedDate}`);
              selectedDates[0] = formattedDate;
              selectedDates[1] = formattedDate;
            });
            document.getElementById("dynamicTable").appendChild(table);
          });
        }
      })
      .catch(error => {
        // Handle fetch errors here
        console.error('Fetch error:', error);
      });
  });
  document.getElementById("closePopupBtn").addEventListener("click", function () {
    document.getElementById("popup").style.display = "none";

    lowCCButton.classList.remove("black-btn");
    lowCCButton.classList.add("light-grey-btn");

    agg.classList.remove("black-btn");
    agg.classList.add("light-grey-btn");

    select.classList.remove("black-btn");
    select.classList.add("accepted-btn");

    refreshButton.classList.remove("light-grey-btn");
    refreshButton.classList.add("black-btn");

    lowCCButton.disabled = true;
    agg.disabled = true;
    select.disabled = true;
    refreshButton.disabled = false;
  });

  document.getElementById("refreshImageBtn").addEventListener("click", function () {

    selectedDates[0] = startingTime;
    selectedDates[1] = endTime;
    console.log(selectedDates);

    lowCCButton.classList.remove("accepted-btn");
    lowCCButton.classList.remove("light-grey-btn");
    lowCCButton.classList.add("black-btn");

    agg.classList.remove("accepted-btn");
    agg.classList.remove("light-grey-btn");
    agg.classList.add("black-btn");

    select.classList.remove("light-grey-btn");
    select.classList.remove("accepted-btn");
    select.classList.add("black-btn");

    refreshButton.classList.remove("black-btn");
    refreshButton.classList.add("light-grey-btn");

    refreshButton.disabled = true;
    lowCCButton.disabled = false;
    agg.disabled = false;
    select.disabled = false;
  })
})



fetch('/getModel')
  .then(response => response.json())
  .then(data => {
    // Get the dropdown menu element
    let dropdownMenu = $('#trainingModelOptions');

    // Clear existing options
    dropdownMenu.empty();

    // Populate the dropdown menu with training model names
    data.forEach(entry => {
      if (entry) {
        dropdownMenu.append(`<a class="dropdown-item" href="#" onclick="selectTrainingModel(event, '${entry.name}')">${entry.name}</a>`);
      }
    });
  })
  .catch(error => console.error('Error:', error));

async function getSpecificModel(modelName) {
  try {
    let response = await fetch(`/getSpecificModel/${modelName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data = await response.json();
    return data;
    console.log(data);
  } catch (error) {
    console.error('Error fetching specific model:', error.message);
  }
}

