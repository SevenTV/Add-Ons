import { APIBase } from "../types/api/APIBase";

export default class APIEmotes extends APIBase {
	getEmoteAppURL(emote) {
		return `${this.settings.appBaseURI}/emotes/${emote.id}`;
	}
}