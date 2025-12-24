// --- Global Variables ---
var allData_Union = null;
var allData_Upazila = null;

var layerUnion = null;
var layerUpazila = null;

// 🔥 সিলেকশন ট্র্যাক করার জন্য ভেরিয়েবল
var selectedDistrictLayer = null; 
var selectedUnionLayer = null;

// --- Map Configuration ---
var mapOptions = {
    zoomControl: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    dragging: false,
    attributionControl: false,
    boxZoom: false,
    keyboard: false,
    zoomSnap: 0.1
};

var map1 = L.map('map1', mapOptions).setView([23.685, 90.3563], 7);
var map2 = L.map('map2', mapOptions).setView([23.685, 90.3563], 7);

// --- Styling Functions ---

// Map 1: Default Style
function styleDistrict(feature) {
    return {
        fillColor: '#3498db',
        weight: 1,
        opacity: 1,
        color: '#ecf0f1',
        fillOpacity: 0.8
    };
}

// Map 1: Highlight Style (Hover & Click)
function highlightStyleDistrict() {
    return {
        weight: 2,
        color: '#f1c40f', // হলুদ বর্ডার
        fillOpacity: 1
    };
}

// Map 2: Union Default Style
function styleUnion(feature) {
    return {
        fillColor: '#dff9fb',
        weight: 1,
        color: '#95afc0',
        fillOpacity: 0.9
    };
}

// Map 2: Union Highlight Style (Hover & Click)
function highlightStyleUnion() {
    return {
        weight: 2,
        color: '#e74c3c',     // লাল বর্ডার
        fillColor: '#ffeaa7', // হালকা হলুদ ফিল
        fillOpacity: 1
    };
}

function styleUpazila(feature) {
    return {
        fillColor: 'transparent',
        weight: 2.5,
        color: '#2c3e50',
        opacity: 0.8,
        fillOpacity: 0
    };
}

// --- Event Handlers for Map 1 (District) ---

function getDistrictName(properties) {
    return properties.DISTRICT || properties.District || properties.NAME_2 || properties.ADM2_EN || properties.name;
}

function onDistrictHover(e) {
    var layer = e.target;
    // যদি এই লেয়ারটি সিলেক্ট করা না থাকে, তবেই হাইলাইট ইফেক্ট দাও
    if (layer !== selectedDistrictLayer) {
        layer.setStyle(highlightStyleDistrict());
        layer.bringToFront();
    }
}

function resetDistrict(e) {
    var layer = e.target;
    // যদি এই লেয়ারটি সিলেক্ট করা লেয়ার হয়, তবে রিসেট করো না (সিলেকশন ধরে রাখো)
    if (layer !== selectedDistrictLayer) {
        layer.setStyle(styleDistrict(layer.feature));
    }
}

function onMap1Click(e) {
    var layer = e.target;
    var districtName = getDistrictName(layer.feature.properties);
    if (!districtName) return;

    // ১. আগের সিলেক্ট করা জেলা থাকলে সেটাকে নরমাল স্টাইলে ফেরত নাও
    if (selectedDistrictLayer && selectedDistrictLayer !== layer) {
        selectedDistrictLayer.setStyle(styleDistrict(selectedDistrictLayer.feature));
    }

    // ২. বর্তমান ক্লিক করা জেলাকে সিলেক্টেড হিসেবে সেট করো এবং হাইলাইট করো
    selectedDistrictLayer = layer;
    layer.setStyle(highlightStyleDistrict());
    layer.bringToFront();

    // ৩. ম্যাপ ২ লোড করো
    var placeholder = document.getElementById('map2-placeholder');
    if(placeholder) placeholder.style.display = 'none';
    loadDistrictDetails(districtName);
}

// --- Event Handlers for Map 2 (Union) ---

function onUnionHover(e) {
    var layer = e.target;
    if (layer !== selectedUnionLayer) {
        layer.setStyle(highlightStyleUnion());
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
            if(layerUpazila) layerUpazila.bringToFront();
        }
    }
}

function resetUnion(e) {
    var layer = e.target;
    if (layer !== selectedUnionLayer) {
        layerUnion.resetStyle(layer); // ডিফল্ট স্টাইলে ফেরত
        if(layerUpazila) layerUpazila.bringToFront();
    }
}

function onUnionClick(e) {
    var layer = e.target;
    var props = layer.feature.properties;

    // ১. আগের সিলেকশন রিসেট
    if (selectedUnionLayer && selectedUnionLayer !== layer) {
        layerUnion.resetStyle(selectedUnionLayer);
    }

    // ২. নতুন সিলেকশন সেট
    selectedUnionLayer = layer;
    layer.setStyle(highlightStyleUnion());
    layer.bringToFront();
    if(layerUpazila) layerUpazila.bringToFront();

    // ৩. ইনফো বক্স আপডেট
    var html = `
        <div class="detail-item"><span class="label">Division</span> <b>${props.DIVISION || 'N/A'}</b></div>
        <div class="detail-item"><span class="label">District</span> <b>${props.DISTRICT || 'N/A'}</b></div>
        <div class="detail-item"><span class="label">Upazila</span> <b>${props.UPAZILLA || 'N/A'}</b></div>
        <div class="detail-item"><span class="label">Union</span> <b>${props.UNION || props.NAME_4 || 'N/A'}</b></div>
    `;
    document.getElementById('details-content').innerHTML = html;
}


