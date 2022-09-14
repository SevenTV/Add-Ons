import { APIObject } from "./api/APIObject";
import { ActiveEmote } from "./Emote";
import { User } from "./User";

export class EmoteSet extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'id', 'string');
        this.parseProperty(json, 'name', 'string');
        this.parseArray(json, 'tags', 'string');
        this.parseProperty(json, 'immutable', 'boolean');
        this.parseProperty(json, 'privileged', 'boolean');
        this.parseArray(json, 'emotes', ActiveEmote, 'discard');
        this.parseProperty(json, 'capacity', 'number');
        this.parseProperty(json, 'owner', User);
    }

    toFFZ(context) {
        return {
            source: '7TV',
            title: this.name,
            icon: context?.setIcon ?? undefined,
            emotes: this.emotes.map(emote => emote.toFFZ(context)).filter(emote => emote != null)
        };
    }
}