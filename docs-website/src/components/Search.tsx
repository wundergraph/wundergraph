import { SVGProps, useCallback, useEffect, useState } from 'react';
import { Flexsearch } from './FlexSearch';
import Modal from './Modal';

function SearchIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" {...props}>
			<path d="M16.293 17.707a1 1 0 0 0 1.414-1.414l-1.414 1.414ZM9 14a5 5 0 0 1-5-5H2a7 7 0 0 0 7 7v-2ZM4 9a5 5 0 0 1 5-5V2a7 7 0 0 0-7 7h2Zm5-5a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7v2Zm8.707 12.293-3.757-3.757-1.414 1.414 3.757 3.757 1.414-1.414ZM14 9a4.98 4.98 0 0 1-1.464 3.536l1.414 1.414A6.98 6.98 0 0 0 16 9h-2Zm-1.464 3.536A4.98 4.98 0 0 1 9 14v2a6.98 6.98 0 0 0 4.95-2.05l-1.414-1.414Z" />
		</svg>
	);
}

export function Search() {
	const [isOpen, setIsOpen] = useState(false);
	const [modifierKey, setModifierKey] = useState<string>();

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, [setIsOpen]);

	const onClose = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	useEffect(() => {
		setModifierKey(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl ');
	}, []);

	return (
		<>
			<button
				type="button"
				className="group flex h-6 w-6 items-center justify-center sm:justify-start md:h-auto md:w-80 md:flex-none md:rounded-lg md:py-2.5 md:pl-4 md:pr-3.5 md:text-sm md:ring-1 md:ring-gray-200 md:hover:ring-gray-300 dark:md:bg-gray-800/75 dark:md:ring-inset dark:md:ring-white/5 dark:md:hover:bg-gray-700/40 dark:md:hover:ring-gray-500 lg:w-96"
				onClick={onOpen}
			>
				<SearchIcon className="h-5 w-5 flex-none fill-gray-400 group-hover:fill-gray-500 dark:fill-gray-500 md:group-hover:fill-gray-400" />
				<span className="sr-only md:not-sr-only md:ml-2 md:text-gray-500 md:dark:text-gray-400">Search docs</span>
				{modifierKey && (
					<kbd className="ml-auto hidden font-medium text-gray-400 dark:text-gray-500 md:block">
						<kbd className="font-sans">{modifierKey}</kbd>
						<kbd className="font-sans">K</kbd>
					</kbd>
				)}
			</button>
			<Modal
				className="!dark:border-gray-100 w-full !gap-0 border !p-0 lg:max-w-[580px]"
				open={isOpen}
				handleClose={onClose}
			>
				<Flexsearch close={onClose} />
			</Modal>
		</>
	);
}
