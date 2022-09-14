export class APIError extends Error {
    constructor(code, error, httpCode) {
        super(`7TV API Error ${code}: ${error}`);

        this.error = error;
        this.code = code;
        this.httpCode = httpCode;
    }
}

export const APIErrors = {
    UnknownEmote:            70440,
    UnknownEmoteSet:         70441,
    UnknownUser:             70442,
    UnknownUserConnection:   70443,
    BadObjectID:             70411,
    RateLimited:             70429
};