/*globals define*/
define(function(require, exports, module) {

    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var ScrollView = require('famous/views/Scrollview');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var RenderController = require('famous/views/RenderController');
    var FlexibleLayout = require('famous/views/FlexibleLayout');
    var Surface = require('famous/core/Surface');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transitionable     = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var Matrix = require('famous/core/Transform');
    var RenderNode         = require('famous/core/RenderNode')

    var Utility = require('famous/utilities/Utility');

    // Helpers
    var Utils = require('utils');
    var $ = require('jquery-adapter');
    var Handlebars = require('lib2/handlebars-helpers');

    var TabBar = require('famous/widgets/TabBar');
    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var NavigationBar = require('famous/widgets/NavigationBar');
    var GridLayout = require("famous/views/GridLayout");

    // Subviews
    var StandardHeader = require('views/common/StandardHeader');

    // Extras
    var Credentials         = JSON.parse(require('text!credentials.json'));
    var numeral = require('lib2/numeral.min');

    // Side menu of options
    var GameMenuView      = require('views/Game/GameMenu');

    // Notifications SubView
    var NotificationsView      = require('./Notifications');
    var CertifyView      = require('./Certify');

    // Models
    var GameModel = require('models/game');
    var PlayerModel = require('models/player');
    var MediaModel = require('models/media');

    function PageView(params) {
        var that = this;
        View.apply(this, arguments);
        this.params = params;



        // create the layout
        this.layout = new HeaderFooterLayout({
            headerSize: 50,
            footerSize: 0
        });


        this.createHeader();

        // Wait for User to be resolved
        App.Data.Players.populated().then((function(){
            this.createContent();
        }).bind(this));

        this.add(this.layout);



        return;


        // // Models

        // // Game
        // this.model = new GameModel.Game({
        //     _id: params.args[0]
        // });
        // this.model.fetch({prefill: true});

        // // Media
        // this.media_collection = new MediaModel.MediaCollection({
        //     game_id: params.args[0]
        // });
        // this.media_collection.fetch({prefill: true});

        // // create the layout
        // this.layout = new HeaderFooterLayout({
        //     headerSize: 50,
        //     footerSize: 0
        // });


        // this.createHeader();
        // // this.createContent();

            
        // // Create the mainTransforms for shifting the entire view over on menu open
        // this.mainTransform = new Modifier({
        //     transform: Transform.identity
        // });
        // this.mainTransitionable = new Transitionable(0);
        // this.mainTransform.transformFrom(function() {
        //     // Called every frame of the animation
        //     return Transform.translate(this.mainTransitionable.get() * -1, 0, 0);
        // }.bind(this));

        // // Create the menu that swings out
        // this.sideView = new GameMenuView({
        //     model: this.model
        // });
        // this.sideView.OpacityModifier = new StateModifier();


        // // Wait for model to get data, and then render the content
        // this.model.populated().then(function(){

        //     // that.update_counts();

        //     // // Now listen for changes
        //     // that.model.on('change', that.update_counts, that);

        //     switch(that.model.get('sport_id.result_type')){
        //         case '1v1':
        //             that.create1v1();
        //             break;

        //         case 'free-for-all':
        //             that.createFreeForAll();
        //             break;

        //         default:
        //             console.log(that.model.toJSON());
        //             throw "error";
        //             alert("Unable to handle other types (1v2, teams, etc.) yet");
        //             debugger;
        //             return;
        //     }

        // });

        // // Attach the main transform and the comboNode to the renderTree
        // this.add(this.mainTransform).add(this.layout);

        // // // Attach the main transform and the comboNode to the renderTree
        // // this.add(this.layout);

    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;
    
    PageView.prototype.createHeader = function(){
        var that = this;
        
        // create the header
        this.header = new StandardHeader({
            content: "Inbox",
            classes: ["normal-header"],
            backClasses: ["normal-header"],
            moreClasses: ["normal-header"],
            moreContent: false, //'<span class="icon ion-navicon-round"></span>'
        }); 
        this.header._eventOutput.on('back',function(){
            App.history.back();//.history.go(-1);
        });
        this.header.navBar.title.on('click', function(){
            App.history.back();
        });
        this.header._eventOutput.on('more',function(){
            // if(that.model.get('CarPermission.coowner')){
            //     App.history.navigate('car/permission/' + that.model.get('_id'), {trigger: true});
            // }
            that.menuToggle();
        });
        this._eventOutput.on('inOutTransition', function(args){
            this.header.inOutTransition.apply(this.header, args);
        })

        // // Node for Modifier and background
        // this.HeaderNode = new RenderNode();
        // this.HeaderNode.add(this.headerBg);
        // this.HeaderNode.add(this.header.StateModifier).add(this.header);

        // Attach header to the layout        
        this.layout.header.add(this.header);

    };
    
    PageView.prototype.createContent = function(){
        var that = this;

        // this.contentScrollView = new ScrollView(App.Defaults.ScrollView);
        this.contentScrollView = new FlexibleLayout({
            direction: FlexibleLayout.DIRECTION_Y,
            ratios: [true, 1]
        });
        this.contentScrollView.Views = [];

        // Content
        this.ContentStateModifier = new StateModifier();

        // Create the Tabs
        this.TopTabs = new View();
        this.TopTabs.Bar = new TabBar();
        this.TopTabs.BarSizeMod = new StateModifier({
            size: [undefined, 50]
        });
        this.TopTabs.add(this.TopTabs.BarSizeMod).add(this.TopTabs.Bar);

        // combine the following 2 into "events" ? ("Stories" would be the default view, with a link inside the "Actions" (because they are a subset, really)
        // this.TopTabs.Bar.defineSection('actions', {
        //     content: '<i class="icon ion-navicon"></i><div>Actions</div>',
        //     onClasses: ['inbox-tabbar-default', 'on'],
        //     offClasses: ['inbox-tabbar-default', 'off']
        // });
    
        // Re-enable Notifications soon!
        // this.TopTabs.Bar.defineSection('notifications', {
        //     content: '<i class="icon ion-ios7-flag"></i><div>Notifications</div>',
        //     onClasses: ['inbox-tabbar-default', 'on'],
        //     offClasses: ['inbox-tabbar-default', 'off']
        // });
        this.TopTabs.Bar.defineSection('certify', {
            content: '<i class="icon ion-ios7-checkmark-outline"></i><div>Certify</div>',
            onClasses: ['inbox-tabbar-default', 'on'],
            offClasses: ['inbox-tabbar-default', 'off']
        });
        this.TopTabs.Bar.defineSection('challenges', {
            content: '<i class="icon ion-play"></i><div>Challenges</div>',
            onClasses: ['inbox-tabbar-default', 'on'],
            offClasses: ['inbox-tabbar-default', 'off']
        });

        // Add tabs to sequence
        this.contentScrollView.Views.push(this.TopTabs);

        // Tab content
        // this.TopTabs = new View();
        this.TopTabs.Content = new RenderController();

        // Actions
        this.TopTabs.Content.Actions = new View();
        this.TopTabs.Content.Actions.Surface = new Surface({
            content: 'No new actions',
            size: [undefined, 50],
            properties: {
                textAlign: "center",
                backgroundColor: "white",
                color: "#222",
                lineHeight: "50px",
                borderTop: "1px solid #ddd"
            }
        });
        this.TopTabs.Content.Actions.add(this.TopTabs.Content.Actions.Surface);

        // Notifications
        this.TopTabs.Content.Notifications = new View();
        this.TopTabs.Content.Notifications.View = new NotificationsView();
        this.TopTabs.Content.Notifications.add(this.TopTabs.Content.Notifications.View);

        // this.TopTabs.Content.Notifications.pipe(this.contentScrollView);
        // this.TopTabs.Content.Notifications.Surface = new Surface({
        //     content: 'No new notifications',
        //     size: [undefined, 50],
        //     properties: {
        //         textAlign: "center",
        //         backgroundColor: "white",
        //         color: "#222",
        //         lineHeight: "50px",
        //         borderTop: "1px solid #ddd"
        //     }
        // });
        // this.TopTabs.Content.Notifications.add(this.TopTabs.Content.Notifications.Surface);

        // Challenges
        this.TopTabs.Content.Challenges = new View();
        this.TopTabs.Content.Challenges.Surface = new Surface({
            content: 'No new Challenges',
            size: [undefined, 50],
            properties: {
                textAlign: "center",
                backgroundColor: "white",
                color: "#222",
                lineHeight: "50px",
                borderTop: "1px solid #ddd"
            }
        });
        this.TopTabs.Content.Challenges.add(this.TopTabs.Content.Challenges.Surface);
        // Certify
        this.TopTabs.Content.Certify = new View();
        this.TopTabs.Content.Certify.View = new CertifyView();
        this.TopTabs.Content.Certify.add(this.TopTabs.Content.Certify.View);
        // this.TopTabs.Content.Certify.Surface = new Surface({
        //     content: 'No games to certify',
        //     size: [undefined, 50],
        //     properties: {
        //         textAlign: "center",
        //         backgroundColor: "white",
        //         color: "#222",
        //         lineHeight: "50px",
        //         borderTop: "1px solid #ddd"
        //     }
        // });
        this.TopTabs.Content.Certify.add(this.TopTabs.Content.Certify.View);

        // Add Lightbox to sequence
        this.contentScrollView.Views.push(this.TopTabs.Content);

        // Listeners for Tabs
        this.TopTabs.Bar.on('select', function(result){
            switch(result.id){
                // case 'actions':
                //     that.TopTabs.Content.show(that.TopTabs.Content.Actions);
                //     break;

                case 'notifications':
                    that.TopTabs.Content.show(that.TopTabs.Content.Notifications);
                    break;

                case 'challenges':
                    that.TopTabs.Content.show(that.TopTabs.Content.Challenges);
                    break;

                case 'certify':
                    that.TopTabs.Content.show(that.TopTabs.Content.Certify);
                    break;

                default:
                    alert('none chosen');
                    break;
            }
        });
        this.TopTabs.Bar.select('certify'); // notifications

        this.layout.content.add(this.ContentStateModifier).add(this.contentScrollView);

        // Flexible Layout sequencing
        this.contentScrollView.sequenceFrom(this.contentScrollView.Views);

    };

    PageView.prototype.refreshData = function() {
        try {
            this.model.fetch();
            // this.media_collection.fetch();
            // this.errorList.fetch();
            // this.alert_collection.fetch();
            // this.CarTripListView.collection.fetch();
        }catch(err){};
    };

    PageView.prototype.inOutTransition = function(direction, otherViewName, transitionOptions, delayShowing, otherView, goingBack){
        var that = this;

        this._eventOutput.emit('inOutTransition', arguments);

        switch(direction){
            case 'hiding':

                switch(otherViewName){
                    case 'Fleet':

                        // No animation by default
                        transitionOptions.outTransform = Transform.identity;

                        // Wait for timeout of delay to hide
                        window.setTimeout(function(){

                            // // Fade header
                            // that.header.StateModifier.setOpacity(0, transitionOptions.outTransition);

                            // Hide content from a direction
                            // if(goingBack){

                            // that.ContentStateModifier.setTransform(Transform.translate(0,window.innerHeight,0), transitionOptions.outTransition);
                            // } else {
                            //     that.ContentStateModifier.setTransform(Transform.translate(window.innerWidth * -1,0,0), transitionOptions.outTransition);
                            // }

                        }, delayShowing);

                        break;

                    default:
                        // Overwriting and using default identity
                        transitionOptions.outTransform = Transform.identity;

                        window.setTimeout(function(){

                            // // Fade header
                            // that.header.StateModifier.setOpacity(0, transitionOptions.outTransition);

                            // Slide down
                            // that.ContentStateModifier.setTransform(Transform.translate(0, window.innerHeight,0), transitionOptions.outTransition);

                        }, delayShowing);

                        break;
                }

                break;

            case 'showing':
                if(this._refreshData){
                    window.setTimeout(this.refreshData.bind(this), 1000);
                }
                this._refreshData = true;
                switch(otherViewName){

                    default:

                        // No animation by default
                        transitionOptions.inTransform = Transform.identity;

                        // // Default header opacity
                        // that.header.StateModifier.setOpacity(0);

                        // // Default position
                        // if(goingBack){
                        //     that.ContentStateModifier.setTransform(Transform.translate(window.innerWidth * -1,0,0));
                        // } else {
                        //     that.ContentStateModifier.setTransform(Transform.translate(window.innerWidth + 100,0,0));
                        // }
                        // that.ContentStateModifier.setTransform(Transform.translate(0, window.innerHeight, 0));

                        // Header
                        window.setTimeout(function(){

                            // // Change header opacity
                            // that.header.StateModifier.setOpacity(1, transitionOptions.outTransition);


                        }, delayShowing);

                        // Content
                        // - extra delay
                        window.setTimeout(function(){

                            // // Bring content back
                            // that.ContentStateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);

                        }, delayShowing + transitionOptions.outTransition.duration);

                        // //Fade out the header
                        // // var previousTransform = transitionOptions.outTransform;
                        // transitionOptions.outTransform = Transform.identity;

                        // // Move the content to the left
                        // // - not the footer
                        // // console.log(transitionOptions.outTransform);
                        // // debugger;
                        // window.setTimeout(function(){

                        //     // Bring map content back
                        //     that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);

                        //     // Bring Footer Up
                        //     that.layout.footer.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.outTransition);

                        // }, delayShowing);

                        break;
                }
                break;
        }
        
        return transitionOptions;
    };


    PageView.DEFAULT_OPTIONS = {
        header: {
            size: [undefined, 50],
        },
        footer: {
            size: [0,0]
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
