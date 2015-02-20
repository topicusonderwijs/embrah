import Ember from 'ember';
import DS from 'ember-data';
import UnicornCookieUtil from 'leerling/utils/unicornCookieUtil';
import ENV from 'leerling/config/environment';

/**
 * Gynzy Kids adapter met specifieke headers en een retry-wrapper om de ajax functie heen.
 **/
var ApplicationAdapter = DS.RESTAdapter.extend({
	_unicornCookieUtil: new UnicornCookieUtil(),
	coalesceFindRequests: true,
	customMediaType: 'application/vnd.topicus.unicorn+json; charset=utf-8',
	/* gaat er vanuit dat er local een rest server draait */
	host: ENV.host,
	namespace: ENV.namespace,
	headers: {},

	ajaxOptions: function(url, type, hash) {
		this.set('headers.Accept', this.get('customMediaType'));
		// check for basic authentication header cookie
		var cookie = this.get('_unicornCookieUtil').getBasicAuthCookie();
		if (!Ember.isNone(cookie) && !Ember.isNone(cookie.basicAuth)) {
			this.set('headers.GynzyKids-Auth', cookie.basicAuth);
		} else {
			this.set('headers.GynzyKids-Auth', '');
		}
		if (type !== 'GET')
			this.set('headers.Content-Type', this.get('customMediaType'));

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
				if (reason.status === 0 || reason.status === 404 || reason.status >= 500)
					return self.ajax(url, type, options, true);
				else
					throw reason;
			});
		} else {
			return this._super(url, type, options);
		}
	}
});

export default ApplicationAdapter;
