import { APIBase } from "../types/api/APIBase";
import { APIError, APIErrors } from "../types/api/APIError";
import { UserConnection } from "../types/User";

export default class APIUsers extends APIBase {
	async fetchUserConnection(id) {
		if (typeof id !== 'string') throw new SyntaxError('Invalid ID field.');

		try {
			let data = await this.requestJSON(`users/twitch/${encodeURIComponent(id)}`);

			return new UserConnection(data);
		} catch (err) {
			if (err instanceof APIError) {
				if (err.code == APIErrors.UnknownUserConnection || err.code == APIErrors.BadObjectID) {
					return null;
				}
			}

			console.error(err);
			return null;
		}
	}
}