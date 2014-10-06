define(function (require) {

    "use strict";

    var $                   = require('jquery'),
        Backbone            = require('backbone-adapter'),
        Credentials         = JSON.parse(require('text!credentials.json')),

        Bank = Backbone.Model.extend({

            idAttribute: '_id',

            urlRoot: Credentials.server_root + "bank/",

            initialize: function () {
                // ok
                this.url = this.urlRoot + this.id;
            }

        }),

        BankCollection = Backbone.Collection.extend({

            model: Bank,

            urlRoot: Credentials.server_root + "banks",

            initialize: function(models, options){
                this.url = this.urlRoot + '';
            }

        });

    return {
        Bank: Bank,
        BankCollection: BankCollection
    };

});