// src/pages/_document.tsx
import { createRelayDocument, RelayDocument } from 'relay-nextjs/document';
import NextDocument, { Html, Head, DocumentContext, Main, NextScript } from 'next/document';

interface DocumentProps {
	relayDocument: RelayDocument;
}

class ExampleDocument extends NextDocument<DocumentProps> {
	static async getInitialProps(ctx: DocumentContext) {
		const relayDocument = createRelayDocument();

		const renderPage = ctx.renderPage;
		ctx.renderPage = () =>
			renderPage({
				// TODO: Issue with types defined in relay-nextjs package. Need to report it to the author.
				// @ts-expect-error
				enhanceApp: (App) => relayDocument.enhance(App),
			});

		const initialProps = await NextDocument.getInitialProps(ctx);

		return {
			...initialProps,
			relayDocument,
		};
	}

	render() {
		const { relayDocument } = this.props;

		return (
			<Html>
				<Head>
					<relayDocument.Script />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default ExampleDocument;
