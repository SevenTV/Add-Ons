import { browserSupportsAVIF } from "../types/Util";

export default class EmotesModule extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.inject('settings');

		this.settings.add('addon.seventv_emotes.global_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Global Emotes',
				description: 'Enable global site-wide emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.unlisted_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes > Emote Visibility',
				title: 'Show unlisted emotes',
				description: 'Show emotes which have not been approved by 7TV moderators.',
				component: 'setting-check-box',
			}
		});

        let avifSupported = browserSupportsAVIF();

		this.settings.add('addon.seventv_emotes.image_format', {
			default: avifSupported ? 'AVIF' : 'WEBP',
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Preferred Image Format',
				description: `Format to use when displaying emotes from 7TV.${avifSupported ? '' : '\n\n*Warning: It appears that your browser doesn\'t fully support AVIF*'}`,
                component: 'setting-select-box',
				data: [
					{ value: 'WEBP', title: 'WEBP' },
					{ value: 'AVIF', title: 'AVIF' }
				]
			}
		});
	}
}
