define(function(require, exports, module) {
    // Famous Modules
    var Surface    = require('famous/core/Surface');
    var Modifier   = require('famous/core/Modifier');
    var StateModifier   = require('famous/modifiers/StateModifier');
    var Transform  = require('famous/core/Transform');
    var View       = require('famous/core/View');
    var GridLayout = require('famous/views/GridLayout');
    var Timer = require('famous/utilities/Timer');

    var ScrollView = require('famous/views/Scrollview');

    var EventHandler = require('famous/core/EventHandler');

    // Curves
    var Easing = require('famous/transitions/Easing');

    var _ = require('underscore');
    var Utils = require('utils');

    var tinycolor = require('lib2/tinycolor');

    // Models
    var CarModel    = require('models/car');

    function SideView(params) {
        var that = this;
        View.apply(this, arguments);
        this.params = params;

        this.open = false;

        // Background surface
        this.bgSurface = new Surface({
            size: [undefined, undefined],
            content: "",
            properties: {
                // backgroundColor: "#111", // invisible!
                // zIndex: "-2"
            }
        });
        // this.bgSurface.on('swipe', (function(){
        //     this._eventOutput.emit("menuToggle");
        // }).bind(this));
        this.bgSurface.on('click', (function(){
            this._eventOutput.emit("menuToggle");
        }).bind(this));

        this.hinge = new StateModifier({ // used to be a Modifier, not a StateModifier
            // transform: Transform.thenMove(Transform.identity, [-1 * this.options.width, 0, 0]) // rotateY(-Math.PI/2.5)
        });

        // Create ScrollView
        this.contentScrollView = new ScrollView();
        this.contentScrollView.Views = [];
        this.modelSurfaces = {};
        this.contentScrollView.sequenceFrom(this.contentScrollView.Views);

        // Car list
        this.collection = new CarModel.CarCollection();
        this.collection.on("reset", function(collection){
        }, this);
        this.collection.on("add", this.addOne, this);
        this.collection.on("remove", function(Model){
            // This was a remove as triggered by the collection
            // - we want to differentiate from a move triggered elsewhere? (like by our same view, we might want to animate differently)
            this.contentScrollView.Views = _.without(this.contentScrollView.Views, this.modelSurfaces[Model.get('_id')]);

            // Re-sequence (unfortunate that I have to do this, thought it would auto-resequence)
            this.contentScrollView.sequenceFrom(this.contentScrollView.Views);
        }, this);
        this.collection.on("cachesync", function(collection){
            // got a "prefill" value
            // - no need to update anything, just use the normal add/remove
        });
        this.collection.fetch({prefill: true, data: {}});

        // Add "New Driver" button below list of drivers
        this.addNewCarButton();

        // turn this.layout into a HeaderFooterLayout??
        this.layout = this.contentScrollView;

        var node = this.add(); //this.add(new Modifier({size : [200, undefined]}));
        // node.add(bgSurface);
        // var hingeNode = node.add(new Modifier({origin : [1,0]})).add(this.hinge);
        var hingeNode = node.add(new Modifier({
            origin : [0,0],
            transform: Transform.thenMove(Transform.identity, [0, 91, 0]) // rotateY(-Math.PI/2.5)
        })).add(this.hinge);
        hingeNode.add(Utils.usePlane('content',-2)).add(this.bgSurface);
        hingeNode.add(Utils.usePlane('content',-1)).add(this.layout);
   
    }

    SideView.prototype = Object.create(View.prototype);
    SideView.prototype.constructor = SideView;

    SideView.prototype.refreshData = function(Car, CarIndex) { 
        this.collection.fetch();
    };

    SideView.prototype.addOne = function(Car, CarIndex) { 
        var that = this;
        
        var temp = new Surface({
             content: '<div>' + S(Car.get('name')) + '</div>',
             size: [this.options.width, this.options.height],
             classes: ['fleet-side-menu-car'],
             properties: {
                color: tinycolor.mostReadable(Car.get('color'), ["#000", "#fff"]).toHexString(),
                backgroundColor: Car.get('color')
             }
        });

        Car.on('change', function(){
            temp.setContent('<div>' + S(Car.get('name')) + '</div>');
            temp.setProperties({
                color: tinycolor.mostReadable(Car.get('color'), ["#000", "#fff"]).toHexString(),
                backgroundColor: Car.get('color')
            });
        });

        // Push surface/View to sequence
        temp.View = new View();
        temp.View.positionModifier = new StateModifier({
            transform: Transform.translate(-1 * window.innerWidth,40,0)
        });
        if(this.open){
            console.log(that.contentScrollView.Views);
            temp.View.positionModifier.setTransform(Transform.translate(0,0,0), {
                duration: 250,
                curve: Easing.easeOut
            });
        }
        temp.View.rotateModifier = new StateModifier({
            transform: Transform.rotateZ(this.options.angle)
        });
        temp.View.skewModifier = new StateModifier({
            transform: Transform.skew(0, 0, this.options.angle)
        });

        temp.View.add(temp.View.positionModifier).add(temp.View.rotateModifier).add(temp.View.skewModifier).add(temp);
        

        // Events
        temp.pipe(this.contentScrollView);
        temp.on('click', function(){
            App.history.navigate('car/' + Car.get('_id'));
            that._eventOutput.emit("menuToggle");
        });

        // temp.on('swipe', (function(){
        //     this._eventOutput.emit("menuToggle");
        // }).bind(this));

        // Model change
        Car.on('change:name', function(ModelTmp){
            temp.setContent(ModelTmp.get('name'));
        }, this);


        this.contentScrollView.Views.unshift(temp.View);

        this.modelSurfaces[Car.get('_id')] = temp.View;

    }

    SideView.prototype.addNewCarButton = function(Car, CarIndex) { 
        var that = this;

        var temp = new Surface({
             content: "<div>New Vehicle</div>",
             size: [this.options.width, this.options.height],
             classes: ['fleet-side-menu-car'],
             properties: {
                 color: "black",
                 backgroundColor: "white",
             }
        });

        // Push surface/View to sequence
        temp.View = new View();
        temp.View.positionModifier = new StateModifier({
            transform: Transform.translate(-1 * window.innerWidth,40,0)
        });
        temp.View.rotateModifier = new StateModifier({
            transform: Transform.rotateZ(this.options.angle)
        });
        temp.View.skewModifier = new StateModifier({
            transform: Transform.skew(0, 0, this.options.angle)
        });
        temp.View.add(temp.View.positionModifier).add(temp.View.rotateModifier).add(temp.View.skewModifier).add(temp);

        temp.pipe(this.contentScrollView);
        temp.on('click', (function(){
            App.history.navigate('car/add');
            that._eventOutput.emit("menuToggle");
        }).bind(this));


        this.contentScrollView.Views.push(temp.View);

    }

    SideView.prototype.flipOut = function() {
        var that = this;

        this.refreshData();

        this.contentScrollView.Views.forEach(function(view, index){
            Timer.setTimeout(function(index) {
                // console.log(that.contentScrollView.Views);
                that.contentScrollView.Views[index].positionModifier.setTransform(Transform.translate(0,0,0), {
                    duration: 250,
                    curve: Easing.easeOut
                });
            }.bind(this, index), 50 * index);
        });

        // this.hinge.setTransform(Transform.translate(-200, 0, 0), { duration: 500, curve: 'easeOut' });
    }

    SideView.prototype.flipIn = function() {
        // this.hinge.setTransform(Transform.thenMove(Transform.identity, [-200, 0, 0]), { duration: 500, curve: 'easeOut' }); // Transform.rotateY(-Math.PI/2.2)

        this.contentScrollView.Views.reverse().forEach(function(view, index){
            Timer.setTimeout(function(){
                view.positionModifier.setTransform(Transform.translate(-1 * window.innerWidth,40,0), {
                    duration: 250,
                    curve: Easing.outBack
                });
            }, 50 * index);
        });

        this.contentScrollView.Views.reverse();

    };

    SideView.DEFAULT_OPTIONS = {
        width: window.innerWidth * 0.75,
        height: 50,
        angle: -0.1
    };


    module.exports = SideView;
});