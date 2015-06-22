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
			return this._super(url, type, options).then(null, () => {
				return this.ajax(url, type, options, true);
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
