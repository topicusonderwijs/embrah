import CobraRestAdapter from 'ember-cli-embrah/adapters/cobra-rest';
import ENV from '../config/environment';

export default CobraRestAdapter.extend({

  basicAuthCookieKey: ENV.embrah.basicAuthCookieKey,
  coalesceFindRequests: ENV.embrah.coalesceFindRequests,

  customMediaType: ENV.embrah.customMediaType,

  customAuthHeader: ENV.embrah.customAuthHeader,
  host: ENV.embrah.host,
  namespace: ENV.embrah.namespace,
});
