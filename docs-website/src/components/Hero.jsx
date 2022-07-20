import { Fragment } from 'react'
import Image from 'next/future/image'
import clsx from 'clsx'
import Highlight, { defaultProps } from 'prism-react-renderer'

import { Button } from '@/components/Button'
import { HeroBackground } from '@/components/HeroBackground'
import blurCyanImage from '@/images/blur-cyan.png'
import blurIndigoImage from '@/images/blur-indigo.png'

const codeLanguage = 'shell'
const code = `# Create a new project
npx -y @wundergraph/wunderctl init \\ \n\t--template nextjs-starter

# Install dependencies and start
npm i && npm start`

const tabs = [{ name: 'Getting Started', isActive: true }]

function TrafficLightsIcon(props) {
	return (
		<svg aria-hidden="true" viewBox="0 0 42 10" fill="none" {...props}>
			<circle cx="5" cy="5" r="4.5" />
			<circle cx="21" cy="5" r="4.5" />
			<circle cx="37" cy="5" r="4.5" />
		</svg>
	)
}

export function Hero() {
	return (
		<div className="overflow-hidden dark:-mb-32 dark:mt-[-4.5rem] dark:bg-gray-950 dark:pb-32 dark:pt-[4.5rem] dark:lg:mt-[-4.75rem] dark:lg:pt-[4.75rem]">
			<div className="py-16 sm:px-2 lg:relative lg:py-20 lg:px-0">
				<div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-y-16 gap-x-8 px-4 lg:max-w-8xl lg:grid-cols-2 lg:px-8 xl:gap-x-16 xl:px-12">
					<div className="relative z-10 md:text-center lg:text-left">
						<div className="relative">
							<p className="inline bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
								Documentation
							</p>
							<p className="mt-3 text-2xl tracking-tight text-slate-400">
								Explore our guides and examples to integrate WunderGraph.
							</p>
							<div className="mt-8 flex gap-4 md:justify-center lg:justify-start">
								<Button href="/getting-started">Get started</Button>
								<Button
									href="https://github.com/wundergraph/wundergraph"
									variant="secondary"
								>
									View on GitHub
								</Button>
							</div>
						</div>
					</div>
					<div className="relative lg:static xl:pl-10">
						<div className="absolute inset-x-[-50vw] -top-32 -bottom-48 [mask-image:linear-gradient(transparent,white,white)] dark:[mask-image:linear-gradient(transparent,white,transparent)] lg:left-[calc(50%+14rem)] lg:right-0 lg:-top-32 lg:-bottom-32 lg:[mask-image:none] lg:dark:[mask-image:linear-gradient(white,white,transparent)]">
							<HeroBackground className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 lg:translate-y-[-60%]" />
						</div>
						<div className="relative">
							<Image
								className="absolute -bottom-40 -right-44"
								src={blurIndigoImage}
								alt=""
								width={567}
								height={567}
								unoptimized
								priority
							/>
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-300 via-sky-300/70 to-blue-300 opacity-10 blur-lg" />
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-300 via-sky-300/70 to-blue-300 opacity-10" />
							<div className="relative rounded-2xl bg-slate-800 ring-1 ring-gray-200 dark:bg-[#0A101F]/80 dark:ring-white/10">
								<div className="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-sky-300/0 via-sky-300/70 to-sky-300/0" />
								<div className="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0" />
								<div className="pl-4 pt-4">
									<TrafficLightsIcon className="h-2.5 w-auto stroke-slate-500/30" />
									<div className="mt-4 flex space-x-2 text-xs">
										{tabs.map((tab) => (
											<div
												key={tab.name}
												className={clsx(
													'flex h-6 rounded-full',
													tab.isActive
														? 'bg-gradient-to-r from-sky-400/30 via-sky-400 to-sky-400/30 p-px font-medium text-sky-300'
														: 'text-slate-500'
												)}
											>
												<div
													className={clsx(
														'flex items-center rounded-full px-2.5',
														tab.isActive &&
															'bg-sky-800 text-sky-200/80 dark:bg-sky-800 dark:text-sky-200/80'
													)}
												>
													{tab.name}
												</div>
											</div>
										))}
									</div>
									<div className="mt-6 flex items-start px-1 text-sm">
										<div
											aria-hidden="true"
											className="select-none border-r border-slate-300/5 pr-4 font-mono text-slate-600"
										>
											{Array.from({
												length: code.split('\n').length,
											}).map((_, index) => (
												<Fragment key={index}>
													{(index + 1).toString().padStart(2, '0')}
													<br />
												</Fragment>
											))}
										</div>
										<Highlight
											{...defaultProps}
											code={code}
											language={codeLanguage}
											theme={undefined}
										>
											{({
												className,
												style,
												tokens,
												getLineProps,
												getTokenProps,
											}) => (
												<pre
													className={clsx(
														className,
														'flex overflow-x-auto pb-6'
													)}
													style={style}
												>
													<code className="px-4">
														{tokens.map((line, lineIndex) => (
															<div key={lineIndex} {...getLineProps({ line })}>
																{line.map((token, tokenIndex) => (
																	<span
																		key={tokenIndex}
																		{...getTokenProps({ token })}
																	/>
																))}
															</div>
														))}
													</code>
												</pre>
											)}
										</Highlight>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
