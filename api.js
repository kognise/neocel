const fetch = require('node-fetch')
const FormData = require('form-data')
const pathLib = require('path')

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
			key: path.replace(/\\/g, '/'),
			value: files[path]
		}))
		if (uploadable.length === 0) return
		await this.post('upload', uploadable)
	}

	async getUrl() {
		const { info } = await this.fetch('info')
		return `https://${info.sitename}.neocities.org/`
	}
}