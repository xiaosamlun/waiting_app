/*globals define*/
define(function(require, exports, module) {

    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var ScrollView = require('famous/views/Scrollview');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var Surface = require('famous/core/Surface');
    var InputSurface = require('famous/surfaces/InputSurface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transitionable     = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var Matrix = require('famous/core/Transform');
    var RenderNode         = require('famous/core/RenderNode')

    var Utility = require('famous/utilities/Utility');

    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var NavigationBar = require('famous/widgets/NavigationBar');
    var GridLayout = require("famous/views/GridLayout");

    // Extras
    var Utils = require('utils');
    var Credentials = JSON.parse(require('text!credentials.json'));
    var $ = require('jquery');
    var crypto = require('lib2/crypto');

    var EventHandler = require('famous/core/EventHandler');

    // Views
    var StandardHeader = require('views/common/StandardHeader');

    // Models
    var MessageModel = require('models/message');


    function PageView(options) {
        var that = this;
        View.apply(this, arguments);
        this.options = options;

        this.doNotShow = true;

        // // create the layout
        // this.layout = new HeaderFooterLayout({
        //     headerSize: 50,
        //     footerSize: 0
        // });

        // this.createHeader();

        // // create the scrollView of content
        // this.contentScrollView = new ScrollView(App.Defaults.ScrollView);
        // this.scrollSurfaces = [];
        // this.contentScrollView.sequenceFrom(this.scrollSurfaces);

        // // link endpoints of layout to widgets

        // // Header/navigation
        // this.layout.header.add(this.header);

        // // Content
        // this.layout.content.StateModifier = new StateModifier();
        // this.layout.content.add(this.layout.content.StateModifier).add(Transform.behind).add(this.contentScrollView);

        this.wizard_hash = CryptoJS.SHA3(new Date().toString());

        // Choose the User
        this.choose_username();

        // Create Model
        this.model = new MessageModel.Message();

    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;


    // Username
    PageView.prototype.choose_username = function(){
        var that = this;

        // Slide to the change screen for the player
        that.previousPage = window.location.hash;

        // Slide page
        App.Cache.UsernameOptions = {
            on_choose: that.username_changed.bind(this),
            on_cancel: that.username_canceled.bind(this),
            title: 'Username',
            back_to_default_hint: false
        };

        // Navigate to next PageView
        App.history.navigate('message/add/username/' + this.wizard_hash);

        return false;
    };
    PageView.prototype.username_canceled = function(ev){
        var that = this;
        App.history.navigate(that.previousPage);
    };
    PageView.prototype.username_changed = function(selected){
        var that = this;

        // Save to .summary
        this.summary = {};
        this.summary.username = selected;

        // Next
        this.add_text();

    };

    // Text
    PageView.prototype.add_text = function(){
        var that = this;

        // Slide to the change screen for the player
        that.previousPage = window.location.hash;

        // Slide page
        App.Cache.TextOptions = {
            on_choose: that.text_changed.bind(this),
            on_cancel: that.text_canceled.bind(this),
            title: 'Add Text',
            summary: this.summary
        };

        // Navigate to next PageView
        App.history.navigate('message/add/text/' + this.wizard_hash);

        return false;
    };
    PageView.prototype.text_canceled = function(ev){
        var that = this;
        // App.slider.slidePage(App.slider.lastPage);
        App.history.navigate(that.previousPage);
    };
    PageView.prototype.text_changed = function(selected){
        var that = this;

        // Save to .summary
        this.summary.text = selected;

        // Next
        this.add_media();

    };

    // Media
    PageView.prototype.add_media = function(){
        var that = this;

        // Slide to the change screen for the player
        that.previousPage = window.location.hash;

        // Slide page
        App.Cache.MediaOptions = {
            on_choose: that.media_changed.bind(this),
            on_cancel: that.media_canceled.bind(this),
            title: 'Add Media',
            summary: this.summary
        };

        // Navigate to next PageView
        App.history.navigate('message/add/media/' + this.wizard_hash);

        return false;
    };
    PageView.prototype.media_canceled = function(ev){
        var that = this;
        // App.slider.slidePage(App.slider.lastPage);
        App.history.navigate(that.previousPage);
    };
    PageView.prototype.media_changed = function(selected){
        var that = this;

        // Save to .summary
        this.summary.media = selected;

        // Next
        this.save_message();

    };

    PageView.prototype.save_message = function(ev){
        var that = this;

        Utils.Notification.Toast('Saving...');

        // Get elements to save
        this.model.set({
            to_username: this.summary.username,
            text: this.summary.text,
            // media: this.summary.media
        });

        console.log(this.model.toJSON());

        this.model.save()
            .then(function(newModel){

                // Created OK
                Utils.Notification.Toast('Message Created!');

                // // Enable submit
                // that.submitButtonSurface.setSize([undefined, 40]);

                // Clear sport cache
                // - todo...

                // Going back to the Dash, or back somewhere else?
                App.history.backTo('StartMessageAdd');

            });

        return false;
    };

    PageView.prototype.inOutTransition = function(direction, otherViewName, transitionOptions, delayShowing, otherView, goingBack){
        var that = this;

        this._eventOutput.emit('inOutTransition', arguments);

        switch(direction){
            case 'hiding':
                switch(otherViewName){

                    default:
                        // Overwriting and using default identity
                        transitionOptions.outTransform = Transform.identity;

                        // Content
                        window.setTimeout(function(){

                            // // Bring content back
                            // that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth,0,0), transitionOptions.inTransition);

                        }, delayShowing);

                        break;
                }

                break;
            case 'showing':
                if(this._refreshData){
                    // window.setTimeout(this.refreshData.bind(this), 1000);
                }
                this._refreshData = true;
                switch(otherViewName){

                    default:

                        // No animation by default
                        transitionOptions.inTransform = Transform.identity;

                        // // Default position
                        // if(goingBack){
                        //     that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth * -1,0,0));
                        // } else {
                        //     that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth + 100,0,0));
                        // }
                        // that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth, 0, 0));

                        // Content
                        // - extra delay for content to be gone
                        window.setTimeout(function(){

                            // // Bring content back
                            // that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);

                        }, delayShowing);


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
            size: [undefined, 0]
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
