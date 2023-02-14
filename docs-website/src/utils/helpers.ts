export const arraysAreEqual = <T>(a: T[], b: T[]) => {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
};

export const isExternalUrl = (link: string): boolean => !link.startsWith('/') && !link.match('wundergraph.com');
