import { APIObject } from "./api/APIObject";
import { EmoteSet } from "./EmoteSet";

export class User extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'id', 'string');
        this.parseProperty(json, 'username', 'string');
        this.parseProperty(json, 'display_name', 'string');
        this.parseProperty(json, 'profile_picture_url', 'string', false);
        this.parseProperty(json, 'biography', 'string', false);
        this.parseArray(json, 'roles', 'string', 'required', false);
        this.parseArray(json, 'connections', UserConnection, 'required', false);
    }
}

export class UserConnection extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'id', 'string');
        this.parseProperty(json, 'platform', 'string');
        this.parseProperty(json, 'username', 'string');
        this.parseProperty(json, 'display_name', 'string');
        this.parseProperty(json, 'linked_at', 'number');
        this.parseProperty(json, 'emote_capacity', 'number');
        this.parseProperty(json, 'user', User, false);
        this.parseProperty(json, 'emote_set', EmoteSet, false);
    }
}