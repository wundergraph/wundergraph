import { useId } from 'react'
import clsx from 'clsx'

import { InstallationIcon } from '@/components/icons/InstallationIcon'
import { LightbulbIcon } from '@/components/icons/LightbulbIcon'
import { PluginsIcon } from '@/components/icons/PluginsIcon'
import { PresetsIcon } from '@/components/icons/PresetsIcon'
import { ThemingIcon } from '@/components/icons/ThemingIcon'
import { WarningIcon } from '@/components/icons/WarningIcon'

import {
	BookOpenIcon,
	CollectionIcon,
	QuestionMarkCircleIcon,
	FlagIcon,
	UserIcon,
	ViewGridIcon,
	CloudIcon,
	CubeTransparentIcon,
	CubeIcon,
	TerminalIcon,
	AtSymbolIcon,
	ServerIcon,
	CogIcon,
	DocumentTextIcon,
} from '@heroicons/react/outline'

const icons = {
	installation: FlagIcon,
	examples: CollectionIcon,
	tutorials: QuestionMarkCircleIcon,
	guides: BookOpenIcon,
	usecases: UserIcon,
	features: ViewGridIcon,
	architecture: CubeTransparentIcon,
	datasources: CloudIcon,
	core: CubeIcon,
	wunderctl: TerminalIcon,
	config: DocumentTextIcon,
	directives: AtSymbolIcon,
	server: ServerIcon,
	operations: CogIcon,
}

const iconStyles = {
	blue: '[--icon-foreground:theme(colors.slate.900)] [--icon-background:theme(colors.white)]',
	amber:
		'[--icon-foreground:theme(colors.amber.900)] [--icon-background:theme(colors.amber.100)]',
}

export function Icon({ color = 'blue', icon, className, ...props }) {
	let id = useId()
	let IconComponent = icons[icon]

	return IconComponent ? (
		<svg
			aria-hidden="true"
			viewBox="0 0 32 32"
			fill="none"
			className={clsx(className, iconStyles[color])}
			{...props}
		>
			<defs>
				<Gradient
					id={`${id}-gradient`}
					color={color}
					gradientTransform="matrix(0 21 -21 0 20 11)"
				/>
			</defs>
			<circle cx={20} cy={20} r={12} fill={`url(#${id}-gradient)`} />
			<IconComponent id={id} color="black" strokeWidth="1.8" width="1.6em" />
		</svg>
	) : null
}

const gradients = {
	blue: [
		{ stopColor: '#0EA5E9' },
		{ stopColor: '#22D3EE', offset: '.527' },
		{ stopColor: '#818CF8', offset: 1 },
	],
	amber: [
		{ stopColor: '#FDE68A', offset: '.08' },
		{ stopColor: '#F59E0B', offset: '.837' },
	],
}

export function Gradient({ color = 'blue', ...props }) {
	return (
		<radialGradient
			cx={0}
			cy={0}
			r={1}
			gradientUnits="userSpaceOnUse"
			{...props}
		>
			{gradients[color].map((stop, stopIndex) => (
				<stop key={stopIndex} {...stop} />
			))}
		</radialGradient>
	)
}

export function LightMode({ className, ...props }) {
	return <g className={clsx('dark:hidden', className)} {...props} />
}

export function DarkMode({ className, ...props }) {
	return <g className={clsx('hidden dark:inline', className)} {...props} />
}
