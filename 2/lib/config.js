const envs = {}

envs.staging = {
  port: 8080,
  env: 'staging',
  hashingSecret : 'thisIsASecret',
  stripeKey: 'sk_test_YaXKW96CBZqBuGKcsi1tl6Eo'
}

envs.production = {
  port: 8081,
  env: 'production',
  hashingSecret : 'thisIsASecret',
  stripeKey: 'sk_test_YaXKW96CBZqBuGKcsi1tl6Eo'
}

const envToUse = Object.keys(envs).includes(process.env.NODE_ENV)
  ? process.env.NODE_ENV
  : 'staging'

module.exports = envs[envToUse]