import { Fragment } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'

export function Fence({ children, language }) {
	return (
		<Highlight
			{...defaultProps}
			code={children.trimEnd()}
			language={language}
			theme={undefined}
		>
			{({ className, style, tokens, getLineProps, getTokenProps }) => (
				<pre className={className} style={style}>
					<code>
						{tokens.map((line, lineIndex) => (
							<div {...getLineProps({ line, key: lineIndex })}>
								{line.map((token, tokenIndex) => (
									<span key={tokenIndex} {...getTokenProps({ token })} />
								))}
							</div>
						))}
					</code>
				</pre>
			)}
		</Highlight>
	)
}
