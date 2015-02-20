import Ember from "ember";
import DS from "ember-data";
export default DS.RESTSerializer.extend({

	normalize: function(type, hash, prop) {
		this._parseLinkables(hash);
		return this._super(type, hash, prop);
	},

	serialize: function(record, options) {
		var json = this._super(record, options);
		var id = record.get('id');
		// get the id of the record and create a self-link with that id
		if (!Ember.isNone(id)) {
			json.links = [{
				'id': id,
				'rel': 'self'
			}];
		}
		// check each relationship
		// replace belongTo relationships with an object with self-links containing the id
		// replace hasMany relationships with an array of self-links containing the id
		record.eachRelationship(function(name, relationship) {
			var recordValue;
			if (relationship.kind === 'hasMany') {
				json[name] = [];

				recordValue = record.get(name);
				if (recordValue.get('content.isLoaded') !== true && recordValue.get('isFulfilled') !== true )
					recordValue = record.get('data.' + name);

				if (!Ember.isNone(recordValue)) {
					recordValue.mapBy('id').forEach(function(relId) {
						json[name].push({
							links: [{
								'id': relId,
								'rel': 'self'
							}]
						});
					});
				}
			} else {
				json[name] = null;
				recordValue = record.get(name);

				if (!Ember.isNone(recordValue)) {
					json[name] = {
						links: [{
							'id': recordValue.get('id'),
							'rel': 'self'
						}]
					};
				}
			}
		});
		return json;
	},

	_parseLinkables: function(hash) {
		var self = this;
		// check properties of hash for more linkables
		if (Ember.isNone(hash) || (!Ember.isArray(hash) && (typeof hash !== 'object'))) return;

		if (!Ember.isNone(hash.additionalObjects)) {
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
		Ember.keys(hash).forEach(function(key) {
			if (key === 'links' || key === 'id') return;
			var object = hash[key];
			if (Ember.isNone(object) || (!Ember.isArray(object) && (typeof object !== 'object'))) return;

			// if the object is an array with relations, get all the ids and place them in an array
			// then replace the object array with the array with ids so Ember can figure out the relation
			//
			// if the object in an object with a self link, get the id of the self link and replace the object
			// with the id so Ember can figure out the relation
			if (Ember.isArray(object)) {
				var idArray = [];
				object.forEach(function(arrayObj) {
					var id = self._getLinkableIdFromSelfLink(arrayObj);
					var type = self._getLinkableTypeFromSelfLink(arrayObj);
					if (!Ember.isNone(id)) {

						if (!Ember.isNone(type)) {
							// This self link has a type, needed for polymorphic support
							idArray.push({
								'id': id,
								'type': type
							});
						} else {
							idArray.push(id);
						}
					}
				});
				object = idArray;
			} else if (typeof object === 'object') {
				var id = self._getLinkableIdFromSelfLink(object);
				var type = self._getLinkableTypeFromSelfLink(object);
				if (!Ember.isNone(id)) {
					if (!Ember.isNone(type)) {
						object = {
							'id': id,
							'type': type
						};
					} else {
						object = id;
					}
				}
			}
			hash[key] = object;
		});

	},

	_getLinkableIdFromSelfLink: function(object) {
		if (Ember.isNone(object) || (typeof object !== 'object') || Ember.isNone(object.links)) {
			return;
		}
		var id;
		object.links.forEach(function(link) {
			if (link.rel === 'self' && !Ember.isNone(link.id)) {
				id = link.id;
				return;
			}
		});
		return id;
	},

	_getLinkableTypeFromSelfLink: function(object) {
		if (Ember.isNone(object) || (typeof object !== 'object') || Ember.isNone(object.links)) {
			return;
		}
		var type;
		object.links.forEach(function(link) {
			if (link.rel === 'self' && !Ember.isNone(link.type)) {
				type = link.type;
				return;
			}
		});
		return type;
	}
});
