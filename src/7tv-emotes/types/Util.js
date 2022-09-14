export function hasBitFlag(bits, mask) {
	return (bits & mask) == mask;
}

export function browserSupportsAVIF() {
	let productMajors = navigator.userAgent.matchAll(/(\S+?)\/(\d+?)[\.\s]/g);

	let hasChrome = false;
	let hasEdge = false;
	for (let match of productMajors) {
		if (match[1] == "Chrome" && match[2] >= 100) hasChrome = true;
		else if (match[1] == "Edg") hasEdge = true;
	}

	return hasChrome && !hasEdge;
}