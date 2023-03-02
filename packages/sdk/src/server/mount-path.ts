export const customGqlServerMountPath = (name: string): string => {
	return `/gqls/${name}/graphql`;
};

export const openApiServerMountPath = (name: string): string => {
	return `/openapis/${name}/graphql`;
};
