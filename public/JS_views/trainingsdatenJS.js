
console.log("File")
function handleFile(event) {
    event.preventDefault();
  
    const formData = new FormData(document.getElementById('uploadForm'));
    const file = formData.get('file');
    console.log(file)
  
    if (file) {
      const fileName = file.name.toLowerCase();
  
      // Check if it's a GeoJSON file
      if (fileName.endsWith('.geojson')) {
        const reader = new FileReader();
        reader.onload = function () {
          const result = reader.result;
          const geojson = JSON.parse(result);
          setGeojsonToMap(geojson);
        };
        reader.readAsText(file);
      }
      // Check if it's a GeoPackage file
      else if (fileName.endsWith('.gpkg')) {
        // Assuming Leaflet is used
        const gpkgLayer = L.geoPackageTileLayer({
          geoPackageUrl: URL.createObjectURL(file),
          layerName: 'features'
        }).addTo(map);
        gpkgLayer.once('load', function () {
          map.fitBounds(gpkgLayer.getBounds());
        });
      } else {
        console.log('Invalid file format. Supported formats: GeoJSON (.geojson) or GeoPackage (.gpkg)');
      }
    } else {
      console.log('No file selected');
    }
  }
 
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

// --------------------------------------------------
// save geojson to file

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

    // Cleanup
    //URL.revokeObjectURL(downloadLink.href);
});




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

  map.getBounds(feature.getBounds());
}



// Event listener for saving GeoJSON
const saveGeoJSON = document.querySelector("#save-Button");
saveGeoJSON.addEventListener("click", (e) => {
    e.preventDefault();

    const data = drawnItems.toGeoJSON();

    if (data.features.length === 0) {
        alert("You must have some data to save it");
        return;
    }

    // Prompt the user to enter the name for the GeoJSON file
    const geojsonName = prompt("Enter the name for the GeoJSON file:");

    if (geojsonName === null || geojsonName.trim() === "") {
        alert("Please enter a valid name for the GeoJSON file.");
        return;
    }


    // Create a button to load the saved GeoJSON
    const savedDataButton = document.createElement("button");
    savedDataButton.textContent = "Load " + geojsonName;
    savedDataButton.classList.add("savedJSONButton");
    savedDataButton.dataset.geojsonName = geojsonName;

    // Add click event listener to the created button
    savedDataButton.addEventListener("click", () => {
        const savedJSON = localStorage.getItem("geojson");

        if (savedJSON) {
            const data = JSON.parse(savedJSON);

            // Clear previously added layers
            drawnItems.clearLayers();

            // Add the saved GeoJSON data as a layer to the map
           setGeojsonToMap(data);

            // Fit map bounds to the new layer
            map.fitBounds(feature.getBounds());
        } else {
            console.error("Saved GeoJSON not found");
        }
    });

    // Append the created button to the document
    document.body.appendChild(savedDataButton);

    // Save the GeoJSON data to local storage
    localStorage.setItem("geojson", JSON.stringify(data));
});


