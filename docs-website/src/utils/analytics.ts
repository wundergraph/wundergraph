import Plausible from 'plausible-tracker';
import React from 'react';

export const plausible = Plausible({
	domain: 'docs.wundergraph.com',
	trackLocalhost: false,
});

export const trackOutboundLinkClick = (url: string) => {
	plausible.trackEvent('Outbound Link: Click', { props: { url } });
};

interface ActionProps {
	[key: string]: any;
}

export interface AnalyticsProps {
	['data-event']?: string;
	['data-event-props']?: string;
}

export enum Events {
	AnnouncementBannerClicked = 'Announcement Banner Clicked',
	AnnouncementBannerTypeformClosed = 'Announcement Banner Typeform Closed',
	AnnouncementBannerTypeformSubmitted = 'Announcement Banner Typeform Submitted',
	EarlyAccessFormEnteredName = 'Early Access Form - Entered Name',
	EarlyAccessFormEnteredEmail = 'Early Access Form - Entered Email',
	OpenInGitpod = 'Open in Gitpod',
	Github = 'Github',
}

export const trackEvent = (event: string, props: ActionProps = {}) => {
	plausible.trackEvent(event, {
		props,
	});
};

const parseProps = (props: string) => {
	try {
		return JSON.parse(props);
	} catch (e) {
		console.log(e);
	}
};

export interface UseTrackActionProps extends AnalyticsProps {
	[key: string]: any;
}

/**
 * This hook add event tracking to buttons.
 * It
 */
export const useTrackEvent = (props: UseTrackActionProps) => {
	let event = props['data-event'];
	const data = props['data-event-props'] && parseProps(props['data-event-props']);

	if (!event) {
		return props;
	}

	return {
		...props,
		onClick: (e: React.MouseEvent) => {
			event && trackEvent(event, data);

			props.onClick?.(e);
		},
	};
};
