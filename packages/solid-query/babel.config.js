const config = {
	presets: ['babel-preset-solid'],
	plugins: [],
};

module.exports = (api) => {
	if (api.env('test')) {
		// modify the config for Jest
		config.presets.push('@babel/preset-typescript', [
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
					esmodules: false,
				},
			},
		]);
		config.plugins.push('@babel/plugin-transform-modules-commonjs');
	}
	return config;
};
