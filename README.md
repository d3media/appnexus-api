[![Build Status](https://travis-ci.org/d3media/appnexus-api.png)](https://travis-ci.org/d3media/appnexus-api)
# appnexus-api
appnexus-api is an easy-to-use Appnexus client for node.

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

