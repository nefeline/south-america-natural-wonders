var initMap= function(){

// Database
var Database = [
  {
    name: "Beagle Channel - Argentina",
    lat: -54.889892, lng: -67.834897,
    imgSrc: "ushuaia",
    description: "Beagle Channel is a strait in Tierra del Fuego Archipelago on the extreme southern tip of South America partly in Chile and partly in Argentina. (Font: Wikipedia)"
  },
  {
    name: "El Chaltén - Argentina",
    lat: -49.331494, lng: -72.886325,
    imgSrc: "elchalten",
    description: "El Chaltén is a small mountain village in Argentina. It is located within the Los Glaciares National Park and it is a popular base for hiking numerous trails. For those reasons, El Chaltén was named Argentina's Trekking Capital. (Font: Wikipedia)"
  },
  {
    name: "Geyser Del Tatio - Chile",
    lat: -22.33485, lng: -68.012976,
    imgSrc: "geysersdeltatio",
    description: "El Tatio is a geyser field located within the Andes Mountains of northern Chile. El Tatio has over 80 active geysers, making it the largest geyser field in the southern hemisphere and the third largest in the world. (Font: Wikipedia)"
  },
  {
    name: "Iguazu Falls - Brazil",
    lat: -25.613348, lng: -54.479599,
    imgSrc: "iguazufalls",
    description: "Iguazu Falls, are waterfalls of the Iguazu River on the border of the Argentine province of Misiones and the Brazilian state of Paraná. They are the largest waterfalls system in the world. (Font: Wikipedia)"
  },
  {
    name: "Salar de Tara - Chile",
    lat: -23.064427, lng: -67.248005,
    imgSrc: "salardetara",
    description: "Los Flamencos National Reserve is a nature reserve located in the commune of San Pedro de Atacama, Chile. Salar de Tara is one section of this Reserve. (Font: Wikipedia)"
  },
  {
    name: "Torres del Paine - Chile",
    lat: -50.942326, lng: -73.406788,
    imgSrc: "torresdelpaine",
    description: "Torres del Paine National Park is a national park encompassing mountains, glaciers, lakes, and rivers in southern Chilean Patagonia. (Font: Wikipedia)"
  },
  {
    name: "Uyuni Salt Flat - Bolivia",
    lat: -20.133777, lng: -67.489134,
    imgSrc: "uyuni",
    description: "Salar de Uyuni is the world's largest salt flat. It is located in southwest Bolivia, near the crest of the Andes. The Salar was formed as a result of transformations between several prehistoric lakes. (Font: Wikipedia)"
  }
];

var Place = function(data) {
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.imgSrc = data.imgSrc;
    this.description = data.description;
    this.visible = ko.observable(true);
};

var AppModel = function() {
    var self = this;
    this.visible = ko.observable(true);
    // Get the value from search field.
    self.FilterTxt = ko.observable("");
    // Set location list observable array from Database
    self.placeList = ko.observableArray([]);
    // Make place object for each item in location list then push to observable array.
    Database.forEach(function(item){
        this.placeList.push(new Place(item));
    }, this);

    this.currentPlace = ko.observable(this.placeList()[0]);

    // Controls what happens when user clicks an item on the list.
    this.setPlace = function(clickedPlace) {
        // Set current location to which user clicked.
        self.currentPlace(clickedPlace);
        // Find index of the clicked location and store for use in activation of marker.
        var index = self.placeList().indexOf(clickedPlace);
        // Prepare content for Google Maps infowindow
        self.updateContent(clickedPlace);
        // Invoke function for instagram API call.
        self.instagram(clickedPlace);
        // Activate the selected marker to change icon.
        self.activateMarker(self.placeList()[index].marker, self, self.infowindow, self.map)();
    };

    // Initialize Google Maps
    this.map = new google.maps.Map(document.getElementById("map"), {
            center: {lat: -25.613348, lng: -54.479599},
            zoom: 3,
            mapTypeControl: false,
            streetViewControl: false
        });

    // Initialize infowindow
    this.infowindow = new google.maps.InfoWindow({
        maxWidth: 500
    });

    // Render all markers with data from the data model.
    this.renderMarkers(self);

    // Add event listener for map click event (when user clicks on other areas of the map beside of markers)
    google.maps.event.addListener(self.map, "click", function(event) {

        // Deactivate all markers
        self.deactivateMarkers();

        // Every click close all indowindows
        self.infowindow.close();
    });

    // Filter location name with value from search field.
    self.filteredItems = ko.computed(function() {

        var filter = self.FilterTxt().toLowerCase();
        if (!filter) {
            ko.utils.arrayFilter(self.placeList(), function(item) {
                item.visible(true);
                item.marker.setVisible(true);
            });
            return self.placeList();
        } else {
            self.infowindow.close();
            return ko.utils.arrayFilter(self.placeList(), function(item) {

                self.deactivateMarkers();

                // return true if found the typed keyword, false if not found.
                if (item.name.toLowerCase().indexOf(filter) >= 0) {
                    item.visible(true);
                    item.marker.setVisible(true);
                    return true;
                } else {
                    item.visible(false);
                    item.marker.setVisible(false);
                    return false;
                }
            });
        }
    });
};

// Render all markers
AppModel.prototype.renderMarkers = function(arrayInput) {

    var infowindow = this.infowindow;
    var context = this;
    var placeToShow = arrayInput.placeList();

    // Create new marker for each place in array and push to markers array
    for (var i = 0, len = placeToShow.length; i < len; i ++) {

        var location = {lat: placeToShow[i].lat, lng: placeToShow[i].lng};
        var marker = new google.maps.Marker({
                position: location,
                map: this.map,
                animation: google.maps.Animation.DROP,
                icon: "img/map-pin.png"
        });

        this.placeList()[i].marker = marker;
        marker.setMap(this.map);
        // add event listener for click event to the newly created marker
        marker.addListener("click", this.activateMarker(marker, context, infowindow, i));
    }
};

// Set all marker icons to default.
AppModel.prototype.deactivateMarkers = function() {
    var places = this.placeList();

    for (var i = 0; i < places.length; i ++) {
        places[i].marker.setIcon("img/map-pin.png");
    }
    this.map.setZoom(3);
    this.map.setCenter({lat: -25.613348, lng: -54.479599});
};

// Set the target marker to change icon and open infowindow
// Call from user click on the menu list or click on the marker
AppModel.prototype.activateMarker = function(marker, context, infowindow, index) {
    return function() {
        // check if have an index. If have an index mean request come from click on the marker event
        if (!isNaN(index)) {
            var place = context.filteredItems()[index];
            context.updateContent(place);
            context.instagram(place);
        }
        // close opened infowindow
        infowindow.close();
        // deactivate all markers
        context.deactivateMarkers();

        // Open targeted infowindow and change its icon.
        infowindow.open(context.map, marker);
        marker.setIcon("img/map-pin-select.png");
        context.map.setZoom(5);
        context.map.setCenter(marker.getPosition());
    };
};

// Connects to Instagram API
AppModel.prototype.instagram = function(place) {
    var self = this;
    var token = "220594605.dc5be36.46fb27425a8c4345999674601f2315dc",
    num_photos = 1;
    $.ajax({
        url: "https://api.instagram.com/v1/tags/" + place.imgSrc + "/media/recent",
        dataType: "jsonp",
        type: "GET",
        data: {access_token: token, count: num_photos}
        }).done(function (data){
            //Replaced for in loop with forEach loop.
            data.data.forEach(function(x){
                var photoURL = "<img src='"+x.images.standard_resolution.url+"'>";
                self.updateContent(place, photoURL);
            });
        }).fail(function (jqXHR, textStatus) {
            window.alert("Unable to load the Instagram photos, please try again later.");
        });
};

// Change the content of infowindow
AppModel.prototype.updateContent = function(place, photoURL){
    var html = '<div class="info-content">' +
        '<h3>' + place.name + '</h3>' +
        '<div class="instagram">'+ photoURL +'</div>' +
        '<div class="by"><a href="https://www.instagram.com/patriciahill" target="_blank">Instagram - By Patricia Hillebrandt</a></div>' +
        '<p>' + place.description + '</p>' + '</div>';
    this.infowindow.setContent(html);
};

ko.applyBindings(new AppModel());
}

var googleError = function(){
    window.alert("Unable to load the Map, please try again later.");
}