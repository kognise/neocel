#!/usr/bin/env node

const NeocitiesAPI = require('./api')
const Confirm = require('prompt-confirm')
const pathLib = require('path')
const chalk = require('chalk')
const arg = require('arg')
const fetch = require('node-fetch')
const fs = require('fs-extra')
const package = require('./package.json')

const supportedExtensions = 'asc atom bin css csv dae eot epub geojson gif gltf htm html ico jpeg jpg js json key kml knowl less manifest markdown md mf mid midi mtl obj opml otf pdf pgp png rdf rss sass scss svg text tsv ttf txt webapp webmanifest webp woff woff2 xcf xml'.split(' ')

const getFlatPaths = async (path, prefix = '') => {
	let paths = []

	const thesePaths = await fs.readdir(pathLib.join(prefix, path))
	for (let innerPath of thesePaths) {
		const innerName = pathLib.join(prefix, path, innerPath)
		const stats = await fs.stat(innerName)

		if (stats.isDirectory()) {
			const theseFlatPaths = await getFlatPaths(innerPath, pathLib.join(prefix, path))
			paths = [ ...paths, ...theseFlatPaths.map((flatPath) => pathLib.join(innerPath, flatPath)) ]
		} else {
			paths.push(innerPath)
		}
	}

	return paths
}

const deploy = async (directory, token, skipPrompts) => {
  try {
    console.log(chalk.gray(`Deploying ${pathLib.resolve(directory)}`))

    const prompt = new Confirm('This will wipe your existing site, continue?')
    const shouldContinue = skipPrompts ? true : await prompt.run()
    if (!shouldContinue) {
      console.log(chalk.red('Deployment aborted'))
      process.exit(1)
    }

    console.log()
    const api = new NeocitiesAPI(token)

    process.stdout.write(chalk.gray('Wiping files... '))
    await api.wipe()
    console.log(chalk.green('Done!'))

    process.stdout.write(chalk.gray('Crawling directory... '))
    const listing = await getFlatPaths(directory)
    const filteredListing = listing.filter((file) => supportedExtensions.includes(file.split('.').reverse()[0].toLowerCase()))
    const elimintated = listing.length - filteredListing.length
    if (elimintated !== 0) {
      console.log(chalk.yellow(`${elimintated} file${elimintated === 1 ? '' : 's'} were unsupported, this is probably fine`))
    } else {
      console.log(chalk.green('Done!'))
    }

    process.stdout.write(chalk.gray('Uploading new files... '))
    await api.uploadFiles(filteredListing.reduce((acc, file) => {
			acc[file] = fs.createReadStream(pathLib.join(directory, file))
			return acc
		}, {}))
    console.log(chalk.green('Done!'))

    console.log()
    console.log(`Deployment completed, view it at ${chalk.blue(await api.getUrl())}`)
  } catch (error) {
    console.log(chalk.red(`Error! ${error.message}`))
    process.exit(1)
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
    process.exit(1)
  }

  ;(async () => {
    const res = await fetch(`https://${encodeURIComponent(username)}:${encodeURIComponent(password)}@neocities.org/api/key`)
    const json = await res.json()

    if (!json.api_key) {
      console.log(chalk.red('There was an error generating your token'))
      process.exit(1)
    } else {
      console.log(`Your token is ${chalk.blue(json.api_key)}`)
    }
  })()
} else {
  const directory = args['--dir'] || '.'
  const token = args['--token'] || process.env.NEOCITIES_TOKEN

  if (!token) {
    console.log(chalk.red('You must specify a token either through the NEOCITIES_TOKEN environment variable or the -t tag'))
    process.exit(1)
  }

  deploy(directory, token, args['--yes'])
}