
//Funktion, welche onload alle Trainingypolygone hinzufügt
async function startingPolygonmanager() {
  try {
    const response = await fetch("/getAllPolygons");
    const stationData = await response.json();
    
    // Iterate over the array of GeoJSON objects and add them to the map
    stationData.forEach((geojson) => {
      const classification = geojson.properties.classification;
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
          <strong>Name:</strong> ${feature.properties.name}<br>
          <strong>Object ID:</strong> ${feature.properties.object_id}<br> 
          <strong>Classification:</strong> ${feature.properties.classification}
        `;
          layer.bindPopup(popupContent);
        }
      }).addTo(map);
    });

    console.log("Fetched stationdata:", stationData);
  } catch (error) {
    console.error("Error fetching GeoJSON data:", error);
  }
}

startingPolygonmanager();


// Input File is processed and shown in the Leaflet Map
function handleFile(event) {
    event.preventDefault();
  
    const formData = new FormData(document.getElementById('uploadForm'));
    const file = formData.get('file');
    console.log(file)
  
    if (file) {
      const fileName = file.name.toLowerCase();
  
      if (fileName.endsWith('.geojson')) {
        const reader = new FileReader();
        reader.onload = function () {
          const result = reader.result;
          const geojson = JSON.parse(result);
          setGeojsonToMap(geojson);
        };
        reader.readAsText(file);
      }
      else if (fileName.endsWith('.gpkg')) {
   
        const gpkgLayer = L.geoPackageTileLayer({
          geoPackageUrl: URL.createObjectURL(file),
          layerName: 'features'
        }).addTo(map);
        gpkgLayer.once('load', function () {
          map.fitBounds(gpkgLayer.getBounds());
        });
      } else {
        console.log('Invalid file format. Supported formats: GeoJSON (.geojson) and GeoPackage (.gpkg)');
      }
    } else {
      console.log('No file selected');
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
const geojsonFromLocalStorage = JSON.parse(localStorage.getItem("geojson"));

function setGeojsonToMap(geojson) {
  drawnItems.clearLayers()
  const feature = L.geoJSON(geojson, {
    onEachFeature: function (feature, layer) {
      drawnItems.addLayer(layer);
      const coordinates = feature.geometry.coordinates.toString();
      const result = coordinates.match(/[^,]+,[^,]+/g);

      layer.bindPopup(
        "<span>Coordinates:<br>" + result.join("<br>") + "</span>"
      );
    },
  }).addTo(map);

  map.fitBounds(feature.getBounds());
}



// Event listener for saving GeoJSON in Local Storage
const saveGeoJSON = document.querySelector("#save-Button");
saveGeoJSON.addEventListener("click", (e) => {
    e.preventDefault();

    const data = drawnItems.toGeoJSON();

    if (data.features.length === 0) {
        alert("You must have some data to save it");
        return;
    }

    const geojsonName = prompt("Enter the name for the GeoJSON file:");

    if (geojsonName == null || geojsonName == "") {
        alert("Please enter a valid name for the GeoJSON file.");
        return;
    }

    const savedData = localStorage.getItem("geojson") ? JSON.parse(localStorage.getItem("geojson")) : {};

    savedData[geojsonName] = data;

    localStorage.setItem("geojson", JSON.stringify(savedData));

    const savedDataButton = document.createElement("button");
    savedDataButton.textContent = "Load " + geojsonName;
    savedDataButton.classList.add("savedJSONButton");
    savedDataButton.dataset.geojsonName = geojsonName;

    savedDataButton.addEventListener("click", () => {
        const savedJSON = localStorage.getItem("geojson");
        const savedData = savedJSON ? JSON.parse(savedJSON) : {};

        if (savedData[geojsonName]) {
            const data = savedData[geojsonName];

            drawnItems.clearLayers();
            setGeojsonToMap(data); 
        } else {
            console.error("Saved GeoJSON not found");
        }
    });

    document.body.appendChild(savedDataButton);
});


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
