/*globals define*/
define(function(require, exports, module) {

    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var RenderController = require('famous/views/RenderController');
    var Surface = require('famous/core/Surface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transitionable     = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var Matrix = require('famous/core/Transform');
    var RenderNode         = require('famous/core/RenderNode')

    var MapView = require('famous-map/MapView');

    var Utility = require('famous/utilities/Utility');
    var Timer = require('famous/utilities/Timer');

    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var NavigationBar = require('famous/widgets/NavigationBar');
    var GridLayout = require("famous/views/GridLayout");

    // Side menu of list of cars
    var FleetSideMenuView      = require('views/Fleet/FleetSideMenu');
    var StandardHeader = require('views/common/StandardHeader');

    // Models
    var CarModel      = require('models/car');
    var FleetModel      = require('models/fleet');

    // var leaflet = require('lib2/leaflet/leaflet');
    // require('lib2/leaflet/leaflet.label');
    require('lib2/leaflet/tile.stamen');

    var MapView = require('famous-map/MapView');
    var MapModifier = require('famous-map/MapModifier');
    var MapStateModifier = require('famous-map/MapStateModifier');
    var MapUtility = require('famous-map/MapUtility');
    var MapPositionTransitionable = require('famous-map/MapPositionTransitionable');
    var MapTransition = require('famous-map/MapTransition');

    // Extras
    var Utils    = require('utils');
    var _ = require('underscore');

    var EventHandler = require('famous/core/EventHandler');

    function PageView(options) {
        var that = this;
        View.apply(this, arguments);
        this.options = options;

        // Create the mainTransforms for shifting the entire view over on menu open
        this.mainTransform = new Modifier({
            transform: Transform.identity
        });
        this.mainTransitionable = new Transitionable(0);
        this.mainTransform.transformFrom(function() {
            return Transform.translate(this.mainTransitionable.get(), 0, Utils.usePlane('content',0,true));
        }.bind(this));

        // create the layout
        this.layout = new HeaderFooterLayout({
            headerSize: App.Defaults.Header.size,
            footerSize: 50
        });

        // Header
        this.createHeader();

        // create the map/content area
        this.contentController = new RenderController();

        // Create Content
        this.createContent();

        // Create Footer
        this.createFooter();

        // Attach layout to the RenderTree
        this.add(this.layout);
        // this.add(this.sideView);


        // Events

        // Redraw the map when I move
        App.Events.on('updated_user_current_location', this.map_update_person.bind(this));

        // Map tapped/clicked
        this.on('mapclick', this.map_clicked);

        // Models

        // Car list
        // - for Fleet Map
        this.collection = new CarModel.CarCollection();
        this.collection.on('sync', this.display_map, this);
        this.collection.on('sync', function(){
            // this.header.navBar.back.setContent(this.collection.length  + ' car' + (this.collection.length === 1 ? '':'s'));
        }, this);
        this.collection.on("change", function(model){

            if(_.intersection(Object.keys(model.changed), ['name','color']).length){
                console.error('INTERSECTED');
                console.log(model.get('name'));
                // that.render_map(model);
            } else {
                that.map_update_car(model);
            }

        }, this);
        this.doInitialFetch = (function(){
            this.collection.fetch({
                prefill: true,
                exhaust: function(){
                    // Toast
                    Utils.Notification.Toast('Network Unavailable!');

                    // Re-fetch the data
                    if(App.Cache.questioned_once !== true){
                        App.Cache.questioned_once = true;
                        if(App.Data.usePg && confirm('Unable to find network connection. Try again?') === true){
                            that.doInitialFetch();
                        }
                    }

                }
            });
        }).bind(this);
        this.doInitialFetch();

        // Render the displays
        // - the correct one will be shown each time display_map is called
        this.display_map();

        // Fleet day summary
        // - miles driven today
        this.model = new FleetModel.Fleet({
            _id: "fleetStats"
        });
        this.model.fetchDaySummary({prefill: true});
        this.model.populated().then(function(){
            // console.log(that.model);
            that.update_quickstats(that.model);
            that.model.on('change', that.update_quickstats, that);
        });

        // Fleet info (alerts, errors, etc.)
        this.model_info = new FleetModel.Fleet({
            _id: "fleetInfo"
        });
        this.model_info.fetchInfo({prefill: true});
        this.model_info.populated().then(function(){
            that.update_counts(that.model_info);
            that.model_info.on('change', that.update_counts, that);
        });

    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;

    PageView.prototype.refreshData = function() {
        // Utils.Notification.Toast('Refreshing');
        try {
            this.model.fetchDaySummary();
            this.model_info.fetchInfo();
            this.collection.fetch();
        }catch(err){};
    };


    PageView.prototype.createHeader = function(){
        var that = this;

        // Header Icons
        this.headerContent = new View();

        // - Settings
        this.headerContent.Settings = new Surface({
            content: '<i class="icon ion-navicon-round"></i>',
            size: [App.Defaults.Header.Icon.w, undefined],
            classes: ['header-tab-icon-text-big']
        });
        this.headerContent.Settings.on('click', function(){
            App.history.navigate('settings');
            // Utils.Popover.ColorPicker({
            //     color: '#f0f0f0',
            //     on_done: function(result){
            //         alert(result);
            //     }
            // });
            // App.history.navigate('popover/colorpicker');
        });

        // - Cars
        this.headerContent.Cars = new Surface({
            content: '<i class="icon ion-model-s"></i>',
            size: [App.Defaults.Header.Icon.w, undefined],
            classes: ['header-tab-icon-text-big']
        });
        this.headerContent.Cars.on('click', this.menuToggle.bind(this));

        // - Dash
        this.headerContent.Dash = new Surface({
            content: '<i class="icon ion-android-contact"></i>',
            size: [App.Defaults.Header.Icon.w, undefined],
            classes: ['header-tab-icon-text-big']
        });
        this.headerContent.Dash.on('click', function(){
            App.history.navigate('dash');
        });

        this.header = new StandardHeader({
            content: '<img height="48px" src="img/waiting_square.svg" />',
            classes: ["normal-header"],
            backContent: false,
            // backClasses: ["normal-header","header-back-text-button"],
            // moreContent: "Dash",
            moreSurfaces: [
                this.headerContent.Settings,
                this.headerContent.Cars,
                this.headerContent.Dash
            ]
            // moreClasses: ["normal-header","header-more-text-button"]
        }); 
        // this.header._eventOutput.on('back', this.menuToggle.bind(this));
        // this.header._eventOutput.on('more', function(){
        //     App.history.navigate('dash');
        // });
        this.header.navBar.title.on('click', function(){
            App.history.navigate('settings');
        });

        this._eventOutput.on('inOutTransition', function(args){
            this.header.inOutTransition.apply(this.header, args);
        })

        // // header StateModifier
        // this.header.StateModifier = new StateModifier();


        // Attach header to the layout

        // // RenderNode or View?
        // this.HeaderNode = new RenderNode();
        // this.HeaderNode.add(this.headerBg);
        // this.HeaderNode.add(this.header.StateModifier).add(this.header);
        
        this.layout.header.add(Utils.usePlane('header')).add(this.header);

    };


    PageView.prototype.createFooter = function(){
        var that = this;

        this.quick_stats_grid = new GridLayout({
            dimensions: [3,1]
        });


        // Create panel buttons
        // - trips
        // - alerts
        // - errors
        //      - these should all be Views, eventually
        this.footerGridSurfaces = [];

        this.surface_MileCount = new Surface({
            content: "<div>Today Mi.</div><div></div>",
            classes: ["quick-stats"],
            size: [undefined, undefined],
            properties: {
                backgroundColor: "white",
                color: "black",
                lineHeight: "14px",
                textAlign: 'center'
            }
        });
        this.footerGridSurfaces.push(this.surface_MileCount);

        this.surface_AlertCount = new Surface({
            content: "<div>Alerts</div><div>",
            size: [undefined, undefined],
            classes: ["quick-stats"]
        });
        this.footerGridSurfaces.push(this.surface_AlertCount);

        this.surface_ErrorCount = new Surface({
            content: "<div>Errors</div><div>",
            size: [undefined, undefined],
            classes: ["quick-stats"]
        });
        this.footerGridSurfaces.push(this.surface_ErrorCount);

        this.quick_stats_grid.sequenceFrom(this.footerGridSurfaces);

        // Temporary Button Assignment!
        this.surface_MileCount.on('click', function(){
           that.map_focus();
        });
        this.surface_MileCount.on('doubletap', function(){
           that.map_redraw();
        });

        this.surface_AlertCount.on('click',function(e){
            App.history.navigate('alerts/fleet');
        }.bind(this));
        this.surface_ErrorCount.on('click',function(e){
            App.history.navigate('errors/fleet');
        }.bind(this));

        // Footer
        // - with modifier
        this.layout.footer.StateModifier = new StateModifier();

        // Add Footer to layout
        this.layout.footer.add(Utils.usePlane('footer')).add(this.layout.footer.StateModifier).add(this.quick_stats_grid);

    };


    PageView.prototype.createContent = function(){
        var that = this;


        // Create the CarList menu that swings out (replacing the map)
        this.sideView = new FleetSideMenuView();
        this.sideView._eventOutput.on("menuToggle", (function(){
            this.menuToggle();
        }).bind(this));

        // Add StateModifier for this.layout.content
        this.layout.content.StateModifier = new StateModifier();

        // Add Content after sideView
        // - with itself's StateModifier
        var contentNode = this.layout.content.add(this.layout.content.StateModifier);
        contentNode.add(Utils.usePlane('background',1)).add(this.sideView);
        contentNode.add(this.mainTransform).add(Utils.usePlane('content')).add(this.contentController);

    };


    PageView.prototype.menuToggle = function() {
        console.log('menuToggle');
        if (!this.sideView.open) {
            console.log('opening');
            this.mainTransitionable.set(window.innerWidth, { duration: 250, curve: 'easeOut' });
            this.sideView.flipOut();
        } else {
            console.log('closing');
            this.mainTransitionable.set(0, { duration: 500, curve: 'easeOut' });
            this.sideView.flipIn();
        }
        this.sideView.open = !this.sideView.open;
    };

    PageView.prototype.update_quickstats = function(model) {
        // // Update the Miles
        // console.log(model);
        // console.log(this);
        // debugger;
        this.surface_MileCount.setContent('<div>Today Mi.</div><div>' + Utils.toFixedOrNone(model.get('miles')) + '</div>');
    };

    PageView.prototype.update_counts = function(model) {
        // Update numbers
        // - alerts, errors
        // - reset classes (add blue-bg if > 0)
        this.surface_AlertCount.setContent('<div>Alerts</div><div>' + model.get('alerts') + '</div>');
        var aClasses = model.get('alerts') ? ['quick-stats','red-bg'] : ['quick-stats'];
        this.surface_AlertCount.setClasses(aClasses);

        this.surface_ErrorCount.setContent('<div>Errors</div><div>' + model.get('errors') + '</div>');
        var eClasses = model.get('errors') ? ['quick-stats','red-bg'] : ['quick-stats'];
        this.surface_ErrorCount.setClasses(eClasses);

    };



    PageView.prototype.display_map = function(model) {
        var that = this;

        // Map is already semi-rendered on the page

        // Create RenderController if not created yet

        if(!this.mapSurfacesCreated){
            this.mapSurfacesCreated = true

            // Create node for holding map
            this.MapNode = new View();

            // Render the mapView
            this.render_map();

            // // Render Map on page
            // this.surfaceMap = new Surface({
            //     // content: "Actual Map Here",
            //     content: '<div id="map-canvas-fleet"></div>',
            //     size: PageView.DEFAULT_OPTIONS.content.size,
            //     classes: ["map-area"],
            //     properties: {
            //         lineHeight: "22px",
            //         textAlign: "center",
            //         zIndex: "1"
            //     }
            // });
            // this.surfaceMap.setContent('<div id="map-canvas-fleet"></div>');
            // this.surfaceMap.pipe(this._eventInput);

            this.surfaceMapButton = new Surface({
                content: '<span class="icon ion-android-location"></span>',
                size: [40, 40],
                properties: {
                    backgroundColor: "white",
                    border: "1px solid #999",
                    color: "#777",
                    textAlign: "center",
                    lineHeight: "40px",
                    fontSize: "28px"

                }
            });
            this.surfaceMapButton.pipe(this._eventInput);
            this.surfaceMapButton.Origin = new StateModifier({
                origin: [1,1]
            });
            this.surfaceMapButton.Position = new StateModifier({
                transform: Transform.translate(-20, -20)
            });

            // Map button event
            this.surfaceMapButton.on('click', function(){
                that.map_focus();
            });
            this.surfaceMapButton.on('doubletap', function(){
               that.map_redraw();
            });

            // Render Cover
            this.MapCoverModifier = new Modifier({
                opacity: 1,
            });
            this.surfaceMapCover = new Surface({
                content: "",
                size: [undefined, undefined],
                // classes: ["map-area"],
                properties: {
                    backgroundColor: "#34495e"
                }
            });

            // Add to this.MapNode
            this.MapNode.add(Utils.usePlane('content',1)).add(this.mapView);
            this.MapNode.add(Utils.usePlane('content',2)).add(this.surfaceMapButton.Origin).add(this.surfaceMapButton.Position).add(this.surfaceMapButton);
            this.MapNode.add(Utils.usePlane('content',3)).add(this.MapCoverModifier).add(this.surfaceMapCover);

            this._eventInput.on('mapclick', function(MapLabel){

                // Me?
                if(!MapLabel.car){
                    alert('me?');
                    return;
                }

                // Show the details for this car
                App.history.navigate('car/' + MapLabel.car._id);

            });

            this.surfaceMapLoading = new Surface({
                content: "Loading Map",
                size: [undefined, undefined],
                classes: ["map-area"],
                properties: {
                    lineHeight: "150px",
                    textAlign: "center",
                    // background: "#444",
                    color: "white"
                }
            });
            this.surfaceNoMapNeeded = new Surface({
                content: "Add vehicles to see them on a map!",
                size: PageView.DEFAULT_OPTIONS.content.size,
                classes: ["map-area"],
                properties: {
                    lineHeight: "40px",
                    textAlign: "center",
                    // background: "#444",
                    color: "white"
                }
            });

            this.surfacePlugInDevice = new Surface({
                content: "No data received from cars, yet.<br /><br />Plug the device <br />into your vehicle <br />and take a trip!",
                size: PageView.DEFAULT_OPTIONS.content.size,
                classes: ["map-area"],
                properties: {
                    lineHeight: "20px",
                    textAlign: "center",
                    // background: "#444",
                    color: "white"
                }
            })

        }

        // Not yet loaded
        // - display "loading" data

        // Unfetched data?
        if(!this.collection.hasFetched){
            this.contentController.show(this.surfaceMapLoading);
            // this.$('.actual_map').addClass('nodisplay');
            // this.$('.no_map_needed').addClass('nodisplay');
            // this.$('.loading_map').removeClass('nodisplay');
            // this.$('.plug_in_device').addClass('nodisplay');
            return;
        }

        if(this.collection.length === 0){
            this.contentController.show(this.surfaceNoMapNeeded);
            return;
        }

        // // Do we have some that we cannot display?
        // var cars_without_location = this.collection.filter(function(car){
        //     // console.log(car);
        //     return car.toJSON().CarPermission.live_location ? true : false;
        // });

        // Fetched data, but none to display?
        if(_.filter(this.collection.toJSON(), function(car){
            console.log(car);
            return car.CarPermission.live_location ? true : false;
        }).length == 0){
            console.log('No map needed');

            this.contentController.show(this.surfaceNoMapNeeded);

            return;
        }

        // Fetched data, contained something!
        this.contentController.show(this.MapNode);
    };

    PageView.prototype.render_map = function(model) {
        var that = this;

        this.mapView = new MapView({
            // size: [window.innerWidth, window.innerHeight],
            type: MapView.MapType.LEAFLET,
            mapOptions: {
                zoomControl: false,
                attributionControl: false
            }
        });

        // Wait for the map to load and initialize
        this.mapView.on('load', function () {

            // Remove Map Hider
            that.MapCoverModifier.setOpacity(0, {duration: 500}, function(){
                that.MapCoverModifier.setSize([1,1]);
            });

            console.log(that.mapView.getMap());
            // debugger;

            // Add tile-layer (you can also get your own at mapbox.com)
            // var layer = new L.StamenTileLayer("toner-lite");
            // layer.addTo(that.mapView.getMap());
            // return;

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
                //maxZoom: 18
            }).addTo(that.mapView.getMap());


            that.collection.populated().then(function(){
                console.log(Utils.addLabelsToMap(that._eventInput, that.mapView, that.MapNode , that.collection.toJSON()));

                // Original dimensions when loaded
                that.fleet_map_original_zoom = that.mapView.getMap().getZoom();
                that.fleet_map_original_bounds = that.mapView.getMap().getBounds();

            });

        });

        this.mapView.pipe(this._eventInput);

        // Missing Waypoints for any cars?
        try {
            if(!this.collection.toJSON()[0].latest_data.lastWaypoint){
                this.contentController.show(this.surfacePlugInDevice);
                return;
            }
        }catch(err){
            console.log(this.collection.toJSON());
        }


        // this.contentController.show(mapView);

        // debugger;

        return;









        // Make sure element exists
        if($('#map-canvas-fleet').length < 1){
            window.setTimeout(this.render_map.bind(this), 100);
            return;
        }

        
        // // Start listening for touchmove events
        // document.getElementById('map-canvas-fleet').addEventListener('touchmove', function(){
        //     if(!App.Cache.touchmove){
        //         App.Cache.touchmove = 0;
        //     }
        //     App.Cache.touchmove += 1;

        //     window.setTimeout(function(){
        //         App.Cache.touchmove -= 1;
        //     },100);
        // }, true);

        try {
            this.fleet_map = Utils.getGoogleMapsGetMapForFleet(this._eventInput, this.fleet_map, document.getElementById('map-canvas-fleet'), this.collection.toJSON());

            // var x = document.getElementById('map-canvas-fleet');
            // console.log(x);
            // console.log($(x).width());
            // console.log($(x).height());

            // console.log(this.fleet_map);
            // debugger;

            // Cars without data points?
            // - shouldn't we handle this higher up?
            if(this.fleet_map === 'no_cars_with_datapoints'){
                this.fleet_map = null;
                throw Exception;
            }
        }catch(err){
            // Failed creating map
            // - just see if they are missing the lastWaypoint
            // debugger;
            if(!this.collection.toJSON()[0].latest_data.lastWaypoint){

                this.contentController.show(this.surfacePlugInDevice);

                // // Fetched data, contained something!
                // this.$('.actual_map').addClass('nodisplay');
                // this.$('.loading_map').addClass('nodisplay');
                // this.$('.no_map_needed').addClass('nodisplay');
                // this.$('.plug_in_device').removeClass('nodisplay');
                return;
            }
            console.error(err);
            console.error('returning');
            return;
        }


        console.log(this.fleet_map);
        // debugger;

        // debugger;
        // Get bounds after map has loaded
        try {
            this.fleet_map.Events.once('load', function() {

                // Remove Map Hider
                that.MapCoverModifier.setOpacity(0, {duration: 500}, function(){
                    that.MapCoverModifier.setSize([1,1]);
                });

                // google.maps.event.removeListener(original_bounds);
                that.fleet_map_original_zoom = that.fleet_map.getZoom();
                that.fleet_map_original_bounds = that.fleet_map.getBounds();
                console.log('got bounds');
            });

            // var original_bounds = google.maps.event.addListener(this.fleet_map, 'idle', function() {

            //     // Remove Map Hider
            //     that.MapCoverModifier.setOpacity(0, {duration: 500}, function(){
            //         that.MapCoverModifier.setSize([1,1]);
            //     });

            //     google.maps.event.removeListener(original_bounds);
            //     that.fleet_map_original_zoom = that.fleet_map.getZoom();
            //     that.fleet_map_original_bounds = that.fleet_map.getBounds();
            //     console.log('got bounds');
            // });
        } catch(err){
            console.error(err);
        }

        return this;
    };

    PageView.prototype.map_update_car = function(carModel){
        // Update the position of the cars on the map
        // - without Centering or fitBounds
        // - if no cars are visible in the map, then do fitBounds?
        var that = this;


        return;


        // fleet_map created?
        if(!this.fleet_map || !carModel){
            return;
        }

        var marker = _.findWhere(this.fleet_map.markerList, {car_id : carModel.get('_id')});

        if(!marker){
            console.log('did not find marker');
            return false;
        }

        var Car = carModel.toJSON();

        // Update marker's position
        // - animate it to a new position
        try {
            var gps_position = Car.latest_data.lastWaypoint,
                latLng = [gps_position.latitude, gps_position.longitude];

            // Update marker with car's new location
            // console.log('setting new position');
            // console.log(latLng);
            // console.log(marker);
            Utils.animateMarker(marker, latLng);
            // marker.setPosition(latLng);

        } catch(err){
            console.error('Failed updating GPS coords for car');
            console.error(err);
        }

    };

    PageView.prototype.map_update_person = function(){
        // Update the position of the mobile user on the map
        // - without Centering or fitBounds
        var that = this;

        // fleet_map created?
        if(!this.fleet_map){
            return;
        }

        var marker = _.findWhere(this.fleet_map.markerList, {me_marker : true});

        if(!marker){
            console.log('did not find me_marker');
            return false;
        }

        // Update marker's position
        // - animate it to a new position
        try {
            var latLng = [App.Cache.geolocation_coords.latitude, App.Cache.geolocation_coords.longitude];

            // Update marker with car's new location
            // console.log('setting new position');
            // console.log(latLng);
            // console.log(marker);
            Utils.animateMarker(marker, latLng);
            // marker.setPosition(latLng);

        } catch(err){
            console.error('Failed updating GPS coords for me_marker');
            console.error(err);
        }

    };

    PageView.prototype.map_focus = function(){
        // Determines if ANY cars are in the viewport
        // - move them around
        // - if not, redraw
        var that = this;

        if(!this.mapView || !this.mapView.getMap()){
            return;
        }

        var mapContext = this.mapView.getMap();

        var inView = false;
        _.each(mapContext.markerList, function(marker){
            if(mapContext.getBounds().contains(marker.getLatLng())){
                inView = true;
            }
        });

        if(inView == false){
            // None in view, redraw
            this.map_redraw();
        }

        // Update the GPS position (if it changes, we'll update it)
        Utils.updateGpsPosition();

        // Also triggers a data refresh
        this.refreshData();

    };

    PageView.prototype.map_redraw = function(ev){
        // Re-center and re-focus the map on the existing points
        // - also does a refresh_data
        var that = this;

        if(!this.mapView || !this.mapView.getMap()){
            return;
        }

        var mapContext = this.mapView.getMap();

        var bounds = [];
        _.each(mapContext.markerList, function(marker){
            bounds.push(marker.getLatLng());
        });

        // Set bounds and zoom
        mapContext.fitBounds(bounds, {
            maxZoom: 18,
            padding: [20,20]
        });


    };


    PageView.prototype.inOutTransition = function(direction, otherViewName, transitionOptions, delayShowing, otherView){
        var that = this;

        this._eventOutput.emit('inOutTransition', arguments);

        switch(direction){
            case 'hiding':

                // Make sure menu is being hidden
                if (this.sideView.open) {
                    // this.menuToggle();
                } 

                switch(otherViewName){
                    default:
                        // Modify every other transition!

                        // Make the transition normal, at first
                        transitionOptions.outTransform = Transform.identity;

                        // Move the content to the left
                        // - not the footer
                        // console.log(transitionOptions.outTransform);
                        // debugger;
                        Timer.setTimeout(function(){

                            // // Fade header
                            // that.header.StateModifier.setOpacity(0, transitionOptions.outTransition);

                            // Move Map to the left
                            // that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth * -1,0,0), transitionOptions.outTransition);
                            that.layout.content.StateModifier.setOpacity(0, transitionOptions.outTransition);

                            // Drop Footer down
                            that.layout.footer.StateModifier.setTransform(Transform.translate(0,50,0), transitionOptions.outTransition);

                        }, delayShowing);

                        break;
                }

                break;
            case 'showing':
                if(this._refreshData){
                    Timer.setTimeout(this.refreshData.bind(this), 1000);
                }
                this._refreshData = true;
                switch(otherViewName){

                    default:

                        //Fade out the header
                        // var previousTransform = transitionOptions.outTransform;
                        transitionOptions.inTransform = Transform.identity;

                        // that.header.StateModifier.setOpacity(0);

                        // Header
                        Timer.setTimeout(function(){

                            // // Change header opacity
                            // that.header.StateModifier.setOpacity(1, transitionOptions.outTransition);

                            // Bring Footer Up
                            that.layout.footer.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.outTransition);

                        }, delayShowing + transitionOptions.outTransition.duration);

                        // Content
                        // - extra delay for prevous content to disappear
                        Timer.setTimeout(function(){

                            // Bring map content back
                            // that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);
                            that.layout.content.StateModifier.setOpacity(1, transitionOptions.inTransition);

                        }, delayShowing + transitionOptions.outTransition.duration);

                        break;
                }
                break;
        }
        
        return transitionOptions;
    };


    PageView.DEFAULT_OPTIONS = {
        header: {
            size: [undefined, 50],
            // inTransition: true,
            // outTransition: true,
            // look: {
            //     size: [undefined, 50]
            // }
        },
        footer: {
            size: [undefined, 50]
        },
        content: {
            size: [undefined, undefined],
            inTransition: true,
            outTransition: true,
            overlap: true
        }
    };

    module.exports = PageView;

});
