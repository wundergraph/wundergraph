import { installer, wunderctlName } from '@wundergraph/tools';
import { wunderctlDir, version } from '../install';

export default installer(version, wunderctlDir(), wunderctlName()).catch((e) => {
	console.error('Error installing wunderctl', e);
	process.exit(1);
});
