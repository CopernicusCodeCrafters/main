
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

map.on(L.Draw.Event.CREATED, function (event) {
  let layer = event.layer;
  let feature = (layer.feature = layer.feature || {});
  let type = event.layerType;

  feature.type = feature.type || "Feature";
  let props = (feature.properties = feature.properties || {});

  props.type = type;

  if (type === "circle") {
    props.radius = layer.getRadius();
  }

  drawnItems.addLayer(layer);
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


const geojson = {
  "type": "Feature",
  "properties": {
    "type": "rectangle"},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [
          2.551218,
          50.781539
        ],
        [
          2.551218,
          52.592531
        ],
        [
          12.304037,
          52.592531
        ],
        [
          12.304037,
          50.781539
        ],
        [
          2.551218,
          50.781539
        ]
      ]
    ]
  }
}

const fetchButton = document.getElementById('insertTrainingsdata_button');

function addGeoJSONtoDB() {
  fetchButton.addEventListener("click", async () => {
    console.log("Funktion startet")
    try {
      const response = await fetch('/insert-geojson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geojson }), // Remove the outer JSON.stringify
      });
      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });
}

addGeoJSONtoDB(); // Call the function to set up the event listener on page load
