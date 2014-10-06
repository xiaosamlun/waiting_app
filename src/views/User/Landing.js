/*globals define*/
define(function(require, exports, module) {

    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var ScrollView = require('famous/views/Scrollview');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var Surface = require('famous/core/Surface');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var InputSurface = require('famous/surfaces/InputSurface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transitionable     = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var Matrix = require('famous/core/Transform');
    var RenderNode         = require('famous/core/RenderNode')

    var Utility = require('famous/utilities/Utility');
    var Timer = require('famous/utilities/Timer');

    // Curves
    var Easing = require('famous/transitions/Easing');

    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var NavigationBar = require('famous/widgets/NavigationBar');
    var GridLayout = require("famous/views/GridLayout");

    var InAppBrowserCSS = require('text!inappbrowsercss');
    var InAppBrowserJS = require('text!inappbrowserjs');
    var Credentials         = JSON.parse(require('text!credentials.json'));
    var $ = require('jquery');
    var Utils = require('utils');

    // Views
    var StandardHeader = require('views/common/StandardHeader');
    
    var EventHandler = require('famous/core/EventHandler');

    // Models
    var UserModel = require('models/user');

    // Custom Surface
    var TextAreaSurface = require('views/common/TextAreaSurface');


    function PageView(options) {
        var that = this;
        View.apply(this, arguments);
        this.options = options;

        // User
        this.model = new UserModel.User();

        // create the layout
        this.layout = new HeaderFooterLayout({
            headerSize: App.Defaults.Header.size,
            footerSize: 132
        });

        this.layout.Bg = new Surface({
            content: '',
            size: [undefined, undefined],
            classes: ['landing-page-bg-default']
        });

        this.createHeader();
        this.createContent();
        this.createFooter();
        
        // Attach the main transform and the comboNode to the renderTree
        this.add(Utils.usePlane('content',-1)).add(this.layout.Bg);
        this.add(Utils.usePlane('content',1)).add(this.layout);

    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;


    PageView.prototype.createHeader = function(){
        var that = this;
        
        // Icons

        // Refresh
        this.headerContent = new View();
        this.headerContent.InstallGuide = new Surface({
            content: 'Guide',
            size: [80, undefined],
            classes: ['header-landing-page-text']
        });
        this.headerContent.InstallGuide.on('longtap', function(){
            Utils.Help('Misc/Landing/InstallGuide');
        });
        this.headerContent.InstallGuide.on('click', function(){
            Utils.Help('Misc/Landing/InstallGuide');

            // var ref = window.open('http://app-content.d1.meetwaiting.com/install', '_blank', 'location=no,toolbar=no');
            // // todo: prevent multiple script additions (unless URL changes)
            // ref.addEventListener('loadstop', function(e) {
            //     Utils.Notification.Toast('Exits after 3 seconds');
            //     ref.executeScript({
            //         code: InAppBrowserJS
            //     });

            //     ref.insertCSS({code: InAppBrowserCSS});
            // });

            // ref.addEventListener('loadstart', function(e){
            //     var url = Utils.parseUrl(e.url);
            //     if(url.hash == '#exit'){
            //         ref.close();
            //     }
            // });

            // ref.addEventListener('loaderror', function(e){
            //     Utils.Notification.Toast('Error loading, please try again');
            //     ref.close();
            // });


        });

        // create the header
        this.header = new StandardHeader({
            content: " ",
            bgClasses: ['header-bg-white__fuckit'],
            classes: ["normal-header","white-bg__nahnah"],
            backContent: false,
            moreSurfaces: [
                // this.headerContent.InstallGuide
            ]
        }); 
        this.header._eventOutput.on('back',function(){
            // App.history.back();
        });
        this.header.navBar.title.on('click', function(){
            // App.history.back();
        });
        this.header.pipe(this._eventInput);
        this._eventOutput.on('inOutTransition', function(args){
            this.header.inOutTransition.apply(this.header, args);
        })

        // Attach header to the layout        
        this.layout.header.add(this.header);

    };


    PageView.prototype.createFooter = function(){
        var that = this;
        
        // // create the header
        // this.header = new StandardHeader({
        //     content: "Signup",
        //     classes: ["normal-header"],
        //     backClasses: ["normal-header"],
        //     moreContent: false
        // }); 
        // this.header._eventOutput.on('back',function(){
        //     App.history.back();
        // });
        // this.header.navBar.title.on('click', function(){
        //     App.history.back();
        // });
        // this.header.pipe(this._eventInput);
        // this._eventOutput.on('inOutTransition', function(args){
        //     this.header.inOutTransition.apply(this.header, args);
        // })

        this.footer = new View();
        this.footer.SizeMod = new StateModifier({
            size: [undefined, undefined]
        });
        this.footer.SeqLayout = new SequentialLayout();
        this.footer.Views = [];

        // Sign Up button
        this.signupButton = new Surface({
            content: '<div>Create Account</div>',
            size: [window.innerWidth, 60],
            classes: ['landing-signup-button']
        });
        this.signupButton.on('click', function(){
            App.history.navigate('signup');
        });
        this.footer.Views.push(this.signupButton);

        // Login button/text
        this.loginButton = new Surface({
            content: 'Already have an account? <span>Log In</span>',
            size: [window.innerWidth, 60],
            classes: ['landing-login-button']
        });
        this.loginButton.on('click', function(){
            App.history.navigate('login');
        });
        this.footer.Views.push(this.loginButton);

        this.footer.SeqLayout.sequenceFrom(this.footer.Views);

        this.footer.add(this.footer.SizeMod).add(this.footer.SeqLayout);
        // Attach header to the layout        
        this.layout.footer.add(this.footer);

    };

    PageView.prototype.createContent = function(){
        var that = this;
        
        // Waiting Title
        this.waitingTitle = new View();
        this.waitingTitle.Bg = new Surface({
            content: '',
            size: [undefined, 300],
            classes: ['landing-title-bg-gradient']
        });
        this.waitingTitle.Surface = new Surface({
            content: '<div>Waiting App</div>',
            size: [undefined, undefined],
            classes: ['landing-page-logo-tagline-text']
        });

        this.waitingTitle.add(Utils.usePlane('content',2)).add(this.waitingTitle.Bg);
        this.waitingTitle.add(Utils.usePlane('content',3)).add(this.waitingTitle.Surface);


        // Content Modifiers
        this.layout.content.StateModifier = new StateModifier();

        // Now add content
        this.layout.content.add(this.layout.content.StateModifier).add(this.waitingTitle);


    };

    PageView.prototype.addSurfaces = function() {
        var that = this;

        // Build Surfaces
        // - add to scrollView
        this.inputEmailSurface = new InputSurface({
            name: 'email',
            placeholder: 'Email Address',
            type: 'email',
            size: [undefined, 50],
            value: ''
        });

        this.inputEmailSurface.View = new View();
        this.inputEmailSurface.View.StateModifier = new StateModifier();
        this.inputEmailSurface.View.add(this.inputEmailSurface.View.StateModifier).add(this.inputEmailSurface);
        this.contentScrollView.Views.push(this.inputEmailSurface.View);

        // Build Surfaces
        // - add to scrollView
        this.inputPasswordSurface = new InputSurface({
            name: 'password',
            placeholder: 'Password',
            type: 'password',
            size: [undefined, 50],
            value: ''
        });

        this.inputPasswordSurface.View = new View();
        this.inputPasswordSurface.View.StateModifier = new StateModifier();
        this.inputPasswordSurface.View.add(this.inputPasswordSurface.View.StateModifier).add(this.inputPasswordSurface);
        this.contentScrollView.Views.push(this.inputPasswordSurface.View);

        this.submitButtonSurface = new Surface({
            content: 'Sign Up',
            size: [undefined, 60],
            classes: ['form-button-submit-default']
        });
        this.submitButtonSurface.View = new View();
        this.submitButtonSurface.View.StateModifier = new StateModifier();
        this.submitButtonSurface.View.add(this.submitButtonSurface.View.StateModifier).add(this.submitButtonSurface);
        this.contentScrollView.Views.push(this.submitButtonSurface.View);

        // Events for surfaces
        this.submitButtonSurface.on('click', this.create_account.bind(this));


    };

    PageView.prototype.backbuttonHandler = function(){
        // killing
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

                        // Hide/move elements
                        Timer.setTimeout(function(){

                            // Slide content left
                            that.layout.content.StateModifier.setOpacity(0, {
                                duration: 750,
                                curve: 'easeIn'
                            });

                            // that.layout.content.StateModifier.setTransform(Transform.translate(-1 * window.innerWidth,0,0), transitionOptions.outTransition);

                        }, delayShowing);

                        break;
                }

                break;
            case 'showing':
                if(this._refreshData){
                    // window.setTimeout(that.refreshData.bind(that), 1000);
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

                        that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), {
                            duration: 350,
                            curve: 'easeIn'
                        });
                        
                        that.layout.content.StateModifier.setOpacity(0);

                        // that.contentScrollView.Views.forEach(function(surf, index){
                        //     surf.StateModifier.setTransform(Transform.translate(0,window.innerHeight,0));
                        // });

                        // Content
                        // - extra delay for other content to be gone
                        Timer.setTimeout(function(){

                            // // Bring content back
                            // that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);

                            that.layout.content.StateModifier.setOpacity(1, {
                                duration: 750,
                                curve: 'easeIn'
                            });

                            // // Bring in button surfaces individually
                            // that.contentScrollView.Views.forEach(function(surf, index){
                            //     window.setTimeout(function(){
                            //         surf.StateModifier.setTransform(Transform.translate(0,0,0), {
                            //             duration: 250,
                            //             curve: Easing.easeOut
                            //         });
                            //     }, index * 50);
                            // });

                        }, delayShowing); // + transitionOptions.outTransition.duration);

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


