import React, {useState} from 'react';
import GoogleMap from 'google-map-react';
import DabkaMarker from './DabkaMarker.js';
import { getCenter } from 'geolib';

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function DabkaMap(props) {
    const [markers, setMarkers] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [viewLocation, setViewLocation] = useState({});

    const [webSocketUrl] = useState(process.env.REACT_APP_DABKA_WEBSOCKET_URL);
    const [googleMapApiKey] = useState(process.env.REACT_APP_GOOGLE_MAP_API_KEY);

    const handleApiLoaded = (map, maps) => {
        console.log("handleApiLoaded");
    };

    function assignViewLocation(latitude, longitude, zoom = 15) {
        var location = {
            center: {
                lat: latitude,
                lng: longitude
            },
            zoom: zoom
        };
        setViewLocation(location);
    }

    function setInitialDisplayLocation() {
        if(!isObjectEmpty(viewLocation)) {
            return
        }

        console.log("Setting view location");

        if (markers.length) {
            console.log("Using server data for initial map location");
            //Was able to get some data from collar...
            return;
        } else if (navigator.geolocation) {
            //Lets go to the Bronx until we can get the write coordinates
            console.log("Manually setting the boogie down...");
            assignViewLocation(40.882520, -73.860340);

            //Try browser location
            console.log("Attempting to use browser location for initial view");
            navigator.geolocation.getCurrentPosition(
                function(loc) {
                    console.log(`Browser location - latitude(${loc.coords.latitude}), longitude(${loc.coords.longitude}), accuracy(${loc.coords.accuracy})`);
                    if(!markers.length) {
                        assignViewLocation(loc.coords.latitude, loc.coords.longitude);
                    } else {
                        console.log("Browser location came late, no point in setting now...");
                    }
                },
                function(error) {
                    switch(error.code)
                    {
                    case error.PERMISSION_DENIED:
                        console.log("User denied the request for location");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log("Location information is unavailable");
                        break;
                    case error.TIMEOUT:
                        console.log("The request to get user location timed out");
                        break;
                    case error.UNKNOWN_ERROR:
                    default:
                        console.log("An unknown error occurred requesting location");
                        break;
                    }
                }
            );
        }
    }

    function networkUpdates() {
        if(loaded) {
            return;
        }

        var socket = new WebSocket(webSocketUrl);

        socket.addEventListener('open', function (event) {
            let endTime = new Date();
            let startTime = new Date(endTime);
            startTime.setMinutes(endTime.getMinutes() - 120);
            let sensorRequest = {id: props.dogName, startTime: startTime.getTime(), endTime: endTime.getTime()};

            console.log("Sending..." + JSON.stringify(sensorRequest));
            socket.send(JSON.stringify(sensorRequest));
        });

        socket.addEventListener('message', function (event) {
            let data = JSON.parse(event.data);
            console.log(data);
            markers.push(data);

            const tempMarkers = Object.assign([], markers);

            let coords = [];
            for(const tempMarker of tempMarkers) {
                coords.push(tempMarker.location);
            }

            let center = getCenter(coords);
            assignViewLocation(center.latitude, center.longitude, 20);
            setMarkers(tempMarkers);
        });

        socket.addEventListener('close', function(event) {
            console.log("Socket closed, attempting to reconnect...");
            setTimeout(function() {
                networkUpdates();
            }, 2000);
        });

        socket.addEventListener('error', function(err) {
            console.error("Socket error occurred: ", err);
            socket.close();
        });

        setLoaded(true);
    }

    networkUpdates();
    setInitialDisplayLocation();
    return (
            <div style={{ height: '100vh', width: '100%' }}>
                <GoogleMap
                    bootstrapURLKeys={{ key: googleMapApiKey }}
                    yesIWantToUseGoogleMapApiInternals
                    center={viewLocation.center}
                    zoom={viewLocation.zoom}
                    onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}>
                    {markers.map((marker, index) => (
                        <DabkaMarker key={index}
                                     lat={marker.location.latitude}
                                     lng={marker.location.longitude}
                                     timestamp={marker.serverTimestamp}
                                     dogName={marker.id}
                                     primaryDog={marker.id === props.dogName}/>
                    ))}
                </GoogleMap>
            </div>
    );
}

export default DabkaMap;
