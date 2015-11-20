import CobraRestSerializer from "./cobra-rest";
import Ember from "ember";
import DS from "ember-data";

/**
 * Serializer which adds a json root property during normalization.
 * Done because the Cobra REST backend doesn't provide a root property anymore and the DS.RESTAdapter needs it.
 */
export default CobraRestSerializer.extend({

  // Custom json root. The backend returns a json object without a root element.
  // We need to re-assign the json payload to the singular version of the model name as its root element.
  normalizeSingleResponse: function(store, primaryModelClass, payload, id, requestType) {
    var typeKey = primaryModelClass.modelName;

    var plData = payload
    payload = new Object();
    payload[typeKey] = plData;

    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, true);
  },

  // Custom json root. The backend returns json objects without a root element.
  // We need to re-assign the json payload to the plural version of the model name as its root element.
  normalizeArrayResponse: function(store, primaryModelClass, payload, id, requestType) {
    var pluralTypeKey = Ember.Inflector.inflector.pluralize(primaryModelClass.modelName);

    var plData = payload
    payload = new Object();
    payload[pluralTypeKey] = plData;

    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, false);
  }

});
