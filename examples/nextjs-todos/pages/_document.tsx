import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class CustomDocument extends Document {
	render() {
		return (
			<Html className="dark">
				<Head>
					<meta charSet="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				</Head>
				<body className="dark:bg-slate-900">
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
