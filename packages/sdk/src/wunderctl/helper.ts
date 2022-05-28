import path from "path";

export const wunderctlBinaryPath = (): string => {
	return path.join(__dirname, '..', '..', 'bin', 'wunderctl');
};
