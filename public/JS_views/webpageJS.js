"use strict"


console.log("webpageJS")
 //Add Leaflet Map 
 var map = L.map('map').setView([51.305915044598834,10.21774343122064], 6);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
 }).addTo(map);

 // Add Leaflet Draw controls
 var drawnItems = new L.FeatureGroup();
 map.addLayer(drawnItems);

 var drawControl = new L.Control.Draw({
     draw: {
         rectangle: true,
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
 // Event listener for the button click
 document.getElementById('drawButton').addEventListener('click', function() {
     // Add Leaflet Draw controls to the map
     map.addControl(drawControl);
      //Handle rectangle creation
      map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'rectangle') {
            drawnItems.addLayer(layer);
        }
        });
 });


 //Option to choose a geojson in any format and adds it to the map
 document.getElementById('uploadRectangle').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
});

document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (file) {
        // Read GeoJSON file
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const geojsonData = JSON.parse(e.target.result);
                //Using Turf.js to create bounding box for OpenEO Request
                var bbox = turf.bbox(geojsonData);
                var bboxPolygon = turf.bboxPolygon(bbox);
                L.geoJSON(geojsonData).addTo(map);
                L.geoJSON(bboxPolygon).addTo(map);
            } catch (error) {
                console.error("Error parsing or processing GeoJSON:", error);
            }
        };
        reader.readAsText(file);
    }
});

async function createDatacube(){
    console.log("Creating1");
    try {
      const con = await OpenEO.connect("http://34.209.215.214:8000")
        await con.authenticateBasic("user", "password");
        var response = await con.listCollections();
        response.collections.forEach(collection => {
          console.log(`${collection.id}: ${collection.summary}`);
        });

        var builder = await con.buildProcess();

        var datacube = builder.load_collection(
          "COPERNICUS/S1_GRD",
          {west: 16.06, south: 48.06, east: 16.65, north: 48.35},
          ["2017-03-01", "2017-04-01"],
          ["VV", "VH"]
        );

        var min = function(data) { return this.min(data); };
        //datacube = builder.reduce_dimension(datacube, min, "t");
        
        datacube = builder.save_result(datacube, "PNG", {
          red: "R",
          green: "G",
          blue: "B"
        });
      
        // Now send the processing instructions to the back-end for (synchronous) execution and save the file as result.png
        await con.downloadResult(datacube, "result.png");
      

        /*var result = builder.save_result(datacube, "GTiff");
        console.log(result)

        var layer = new GeoRasterLayer({
          result 
        });
        layer.addTo(map);

        map.fitBounds(layer.getBounds());
        */
        
      } catch (error) {
        console.log("Error connecting);", error);
      }
}
