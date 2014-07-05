define(function (require) {

    "use strict";

    var $                   = require('jquery'),
        Backbone            = require('backbone-adapter'),
        Credentials         = JSON.parse(require('text!credentials.json')),

        RelationshipCode = Backbone.Model.extend({

            idAttribute: '_id',

            urlRoot: Credentials.server_root + "relationships/",

            initialize: function (options) {
                // ok
                if(options.modelType == 'player' && options.player_id){
                    this.url = this.urlRoot + 'player/' + options.player_id;
                } else if(options.modelType == 'add_player'){
                    this.url = this.urlRoot + 'add_player'
                } else {
                    this.url = this.urlRoot + this.id;
                }

            },

        }),

    RelationshipCode = Backbone.UniqueModel(RelationshipCode);

    var RelationshipCodeCollection = Backbone.Collection.extend({

            model: RelationshipCode,

            urlRoot: Credentials.server_root + "relationships",

            initialize: function(models, options){
                this.url = this.urlRoot + '';
            }

        });

    return {
        RelationshipCode: RelationshipCode,
        RelationshipCodeCollection: RelationshipCodeCollection
    };

});