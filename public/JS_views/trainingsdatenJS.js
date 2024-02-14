//let cons = require("consolidate");

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
googleSatLayer.addTo(map);  // Default base layer

// Create an object to store base layers with custom names
var baseLayers = {
  'OpenStreetMap': osmLayer,
  'Google Satellite': googleSatLayer
};

// Add layer control to the map
L.control.layers(baseLayers).addTo(map);

//Initialize Datepicker
$(document).ready(function () {
  let today = new Date();
  let minDate = new Date(2015, 0, 1); // Minimum date: January 1, 2015


  $('#datepicker1TD').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    startDate: minDate,
    endDate: today // Restrict datepicker1 to today
  });

  $('#datepicker2TD').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    startDate: today, // Start datepicker2 from today
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 365) // Set end date 
  });
});

// Event listener for the change event on datepicker1
$('#datepicker1TD').on('changeDate', function (e) {
  // Calculate two weeks later
  let endDate = new Date(e.date);
  endDate.setDate(endDate.getDate() + 365); // 14 days to allow for a 14-day span

  // Set the new startDate for the second datepicker
  $('#datepicker2TD').datepicker('setStartDate', e.date);

  // Set the new endDate for the second datepicker
  $('#datepicker2TD').datepicker('setEndDate', endDate);
});

function getTrainingDates() {
  let startDateTD = $('#datepicker1TD').datepicker('getDate');
  let endDateTD = $('#datepicker2TD').datepicker('getDate');

  if (startDateTD && endDateTD) {
    // Format dates as YYYY-MM-DD
    let formattedStartDateTD = formatDate(startDateTD);
    let formattedEndDateTD = formatDate(endDateTD);

    // Store dates in an array
    selectedDatesTD = [formattedStartDateTD, formattedEndDateTD];

    console.log(selectedDatesTD);

    let saveDateBtn = document.getElementById("saveDateBtn");

    // Remove the current class
    saveDateBtn.classList.remove("black-btn");

    // Add the new class
    saveDateBtn.classList.add("accepted-btn");

    // Change button text
    saveDateBtn.innerHTML = "Date saved";
    document.getElementById("datepicker1TD").disabled = true;
    document.getElementById("datepicker2TD").disabled = true;
    saveDateBtn.disabled = true;
  } else {
    alert('Please select both start and end dates.');
  }
}

