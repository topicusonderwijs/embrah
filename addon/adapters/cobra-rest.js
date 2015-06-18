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
	 * ajax implementatie die 1x opnieuw probeert bij status codes 0, 404 en >= 500
	 **/
	ajax: function(url, type, options, isRetry) {
		var self = this;
		if (Ember.isNone(isRetry) || isRetry === false) {
			return this._super(url, type, options).then(null, function(reason) {
				// als de status 0 is betekent dat connection error
				// voor 404 (not found) en 5xx willen we het ook opnieuw proberen
				// dat kan duiden op server errors
				if (reason.status === 0 || reason.status === 404 || reason.status >= 500) {
					return self.ajax(url, type, options, true);
				}
				else {
					throw reason;
				}
			});
		} else {
			return this._super(url, type, options);
		}
	},

	/**
	 * Use jQuery Cookie to fetch the value of the auth cookie
	 **/
	getBasicAuthCookie: function() {
		return $.cookie(this.get('basicAuthCookieKey'));
	}
});
