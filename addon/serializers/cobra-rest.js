import Ember from "ember";
import DS from "ember-data";

export default DS.RESTSerializer.extend({

	normalize: function (type, hash, prop) {
		this._parseLinkables(hash);
		return this._super(type, hash, prop);
	},

	serializeIntoHash: function(hash, type, snapshot, options) {
		return Ember.merge(hash, this.serialize(snapshot, options));
	},
	
    extract: function(store, type, payload, id, requestType) {
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

	serialize: function (record, options) {
		var json = this._super(record, options);
		var id = record.get('id');
		// get the id of the record and create a self-link with that id
		if (!Ember.isNone(id)) {
			json.links = [
				{
					'id': id,
					'rel': 'self'
				}
			];
		}
		// check each relationship
		// replace belongTo relationships with an object with self-links containing the id
		// replace hasMany relationships with an array of self-links containing the id
		record.eachRelationship(function (name, relationship) {
			if (relationship.kind === 'hasMany') {
				json[name] = [];
				if (!Ember.isNone(record.get(name))) {
					record.get(name).mapBy('id').forEach(function (relId) {
						json[name].push({
							links: [
								{
									'id': relId,
									'rel': 'self'
								}
							]
						});
					});
				}
			} else {
				json[name] = null;
				if (!Ember.isNone(record.get(name))) {
					json[name] = {
						links: [
							{
								'id': record.get(name).get('id'),
								'rel': 'self'
							}
						]
					};
				}
			}
		});
		return json;
	},

	_parseLinkables: function (hash) {
		var self = this;
		// check properties of hash for more linkables
		if (Ember.isNone(hash) || (!Ember.isArray(hash) && (typeof hash !== 'object'))) {
			return;
		}

		if (!Ember.isNone(hash.additionalObjects)) {
			// Verplaats additionalObjects naar het bovenliggende object
			Ember.keys(hash.additionalObjects).forEach(function (key){
				hash[key] = hash.additionalObjects[key];
			});
			delete hash.additionalObjects;
		}
		if (!Ember.isNone(hash.permissions)) {
			delete hash.permissions;
		}

		// highest object is the root model so get id from self link and place on root
		if (!Ember.isNone(hash.links) && Ember.isNone(hash.id)) {
			hash.id = self._getLinkableIdFromSelfLink(hash);
			delete hash.links;
		}

		// look inside the hash properties for relations in the form of an array or object containing links
		Ember.keys(hash).forEach(function (key) {
			if (key === 'links' || key === 'id') {
				return;
			}
			var object = hash[key];
			if (Ember.isNone(object) || (!Ember.isArray(object) && (typeof object !== 'object'))) {
				return;
			}

			// if the object is an array with relations, get all the ids and place them in an array
			// then replace the object array with the array with ids so Ember can figure out the relation
			//
			// if the object in an object with a self link, get the id of the self link and replace the object
			// with the id so Ember can figure out the relation
			if (Ember.isArray(object)) {
				var idArray = [];
				object.forEach(function (arrayObj) {
					var id = self._getLinkableIdFromSelfLink(arrayObj);
					if (!Ember.isNone(id)) {
						idArray.push(id);
					}
				});
				object = idArray;
			} else if (typeof object === 'object') {
				var id = self._getLinkableIdFromSelfLink(object);
				if (!Ember.isNone(id)) {
					object = id;
				}
			}
			hash[key] = object;
		});

	},

	_getLinkableIdFromSelfLink: function (object) {
		if (Ember.isNone(object) || (typeof object !== 'object') || Ember.isNone(object.links)) {
			return;
		}
		var id;
		object.links.forEach(function (link) {
			if (link.rel === 'self' && !Ember.isNone(link.id)) {
				id = link.id;
				return;
			}
		});
		return id;
	}
});