window.cebuCityLocation = null;
window.cityBounds = null;
window.markers = [];
window.googleMap = null
window.currentLoc = null;
window.directionsRenderer = null;
const ctx = document.getElementById('myChart');
let rectangle;
let map;
let infoWindow;


function findCebuBounds() {
  const geocoder = new google.maps.Geocoder()
  const request = {
    address: 'Cebu City',
    location: window.cebuCityLocation
  }
  return geocoder.geocode(request)
}

function findNearbyRestos(category) {
  var query = {
    query: 'restaurant near Cebu City',
    bounds: window.cityBounds
  }
  if (category != null) {
    query['query'] = category + ' near Cebu City'
  }
  var service = new google.maps.places.PlacesService(window.googleMap);
  var allResults = []
  return new Promise(function (resolved) {
    service.textSearch(query, function (results, status, pagination) {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        allResults = allResults.concat(results)
        if (pagination && pagination.hasNextPage) {
          pagination.nextPage()
        } else {
          resolved(allResults)
        }
      }
    });
  })

}

function filterByCategory(query) {

  findNearbyRestos(query)
    .then(
      function (result) {
        removeAllMarkers()
        addAllToMarkers(result)
      }
    )
}

function removeAllMarkers() {
  for (let marker of window.markers) {
    marker.setMap(null)
  }
}

function infowindowContent(place) {
  return `
  <div>
    <h2>${place.name}</h2>
    <p>${place.formatted_address}</p>
    <p>Number of Customer w/Review : ${place.user_ratings_total}</p>

    <a href="#inline" class="navigation-btn btn btn-primary" data-lat=${place.geometry.location.lat()} data-lng=${place.geometry.location.lng()}>Navigate</a>
  </div>
  `
}


function renderDirections(origin, destination) {
  const request = {
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING'
  }
  var directionsService = new google.maps.DirectionsService();
  window.directionsRenderer.setMap(window.googleMap)
  directionsService.route(request, function (result, status) {
    if (status == 'OK') {
      window.directionsRenderer.setDirections(result);
    }
  });
}

function addAllToMarkers(places) {
  window.markers = []
  for (let place of places) {
    let marker = new google.maps.Marker({ position: place.geometry.location, map: window.googleMap, title: place.name })

    marker.addListener('click', () => {
      let infowindow = new google.maps.InfoWindow({
        content: infowindowContent(place),
        arial_label: place.name
      });
      window.googleMap.setCenter(marker.getPosition())
      infowindow.open({ anchor: marker, map: window.googleMap })
    })
    window.markers.push(marker)
  }
}

function getCurrenLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.currentLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
      },
      () => {
      }
    );
  }
}

function resetNavigation() {
  window.directionsRenderer.setMap(null)
  window.googleMap.setZoom(10)
  window.googleMap.setCenter(cebuCityLocation)
}

function initAllRestos() {
  findCebuBounds()
    .then(
      function (result) {
        window.cityBounds = result.results[0].geometry.bounds
        return findNearbyRestos()
      }
    ).then(
      function (results) {
        addAllToMarkers(results)
      }
    )
}

function initGoogleMap(){
  window.googleMap.setZoom(10)
  window.googleMap.setCenter(cebuCityLocation)
}

function initMap() {
  window.directionsRenderer = new google.maps.DirectionsRenderer();
  getCurrenLocation()
  window.cebuCityLocation = new google.maps.LatLng(10.3156992, 123.8854366);
  window.googleMap = new google.maps.Map(document.getElementById("map"));

  initGoogleMap();
  initAllRestos();
  $('#add-rectangle').on('click', function () { addRectangle()   })
  $('#remove-rectangle').on('click', function () { removeRectangle()   })

  $('button.resto-type-filter').on('click', function () { filterByCategory($(this).text())   })
  $('a.resto-type-filter').on('click', function () { filterByCategory($(this).text())   })
  
  $('#reset-navigation').on('click', resetNavigation)
  $(document).on('click', 'a.navigation-btn', (e) => {
    let elem = $(e.target)
    let destination = new google.maps.LatLng(elem.data('lat'), elem.data('lng'))
    renderDirections(window.currentLoc, destination)
  })

}

function addRectangle(){
  // init bounds 
  const bounds = {
    north: 10.3156992,
    south: 10.20,
    east: 123.8854366,
    west: 123.80,
  };

  // Define the rectangle and set its editable property to true.
  rectangle = new google.maps.Rectangle({
    bounds: bounds,
    editable: true,
    draggable: true,
  });
  rectangle.setMap(window.googleMap);
  // Add an event listener on the rectangle.
  rectangle.addListener("bounds_changed", showNewRect);
  // Define an info window on the map.
  infoWindow = new google.maps.InfoWindow();
}

function removeRectangle(){
  rectangle.setMap(null);
}

function countMarkers(ne,sw){
  var count = 0;
  for (let marker of window.markers) {
    if ((ne.lat() > marker.position.lat() && sw.lat() < marker.position.lat()) &&
       (ne.lng() > marker.position.lng() && sw.lng() < marker.position.lng()))
    {
      count += 1
    }
  }
  return count
}

function showNewRect() {
  const ne = rectangle.getBounds().getNorthEast();
  const sw = rectangle.getBounds().getSouthWest();
  
  const contentString =
    "<b>Rectangle moved.</b><br>" +
    "Restaurant Count: " +
    countMarkers(ne,sw);

  // Set the info window's content and position.
  infoWindow.setContent(contentString);
  infoWindow.setPosition(ne);
  infoWindow.open(window.googleMap);
}


new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
      axis: 'y',
      label: '# of Votes',
      data: [12, 50, 3, 5, 2, 3],
      borderWidth: 1
    }]
  },
  options: {
        indexAxis: 'y',
  }
});

window.initMap = initMap;
