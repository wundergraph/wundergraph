import clsx from 'clsx';
import { HTMLProps } from 'react';

const Video = ({
	className,
	src,
	autoPlay,
	muted,
	playsInline,
	loop,
	controls = true,
}: HTMLProps<HTMLVideoElement>) => {
	return (
		<video
			src={src}
			autoPlay={autoPlay}
			muted={muted}
			playsInline={playsInline}
			loop={loop}
			controls={controls}
			className={clsx('rounded-md', className)}
		/>
	);
};

export default Video;
