import { APIError } from "./APIError";

export class APIBase {
	constructor(settings) {
		this.settings = settings;
	}

	makeRequest(route, options) {
		const headers = new Headers(options && options.headers || {});

		if (this.settings.clientPlatform) headers.set('X-SevenTV-Platform', this.settings.clientPlatform);
		if (this.settings.clientVersion) headers.set('X-SevenTV-Version', this.settings.clientVersion);

		return fetch(`${this.settings.apiBaseURI}/${route}`, {...options, headers: headers})
	}

	async requestJSON(route, options) {
		const response = await this.makeRequest(route, options);

		let json = await response.json();

		if (response.status == 200) {
			return json;
		}
		else {
			throw new APIError(json?.error_code ?? 0, json?.error ?? '', response.status);
		}
	}
}