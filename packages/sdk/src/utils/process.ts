import process from 'node:process';

/**
 * Rationale:
 * - We launch the server/introspection as a child process from the CLI
 * - When the CLI is killed, child process do not get notified
 * - We want to be able to clean up the process when the CLI process dies
 */

const parentProcessCheckIntervalMs = 500;

/**
 * isProcessAlive - Check if a process with a given pid is alive
 * @param pid
 */
const isProcessAlive = (pid: number) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e: any) {
		return e.code === 'EPERM';
	}
};

/**
 * onParentProcessExit - on interval basics check if the parent process is still alive and if not trigger the callback
 * @param callback
 */
export const onParentProcessExit = (callback: () => void) => {
	const parentPid = process.ppid;

	let interval: NodeJS.Timeout;

	interval = setInterval(async () => {
		if (!isProcessAlive(parentPid)) {
			interval.unref();
			callback();
		}
	}, parentProcessCheckIntervalMs);
};
