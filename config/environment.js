'use strict';

module.exports = function(/* environment, appConfig */) {
  var ENV = {
    embrah: {
        host: 'http://localhost',
        namespace: 'rest/v1',
        authHeader: '_RestAuth',
        coalesceFindRequests: true,
        customMediaType: 'application/vnd.topicus.myapp+json; charset=utf-8',
        customAuthHeader: 'headers.MyApp-Auth',
        basicAuthCookieKey: '_basicAuth'
      }
  }
  return {};
};
