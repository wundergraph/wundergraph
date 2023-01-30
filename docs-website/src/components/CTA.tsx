import * as React from 'react';
import { Button, sharedClasses, themeClasses } from './Button';

import clsx from 'clsx';
import { PopupButton } from '@typeform/embed-react';

interface Action {
	label: string;
	href: string;
}

const styles = {
	primary: {
		container: 'bg-sky-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10',
		title: 'text-sky-900 dark:text-sky-400',
		body: 'text-sky-800 [--tw-prose-background:theme(colors.sky.50)] prose-a:text-sky-900 prose-code:text-sky-900 dark:text-slate-300 dark:prose-code:text-slate-300',
	},
	alternative: {
		container: 'bg-amber-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10',
		title: 'text-amber-900 dark:text-amber-500',
		body: 'text-amber-800 [--tw-prose-underline:theme(colors.amber.400)] [--tw-prose-background:theme(colors.amber.50)] prose-a:text-amber-900 prose-code:text-amber-900 dark:text-slate-300 dark:[--tw-prose-underline:theme(colors.sky.700)] dark:prose-code:text-slate-300',
	},
};

export function CTA({
	title,
	primaryActionLabel,
	primaryActionHref,
	primaryActionTypeformId,
	secondaryActionLabel,
	secondaryActionHref,
	secondaryActionTypeformId,
	type = 'primary',
	children,
}: {
	title?: string;
	primaryActionLabel?: string;
	primaryActionHref?: string;
	primaryActionTypeformId?: string;
	secondaryActionLabel?: string;
	secondaryActionHref?: string;
	secondaryActionTypeformId?: string;
	type?: keyof typeof styles;
	children: React.ReactNode;
}) {
	return (
		<div className={clsx('not-prose my-16 flex rounded-3xl p-6', styles[type].container)}>
			{(title || children) && (
				<div className="ml-4 flex-auto">
					{title && <p className={clsx('m-0 font-display text-xl', styles[type].title)}>{title}</p>}
					{children && <div className={clsx('prose mt-2.5', styles[type].body)}>{children}</div>}
				</div>
			)}
			<div
				className={clsx({
					'flex flex-row items-center space-x-2': title || children,
					'flex w-full items-center justify-center space-x-2': !(title || children),
				})}
			>
				{primaryActionLabel &&
					(primaryActionTypeformId ? (
						<PopupButton
							id={primaryActionTypeformId}
							size={50}
							className={clsx('px-6 py-2 text-sm', sharedClasses, themeClasses['primary'], {
								'px-12': !(title || children),
								'px-20': !(title || children) && !secondaryActionLabel,
							})}
						>
							{primaryActionLabel}
						</PopupButton>
					) : (
						<Button
							label={primaryActionLabel}
							href={primaryActionHref}
							className={clsx({
								'px-12': !(title || children),
								'px-20': !(title || children) && !secondaryActionLabel,
							})}
						/>
					))}
				{secondaryActionLabel &&
					(secondaryActionTypeformId ? (
						<PopupButton
							id={secondaryActionTypeformId}
							size={50}
							className={clsx('px-6 py-2 text-sm', sharedClasses, themeClasses['secondary'], {
								'px-12': !(title || children),
								'px-20': !(title || children) && !primaryActionLabel,
							})}
						>
							{secondaryActionLabel}
						</PopupButton>
					) : (
						<Button
							label={secondaryActionLabel}
							href={secondaryActionHref}
							theme="secondary"
							className={clsx({
								'px-12': !(title || children),
								'px-20': !(title || children) && !primaryActionLabel,
							})}
						/>
					))}
			</div>
		</div>
	);
}
