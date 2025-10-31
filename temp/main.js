var destinationLatitude,
    destinationLongitude,
    destinationName,
    destinationAddress,
    currentLatitude,
    currentLongitude,
    angle,
    distance,
    waySelected,
    orientationAccepted;

var startButtonDiv = document.getElementById("startWayButton");
var distanceDiv = document.getElementById("distance");
var removeDestinationButtonDiv = document.getElementById("stopWayButton");
var needleDiv = document.getElementById("needle");
var destinationNameDiv = document.getElementById("destinationName");
var searchInputDiv = document.getElementById('search-input');

const isIOS = (
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/)
);

// Gets called when phone position changes
function positionHandler(position) {
    setCurrentCoords(position.coords.latitude, position.coords.longitude);
    console.log(position);
}

// Gets called when phone orientation changes
function orientationHandler(event) {
    if (destinationLatitude) {
        // At some point need to make sure it works on iOS too
        var alpha = event.webkitCompassHeading || Math.abs(event.alpha - 360);
        
        var needleAngle = angle - alpha;
        
        needleDiv.style.transform = "rotate(" + needleAngle.toFixed(2) + "deg)";
    }
}

function setDestination() {
    var autocomplete = new google.maps.places.Autocomplete(searchInputDiv);
    autocomplete.setFields(["place_id", "geometry", "name"]);
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace();
        console.log(place);
        
        setDestinationCoords(place.geometry.location.lat(), place.geometry.location.lng());
        
        searchInputDiv.style.opacity = "0";
        setTimeout(function() {
            searchInputDiv.style.display = "none";
        }, 1000);
        
        destinationName = place.name;
        destinationNameDiv.innerHTML = destinationName;
        destinationNameDiv.style.display = "block";
        destinationNameDiv.style.opacity = "1";

        removeDestinationButtonDiv.style.display = "block";
        removeDestinationButtonDiv.style.opacity = "1";
    });

}

function stopWay() {
    // #destinationName:after onclick

    searchInputDiv.style.display = "block";
    searchInputDiv.value = "";

    destinationNameDiv.style.display = "none";
    distanceDiv.style.display = "none";
    removeDestinationButtonDiv.style.display = "none";
    
    searchInputDiv.style.display = "block";
    searchInputDiv.style.opacity = "1";

    destinationLatitude = undefined;
    destinationLongitude = undefined;
    destinationName = undefined;
}

function setDestinationCoords(latitude, longitude) {
    destinationLatitude = latitude;
    destinationLongitude = longitude;
    
    calculateAngle();
    calculateDistance();

    if (currentLatitude !== undefined) {
        distanceDiv.style.display = "block";
        startButtonDiv.style.display = "none";
        removeDestinationButtonDiv.style.display = "block";
    }
}

function setCurrentCoords(latitude, longitude) {
    currentLatitude = latitude;
    currentLongitude = longitude;

    calculateAngle();
    calculateDistance();

    if (destinationLatitude !== undefined) {
        distanceDiv.style.display = "block";
        removeDestinationButtonDiv.style.display = "block";
        startButtonDiv.style.display = "none";
    }
}

function permissionsAccepted(){
    // Asks permission to the user for getting their location, and start tracking them, gives an alert if refused
    console.log("askPermissionLocation called");

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
            // create cookie saying they've given permission
            // Therefore hiding the Ask permission button IF orientation permission is given too
            navigator.geolocation.watchPosition(positionHandler);	
        } else if (result.state === "prompt") {
            console.log("Prompting...");
        } else {
            alert("Well... we do need your location to be able to tell you where to go 😅");
        }
    });

    // Asks permission to the user for getting their phone orientation, and start tracking them, gives an alert if refused
    console.log("askPermissionOrientation called");
    
    // Adds an eventListener for the device orientation event
    if (!isIOS) {
        console.log("Not iOS")
        window.addEventListener("deviceorientationabsolute", orientationHandler, true);
    } else {
        console.log("Webkit/iOS")
        DeviceOrientationEvent.requestPermission()
            .then((response) => {
                if (response === "granted") {
                    window.addEventListener("deviceorientation", orientationHandler, true);
                } else {
                    alert("Device orientation has to be allowed!");
                }
            })
            .catch(() => alert("Device orientation is not supported"));
    }
}

function startWay() {
    navigator.geolocation.watchPosition(positionHandler, () => { alert("Mmmh, not sure where you are... have you allowed us to have access?")});	
    
    if (orientationAccepted == false ) {
        // Adds an eventListener for the device orientation event -> called when the phone rotates
        if (!isIOS) {
            // console.log("Not iOS")
            window.addEventListener("deviceorientationabsolute", orientationHandler, true);
        } else {
            console.log("Webkit/iOS");
            DeviceOrientationEvent.requestPermission()
                .then((response) => {
                    if (response === "granted") {
                        window.addEventListener("deviceorientation", orientationHandler, true);
                    } else {
                        alert("Device orientation has to be allowed!");
                    }
                })
                .catch(() => alert("Device orientation is not supported"));
        }
    }

    startButtonDiv.style.display = "none";
    needleDiv.style.display = "block";
    
    orientationAccepted = true;

    console.log(currentLatitude + " " + destinationLatitude);
}


/////////////////////////////////////////////////////
/////////////////// CALCULATIONS ////////////////////
/////////////////////////////////////////////////////

// Calculates the distance between my coordinates and the destination coordinates, and updates the global var
function calculateDistance() {
    var R = 6371e3; // radius of Earth in meters
    var phi1 = currentLatitude * Math.PI/180;
    var phi2 = destinationLatitude * Math.PI/180;
    var deltaPhi = (destinationLatitude - currentLatitude) * Math.PI/180;
    var deltaLambda = (destinationLongitude - currentLongitude) * Math.PI/180;
    var a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Calculate the distance and assign it to the global "distance" variable
    distance = R * c;

    console.log(distance);

    if (distance < 500) {
        // From 0m to 500m, show distance in meters, in steps of 5m
        distance = `${Math.round(distance / 5) * 5} m away`;
    } else if (500 <= distance < 1000) {
        // From 500m up to 1km, show distance in meters, in steps of 10m
        distance = `${Math.round(distance / 10) * 10} m away`;
    } else if (100 <= distance < 2000) {
        // From 1km to 2km, show distance in meters, in steps of 100m
        distance = `${Math.round(distance / 100) * 100} m away`;
    } else {
        // From 2km upwards, show distance in km
        distance = `${(distance / 1000).toFixed(0)} km away`;
    }
    
    distanceDiv.innerHTML = distance;
}

// Calculates the angle between my coordinates and the destination coordinates, and updates the global var
function calculateAngle() {
    var deltaLatitude = destinationLatitude - currentLatitude;
    var deltaLongitude = destinationLongitude - currentLongitude;
    
    // Calculate the angle and assign it to the global "angle" variable
    angle = Math.atan2(deltaLongitude, deltaLatitude) * 180 / Math.PI;
    
    // document.getElementById("angle").innerHTML = "Angle: " + angle.toFixed(2) + " degrees";
    // needleDiv.style.transform = "rotate(" + angle.toFixed(2) + "deg)";
}

// Generates random coordinates to test, assigns them to the destinationcoordinates. The "/ 10" ensures it stays within a few km from where you are located.
function randomCoordinates() {
    setDestinationCoords(currentLatitude + (Math.random() - 0.5) / 10, currentLongitude + (Math.random() - 0.5) / 10);
}