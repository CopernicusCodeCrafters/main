
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

//Funktion, welche onload alle Trainingypolygone hinzufügt
async function startingPolygonmanager() {
  try {
    const response = await fetch("/getAllPolygons");
    const stationData = await response.json();
    if (Array.isArray(stationData)) {
      // Check if stationData is an array
      stationData.forEach((geojson) => {
        const classification = geojson && geojson.properties && geojson.properties.classification;
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
            const div = document.createElement("div");
            div.innerHTML = `
            <strong>Name:</strong> ${feature.properties.name || 'N/A'}<br>
            <strong>Object ID:</strong> ${feature.properties.object_id || 'N/A'}<br> 
            <strong>Classification:</strong> ${feature.properties.classification || 'N/A'}<br>
          `;

            const button = document.createElement("button");
            button.innerHTML = "Delete";

            button.onclick = function() {
              console.log("start deleting");
              console.log(feature);
              deleteFeaturefromMapAndDB(feature, layer);
            }
            div.appendChild(button);
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

  const formData = new FormData(document.getElementById('uploadForm'));
  const file = formData.get('file');

  if (file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.geojson')) {
      const reader = new FileReader();
      reader.onload = async function () {
        const result = reader.result;
        const geojson = JSON.parse(result);

        addFeaturesNames(geojson);

      };

      reader.readAsText(file);
    }

    else if (fileName.endsWith('.gpkg')) {
      const reader = new FileReader();
      reader.onload = async function () {
        const result = reader.result;
        try {
          const fileContent = new Blob([result], { type: file.type });
          const formData = new FormData();
          formData.append('upload', fileContent, 'file');
          const response = await fetch('http://ogre.adc4gis.com/convert', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const convertedGeoJSON = await response.json();
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
  setGeojsonToMap(geojson);
  for (const feature of geojson.features) {
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

    setGeojsonToMap(geojson); // müsste es hier nicht immer das einzelne feature sein? Oder geht das nicht
    await addGeoJSONtoDB(feature);
  }
}


// Leaflet Draw is intialized
const container = L.DomUtil.create(
  "div",
  "leaflet-control "
);

let drawnItems = L.featureGroup().addTo(map);

map.addControl(
  new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false,
      },
    },
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
      },
      polyline: false,
      marker: false
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

  if (type === "circle") {
    props.radius = layer.getRadius();
  }

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
    const properties = feature.properties;
    const popupContent = `
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

const download = document.getElementById("save-Button1");

download.addEventListener("click", () => {
  // Extract GeoJSON from featureGroup
  const data = drawnItems.toGeoJSON();

  if (data.features.length === 0) {
    alert("No features in GeoJSON data");
    return;
  }

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "trainingsdaten.geojson";

  downloadLink.click();

  //URL.revokeObjectURL(downloadLink.href);
});

//Funktion, welche eine GeoJSON der Trainingsgebiete in der MongoDB speichert
const fetchButton = document.getElementById('insertTrainingsdata_button');
const addGeoJSONtoDB = async (geojson) => {
  try {
    const response = await fetch('/insert-geojson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geojson }),
    });
    const result = await response.text();
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Function to Delete a Polygon
async function deleteFeaturefromMapAndDB(feature, layer){
  map.removeLayer(layer);
  try{
    const response = await fetch ("/delete-feature", {
      method: 'DELETE',
      body: feature,
    });
    const result = await response.text();
    console.log(result);
  }catch (error) {
    console.error('An error occured: ', error)
  }
  
  // fetch(`/deletePolygon/${feature.properties.object_id}`, {
  //   method: 'DELETE',
  // })
  // .then(response => {
  //   if (!response.ok) {
  //       throw new Error(`Failed to delete polygon. Status: ${response.status}`);
  //   }
  //   console.log('Polygon deleted successfully.');
  // })
  // .catch(error => {
  //   console.error('Error deleting polygon:', error);
  //   // Optionally, you might want to add UI feedback or retry logic
  // });
}

// Function to get FeatureCollection from GeoJSON layer
function getFeatureCollectionFromLayer(geoJSONlayer) {
  // Check if the layer is a GeoJSON layer
  if (geoJSONlayer instanceof L.GeoJSON) {
    // Extract GeoJSON data from the layer
    const geoJsonData = geoJSONlayer.toGeoJSON();

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
  let numberCounter = 1;

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
  return featureCollection;
  } catch (error) {
      console.log("Error: ", error);
      alert ("error");
  }
}

async function buildModel() {
  //startRotation();
  const response = await fetch("/getAllPolygons");
  const geoJSONData = await response.json();
  let featureCollection = {
    "type" : "FeatureCollection",
    "features" : geoJSONData
  }
  featureCollection = exchangeClassifier(featureCollection);
  let geoJSONDataString = JSON.stringify(featureCollection);
  console.log(geoJSONDataString)

  const bbox = turf.bbox(featureCollection);
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
  console.log(bbox, convertedSouth);

  
  // Get values from input fields
  const nt = document.getElementById('ntInput').value;
  const mt = document.getElementById('mtInput').value;
  const name = document.getElementById('nameInput').value;

  try {
    // Call the /buildModel endpoint with the needed data
    const encodedGeoJSONDataString = encodeURIComponent(geoJSONDataString);
    const response = await fetch(`/buildModel?nt=${nt}&mt=${mt}&name=${name}&geoJSONData=${encodedGeoJSONDataString}&convertedSouth=${convertedSouth}&convertedWest=${convertedWest}&convertedNorth=${convertedNorth}&convertedEast=${convertedEast}`);
    req.session.myArray = [1, 2, 3];

    //stopRotation();

  } catch (error) {
    alert('Error' , error)
    console.error('Error:', error.message);
    //stopRotation();
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

