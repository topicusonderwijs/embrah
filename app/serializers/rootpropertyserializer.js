import CobraRestSerializer from "./cobra-rest";
import Ember from "ember";
import DS from "ember-data";

/**
 * Serializer which adds a json root property during normalization / serialization.
 * Done because the Cobra REST backend doesn't provide a root property anymore and the DS.RESTAdapter needs it.
 */
export default CobraRestSerializer.extend({
  doGenerateSelfLinks: false,

  // Custom json root element
  serializeIntoHash: function(hash, type, snapshot, options) {
    return Ember.merge(hash, this.serialize(snapshot, options));
  },

  normalizeSingleResponse: function(store, type, payload, id, requestType) {
    var resourceName = type.typeKey;
    if (payload.items) {
      payload[resourceName] = payload.items;
      delete payload.items;
      return this._super(store, type, payload, id, requestType);
    } else {
      var payloadEmber = {};
      payloadEmber[resourceName] = payload;
      return this._super(store, type, payloadEmber, id, requestType);
    }
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
