import { FC, ReactNode } from 'react';
import clsx from 'clsx';

export interface CardProps {
	children: ReactNode;
	className?: string;
	shadow?: boolean;
	dark?: boolean;
}

export const Card: FC<CardProps> = ({ children, className, shadow = false, dark = false }) => {
	return (
		<div
			className={clsx(
				'overflow-hidden rounded-xl border',
				dark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900',
				shadow && `shadow-lg ${dark ? 'shadow-gray-900' : 'shadow-gray-100 dark:shadow-gray-900'}`,
				className
			)}
		>
			{children}
		</div>
	);
};
