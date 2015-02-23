import CobraRestAdapter from 'ember-cli-embrah/adapters/cobra-rest';
import ENV from '../config/environment';

export default CobraRestAdapter.extend({

  basicAuthCookieKey: ENV.embrah.basicAuthCookieKey,
  coalesceFindRequests: ENV.embrah.coalesceFindRequests,

  customMediaType: ENV.embrah.customMediaType,

  customAuthHeader: function() {
    return ENV.embrah.customAuthHeader;
  }.property(),

  host: ENV.embrah.host,

  namespace: function() {
    return ENV.embrah.namespace;
  }.property()

});
