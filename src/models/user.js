define(function (require) {

		"use strict";

		var $                   = require('jquery'),
				Backbone            = require('backbone-adapter'),
				Utils = require('utils'),

				Credentials         = JSON.parse(require('text!credentials.json')),

				User = Backbone.DeepModel.extend({

						idAttribute: '_id',
						
						urlRoot: Credentials.server_root + "user",

						initialize: function (defaults) {
							defaults = defaults || {};
							this.url = this.urlRoot;
							if(defaults.profile_id){
								this.url = this.urlRoot + '/profile/' + defaults.profile_id;
							}
								
						},

						submitEmailCode: function(code){
							var def = $.Deferred();

							$.ajax({
								url: Credentials.server_root + 'user/verify/email/',
								data: {
									code: code, 
									platform: App.Config.devicePlatform
								},
								method: 'post',
								success: function(result){
									// verified
									def.resolve();
								},
								error: function(){
									def.reject();
								}
							}); 

							return def.promise();
						},

						verifiedEmail: function(){
							var def = $.Deferred();

							$.ajax({
								url: Credentials.server_root + 'user/verify/status/',
								method: 'get',
								cache: false,
								success: function(result){
									// verified
									// console.error(JSON.stringify(result));
									// Utils.Notification.Toast(result);
									if(result.verified == true){
										def.resolve();
										return;
									}
									// alert(JSON.stringify(result));
									def.reject(result);
								},
								error: function(err){
									def.reject(err);
								}
							}); 

							return def.promise();
						},

						resendEmail: function(){
							var def = $.Deferred();
							
							$.ajax({
								url: Credentials.server_root + 'user/email/',
								method: 'post',
								data: {
									email: localStorage.getItem(Credentials.local_user_email)
								},
								success: function(){
									// resent
									def.resolve();
								},
								error: function(){
									def.reject();
								}
							});  

							return def.promise();
						},

						signup: function(body){
								// Log in a user with credentials
								// - store login information in the global scope

								// Deferred
								var def = $.Deferred();

								// Run ajax command from here, instead of from View
								$.ajax({
									url: Credentials.server_root + 'signup',
									data: body,
									method: 'POST',
									success: function(response){
										// Signed up OK

										def.resolve(response);

									},
									error: function(errResponse){
										def.reject(errResponse);
									}
								});

								return def.promise();

						},

						login: function(body){
								// Log in a user with credentials
								// - store login information in the global scope

								// Deferred
								var def = $.Deferred();

								var extra = '';
								if(body.facebook === true){
									extra = '/facebook';
								}
								if(body.gplus === true){
									extra = '/gplus';
								}

								// Run ajax command from here, instead of from View
								$.ajax({
									url: Credentials.server_root + 'login' + extra,
									data: body,
									method: 'POST',
									success: function(response){
										// Great!
										//  store the access token

										var token = response.token;

										// Store access_token in localStorage
										localStorage.setItem(App.Credentials.local_token_key, token);
										App.Data.UserToken = token;

										console.log(response);

										// Update ajaxSetup with x-token header
										$.ajaxSetup({
												headers: {
														"x-token" : token
														// 'Authorization' : 'Bearer ' + response.access_token
												}
										});

										App.Data.User = new User({
											_id: response._id
										});
										App.Data.User.populated().then(function(){
											localStorage.setItem(App.Credentials.local_user_key, JSON.stringify(App.Data.User.toJSON()));
										});
										App.Data.User.fetch();

										// Save user email
										localStorage.setItem(Credentials.local_user_email, body.email.toLowerCase())

										// Preload Models
										require(['models/preload'], function(PreloadModels){
												PreloadModels(App);
										});

										// Register for Push Notifications
										App.DeviceReady.initPush();
											
										// Store websocket access_token
										var websocket_token = response.websocket;
										localStorage.setItem(App.Credentials.local_token_key +'_websocket', websocket_token);
										App.Data.UserWebsocketToken = websocket_token;

										// Login to Firebase
										Utils.Websocket.login(websocket_token);

										// Return to original
										def.resolve(response);

									},
									error: function(errResponse){
										def.reject(errResponse);
									}
								});

								return def.promise();

						},

						gplus_login: function(){
							var that = this;

							// Browser
							if(!App.usePg){

								gapi.auth.signIn({
									clientid : App.Credentials.gplus_web_client_id,
									scope: App.Credentials.gplus_scopes,
									cookiepolicy : 'none', //single_host_origin',
									callback : function(authResult){
										// Successful login?
										if (authResult['status']['signed_in']) {
											console.log(authResult);
											// debugger;
											window.setTimeout(function(){
												that.gplus_token_login(authResult.access_token, authResult.id_token);
											},100 * Math.random());
											return;
										}

										Utils.Notification.Toast('Failed login with Google+');
									}
								});

								// // Set the API key
								// gapi.client.setApiKey(App.Credentials.gplus_web_api_key);

								// // Run authorization (with a popup)
								// window.setTimeout(function(){
								// 	gapi.auth.authorize({client_id: App.Credentials.gplus_web_client_id, scope: App.Credentials.gplus_scopes, immediate: true}, function(result){
								// 		// Auth result
								// 		console.log(result);
								// 	});
								// },1);

								return;
							}

							// Utils.Notification.Toast('Native Google+ Attempt');

							// Native app
							try {
								// window.plugins.googleplus.webApiKey = '454863296911-qc94sk5gs4ucg6v9vul1p3midhst0lba.apps.googleusercontent.com';
								// window.plugins.googleplus.androidApiKey = '454863296911-o5r82tbns4umih6jr60dl99pfqicrnls.apps.googleusercontent.com';
						        window.plugins.googleplus.login(
						            {
						              iOSApiKey: App.Credentials.gplus_ios_client_id,
						              // webApiKey: '454863296911-qc94sk5gs4ucg6v9vul1p3midhst0lba.apps.googleusercontent.com'
						              // androidApiKey: '454863296911-fvebomm4p53bvkc2frffqik09k75deh8.apps.googleusercontent.com'
						              // there is no API key for Android; you app is wired to the Google+ API by listing your package name in the google dev console and signing your apk
						            },
						            function (obj) {

										// obj.email        
										// obj.userId       
										// obj.displayName  
										// obj.gender       
										// obj.imageUrl     
										// obj.givenName    
										// obj.middleName   
										// obj.familyName   
										// obj.birthday     
										// obj.ageRangeMin  
										// obj.ageRangeMax  
										// obj.idToken // only if using androidWebKey! (or ios?)
										// obj.oauthToken

										// alert(JSON.stringify(obj));

										Utils.Notification.Toast('Logging in through Google+');

										that.gplus_token_login(obj.oauthToken, obj.email);

						            },
						            function (msg) {
										Utils.Notification.Toast('Failed Google+ login');
										Utils.Notification.Toast(msg);
										console.log(msg);

						                window.plugins.googleplus.logout(
						                    function (msg) {
						                      console.log(msg);
						                    }
						                );

						            }
						        );
						    }catch(err){
						    	Utils.Popover.Alert('Google+ login not available. Please Sign Up with Email');
						    }
						},

						gplus_token_login: function(token, email){
							// used by fb_login for exchanging a token for a server_token

							if(App.Cache.is_logging_in){
								return;
							}
							App.Cache.is_logging_in = true;

							$.ajax({
								url: App.Credentials.server_root + 'login/gplus',
								method: 'post',
								data: {
										token: token,
										email: email
								},
								error: function(){
									App.Cache.is_logging_in = false;
									// alert('failed token submit');
									Utils.Notification.Toast('Failed login on server');

					                window.plugins.googleplus.logout(
					                    function (msg) {
					                      console.log(msg);
					                    }
					                );

								},
								success: function(response){
									App.Cache.is_logging_in = false;

									// alert('logged in with fb!');
									Utils.Notification.Toast('Logged In With Google+');

									console.log('Server response:');
									console.log(response);

									// Save our token and whatnot

									var userModel = new User();

									var data = {
											gplus: true,
											token: token,
											email: email,
											platform: App.Config.devicePlatform
									};

									// Test fetching a user
									userModel.login(data)
									.fail(function(){
											// invalid login

											Utils.Popover.Alert('Sorry, unable to login via Google+', 'Try Again');
											// that.checking = false;
											// that.submitButton.setContent('Login');

									})
									.then(function(response){
											// Success logging in
											// - awesome!

											// that.checking = false;
											// that.submitButton.setContent('Login');

											// alert('Login actually worked awesome');
											Utils.Notification.Toast('Logged in!');

											// Go to signup/home (will get redirected)
											App.history.eraseUntilTag('all-of-em');
											App.history.navigate(App.Credentials.home_route);

									});


								}
							});

						},


						fb_login: function(){
							var that = this;

							// Browser
							if(!App.usePg){
								FB.login(function(response){
									if(response && response.authResponse){
										var token = response.authResponse.accessToken;
										that.fb_token_login(token);
										return;
									}

									Utils.Notification.Toast('Did not login to Facebook');

								},{
									scope: App.Credentials.fb_permissions
								});
								return;
							}

							// Native App
							try {
								facebookConnectPlugin.login(App.Credentials.fb_permissions,
									// success
									function (userData) {
										
										facebookConnectPlugin.getAccessToken(function(token) {

											that.fb_token_login(token);

										}, function(err) {
												alert("Could not get access token: " + err);
										});
									},
									// error
									function (error) { 
										console.error(error) 
									}
								);
							}catch(err){
						    	Utils.Popover.Alert('Facebook login not available. Please Sign Up with Email');
							}

						},

						fb_token_login: function(token){
							// used by fb_login for exchanging a token for a server_token

							$.ajax({
									url: App.Credentials.server_root + 'login/facebook',
									method: 'post',
									data: {
											token: token
									},
									error: function(){
											// alert('failed token submit');

									},
									success: function(response){
											// alert('logged in with fb!');
											Utils.Notification.Toast('Logged In With Facebook');

											// Save our token and whatnot

											var userModel = new User();

											var data = {
													facebook: true,
													token: token,
													platform: App.Config.devicePlatform
											};

											// Test fetching a user
											userModel.login(data)
											.fail(function(){
													// invalid login

													Utils.Popover.Alert('Sorry, unable to login via Facebook', 'Try Again');
													// that.checking = false;
													// that.submitButton.setContent('Login');

											})
											.then(function(response){
													// Success logging in
													// - awesome!

													// that.checking = false;
													// that.submitButton.setContent('Login');

													// alert('Login actually worked awesome');
													Utils.Notification.Toast('Logged in!');

													// Go to signup/home (will get redirected)
													App.history.eraseUntilTag('all-of-em');
													App.history.navigate(App.Credentials.home_route);

											});


									}
							});

						},

						inviteViaEmail: function(email){
							var def = $.Deferred();

							$.ajax({
								url: Credentials.server_root + 'invite/user/email',
								data: {
									email: email
								},
								method: 'post',
								success: function(result){
									// verified
									def.resolve();
								},
								error: function(){
									def.reject();
								}
							}); 

							return def.promise();
						},

				});

				User = Backbone.UniqueModel(User);

				var UserCollection = Backbone.Paginator.requestPager.extend({

						model: User,

						url: Credentials.server_root + "users",
						urlRoot: Credentials.server_root + "users",

						// Paginator Core
						paginator_core: {
							// the type of the request (GET by default)
							type: 'GET',

							// the type of reply (jsonp by default)
							dataType: 'json',

							// the URL (or base URL) for the service
							// if you want to have a more dynamic URL, you can make this a function
							// that returns a string
							url: function(){return this.url}
						},

						// Paginator User Interface (UI)
						paginator_ui: {
							// the lowest page index your API allows to be accessed
							firstPage: 0,

							// which page should the paginator start from
							// (also, the actual page the paginator is on)
							currentPage: 0,

							// how many items per page should be shown
							perPage: 20,
							totalPages: 10 // the default, gets overwritten
						},

						// Paginator Server API
						server_api: {
							// the query field in the request
							'$filter': '',

							// number of items to return per request/page
							'$top': function() { return this.perPage },

							// how many results the request should skip ahead to
							// customize as needed. For the Netflix API, skipping ahead based on
							// page * number of results per page was necessary.
							'$skip': function() { return this.currentPage * this.perPage },

							// // field to sort by
							// '$orderby': 'ReleaseYear',

							// what format would you like to request results in?
							'$format': 'json',

							// custom parameters
							'$inlinecount': 'allpages',
							// '$callback': 'callback'
						},

						// Paginator Parsing
						parse: function (response) {
								this.totalPages = Math.ceil(response.total / this.perPage);
								this.totalResults = response.total;
								return response.results;
						},

						initialize: function(models, options){
								options = options || {};
								this.options = options;

								if(options.type == 'sentence_to_select'){
									this.url = Credentials.server_root + 'sentence/users/to_select';
								}

								if(options.type == 'sentence_matched'){
									this.url = Credentials.server_root + 'sentence/users/matched';
								}

						}

				});

		return {
				User: User,
				UserCollection: UserCollection
		};

});