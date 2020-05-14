const fetch = require('node-fetch')
const fs = require('fs-extra')
const pathLib = require('path')
const FormData = require('form-data')

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

module.exports = class NeocitiesAPI {
	constructor(apiKey) {
		this.apiKey = apiKey
	}

	async fetch(route, options = {}) {
		const res = await fetch(`https://neocities.org/api/${route}`, {
			...options,
			headers: {
				...options.headers,
				'Authorization': `Bearer ${this.apiKey}`
			}
		})

		const text = await res.text()
		let json
		try {
			json = JSON.parse(text)
		} catch {
			throw new Error(text.trim())
		}

		if (json.result === 'success') {
			return json
		} else {
			throw new Error(json.message)
		}
	}

	async post(route, args = []) {
		const form = new FormData()
		for (let { key, value } of args) {
			form.append(key, value)
		}

		return await this.fetch(route, {
			method: 'POST',
			body: form,
			headers: form.getHeaders()
		})
	}

	async listFiles() {
		const { files } = await this.fetch('list')
		return files.map(({ path, is_directory }) => ({
			path, isDirectory: is_directory
		}))
	}

	async deleteFiles(paths) {
		await this.post('delete', paths.map((path) => ({
			key: 'filenames[]',
			value: path
		})))
	}

	async wipe() {
		const files = await this.listFiles()
		const deletable = files
			.filter(({ path }) => path !== 'index.html' && !path.includes('/'))
			.map(({ path }) => path)
		if (deletable.length === 0) return
		await this.deleteFiles(deletable)
	}

	async uploadFiles(files) {
		const uploadable = Object.keys(files).map((path) => ({
			key: path,
			value: files[path]
		}))
		if (uploadable.length === 0) return
		await this.post('upload', uploadable)
	}

	async uploadDirectory(path) {
		const listing = await getFlatPaths(path)
		await this.uploadFiles(listing.reduce((acc, file) => {
			acc[file] = fs.createReadStream(pathLib.join(path, file))
			return acc
		}, {}))
	}

	async getUrl() {
		const { info } = await this.fetch('info')
		return `https://${info.sitename}.neocities.org/`
	}
}