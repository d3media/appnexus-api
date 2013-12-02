[![Build Status](https://travis-ci.org/d3media/appnexus-api.png)](https://travis-ci.org/d3media/appnexus-api)
# appnexus-api

> appnexus-api is an easy-to-use Appnexus client for node.


## Install

	$ npm install appnexus-api

## Request throttling

This library throttle requests to respect Appnexus limits:
- Max 10 authentications per 5 minute period
- Max 60 writes per minute
- Max 100 reads per minute


## Usage 

See [system tests](test/system).

## Keep authenticated

Appnexus token is valid for 2 hours. Appnexus recomends to listen for the  
"NOAUTH" error and then reauthenticate.   
This library does not implement that behavior.  

Here is an example of continuous authentication.

    var Appnexus = require('appnexus-api'),
	reauthenticateEvery = 60*60*1000;
	reauthenticateRetry = 500;

    (function authenticate() {
        self.client.authenticate(function (err, token) {
            if (err) {
                self.emit('error', err);
                setTimeout(authenticate, reauthenticateRetry);
            } else {
                self.client.token = token;
                setTimeout(authenticate, reauthenticateEvery);
            }
        });
    }());

In the example the client try to reauthenticate every hour.  
If it fails, it will keep trying retry every 500 ms. Request throttle will prevent  
exceeding appnexus authentication request limits.

## Unit testing

You can use `mocha` with your preferred options or just `make test-unit`

## Test against Appnexus endpoint

You can run the *system* tests against an Appnexus like system.  
Before you run them, double check that your environment is set up.  
For instance you can create a `testing-env.sh` shell script like:  

	# Appnexus testing environment credentials
	export APPNEXUS_USERNAME=johndoe
	export APPNEXUS_PASSWORD=secret
	export APPNEXUS_ENDPOINT=http://sand.api.appnexus.com

And add it to your working environment with `$ . ./testing-env.sh` then

	$ npm test
or 

	$ make test-system

System tests are instrumentalised using the excellent [debug](https://github.com/visionmedia/debug) library.  


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/d3media/appnexus-api/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

