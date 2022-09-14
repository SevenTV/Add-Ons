export class APISettings {
	constructor(dict) {
		this.apiBaseURI = 'https://stage.7tv.io/v3';
		this.eventsBaseURI = 'https://events.stage.7tv.io';
		this.appBaseURI = 'https://7tv.dev';
		// this.apiBaseURI = 'https://7tv.io/v3';
		// this.eventsBaseURI = 'https://events.7tv.io';
		// this.appBaseURI = 'https://7tv.app';

		Object.assign(this, dict);
	}
}