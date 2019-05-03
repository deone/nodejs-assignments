const envs = {}

envs.staging = {
  port: 8080,
  env: 'staging',
  hashingSecret : 'thisIsASecret',
  stripeKey: process.env.STRIPE_KEY,
  mailgunDomain: 'sandboxcdc8e4d68fec495cb2e45f0ba0fc2293.mailgun.org',
  mailgunKey: process.env.MAILGUN_KEY
}

envs.production = {
  port: 8081,
  env: 'production',
  hashingSecret : 'thisIsASecret',
  stripeKey: process.env.STRIPE_KEY,
  mailgunDomain: 'sandboxcdc8e4d68fec495cb2e45f0ba0fc2293.mailgun.org',
  mailgunKey: process.env.MAILGUN_KEY
}

envs.testing = {
  port: 8082,
  env: 'testing',
  hashingSecret : 'thisIsASecret',
  stripeKey: process.env.STRIPE_KEY,
  mailgunDomain: 'sandboxcdc8e4d68fec495cb2e45f0ba0fc2293.mailgun.org',
  mailgunKey: process.env.MAILGUN_KEY
}

const envToUse = Object.keys(envs).includes(process.env.NODE_ENV)
  ? process.env.NODE_ENV
  : 'staging'

module.exports = envs[envToUse]