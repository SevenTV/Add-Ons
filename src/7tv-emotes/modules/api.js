import { APISettings } from "../types/api/APISettings";

export default class APIModule extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.settings = new APISettings({
			clientPlatform: 'ffz',
			clientVersion: this.parent.manifest.version
		});
	}

	async onLoad() {
		let context = await require.context('../api', false, /\.js$/);
		for (let path of context.keys()) {
			let module = await context(path);
			let id = path.slice(2, path.lastIndexOf('.'));
			let cl = module.default;

			if (cl) this[id] = new cl(this.settings);
		}
	}
}