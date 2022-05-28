import path from 'path';
import {wunderctlName} from "@wundergraph/tools";

export const wunderctlDir = (): string => {
	return path.join(__dirname, '..', 'dist');
};

export const wunderctlBinaryPath = (): string => {
	return path.join(wunderctlDir(), wunderctlName());
};
