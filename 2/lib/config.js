const envs = {}

envs.staging = {
  port: 8080,
  env: 'staging',
  hashingSecret : 'thisIsASecret',
  stripeKey: 'sk_test_YaXKW96CBZqBuGKcsi1tl6Eo',
  mailgunDomain: 'sandboxcdc8e4d68fec495cb2e45f0ba0fc2293.mailgun.org'
}

envs.production = {
  port: 8081,
  env: 'production',
  hashingSecret : 'thisIsASecret',
  stripeKey: 'sk_test_YaXKW96CBZqBuGKcsi1tl6Eo',
  mailgunDomain: 'sandboxcdc8e4d68fec495cb2e45f0ba0fc2293.mailgun.org'
}

const envToUse = Object.keys(envs).includes(process.env.NODE_ENV)
  ? process.env.NODE_ENV
  : 'staging'

module.exports = envs[envToUse]