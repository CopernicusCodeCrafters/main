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
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) // Set end date 2 weeks after today
  });
});

// Event listener for the change event on datepicker1
$('#datepicker1').on('changeDate', function (e) {
  // Calculate two weeks later
  let endDate = new Date(e.date);
  endDate.setDate(endDate.getDate() + 30); // 14 days to allow for a 14-day span

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

let convertedEast = 0;
let convertedNorth = 0;
let convertedSouth = 0;
let convertedWest = 0;


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

    // Extract coordinates from the bounds object
    let southWest = bounds.getSouthWest(); // returns LatLng object
    let northEast = bounds.getNorthEast(); // returns LatLng object

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

  let AoIgiven = false;
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
    console.log("warum")

    /*
    let downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'satelliteImage.tif';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink)
      */
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

createClassification();

async function createClassification() {
  console.log("Creating Classification");
  startRotation();
  
  try {
    const localTIFPath = 'pictures/satelliteImage.tif';
    const response = await fetch(localTIFPath);
    const blob = await response.blob();

    /*
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'satelliteImage.tif';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    */
    // read arraybuffer
    const reader = new FileReader();
    reader.onload = async () => {
      let arrayBuffer = reader.result;

      try {
        const georaster = await parseGeoraster(arrayBuffer);
        console.log(georaster);

        let layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 1,

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
        console.log("Error connecting:", error);
        alert("Error");
      }
    };

    reader.readAsArrayBuffer(blob);
  } catch (error) {
    stopRotation();
    alert("Error");
    console.log(error);
  }
}

var randomColors= generateRandomColors();
function generateRandomColors() {
  const colors = [];

  // Funktion, um eine zufällige Farbe zu generieren
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
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
  // You can modify this logic based on your specific class-color mapping
  var classColors = {
    1: randomColors[0],
    2: randomColors[1],
    3: randomColors[2],
    4: randomColors[3],
    // Add more class-color mappings as needed
  };

  // Default color for unknown class
  var defaultColor = chroma('gray').hex();

  // Return the color based on the class value or default color if not found
  return classColors[classValue] || defaultColor;
}

function loadingAnimation() {
  const dotsElement = document.getElementById('loading-dots');
  let dots = 0;

  function updateDots() {
    dots = (dots + 1) % 4;
    const dotsText = '.'.repeat(dots);
    dotsElement.textContent = `Loading${dotsText}`;
  }
  setInterval(updateDots, 500);

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

  async function getSpecificModel(modelName ) {
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

  let legend = L.control({ position: "topleft" });

  legend.onAdd = function(map) {
    let div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Legende</h4>";
  
    getSpecificModel("TEstz").then(model => {
      let nameClass = model.class;
      console.log("nameClass:",nameClass);
      console.log(Object.keys(nameClass));
  
      // Loop through class values and get colors using getColorForClass function
      Object.values(nameClass).forEach(value => {
        let color = getColorForClass(value);
        div.innerHTML += `<i style="background: ${color}"></i><span>${Object.keys(nameClass)[value-1]}</span><br>`;
      });
  
      // Example: Find the key for class value 2
      let keyWithValue2 = Object.keys(model.class).find(key => model.class[key] === 2);
      console.log(keyWithValue2); // This will output: "Siedlung"
    });
  
    return div;
  };
  
  legend.addTo(map);
  