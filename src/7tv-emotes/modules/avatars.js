export default class Avatars extends FrankerFaceZ.utilities.module.Module {
	constructor(...args) {
		super(...args);

		this.inject('settings');
		this.inject("site");
		this.inject("site.fine");

		this.settings.add('addon.seventv_emotes.animated_avatars', {
			default: true,
			ui: {
				path: 'Add-Ons > 7TV Emotes >> User Cosmetics',
				title: 'Animated Avatars',
				description: 'Show 7TV animated avatars. [(7TV Subscriber Perk)](https://7tv.app/subscribe)',
				component: 'setting-check-box',
			}
		});

		this.userAvatars = new Map();
    }

    onEnable() {
		this.on('settings:changed:addon.seventv_emotes.animated_avatars', () => this.updateAnimatedAvatars());

		this.updateAnimatedAvatars();

		this.patchAvatarRenderer();
    }

	async patchAvatarRenderer() {
		if (this.root.flavor != "main") return;

		let avatarElement = await this.site.awaitElement(".tw-avatar");

		if (avatarElement) {
			let avatarComponent = this.site.fine.getOwner(avatarElement);

			if (avatarComponent.type.displayName == "ScAvatar") {
				let oldRenderer = avatarComponent.type.render;

				avatarComponent.type.render = (component, ...args) => {
					for (let child of component.children) {
						if (child?.type?.displayName == "ImageAvatar") this.patchImageAvatar(child);
					}
					return oldRenderer(component, ...args);
				}
			}
		}
	}

	patchImageAvatar(component) {
		let props = component.props;
		if (props.userLogin && props["data-a-target"] != "profile-image") {
			let animatedAvatarURL = this.getUserAvatar(props.userLogin);
			if (animatedAvatarURL) {
				props.SEVENTV_oldSrc = props.SEVENTV_oldSrc || props.src;
				props.src = animatedAvatarURL;
			}
			else if (props.SEVENTV_oldSrc) {
				props.src = props.SEVENTV_oldSrc;
				delete props["SEVENTV_oldSrc"];
			}
		}
	}

	async updateAnimatedAvatars() {
		this.userAvatars.clear();

		if (!this.settings.get('addon.seventv_emotes.animated_avatars')) return;

		const response = await fetch("https://api.7tv.app/v2/cosmetics/avatars?map_to=login");
		if (response.ok) {
			const json = await response.json();

			for (const [login, avatar] of Object.entries(json)) {
				this.userAvatars.set(login, avatar);
			}
		}
	};

	getUserAvatar(login) {
		return this.userAvatars.get(login.toLowerCase());
	}
}