// Function to format date using Bootstrap-datepicker's format
function formatDate(date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

var selectedFeature = null;
//Funktion, welche onload alle Trainingypolygone hinzufügt
async function startingPolygonmanager() {
  try {
    let response = await fetch("/getAllPolygons");
    let stationData = await response.json();
    if (Array.isArray(stationData)) {
      // Check if stationData is an array
      stationData.forEach((geojson) => {
        let classification = geojson && geojson.properties && geojson.properties.classification;
        let color;

        switch (classification) {
          case 'field':
            color = 'green';
            break;
          case 'water':
            color = 'blue';
            break;
          case 'street':
            color = 'black';
            break;
          case 'settlement':
            color = 'red';
            break;
          case 'forest':
            color = 'darkgreen';
            break;
          default:
            color = 'gray';
        }

        L.geoJSON(geojson, {
          style: {
            fillColor: color,
            color: color,
            weight: 2,
          },
          onEachFeature: function (feature, layer) {

            let div = document.createElement("div");
            div.innerHTML = `
            <strong>Name:</strong> ${feature.properties.name || 'N/A'}<br>
            <strong>Object ID:</strong> ${feature.properties.object_id || 'N/A'}<br> 
            <strong>Classification:</strong> ${feature.properties.classification || 'N/A'}<br>
          `;
            //Delete Function
            let deleteButton = document.createElement("button");
            deleteButton.innerHTML = "Delete";
            deleteButton.onclick = function () {
              console.log("start deleting");
              console.log(feature);
              deleteFeaturefromMapAndDB(feature);
            }
            div.appendChild(deleteButton);
            div.appendChild(document.createElement("br"));

            // Save edit button
            let submitEditButton = document.createElement("button");
            submitEditButton.innerHTML = "Submit Edit";
            div.appendChild(submitEditButton);
            div.appendChild(document.createElement("br"));

            // End edit button
            let stopEditButton = document.createElement("button");
            stopEditButton.innerHTML = "Dismiss Edit";
            div.appendChild(stopEditButton);


            //When a feature is edited its new coordinates get saved
            var newCoordinates;
            layer.on('edit', function (e) {
              newCoordinates = e.target.getLatLngs()[0];
              console.log("New coordinates:", newCoordinates);
            })

            //When a polygon is clicked it gets editable and can be uploaded
            layer.on('click', function (e) {
              if (selectedFeature) {
                selectedFeature.editing.disable();
              }

              submitEditButton.onclick = function () {
                selectedFeature.editing.disable();
                var object_id = selectedFeature.feature.properties.object_id;
                var name = selectedFeature.feature.properties.name;
                var classification = selectedFeature.feature.properties.classification;

                // User can input different values if he wants to              
                do {
                  object_id = prompt("Change 'object_id' if necessary:", object_id);
                } while (!object_id.trim());
                do {
                  name = prompt("Change 'name' if necessary:", name);
                } while (!name.trim());
                do {
                  classification = prompt("Change 'classification' if necessary:", classification);
                } while (!classification.trim());

                let newCoords = [];
                for (let i = 0; i < newCoordinates.length; i++) {
                  newCoords[i] = [];
                  newCoords[i][0] = newCoordinates[i].lng;
                  newCoords[i][1] = newCoordinates[i].lat;
                }
                newCoords.push([newCoordinates[0].lng, newCoordinates[0].lat]);

                let newFeature = {
                  type: "Feature",
                  properties: {
                    object_id,
                    name,
                    classification,
                  },
                  geometry: {
                    type: "Polygon",
                    coordinates: [newCoords]
                  }
                };
                updateFeatureinDB(feature, newFeature);
              }

              selectedFeature = e.target;
              selectedFeature.editing.enable();

              stopEditButton.onclick = function () {
                selectedFeature.editing.disable();
              }
            });
            layer.bindPopup(div);
          }
        }).addTo(map);
      });

      console.log("Fetched stationdata:", stationData);
    } else {
      console.error("Error: Invalid stationData format");
    }
  } catch (error) {
    console.error("Error fetching GeoJSON data:", error);
  }
}

startingPolygonmanager();


// Input File is processed and shown in the Leaflet Map
async function handleFile(event) {
  event.preventDefault();

  let formData = new FormData(document.getElementById('uploadForm'));
  let file = formData.get('file');

  if (file) {
    let fileName = file.name.toLowerCase();

    if (fileName.endsWith('.geojson')) {
      let reader = new FileReader();
      reader.onload = async function () {
        let result = reader.result;
        let geojson = JSON.parse(result);

        addFeaturesNames(geojson);

      };

      reader.readAsText(file);
    }

    else if (fileName.endsWith('.gpkg')) {
      let reader = new FileReader();
      reader.onload = async function () {
        let result = reader.result;
        try {
          let fileContent = new Blob([result], { type: file.type });
          let formData = new FormData();
          formData.append('upload', fileContent, 'file');
          let response = await fetch('http://ogre.adc4gis.com/convert', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          let convertedGeoJSON = await response.json();
          console.log('Converted GeoJSON:', convertedGeoJSON);

          addFeaturesNames(convertedGeoJSON);

        } catch (error) {
          console.error('Error:', error.message || error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else {
      console.log('Invalid file format. Supported formats: GeoJSON (.geojson) and GeoPackage (.gpkg)');
    }
  } else {
    console.log('No file selected');
  }
}


async function addFeaturesNames(geojson) {
  //setGeojsonToMap(geojson);
  console.log(geojson.features);
  //console.log(geojson.feat)

  for (let feature of geojson.features) {

    const temporaryLayer = L.geoJSON(feature);
    console.log(temporaryLayer);
    drawnItems.addLayer(temporaryLayer);
    map.fitBounds(temporaryLayer.getBounds(), { padding: [20, 20], maxZoom: 15 });

    await new Promise(resolve => setTimeout(resolve, 500));

    let object_id, name, classification;
    do {
      object_id = prompt("Enter object_id:");
    } while (!object_id.trim());

    do {
      name = prompt("Enter name:");
    } while (!name.trim());

    do {
      classification = prompt("Enter classification:");
    } while (!classification.trim());

    feature.properties = {
      object_id,
      name,
      classification,
    };
    drawnItems.removeLayer(temporaryLayer);
    setGeojsonToMap(feature);
    await addGeoJSONtoDB(feature);
  }
}


// Leaflet Draw is intialized
let container = L.DomUtil.create(
  "div",
  "leaflet-control "
);

let drawnItems = L.featureGroup().addTo(map);

map.addControl(
  new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
    },
    draw: {
      polygon: {
        showArea: true,
      },
      polyline: false,
      marker: false,
      circle: false,
    },
  })
);

map.on(L.Draw.Event.CREATED, async function (event) {
  let layer = event.layer;
  let feature = (layer.feature = layer.feature || {});
  let type = event.layerType;

  let object_id, name, classification;

  do {
    object_id = prompt("Enter object_id:");
  } while (!object_id.trim()); // Repeat the prompt until a non-empty string is entered

  do {
    name = prompt("Enter name:");
  } while (!name.trim());

  do {
    classification = prompt("Enter classification:");
  } while (!classification.trim());

  let geojson = {
    type: "Feature",
    properties: {
      object_id,
      name,
      classification,
    },
    geometry: layer.toGeoJSON().geometry,
  };

  feature.type = feature.type || "Feature";
  let props = (feature.properties = feature.properties || {});

  props.type = type;

  drawnItems.addLayer(layer);

  await addGeoJSONtoDB(geojson);
});


let layer;
// A Geojson is displayed in the map
function setGeojsonToMap(geojson) {
  drawnItems.clearLayers();

  if (geojson.type === "FeatureCollection" && geojson.features) {
    // GeoJSON is a Feature Collection
    geojson.features.forEach((feature) => {
      displayFeature(feature);
    });
  } else if (geojson.type === "Feature") {
    // GeoJSON is a single Feature
    displayFeature(geojson);
  }

  function displayFeature(feature) {
    let properties = feature.properties;
    let popupContent = `
      <strong>Name:</strong> ${properties.name || 'N/A'}<br>
      <strong>Object ID:</strong> ${properties.object_id || 'N/A'}<br> 
      <strong>Classification:</strong> ${properties.classification || 'N/A'}
    `;
    layer = L.geoJSON(feature, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(popupContent);
      },
    });
    drawnItems.addLayer(layer);
  }

  map.fitBounds(drawnItems.getBounds());
}






// Geojson is transformed into a Download Link using a Blob object

let download = document.getElementById("save-Button1");

download.addEventListener("click", async () => {
  try {
    // Extract GeoJSON from featureGroup
    let response = await fetch("/getAllPolygons");
    let geoJSONData = await response.json();

    let featureCollection = {
      "type": "FeatureCollection",
      "features": geoJSONData
    };

    if (featureCollection.features.length === 0) {
      alert("No features in GeoJSON data");
      return;
    }

    let blob = new Blob([JSON.stringify(featureCollection)], { type: "application/json" });

    let downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "trainingsdaten.geojson";

    downloadLink.click();

    URL.revokeObjectURL(downloadLink.href);
  } catch (error) {
    console.error("Error downloading GeoJSON:", error);
  }
});

//Funktion, welche eine GeoJSON der Trainingsgebiete in der MongoDB speichert
let fetchButton = document.getElementById('insertTrainingsdata_button');
let addGeoJSONtoDB = async (geojson) => {
  try {
    let response = await fetch('/insert-geojson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geojson }),
    });
    let result = await response.text();
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Function to Delete a Polygon
async function deleteFeaturefromMapAndDB(feature) {
  try {
    let objectId = feature._id; // Replace with the actual property name of your objectId

    // Make a request to the server to delete the feature
    let response = await fetch(`/delete-feature?_id=${objectId}`, {
      method: 'GET', // Since the server route is defined as app.get
    });

    let result = await response.text();
    console.log(result);

  } catch (error) {
    console.error('An error occurred deleting feature: ', error);
  }
  location.reload();

}

//Function to modify a polygon and update properties
async function updateFeatureinDB(oldFeature, newFeature) {
  await addGeoJSONtoDB(newFeature);
  deleteFeaturefromMapAndDB(oldFeature);
}

// Function to get FeatureCollection from GeoJSON layer
function getFeatureCollectionFromLayer(geoJSONlayer) {
  // Check if the layer is a GeoJSON layer
  if (geoJSONlayer instanceof L.GeoJSON) {
    // Extract GeoJSON data from the layer
    let geoJsonData = geoJSONlayer.toGeoJSON();

    // Check if the GeoJSON data is a Feature or FeatureCollection
    if (geoJsonData.type === 'Feature') {
      // Convert a single Feature to a FeatureCollection
      return {
        type: 'FeatureCollection',
        features: [geoJsonData]
      };
    } else if (geoJsonData.type === 'FeatureCollection') {
      // Return the existing FeatureCollection
      return geoJsonData;
    }
  }

  // Return null if the layer is not a GeoJSON layer
  return null;
}



// Method to exchange the classifiers to numbers (needed in openeobackend)
function exchangeClassifier(featureCollection) {
  try {
    let features = featureCollection.features;
    let classifications = new Set();

    features.forEach((element) => {
      if (element.properties && element.properties.classification) {
        classifications.add(element.properties.classification);
      }
    });

    // Convert the Set to an array
    let uniqueClassificationsArray = Array.from(classifications);


    let classificationMapping = {};
    let numberCounter = 0;


    uniqueClassificationsArray.forEach((classification) => {
      classificationMapping[classification] = numberCounter;
      numberCounter++;
    });

    // replace classifications with numbers
    features.forEach((element) => {
      if (element.properties && element.properties.classification) {
        element.properties.classification = classificationMapping[element.properties.classification];
      }
    });

    // Output the updated featureCollection
    console.log(classificationMapping)
    return { featureCollection, classificationMapping };
  } catch (error) {
    console.log("Error: ", error);
    alert("error");
  }
}
let featureCollection;
// function to create a ml model in the openeobackend
async function buildModel() {
  startRotation();
  let response = await fetch("/getAllPolygons");

  let geoJSONData;
  try {
    geoJSONData = await response.json();
    console.log("fetched geojson:")
    console.log(geoJSONData)
    console.log(geoJSONData[0].type === "FeatureCollection")
  } catch (error) {
    console.log(error)
  }

  try {
    if (geoJSONData[0].type === "FeatureCollection") {
      featureCollection = geoJSONData[0];

    } else {
      featureCollection = {
        type: "FeatureCollection",
        features: geoJSONData
      }
    }
    //featureCollection = geoJSONData;
    console.log("after inserting")
    console.log(featureCollection)
  } catch (error) {
    console.log(error)
  }
  let { featureCollection: updatedFeatureCollection, classificationMapping } = exchangeClassifier(featureCollection);

  console.log("After exchangeClassifier:")
  console.log(updatedFeatureCollection)
  //let nonames =updatedFeatureCollection.features[0].features.map(u => ({geometry: u.geometry,type: u.type,_id: u._id,properties:{classification: u.properties.classification,object_id:u.properties.object_id}}));
  //console.log(nonames)
  let geoJSONDataString = JSON.stringify(updatedFeatureCollection).trim();


  let bbox;
  try {
    console.log(featureCollection);
    bbox = turf.bbox(featureCollection);
  } catch (error) {
    console.log(error)
  }

  south = bbox[0];
  west = bbox[1];
  north = bbox[2];
  east = bbox[3];

  // Define the source and destination coordinate systems
  let sourceCRS = 'EPSG:4326';
  let destCRS = 'EPSG:3857';

  // Define the projection transformations
  try {
    proj4.defs(sourceCRS, '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs(destCRS, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');
  } catch (error) {
    console.log(error)
  }


  let convertedSouthWest;
  let convertedNorthEast;
  try {
    convertedSouthWest = proj4(sourceCRS, destCRS, [bbox[0], bbox[1]]);
    convertedNorthEast = proj4(sourceCRS, destCRS, [bbox[2], bbox[3]]);
  } catch (error) {
    console.log(error);
  }

  let convertedSouth;
  let convertedWest;
  let convertedNorth;
  let convertedEast;

  try {
    //Extract LatLng from converted object
    convertedSouth = convertedSouthWest[1];
    convertedWest = convertedSouthWest[0];
    convertedNorth = convertedNorthEast[1];
    convertedEast = convertedNorthEast[0];
  } catch (error) {
    console.log(error);
  }



  // Get values from input fields
  let nt = document.getElementById('ntInput').value;
  let mt = document.getElementById('mtInput').value;
  let name = document.getElementById('nameInput').value;


  let classID = {
    name: name,
    class: classificationMapping
  };
  try {
    // Call the /buildModel endpoint with the needed data
    let encodedGeoJSONDataString = encodeURIComponent(geoJSONDataString);
    //let RDSresponse = await fetch(`/buildModel?nt=${nt}&mt=${mt}&name=${name}&geoJSONData=${encodedGeoJSONDataString}&convertedSouth=${convertedSouth}&convertedWest=${convertedWest}&convertedNorth=${convertedNorth}&convertedEast=${convertedEast}&trainingDates=${selectedDatesTD}`);
    let requestBody = {
      nt: nt,
      mt: mt,
      name: name,
      geoJSONData: geoJSONDataString,
      convertedSouth: convertedSouth,
      convertedWest: convertedWest,
      convertedNorth: convertedNorth,
      convertedEast: convertedEast,
      trainingDates: selectedDatesTD,
    };
    console.log(geoJSONData)
    
    let RDSresponse = await fetch('/buildModel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (RDSresponse.ok) {
      fetch('/saveModel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ classIDs: classID })
      })
        .then(response => response.json())
        .then(data => {
          console.log('Data saved:', data);
          alert("Done");
        })
        .catch(error => console.error('Error saving data:', error));


    } else {
      stopRotation();
      console.error('Error in the first fetch:', response.statusText);
    }

    stopRotation();
  } catch (error) {
    stopRotation();
    alert('Error in building model');
    console.error('Error:', error.message);
  }
  stopRotation();
}

document.addEventListener("DOMContentLoaded", async function () {

  const lowCCButton = document.getElementById("leastCloudCoverage");
  const agg = document.getElementById("aggregate");
  const select = document.getElementById("selectAvailable");
  const refreshButton = document.getElementById("refreshImageBtn");
  var startingTime;
  var endTime;

  document.getElementById("leastCloudCoverage").addEventListener("click", async function () {

    let response = await fetch("/getAllPolygons");
    let featureCollections;
    let geoJSONData;
    try {
      geoJSONData = await response.json();
    } catch (error) {
      console.log(error)
    }

    try {
      if (geoJSONData[0].type === "FeatureCollection") {
        featureCollections = geoJSONData[0];

      } else {
        featureCollections = {
          type: "FeatureCollection",
          features: geoJSONData
        }
      }
    } catch (error) {
      console.log(error)
    }

    let bbox;
    try {
      bbox = turf.bbox(featureCollections);
    } catch (error) {
      console.log(error)
    }

    south = bbox[0];
    west = bbox[1];
    north = bbox[2];
    east = bbox[3];

    startingTime = selectedDatesTD[0];
    endTime = selectedDatesTD[1];

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
          selectedDatesTD[0] = formattedDate;
          selectedDatesTD[1] = formattedDate;

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

    let response = await fetch("/getAllPolygons");
    let featureCollections;
    let geoJSONData;
    try {
      geoJSONData = await response.json();
    } catch (error) {
      console.log(error)
    }

    try {
      if (geoJSONData[0].type === "FeatureCollection") {
        featureCollections = geoJSONData[0];
      } else {
        featureCollections = {
          type: "FeatureCollection",
          features: geoJSONData
        }
      }
    } catch (error) {
      console.log(error)
    }

    let bbox;
    try {
      bbox = turf.bbox(featureCollections);
    } catch (error) {
      console.log(error)
    }

    south = bbox[0];
    west = bbox[1];
    north = bbox[2];
    east = bbox[3];

    startingTime = selectedDatesTD[0];
    endTime = selectedDatesTD[1];

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

    let response = await fetch("/getAllPolygons");
    let featureCollections;
    let geoJSONData;

    try {
      geoJSONData = await response.json();
    } catch (error) {
      console.log(error)
    }

    try {
      if (geoJSONData[0].type === "FeatureCollection") {
        featureCollections = geoJSONData[0];

      } else {
        featureCollections = {
          type: "FeatureCollection",
          features: geoJSONData
        }
      }
    } catch (error) {
      console.log(error)
    }

    let bbox;
    try {
      bbox = turf.bbox(featureCollections);
    } catch (error) {
      console.log(error)
    }

    south = bbox[0];
    west = bbox[1];
    north = bbox[2];
    east = bbox[3];

    startingTime = selectedDatesTD[0];
    endTime = selectedDatesTD[1];

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
              selectedDatesTD[0] = formattedDate;
              selectedDatesTD[1] = formattedDate;
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

    selectedDatesTD[0] = startingTime;
    selectedDatesTD[1] = endTime;
    console.log(selectedDatesTD);

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


function checkInputsForEarthSearch() {
  var date1Value = $('#datepicker1').val();
  var date2Value = $('#datepicker2').val();
  // var AoIgiven = false;

  // // Check if something is drawn
  // if (drawnItems.getLayers().length > 0) {
  //   AoIgiven = true;
  // }

  // // Check if something is uploaded
  // var fileInputValue = document.getElementById('fileInput').value;
  // if (fileInputValue !== '') {
  //   AoIgiven = true;
  // }

  // Check if both Dateinputs are not empty
  if (date1Value !== '' && date2Value !== '') {

    const lowerLeftLong = west;
    const lowerLeftLat = south;
    const upperRightLong = east;
    const upperRightLat = north;

    // Url for request with filter parameters for earth search v1
    // Transform dates into earth-search v1 compatible
    // const startDate = selectedDates[0] + "T00:00:00.000Z";
    // const endDate = selectedDates[1] + "T23:59:59.999Z";
    // const apiUrl = `https://earth-search.aws.element84.com/v1/search?bbox=${lowerLeftLong},${lowerLeftLat},${upperRightLong},${upperRightLat}&datetime=${startDate}/${endDate}&collections=sentinel-2-l2a&limit=10000&sortby=properties.eo:cloud_cover`;
    // console.log(apiUrl);
    // fetch(apiUrl)

    //URL for earth-search v0 (As openeocubes uses), but discontinued
    const datetime = selectedDatesTD[0] + "/" + selectedDatesTD[1];
    const bbox = [lowerLeftLong, lowerLeftLat, upperRightLong, upperRightLat];
    const apiUrl = "https://earth-search.aws.element84.com/v0/search";

    return `${apiUrl}?datetime=${datetime}&collection=sentinel-s2-l2a-cogs&bbox=[${bbox}]&sortby=properties.eo:cloud_cover&limit=1000`;
  } else {
    alert("Please fill in all the values");
  }
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