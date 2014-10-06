define(function (require) {

    "use strict";

    var $                   = require('jquery'),
        Backbone            = require('backbone-adapter'),
        Credentials         = JSON.parse(require('text!credentials.json')),

        PaymentSource = Backbone.Model.extend({

            idAttribute: '_id',

            urlRoot: Credentials.server_root + "payment_source/",

            initialize: function () {
                // ok
                this.url = this.urlRoot + this.id;
            }

        }),

        PaymentSourceCollection = Backbone.Collection.extend({

            model: PaymentSource,

            urlRoot: Credentials.server_root + "payment_sources",

            initialize: function(models, options){
                this.url = this.urlRoot + '';
            }

        });

    return {
        PaymentSource: PaymentSource,
        PaymentSourceCollection: PaymentSourceCollection
    };

});