const OAuthClient = require('intuit-oauth');
var oauthClient ;
function connectToQuickbook(client_id,client_secret,cb){
  cb(oauthClient = new OAuthClient({
    clientId: client_id,
    clientSecret: client_secret,
    environment: process.env.QUICKBOOK_ENV,
    redirectUri: process.env.QUICKBOOK_REDIRECTURL
  }) );

}
module.exports = {oauthClient,connectToQuickbook};
