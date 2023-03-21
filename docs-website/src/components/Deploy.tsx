interface DeployProps {
	template?: string;
	repository?: string;
}

export const Deploy: React.FC<DeployProps> = (props) => {
	const { template, repository } = props;
	const baseUrl = 'https://cloud.wundergraph.com/new';

	let params;
	if (template) {
		params = new URLSearchParams({ templateName: template });
	} else if (repository) {
		params = new URLSearchParams({ repository });
	}

	let url = params ? `${baseUrl}/clone?${params.toString()}` : baseUrl;

	return (
		<a href={url}>
			<img src="/button-full.svg" alt="Deploy to WunderGraph" />
		</a>
	);
};
