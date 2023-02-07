import React, { FC } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { Icon } from './Icon';
import { isExternalUrl } from '@/utils/helpers';

export const themeClasses = {
	primary:
		'bg-sky-500 text-white border-sky-600/20 hover:bg-sky-600 hover:border-sky-700/20 dark:bg-sky-600 dark:border-sky-500 dark:hover:bg-sky-500 dark:hover:border-sky-400',
	secondary:
		'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-600/30 dark:bg-sky-500/20',
	tertiary:
		'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500/30 dark:hover:bg-gray-600/30 dark:hover:text-white dark:bg-gray-500/20',
	ghost: 'bg-transparent text-sky-800 border-none hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/30',
	plain:
		'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:text-gray-700 dark:hover:border-gray-500 dark:hover:text-gray-200',
	danger:
		'bg-red-500 text-white border-red-600 hover:bg-red-400 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500 dark:hover:border-red-400',
};

const disabledThemeClasses = {
	primary: 'disabled:hover:text-white disabled:hover:bg-sky-500 disabled:hover:dark:bg-sky-600 disabled:opacity-50',
	secondary:
		'disabled:hover:text-sky-800 disabled:dark:hover:text-sky-300 disabled:hover:bg-sky-100 disabled:hover:dark:bg-sky-500/20 disabled:opacity-50',
	tertiary:
		'disabled:hover:text-gray-800 disabled:dark:hover:text-gray-300 disabled:hover:bg-gray-100 disabled:hover:dark:bg-gray-500/20 disabled:opacity-50',
	ghost:
		'disabled:hover:text-sky-800 disabled:dark:hover:text-sky-300 disabled:hover:bg-transparent disabled:dark:hover:bg-transparent disabled:opacity-50',
	plain:
		'disabled:hover:text-gray-500 disabled:hover:dark:text-gray-400 disabled:hover:border-gray-400 disabled:hover:dark:border-gray-500 disabled:opacity-50',
	danger: 'disabled:hover:text-white disabled:hover:bg-red-500 disabled:hover:dark:bg-red-600 disabled:opacity-50',
};

const sizes = {
	sm: 'px-3 h-6 text-xs',
	md: 'px-4 h-8 text-sm',
	lg: 'px-6 h-10 text-md',
	xl: 'px-10 h-12 text-base',
};

export const sharedClasses =
	'flex justify-center items-center space-x-3 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-900 transition disabled:cursor-not-allowed';

export const Button: FC<{
	label: React.ReactNode;
	'aria-label'?: string;
	onClick?: () => void;
	theme?: keyof typeof themeClasses;
	className?: string;
	href?: string;
	icon?: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	type?: 'button' | 'submit' | 'reset';
	isLoading?: boolean;
	loadingLabel?: string;
	isDisabled?: boolean;
}> = (props) => {
	const {
		label,
		onClick,
		href,
		className,
		theme = 'plain',
		icon,
		size = 'lg',
		type = 'button',
		isDisabled,
		...rest
	} = props;

	const cls = clsx(className, sharedClasses, themeClasses[theme], disabledThemeClasses[theme], sizes[size]);

	let content = (
		<>
			{icon && <span className="w-5">{typeof icon === 'string' ? <Icon icon={icon} className="" /> : icon}</span>}
			<span>{label}</span>
		</>
	);

	if (href && !isDisabled) {
		return (
			<Link
				href={href}
				className={cls}
				onClick={onClick}
				aria-label={props['aria-label']}
				target={isExternalUrl(href) ? '_blank' : undefined}
				rel={isExternalUrl(href) ? 'noreferrer' : undefined}
			>
				{content}
			</Link>
		);
	}

	return (
		<button className={cls} onClick={onClick} type={type} disabled={isDisabled} {...rest}>
			{content}
		</button>
	);
};
