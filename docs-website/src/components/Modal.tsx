import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Fragment, ReactNode } from 'react';

const Modal = ({
	open,
	handleClose,
	children,
	title,
	className,
}: {
	open: boolean;
	handleClose: () => void;
	children: ReactNode;
	title?: string;
	className?: string;
}) => {
	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog
				as="div"
				className="relative z-10"
				onClose={() => {
					handleClose();
				}}
			>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 backdrop-blur-md" />
				</Transition.Child>
				<div className="fixed inset-0 z-10 overflow-y-auto">
					<div className="flex h-full items-center justify-center p-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
							enterTo="opacity-100 translate-y-0 sm:scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 translate-y-0 sm:scale-100"
							leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
						>
							<Dialog.Panel
								className={clsx(
									'relative flex transform flex-col gap-y-5 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 text-left shadow-md transition-all dark:border-gray-700 dark:bg-gray-800 lg:p-8',
									className
								)}
							>
								{title && <h1 className="pb-2 text-lg font-bold text-gray-800 dark:text-white">{title}</h1>}
								{children}
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
};

export default Modal;
