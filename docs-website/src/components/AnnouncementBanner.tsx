import { FC } from 'react'
import { PopupButton } from '@typeform/embed-react'
import { Events, plausible } from '@/utils/analytics'

export const AnnouncementBanner: FC = () => {
	return (
		<div className="flex w-full justify-center bg-gradient-to-r from-purple-400 to-pink-600 text-xs md:text-sm">
			<PopupButton
				id={'cn3Zwo5B'}
				size={50}
				className="flex h-full w-full items-center justify-center space-x-2.5 py-2 px-4"
				onReady={() => {
					plausible.trackEvent(Events.AnnouncementBannerClicked)
				}}
				onClose={() => {
					plausible.trackEvent(Events.AnnouncementBannerTypeformClosed)
				}}
				onSubmit={() => {
					plausible.trackEvent(Events.AnnouncementBannerTypeformSubmitted)
				}}
			>
				<span className="relative flex h-3 w-3">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
					<span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
				</span>
				<span className="text-slate-50 dark:text-slate-100">
					Get Early Access to{' '}
					<span className="font-bold">
						WunderGraph Cloud - &quot; The Vercel for Backend &quot;
					</span>
				</span>
			</PopupButton>
		</div>
	)
}
