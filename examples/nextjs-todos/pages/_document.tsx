import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class CustomDocument extends Document {
	render() {
		return (
			<Html>
				<Head>
					<meta charSet="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<script src="https://cdn.tailwindcss.com"></script>
					<title>Todo app</title>
				</Head>
				<body className={'bg-gray-900'}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
