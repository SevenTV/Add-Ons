import { hasBitFlag } from "./Util";
import { APIObject } from "./api/APIObject";
import { User } from "./User";

export class ActiveEmote extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'id', 'string');
        this.parseProperty(json, 'name', 'string');
        this.parseProperty(json, 'flags', 'number');
        this.parseProperty(json, 'timestamp', 'number', false);
        this.parseProperty(json, 'actor_id', 'string', false);
        this.parseProperty(json, 'data', Emote);
    }

    toFFZ(context) {
        let data = this.data.toFFZ(context);

        if (data) return {
            ...data,
            name: this.name
        };
    }

    hasFlags(flags) {
        return hasBitFlag(this.flags, flags);
    }
}

export class Emote extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'id', 'string');
        this.parseProperty(json, 'name', 'string');
        this.parseProperty(json, 'flags', 'number');
        this.parseArray(json, 'tags', 'string');
        this.parseProperty(json, 'lifecycle', 'number');
        this.parseProperty(json, 'listed', 'boolean');
        this.parseProperty(json, 'owner', User, false);
        this.parseProperty(json, 'host', EmoteFiles);
    }

    toFFZ(context) {
        if (!this.calculateVisibility(context?.visibility ?? {})) return null;

        return {
			id: this.id,
			name: this.name,
			owner: {
				display_name: this.owner?.display_name,
				name: this.owner?.login
			},
			urls: this.host.getURLs(context?.imageFormat),
			modifier: this.hasFlags(1 << EmoteFlags.ZeroWidth),
			modifier_offset: '0',
			width: this.host.baseWidth,
			height: this.host.baseHeight,
			click_url: context?.emotesAPI ? context?.emotesAPI.getEmoteAppURL(this) : undefined
		};
    }

    hasFlags(flags) {
        return hasBitFlag(this.flags, flags);
    }

    calculateVisibility(prefs) {
        if (this.lifecycle != EmoteLifeCycle.Live) return false;

        if (!(prefs.unlisted ?? true) && !this.listed) return false;

        if (!(prefs.sexual ?? true) && this.hasFlags(1 << EmoteFlags.ContentSexual)) return false;
        if (!(prefs.epilepsy ?? true) && this.hasFlags(1 << EmoteFlags.ContentEpilepsy)) return false;
        if (!(prefs.edgy ?? true) && this.hasFlags(1 << EmoteFlags.ContentEdgy)) return false;

        if (this.hasFlags(1 << EmoteFlags.ContentTwitchDisallowed)) return false;

        return true;
    }
}

export const EmoteFlags = {
    Private: 0,
    Authentic: 1,
    ZeroWidth: 8,
    ContentSexual: 16,
    ContentEpilepsy: 17,
    ContentEdgy: 18,
    ContentTwitchDisallowed: 24
}

export const EmoteLifeCycle = {
	Failed: -2,
    Deleted: -1,
	Pending: 0,
	Processing: 1,
	Disabled: 2,
	Live: 3
}

export class EmoteFiles extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'url', 'string');
        this.parseArray(json, 'files', EmoteFile, 'discard');

        let smallest = this.files.reduce((f1, f2) => f1.pxSize > f2.pxSize ? f2 : f1);
        this.baseWidth = smallest?.width ?? 0;
        this.baseHeight = smallest?.height ?? 0;
        this.basePxSize = smallest?.pxSize ?? 0;
    }

    getURLs(format) {
        let filesBySize = this.getSizes(format);

        let urls = {};
        for (const [size, file] of Object.entries(filesBySize)) {
            if (file != undefined) {
                urls[size] = `${this.url}/${file.name}`;
            }
        }

        return urls;
    }

    getSizes(format) {
        let files = this.getFilesByFormat(format);

        if (files.length == 0 && format != 'WEBP') files = this.getFilesByFormat('WEBP');

        return {
            1: this.getFileBySize(1, undefined, files),
            2: this.getFileBySize(2, undefined, files),
            3: this.getFileBySize(3, undefined, files),
            4: this.getFileBySize(4, undefined, files),
        }
    }

    getFileBySize(size, format, files) {
        files = files ?? this.getFilesByFormat(format);

        return files.find(file => file.pxSize == this.basePxSize * size ** 2);
    }

    getFilesByFormat(format) {
        format = format ?? 'WEBP';

        return this.files.filter(file => file.format == format);
    }
}

export class EmoteFile extends APIObject {
    constructor(json) {
        super();

        this.parseProperty(json, 'name', 'string');
        this.parseProperty(json, 'width', 'number');
        this.parseProperty(json, 'height', 'number');
        this.parseProperty(json, 'format', 'string');

        this.pxSize = this.width * this.height;
    }
}