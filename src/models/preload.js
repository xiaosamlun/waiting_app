/*globals define*/
define(function(require, exports, module) {
    
    var Action               = require('models/action'),
        // AlertAction         = require('models/alert_action'),
        // AlertTrigger        = require('models/alert_trigger'),
        // Car                 = require('models/car'),
        // CarError            = require('models/car_error'),
        // CarPermission       = require('models/car_permission'),
        // Driver              = require('models/driver'),
        // Error               = require('models/error'),
        // Fleet               = require('models/fleet'),
        // Leg                 = require('models/leg'),
        // RelationshipCode    = require('models/relationship_code'),
        // Trip                = require('models/trip'),
        User                = require('models/user');


    module.exports = function(App){

        // Load our existing models first
        // - should have already been loaded into App.Data (or similar)
        // - initiate a fetcs

        // Preload the necessary models by fetching from the server
        console.info('preloading models');

        App.Data.User.fetch({prefill: true});

        if(App.Data.User.get('_id')){
            // Logged in
            
            // // Car List
            // var carList = new Car.CarCollection();
            // carList.fetch({prefill: true});

            // // Driver List
            // var driverList = new Driver.DriverCollection();
            // driverList.fetch({prefill: true});


        } else {
            // Not logged in
            // - probably not fetching anything!
        }
        
        // // Player List
        // App.Data.Players = new Player.PlayerCollection();
        // App.Data.Players.fetch({prefill: true});

        return true;

    };

});
