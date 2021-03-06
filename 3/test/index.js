/*
 * Test runner
 *
 */

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing'

// Dependencies
const { fp } = require('./../lib/utils')
const { reduce, forEach } = fp

// Application logic for the test runner
const _app = {}

// Holder of all tests
_app.tests = {}

// Dependencies
_app.tests.unit = require('./unit')
_app.tests.notFound = require('./notfound')
_app.tests.auth = require('./auth')
_app.tests.menu = require('./menu')
_app.tests.user = require('./user')
_app.tests.cart = require('./cart')
_app.tests.order = require('./order')
_app.tests.checkout = require('./checkout')

const appTests = Object.entries(_app.tests)

// Count all tests
const testCounter = (acc, xs) => acc + Object.keys(xs[1]).length
_app.countTests = () => reduce(testCounter)(0)(appTests)

// Run all the tests, collecting the errors and successes
_app.runTests = () => {
  let counter = 0
  let successes = 0
  const errors = []
  const numberOfTests = _app.countTests()
  forEach(type => {
    const tests = type[1]
    forEach(x => {
      const name = x[0]
      const test = x[1]
      try {
        test(() => {
          // If it calls back without throwing
          // then it succeeded, so log it in green
          console.log('\x1b[32m%s\x1b[0m', name)
          counter = counter + 1
          successes = successes + 1
          if (counter === numberOfTests) {
            _app.produceTestReport(numberOfTests, successes, errors)
          }
        })
      } catch(e) {
        console.log('error', e)
        // If it throws, then it failed, so capture
        // the error thrown and log it in red
        errors.push({
          'name' : name,
          'error' : e
        })
        console.log('\x1b[31m%s\x1b[0m', name)
        counter = counter + 1
        if (counter === numberOfTests) {
          _app.produceTestReport(numberOfTests, successes, errors)
        }
      }
    })(Object.entries(tests))
  })(appTests)
}

// Product a test outcome report
_app.produceTestReport = (numberOfTests, successes,errors) => {
  console.log("")
  console.log("--------BEGIN TEST REPORT--------")
  console.log("")
  console.log("Total Tests: ", numberOfTests)
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