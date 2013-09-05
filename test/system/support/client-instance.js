var appnexus = require('../../../');
client = appnexus.create({
    username: process.env.APPNEXUS_USERNAME,
    password: process.env.APPNEXUS_PASSWORD,
    endpoint: process.env.APPNEXUS_ENDPOINT
});
exports = module.exports = client;
