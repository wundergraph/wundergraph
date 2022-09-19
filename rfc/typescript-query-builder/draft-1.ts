const query = async (root: any) => {};

interface root {
	countries_country(args?: { code?: string }, fields?: (c: countries_country) => any): any;
}

interface countries_country {
	id: string;
}

const alias = (name: string, field: any): any => {};

const test = async () => {
	const code = 'DE';
	const data = await query((root: root) => [
		alias(
			'countries',
			root.countries_country({ code }, (c: any) => [
				c.code,
				c.name,
				c.capital,
				c.join((j: any) => [
					j.weather_getCityByName({ name: c.capital }, (w: any) => [
						w.weather((w: any) => [
							w.summary((s: any) => [s.title, s.description]),
							w.temperature((t: any) => [t.actual, t.feelsLike]),
						]),
					]),
				]),
			])
		),
	]);
};

export default query;
