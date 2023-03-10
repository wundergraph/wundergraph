import { OpenAPIV3 } from 'openapi-types';
import { getJSONSchemaOptionsFromOpenAPIOptions } from '@omnigraph/openapi';

export interface Options {
	source: OpenAPIV3.Document;
	endpoint?: string;
	name: string;
}

export class JsonSchemaOptions {
	private extraJSONSchemaOptions?: any;
	private readonly opts: Options;

	constructor(opts: Options) {
		this.opts = opts;
	}

	public getExtraJSONSchemaOptions = async () => {
		if (this.extraJSONSchemaOptions) {
			return this.extraJSONSchemaOptions;
		}
		this.extraJSONSchemaOptions = await getJSONSchemaOptionsFromOpenAPIOptions(this.opts.name, this.opts);
	};

	public findMetaData = (queryType: string, fieldName: string) => {
		const opMeta = this.extraJSONSchemaOptions.operations.find((op: any) => {
			return op.type === queryType && op.field === fieldName;
		});

		return opMeta;
	};
}
