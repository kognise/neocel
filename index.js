#!/usr/bin/env node

const NeocitiesAPI = require('./api')
const Confirm = require('prompt-confirm')
const pathLib = require('path')
const chalk = require('chalk')
const arg = require('arg')
const fetch = require('node-fetch')
const package = require('./package.json')

const deploy = async (directory, token) => {
  try {
    console.log(chalk.gray(`Deploying ${pathLib.resolve(directory)}`))

    const prompt = new Confirm('This will wipe your existing site, continue?')
    const shouldContinue = await prompt.run()
    if (!shouldContinue) {
      console.log(chalk.red('Deployment aborted'))
      return
    }

    console.log()
    const api = new NeocitiesAPI(token)

    process.stdout.write(chalk.gray('Wiping files... '))
    await api.wipe()
    console.log(chalk.green('Done!'))

    process.stdout.write(chalk.gray('Uploading new files... '))
    await api.uploadDirectory(directory)
    console.log(chalk.green('Done!'))

    console.log()
    console.log(`Deployment completed, view it at ${chalk.blue(await api.getUrl())}`)
  } catch (error) {
    console.log(chalk.red(`Error! ${error.message}`))
  }
}

const args = arg({
  '--help': Boolean,
  '--version': Boolean,
  '--token': String,
  '--yes': Boolean,
  '--dir': String,

  '-h': '--help',
  '-v': '--version',
  '-t': '--token',
  '-y': '--yes',
  '-d': '--dir'
})

if (args['--version']) {
  console.log(`Neocel version ${chalk.bold(package.version)}`)
} else if (args['--help']) {
  console.log(`
${chalk.bold('Usage:')} neocel

${chalk.gray('--help, -h')}\tShow this help
${chalk.gray('--version, -v')}\tShow the Neocel version
${chalk.gray('--token, -t')}\tSet the Neocities API key
${chalk.gray('--yes, -y')}\tAccept all yes/no prompts
${chalk.gray('--dir, -d')}\tChange the directory to deploy

Specify a token in the NEOCITIES_TOKEN environment variable or the -t tag
Get your token with \`${chalk.cyan('neocel token <username> <password>')}\`
  `.trim())
} else if (args._[0] === 'token') {
  const [ , username, password ] = args._
  if (!username || !password) {
    console.log(chalk.red('You must specify a username and password'))
    return
  }

  ;(async () => {
    const res = await fetch(`https://${encodeURIComponent(username)}:${encodeURIComponent(password)}@neocities.org/api/key`)
    const json = await res.json()

    if (!json.api_key) {
      console.log(chalk.red('There was an error generating your token'))
    } else {
      console.log(`Your token is ${chalk.blue(json.api_key)}`)
    }
  })()
} else {
  const directory = args['--dir'] || '.'
  const token = args['--token'] || process.env.NEOCITIES_TOKEN

  if (!token) {
    console.log(chalk.red('You must specify a token either through the NEOCITIES_TOKEN environment variable or the -t tag'))
    return
  }

  deploy(directory, token)
}