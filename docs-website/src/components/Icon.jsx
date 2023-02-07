import clsx from 'clsx';

import {
	BookOpenIcon,
	FolderOpenIcon,
	QuestionMarkCircleIcon,
	FlagIcon,
	UserIcon,
	ListBulletIcon,
	CloudIcon,
	CubeTransparentIcon,
	CubeIcon,
	CommandLineIcon,
	AtSymbolIcon,
	ServerIcon,
	CogIcon,
	DocumentTextIcon,
	LightBulbIcon,
	ExclamationTriangleIcon,
	LockClosedIcon,
	CloudArrowUpIcon,
	ShareIcon,
	CircleStackIcon,
	ComputerDesktopIcon,
	WrenchIcon,
} from '@heroicons/react/24/outline';

const icons = {
	installation: FlagIcon,
	examples: FolderOpenIcon,
	tutorials: QuestionMarkCircleIcon,
	guides: BookOpenIcon,
	usecases: UserIcon,
	features: ListBulletIcon,
	architecture: CubeTransparentIcon,
	datasources: CloudIcon,
	core: CubeIcon,
	wunderctl: CommandLineIcon,
	config: DocumentTextIcon,
	directives: AtSymbolIcon,
	server: ServerIcon,
	operations: CogIcon,
	warning: ExclamationTriangleIcon,
	note: LightBulbIcon,
	cloud: CloudArrowUpIcon,
	apis: ShareIcon,
	auth: LockClosedIcon,
	databases: CircleStackIcon,
	monitor: ComputerDesktopIcon,
	wrench: WrenchIcon,
	cog: CogIcon,
};

export function Icon({ icon: iconProp, className, ...props }) {
	let IconComponent;
	if (typeof iconProp === 'string' && icons[iconProp]) {
		IconComponent = icons[iconProp];
	}

	let icon = iconProp;
	if (IconComponent) {
		icon = <IconComponent />;
	}

	return (
		<span {...props} className={clsx('inline-block text-pink-500', className)}>
			{icon}
		</span>
	);
}

const gradients = {
	blue: [{ stopColor: '#0EA5E9' }, { stopColor: '#22D3EE', offset: '.527' }, { stopColor: '#818CF8', offset: 1 }],
	darkBlue: [
		{ stopColor: 'rgb(2 132 199)' },
		{ stopColor: 'rgb(36 164 229)', offset: '.527' },
		{ stopColor: '#606bd4', offset: 1 },
	],
	amber: [
		{ stopColor: '#FDE68A', offset: '.08' },
		{ stopColor: '#F59E0B', offset: '.837' },
	],
	pink: [
		{ stopColor: '#c084fc', offset: '0' },
		{ stopColor: '#db2777', offset: '1' },
	],
};

export function Gradient({ color = 'blue', ...props }) {
	return (
		<radial-gradient cx={0} cy={0} r={1} gradientUnits="userSpaceOnUse" {...props}>
			{gradients[color].map((stop, stopIndex) => (
				<stop key={stopIndex} {...stop} />
			))}
		</radial-gradient>
	);
}

export function LightMode({ className, ...props }) {
	return <g className={clsx('dark:hidden', className)} {...props} />;
}

export function DarkMode({ className, ...props }) {
	return <g className={clsx('hidden dark:inline', className)} {...props} />;
}
