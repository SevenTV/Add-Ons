class SevenTVEmotes extends Addon {
	constructor(...args) {
		super(...args);

		this.inject('settings');
		this.inject('chat');
		this.inject('chat.emotes');
		this.inject('chat.badges');
		this.inject('site');
		this.injectAs('siteChat', 'site.chat');

		this.settings.add('addon.seventv_emotes.global_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Global Emotes',
				description: 'Enables global emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.channel_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes',
				title: 'Channel Emotes',
				description: 'Enables channel specific emotes from 7TV.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.unlisted_emotes', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes > Emote Visibility',
				title: 'Show Unlisted Emotes',
				description: 'Show emotes which have been deemed non-TOS friendly by 7TV moderators.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.emote_updates', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes > Live Emote Updates',
				title: 'Enable emote updates',
				description: 'Enables live updates when a 7TV emote is added or removed in the current channel.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.update_messages', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> Emotes > Live Emote Updates',
				title: 'Show update messages',
				description: 'Show messages in chat when emotes are updated in the current channel.',
				component: 'setting-check-box',
			}
		});

		this.settings.add('addon.seventv_emotes.badges', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> User Cosmetics',
				title: 'Badges',
				description: 'Show 7TV user badges. (Per-badge visibilty can be set in [Chat >> Badges > Visibilty > Add-Ons](~chat.badges))',
				component: 'setting-check-box',
			}
		});

		this.bulkBadgeIDs = new Set();
	}

	async onEnable() {
		this.chat.context.on('changed:addon.seventv_emotes.badges', () => this.updateBadges());
		this.chat.context.on('changed:addon.seventv_emotes.global_emotes', () => this.updateGlobalEmotes());
		this.chat.context.on('changed:addon.seventv_emotes.channel_emotes', () => {
			this.updateChannelSets();
			this.updateEventSource();
		});
		this.chat.context.on('changed:addon.seventv_emotes.unlisted_emotes', () => this.updateChannelSets());
		this.chat.context.on('changed:addon.seventv_emotes.emote_updates', () => this.updateEventSource());

		this.on('chat:room-add', this.addChannel, this);
		this.on('chat:room-remove', this.removeChannel, this);

		this.updateBadges();
		this.updateGlobalEmotes();
		this.updateChannelSets();
		this.updateEventSource();
	}

	addChannel(channel) {
		this.updateChannelSet(channel);
		this.updateEventSource();
	}

	removeChannel(channel) {
		this.setChannelSet(channel, null);
		this.updateEventSource();
	}

	async updateGlobalEmotes() {
		this.emotes.removeDefaultSet('addon.seventv_emotes', 'addon.seventv_emotes.global');
		this.emotes.unloadSet('addon.seventv_emotes.global');

		if (!this.chat.context.get('addon.seventv_emotes.global_emotes')) return;

		const response = await fetch("https://api.7tv.app/v2/emotes/global");
		if (response.ok) {
			const json = await response.json();

			const emotes = [];
			for (const emote of json) {
				emotes.push(this.convertEmote(emote));
			}

			this.emotes.addDefaultSet('addon.seventv_emotes', 'addon.seventv_emotes.global', {
				title: "Global Emotes",
				source: "7TV",
				icon: "https://7tv.app/assets/favicon.png",
				emotes: emotes
			});
		}
	}

	async updateBadges() {
		this.removeBadges();

		if (this.chat.context.get('addon.seventv_emotes.badges')) {
			const response = await fetch(`https://api.7tv.app/v2/badges?user_identifier=twitch_id`);
			if (response.ok) {
				const json = await response.json();
				if (typeof json == "object" && json != null && json.badges) {
					for (const badge of json.badges) {
						const id = `addon.seventv_emotes.badge-${badge.id}`;
						this.badges.loadBadgeData(id, {
							id: badge.id,
							title: badge.tooltip,
							slot: 69,
							image: badge.urls[1][1],
							urls: {
								1: badge.urls[2][1]
							},
							svg: false
						});

						this.badges.setBulk('addon.seventv_emotes', id, badge.users);
						this.bulkBadgeIDs.add(id);
					}
				}
			}
		}
	}

	removeBadges() {
		for (let id of this.bulkBadgeIDs) {
			this.badges.deleteBulk("addon.seventv_emotes", id);
			delete this.badges.badges[id];
		}

		this.badges.buildBadgeCSS();

		this.bulkBadgeIDs.clear();
	}

	getChannelSetID(channel) {
		return `addon.seventv_emotes.channel-${channel.id}`;
	}

	getChannelSet(channel) {
		return this.emotes.emote_sets[this.getChannelSetID(channel)];
	}

	setChannelSet(channel, ffzEmotes) {
		const setID = this.getChannelSetID(channel);

		channel.removeSet('addon.seventv_emotes', setID);
		this.emotes.unloadSet(setID);

		if (ffzEmotes && ffzEmotes.length > 0) {
			channel.addSet('addon.seventv_emotes', setID, {
				title: "Channel Emotes",
				source: "7TV",
				icon: "https://7tv.app/assets/favicon.png",
				emotes: ffzEmotes
			});
		}
	}

	addEmoteToChannelSet(channel, emote, force = false) {
		const emoteSet = this.getChannelSet(channel);

		if (emoteSet) {
			if (force || this.shouldShowEmote(emote)) {
				const emotes = emoteSet.emotes || {};

				emotes[emote.id] = this.convertEmote(emote);

				this.setChannelSet(channel, Object.values(emotes));
				return true;
	    	}
		}

		return false;
	}

	removeEmoteFromChannelSet(channel, emote) {
		const emoteSet = this.getChannelSet(channel);

		if (emoteSet) {
			const emotes = emoteSet.emotes || {};

			if (emotes[emote.id] === undefined) return false;

			delete emotes[emote.id];

			this.setChannelSet(channel, Object.values(emotes));
			return true;
		}

		return false;
	}

	async updateChannelSet(channel) {
		if (this.chat.context.get('addon.seventv_emotes.channel_emotes')) {
			const response = await fetch(`https://api.7tv.app/v2/users/${channel.login}/emotes`);

			if (response.ok) {
				let emotes = await response.json();

				let ffzEmotes = [];
				for (let emote of emotes) {
					if (this.shouldShowEmote(emote)) {
						ffzEmotes.push(this.convertEmote(emote));
					}
				}

				this.setChannelSet(channel, ffzEmotes);
				return true;
			}
		}

		this.setChannelSet(channel, null);
		return false;
	}

	async updateChannelSets() {
		for (const channel of this.chat.iterateRooms()) {
			await this.updateChannelSet(channel);
		}
	}

	getBitFlag(byte, mask) {
		return (byte & mask) == mask;
	}

	convertEmote(emote) {
		const ffzEmote = {
			id: emote.id,
			name: emote.name,
			urls: {
				1: emote.urls[0][1],
				2: emote.urls[1][1],
				3: emote.urls[2][1],
				4: emote.urls[3][1]
			},
			modifier: this.getBitFlag(emote.visibility, 1 << 7),
			modifier_offset: "0",
			width: emote.width[0],
			height: emote.height[0],
			click_url: `https://7tv.app/emotes/${emote.id}`
		};

		if (emote.owner) {
			ffzEmote.owner = {
				display_name: emote.owner.display_name,
				name: emote.owner.login
			};
		}

		return ffzEmote;
	}

	shouldShowEmote(emote) {
		const ShowUnlisted = this.chat.context.get('addon.seventv_emotes.unlisted_emotes');

		const Unlisted = this.getBitFlag(emote.visibility, 1 << 2);
		const PermanentlyUnlisted = this.getBitFlag(emote.visibility, 1 << 8);

		return ShowUnlisted || !(Unlisted || PermanentlyUnlisted);
	}

    updateEventSource() {
        this.closeEventSource();

		if (this.chat.context.get('addon.seventv_emotes.emote_updates') && this.chat.context.get('addon.seventv_emotes.channel_emotes')) {
			const channelLogins = [];
			for (let channel of this.chat.iterateRooms()) channelLogins.push(channel.login);

			if (channelLogins.length > 0) {
				this.eventSource = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${encodeURIComponent(channelLogins.join(","))}`);

				this.eventSource.addEventListener("open", () => this.eventSourceReconnectDelay = undefined);

				this.eventSource.addEventListener("update", event => this.handleChannelEmoteUpdate(event));

				this.eventSource.addEventListener("error", () => {
					if (this.eventSource.readyState == EventSource.CLOSED) {
						this.closeEventSource();

						if (!this.eventSourceReconnectDelay) this.eventSourceReconnectDelay = 5000;

						this.eventSourceReconnectTimeout = setTimeout(() => {
							this.eventSourceReconnectTimeout = undefined;
							this.updateEventSource();
						}, this.eventSourceReconnectDelay);

						this.eventSourceReconnectDelay *= 2 + Math.random() * 0.2;
					}
				});
			}
		}
    }

    closeEventSource() {
        if (this.eventSource) this.eventSource.close();
        if (this.eventSourceReconnectTimeout) clearTimeout(this.eventSourceReconnectTimeout);
        this.eventSource = null;
        this.eventSourceReconnectTimeout = undefined;
    }

	handleChannelEmoteUpdate(event) {
		if (!this.chat.context.get('addon.seventv_emotes.channel_emotes')) return;

		let data = JSON.parse(event.data);

		let channel;
		for (const room of this.chat.iterateRooms()) {
			if (room.login == data.channel) {
				channel = room;
				break;
			}
		}

		if (channel) {
			let completed = false;
			switch (data.action) {
				case 'ADD':
				case 'UPDATE':
					completed = this.addEmoteToChannelSet(channel, {...data.emote, id: data.emote_id, name: data.name});
					break;
				case 'REMOVE':
					completed = this.removeEmoteFromChannelSet(channel, {...data.emote, id: data.emote_id, name: data.name});
					break;
			}

			if (completed && this.chat.context.get('addon.seventv_emotes.update_messages')) {
				let message = `[7TV] ${data.actor} `;
				switch (data.action) {
					case 'ADD': {
						message += `added the emote "${data.name}"`;
						break;
					}
					case 'REMOVE': {
						message += `removed the emote "${data.name}"`;
						break;
					}
					case 'UPDATE': {
						if (data.emote.name != data.name) {
							message += `aliased the emote "${data.emote.name}" to "${data.name}"`;
						}
						else {
							message += `unaliased the emote "${data.name}"`;
						}
						break;
					}
					default: {
						message += `performed '${data.action}' on the emote "${data.name}"`;
						break;
					}
				}
				this.siteChat.addNotice(channel.login, message);
			}
		}
	}
}

SevenTVEmotes.register();