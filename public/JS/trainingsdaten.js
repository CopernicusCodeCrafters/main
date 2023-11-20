function handleFile(event) {
  console.log("test44444")
    event.preventDefault();

    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (file) {
      const fileName = file.name.toLowerCase();

      // Check if it's a GeoJSON file
      if (fileName.endsWith('.geojson')) {
        const reader = new FileReader();

        reader.onload = function (e) {
          const geoJsonData = JSON.parse(e.target.result);
          setGeojsonToMap(geoJsonData);
        };

        reader.readAsText(file);
      }
      // Check if it's a GeoPackage file
      else if (fileName.endsWith('.gpkg')) {
        const gpkgLayer = L.geoPackageTileLayer({
            geoPackageUrl: file,
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
  function setGeojsonToMap(geojson) {
    const feature = L.geoJSON(geojson, {
      style: function (feature) {
        return {
          color: "red",
          weight: 2,
        };
      },
      pointToLayer: (feature, latlng) => {
        if (feature.properties.type === "circle") {
          return new L.circle(latlng, {
            radius: feature.properties.radius,
          });
        } else if (feature.properties.type === "circlemarker") {
          return new L.circleMarker(latlng, {
            radius: 10,
          });
        } else {
          return new L.Marker(latlng);
        }
      },
      onEachFeature: function (feature, layer) {
        drawnItems.addLayer(layer);
        const coordinates = feature.geometry.coordinates.toString();
        const result = coordinates.match(/[^,]+,[^,]+/g);
  
        layer.bindPopup(
          "<span>Coordinates:<br>" + result.join("<br>") + "</span>"
        );
      },
    }).addTo(map);
  
    map.flyToBounds(feature.getBounds());
  }

  function openFile(event) {
    const input = event.target;
  
    const reader = new FileReader();
    reader.onload = function () {
      const result = reader.result;
      const geojson = JSON.parse(result);
  
      Notiflix.Notify.info("The data has been loaded from the file");
  
      setGeojsonToMap(geojson);
    };
    reader.readAsText(input.files[0]);
  }