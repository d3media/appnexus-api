BIN= ./node_modules/.bin
REPORTER= spec

test: test-unit check-coverage test-system
test-unit:
	@NODE_ENV=test $(BIN)/mocha \
		--reporter $(REPORTER) 
clean-coverage:
	-rm -rf lib-cov
	-rm -rf html-report
	-rm coverage-final.json 

lib-cov: clean-coverage
	$(BIN)/istanbul instrument lib --output lib-cov --no-compact

check-coverage: test-cov
	$(BIN)/istanbul check-coverage $(COVERAGE_OPTS)

test-cov: lib-cov 
	APPNEXUS_API_COV=1 \
	ISTANBUL_REPORTERS=text-summary,html,json \
	$(MAKE) test-unit REPORTER=mocha-istanbul 
test-system:
	@NODE_ENV=test $(BIN)/mocha test/system \
		--timeout 60000 \
		--reporter $(REPORTER) 



.PHONY: test test-cov check-coverage
