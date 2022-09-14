export class APIObject {
    parseProperty(json, name, type, required = true) {
        let computed = this.parseValueAsType(json[name], type, name, required);
        if (computed !== undefined) {
            this[name] = computed;
        }
    }

    parseArray(json, name, childType, childMode = 'required', required = true) {
        let array = json[name];
        if (array instanceof Array) {
            let computed = [];
            for (let x in array) {
                try {
                    computed.push(this.parseValueAsType(array[x], childType, `${name}[${x}]`, true));
                }
                catch (err) {
                    switch (childMode) {
                        case 'required': {
                            if (required) throw err;
                            else return;
                        }
                        case 'optional': computed.push(null);
                        case 'discard': break;
                    }
                }
            }

            this[name] = computed;
        }
        else if (required) {
            throw new APIObjectValidationError(name);
        }
    }

    parseValueAsType(value, type, path, required = false) {
        if (APIObject.isPrototypeOf(type)) {
            if (typeof value === 'object' && value != null) {
                try {
                    return new type(value);
                }
                catch (err) {
                    if (required) {
                        if (err instanceof APIObjectValidationError) {
                            throw new APIObjectValidationError(`${path}.${err.badPropPath}`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
            }
            else if (required) {
                throw new APIObjectValidationError(path);
            }
        }
        else {
            if (typeof value === type) {
                return value;
            }
            else if (required) {
                throw new APIObjectValidationError(path);
            }
        }

        return undefined;
    }
}

export class APIObjectValidationError extends Error {
    constructor(badPropPath) {
        super(`Failed to parse required property ${badPropPath}`);

        this.badPropPath = badPropPath;
    }
}
