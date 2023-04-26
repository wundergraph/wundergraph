export const scrollIntoViewIfNeeded = (target, options) => {
	const { offsetTop = 0, ...params } = options;

	if (target.getBoundingClientRect().bottom > window.innerHeight) {
		target.scrollIntoView({
			block: 'end',
			inline: 'nearest',
			...params,
		});
	}
	if (target.getBoundingClientRect().top < offsetTop) {
		target.scrollIntoView(params);
	}
};
