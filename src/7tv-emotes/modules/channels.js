export default class ChannelsModule extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.inject('..api');

		this.inject('settings');
		this.inject('chat');
		this.inject('chat.emotes');

		this.settings.add('addon.seventv_emotes.channel_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Channel Emotes',
				description: 'Enable channel specific emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.managers = new Map();
	}

	onEnable() {
		this.conversionCtx = {
			setIcon: this.parent.manifest.icon,
			emotesAPI: this.api.emotes
		}

		this.initializeRooms();

		this.on('chat:room-add', this.addRoom);
		this.on('chat:room-remove', this.removeRoom);
	}

	initializeRooms() {
		for (const manager of this.managers) manager.destroy();

		this.managers.clear();

		for (const channel of this.chat.iterateRooms()) {
			this.addRoom(channel);
		}
	}

	addRoom(channel) {
		let manager = new ChannelManager(this, channel);

		manager.initialize();

		this.managers.set(channel.id, manager);
	}

	removeRoom(channel) {
		let manager = this.managers.get(channel.id);

		manager.destroy();

		this.managers.delete(channel.id);
	}
}

export class ChannelManager {
	constructor(module, channel) {
		this.module = module;

		this.channel = channel;

		this.user = null;
		this.connection = null;

		this.set = null;
		this.ffzSetID = null;
	}

	async initialize() {
		await this.fetchUser();

		this.updateEmoteSet();

		this.module.on('settings:changed:addon.seventv_emotes.channel_emotes', this.onEmoteSettingsChange, this);
		this.module.on('settings:changed:addon.seventv_emotes.unlisted_emotes', this.onEmoteSettingsChange, this);
		this.module.on('settings:changed:addon.seventv_emotes.image_format', this.onEmoteSettingsChange, this);
	}

	destroy() {
		this.module.off('settings:changed:addon.seventv_emotes.channel_emotes', this.onEmoteSettingsChange, this);
		this.module.off('settings:changed:addon.seventv_emotes.unlisted_emotes', this.onEmoteSettingsChange, this);
		this.module.off('settings:changed:addon.seventv_emotes.image_format', this.onEmoteSettingsChange, this);

		this.updateEmoteSet(false);
	}

	async fetchUser() {
		let connection = await this.module.api.users.fetchUserConnection(this.channel.id);

		if (connection) {
			this.connection = connection;
			this.user = connection.user;
		}
	}

	onEmoteSettingsChange() {
		this.updateEmoteSet();
	}

	updateEmoteSet(enabled) {
		enabled = enabled ?? this.module.settings.get('addon.seventv_emotes.channel_emotes');

		if (!enabled) this.set = null;
		else this.set = this.connection?.emote_set ?? null;

		if (this.ffzSetID) {
			this.channel.removeSet('addon.seventv_emotes', this.ffzSetID);

			this.module.emotes.unloadSet(this.ffzSetID);

			this.ffzSetID = null;
		}

		if (this.set) {
			let ffzSet = this.set.toFFZ({
				...this.module.conversionCtx,
				visibility: {
					unlisted: this.module.settings.get('addon.seventv_emotes.unlisted_emotes')
				},
				imageFormat: this.module.settings.get('addon.seventv_emotes.image_format')
			});

			let setID = `addon.seventv_emotes.${this.set.id}`;

			this.channel.addSet('addon.seventv_emotes', setID, ffzSet);

			this.ffzSetID = setID;
		}
	}
}