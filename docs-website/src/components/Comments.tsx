import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';

const Comments = () => {
	const { theme, systemTheme } = useTheme();
	// we don't want to render Comments during development
	// because Giscus doesn't work in development (iframe issues)
	if (process.env.NODE_ENV === 'development') return null;
	return (
		<div className="my-8">
			<Giscus
				id="comments"
				repo="wundergraph/wundergraph"
				repoId={process.env.NEXT_PUBLIC_COMMENTS_REPO_ID ? process.env.NEXT_PUBLIC_COMMENTS_REPO_ID : ''}
				category="Docs"
				categoryId={process.env.NEXT_PUBLIC_COMMENTS_CATEGORY_ID ? process.env.NEXT_PUBLIC_COMMENTS_CATEGORY_ID : ''}
				mapping="title"
				strict="1"
				reactionsEnabled="1"
				emitMetadata="0"
				inputPosition="top"
				theme={theme !== 'system' ? theme : systemTheme}
				lang="en"
				loading="lazy"
				host={process.env.NEXT_PUBLIC_COMMENTS_APP_HOST ? process.env.NEXT_PUBLIC_COMMENTS_APP_HOST : ''}
			/>
		</div>
	);
};

export default Comments;
