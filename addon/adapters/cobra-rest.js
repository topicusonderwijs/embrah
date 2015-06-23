import Ember from 'ember';
import DS from 'ember-data';

/**
 * Cobra REST adapter met specifieke headers en een retry-wrapper om de ajax functie heen.
 **/
export default DS.RESTAdapter.extend({

	// FIXME: Tijdelijke fix ivm deprecation
	shouldReloadAll: function() {
		return true;
	},

	// FIXME: Tijdelijke fix ivm deprecation
	shouldBackgroundReloadRecord: function() {
		return false;
	},

	headers: {},

	ajaxOptions: function(url, type, hash) {
		this.set('headers.Accept', this.get('customMediaType'));
		var cookie = this.getBasicAuthCookie();
		if (!Ember.isNone(cookie) && !Ember.isNone(cookie.basicAuth)) {
			this.set('headers.' + this.get('customAuthHeader'), cookie.basicAuth);
		} else {
			this.set('headers.' + this.get('customAuthHeader'), '');
		}
		if (type !== 'GET') {
			this.set('headers.Content-Type', this.get('customMediaType'));
		}

		return this._super(url, type, hash);
	},

	/**
	 * ajax implementatie die 1x opnieuw probeert als de request faalt.
	 **/
	ajax: function(url, type, options, isRetry) {
		if (Ember.isNone(isRetry) || isRetry === false) {
			return this._super(url, type, options).then(null, (error) => {
				if (error instanceof DS.AdapterError) {
					var statusCode = this._getStatusCode(error);
					if (statusCode && (statusCode === 0 || statusCode === 404 || statusCode >= 500)) {
						if (type !== 'GET' && Ember.isPresent(options) && Ember.isPresent(options.data) && typeof options.data === 'string') {
							options.data = JSON.parse(options.data);
						}
						return this.ajax(url, type, options, true);
					}
				}
				// return een rejectende promise met error voor graceful handling
				// voor errors die we niet retry-en
				return new Ember.RSVP.Promise((resolve, reject) => {
					reject(error);
				});
			});
		} else {
			return this._super(url, type, options);
		}
	},

	_getStatusCode: function(error) {
		if (Ember.isPresent(error.errors)) {
			for (var i = 0; i < error.errors.length; i++) {
				if (error.errors[i].status && !isNaN(error.errors[i].status)) {
					return parseInt(error.errors[i].status);
				}
			}
		}
		return null;
	},

	/**
	 * Use jQuery Cookie to fetch the value of the auth cookie
	 **/
	getBasicAuthCookie: function() {
		return $.cookie(this.get('basicAuthCookieKey'));
	}
});
