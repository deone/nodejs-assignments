const envs = {}

envs.staging = {
  port: 8080,
  env: 'staging',
  hashingSecret : 'thisIsASecret'
}

envs.production = {
  port: 8081,
  env: 'production',
  hashingSecret : 'thisIsASecret'
}

const envToUse = Object.keys(envs).includes(process.env.NODE_ENV)
  ? process.env.NODE_ENV
  : 'staging'

module.exports = envs[envToUse]