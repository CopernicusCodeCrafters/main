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

async function createDatacube(){
    console.log("Creating");
    try {
        var con = await OpenEO.connect("http://34.209.215.214:8000/");
        await con.authenticateBasic("username", "password");
        let datacube = compute_result({
            "process_graph": {
              "load1": {
                "process_id": "load_collection",
                "arguments": {
                  "bands": [
                    "B01",
                    "B02",
                    "B03"
                  ],
                  "id": "landsat-8-l1-c1",
                  "crs": 3262,
                  "spatial_extent": {
                    "west": 7.249267614418553,
                    "east": 7.982744173837268,
                    "south": 51.8492779296632,
                    "north": 52.04432055815272
                  },
                  "temporal_extent": [
                    "2023-11-09T00:00:00Z",
                    "2023-12-06T00:00:00Z"
                  ]
                },
                "result": true
              }
            },
            "parameters": []
          })
      } catch (error) {
        console.log("Error connecting);", error);
      }
}