// --- Main Logic: Load Map 2 ---
function loadDistrictDetails(districtName) {
    if (layerUnion) map2.removeLayer(layerUnion);
    if (layerUpazila) map2.removeLayer(layerUpazila);
    
    // ম্যাপ ২ চেঞ্জ হলে সিলেকশন ভেরিয়েবল রিসেট করতে হবে
    selectedUnionLayer = null;

    var targetName = districtName.trim().toLowerCase();

    var filteredUnions = allData_Union.features.filter(f => {
        var dName = getDistrictName(f.properties);
        return dName && dName.trim().toLowerCase() === targetName;
    });

    var filteredUpazilas = allData_Upazila.features.filter(f => {
        var dName = getDistrictName(f.properties);
        return dName && dName.trim().toLowerCase() === targetName;
    });

    if (filteredUnions.length === 0) {
        alert("No data for " + districtName);
        return;
    }

    // Union Layer (No Tooltip, No Popup)
    layerUnion = L.geoJSON(filteredUnions, {
        style: styleUnion,
        onEachFeature: function(feature, layer) {
            layer.on({
                click: onUnionClick,
                mouseover: onUnionHover,
                mouseout: resetUnion
            });
            // 🔥 রিকোয়ারমেন্ট: ম্যাপ ২-এ হোভার/ক্লিকে কোনো টেক্সট দেখাবে না
            // তাই bindTooltip বা bindPopup বাদ দেওয়া হলো।
        }
    }).addTo(map2);

    // Upazila Layer
    layerUpazila = L.geoJSON(filteredUpazilas, {
        style: styleUpazila,
        interactive: false 
    }).addTo(map2);

    map2.fitBounds(layerUnion.getBounds());
}

// --- স্মার্ট ডেটা লোডিং ---

// ১. প্রথমে শুধু District ডাটা লোড হবে (দ্রুত দেখানোর জন্য)
console.log("Fetching District Data...");

fetch('data/District_all_bangladesh01.geojson')
    .then(res => res.json())
    .then(districtData => {
        
        // ম্যাপ ১ রেন্ডার করা
        var districtLayer = L.geoJSON(districtData, {
            style: styleDistrict,
            onEachFeature: function(feature, layer) {
                layer.on({
                    click: onMap1Click,
                    mouseover: onDistrictHover,
                    mouseout: resetDistrict
                });
                var dName = getDistrictName(feature.properties);
                layer.bindTooltip(dName, { sticky: true, direction: 'top', className: 'district-tooltip' });
            }
        }).addTo(map1);

        map1.fitBounds(districtLayer.getBounds());

        // 🔥 ম্যাপ ১ রেডি হয়ে গেলে লোডার বন্ধ করে দিন!
        document.getElementById('loader').style.display = 'none';

        // ২. এবার ব্যাকগ্রাউন্ডে ভারী ফাইলগুলো লোড শুরু করুন
        loadHeavyData(); 
    })
    .catch(err => {
        console.error(err);
        document.getElementById('loader').innerHTML = "Error Loading Map!";
    });


// ভারী ডাটা লোড করার ফাংশন (ব্যাকগ্রাউন্ডে চলবে)
function loadHeavyData() {
    console.log("Loading heavy data in background...");
    
    Promise.all([
        fetch('data/Upazilla_all_bangladesh.geojson').then(res => res.json()),
        fetch('data/All_bangladesh01.geojson').then(res => res.json())
    ]).then(([upazilaData, unionData]) => {
        
        allData_Upazila = upazilaData;
        allData_Union = unionData;
        console.log("Heavy data loaded & ready!");

    }).catch(err => console.error("Background loading failed:", err));
}

// ৩. ক্লিক হ্যান্ডলারে ছোট একটি চেক বসাতে হবে
// (যদি ইউজার ব্যাকগ্রাউন্ড লোড হওয়ার আগেই ক্লিক করে ফেলে)
function onMap1Click(e) {
    // চেক: ভারী ডাটা কি এসেছে?
    if (!allData_Union || !allData_Upazila) {
        alert("Detailed map is still loading... please wait 2 seconds and try again.");
        return; 
    }

    var layer = e.target;
    var districtName = getDistrictName(layer.feature.properties);
    if (!districtName) return;

    // ... বাকি কোড আগের মতোই ...
    if (selectedDistrictLayer && selectedDistrictLayer !== layer) {
        selectedDistrictLayer.setStyle(styleDistrict(selectedDistrictLayer.feature));
    }
    selectedDistrictLayer = layer;
    layer.setStyle(highlightStyleDistrict());
    layer.bringToFront();

    var placeholder = document.getElementById('map2-placeholder');
    if(placeholder) placeholder.style.display = 'none';
    
    loadDistrictDetails(districtName);
}