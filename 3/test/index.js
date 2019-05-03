/*
 * Test runner
 *
 */

// Dependencies
const { fp } = require('./../lib/utils')
const { reduce, forEach } = fp

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing'

// Application logic for the test runner
const _app = {}

// Holder of all tests
_app.tests = {}

// Dependencies
_app.tests.unit = require('./unit')
// _app.tests.api = require('./api')

const appTests = Object.entries(_app.tests)

// Count all tests
const testCounter = (acc, xs) => acc + Object.keys(xs[1]).length
_app.countTests = () => reduce(testCounter)(0)(appTests)

// Run all the tests, collecting the errors and successes
_app.runTests = function() {
  let counter = 0
  let successes = 0
  const errors = []
  const limit = _app.countTests()
  forEach(type => {
    const tests = type[1]
    forEach(x => {
      const name = x[0]
      const test = x[1]
      try {
        test(function() {
          // If it calls back without throwing, then it succeeded, so log it in green
          console.log('\x1b[32m%s\x1b[0m', name)
          counter = counter + 1
          successes = successes + 1
          if (counter === limit) {
            _app.produceTestReport(limit, successes, errors)
          }
        })
      } catch(e){
        // If it throws, then it failed, so capture the error thrown and log it in red
        errors.push({
          'name' : name,
          'error' : e
        })
        console.log('\x1b[31m%s\x1b[0m', name)
        counter = counter + 1
        if (counter === limit) {
          _app.produceTestReport(limit, successes, errors)
        }
      }
    })(Object.entries(tests))
  })(appTests)
}

// Product a test outcome report
_app.produceTestReport = function(limit,successes,errors){
  console.log("")
  console.log("--------BEGIN TEST REPORT--------")
  console.log("")
  console.log("Total Tests: ", limit)
  console.log("Pass: ", successes)
  console.log("Fail: ", errors.length)
  console.log("")

  // If there are errors, print them in detail
  if (errors.length > 0) {
    console.log("--------BEGIN ERROR DETAILS--------")
    console.log("")

    forEach(e => {
      console.log('\x1b[31m%s\x1b[0m', e.name)
      console.log(e.error)
      console.log("")
    })(errors)

    console.log("")
    console.log("--------END ERROR DETAILS--------")
  }
  console.log("")
  console.log("--------END TEST REPORT--------")
  process.exit(0)

}

// Run the tests
_app.runTests()