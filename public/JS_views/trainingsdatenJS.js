
 //Add Leaflet Map 
 var map = L.map('map').setView([51.96269732749698,7.625025563711631], 13);
 // Define base layers
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
 });
var googleSatLayer =  L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    attribution: 'Google Satellite',
    maxZoom: 20,
    minZoom:2,
    subdomains:['mt0','mt1','mt2','mt3']
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
            color='darkgreen';
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
            const popupContent =`
            <strong>Name:</strong> ${feature.properties.name || 'N/A'}<br>
            <strong>Object ID:</strong> ${feature.properties.object_id || 'N/A'}<br> 
            <strong>Classification:</strong> ${feature.properties.classification || 'N/A'}
          `;
            layer.bindPopup(popupContent);
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


  async function addFeaturesNames(geojson){
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

      setGeojsonToMap(geojson);
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
      polyline : false,
      marker : false
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
    const layer = L.geoJSON(feature, {
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

async function buildModel() {
  // Get values from input fields
  const nt = document.getElementById('ntInput').value;
  const mt = document.getElementById('mtInput').value;
  const name = document.getElementById('nameInput').value;

  try {
      // Call the /buildModel endpoint with the extracted data
      const response = await fetch(`/buildModel?nt=${nt}&mt=${mt}&name=${name}`);

  } catch (error) {
      console.error('Error:', error.message);
  }
}

