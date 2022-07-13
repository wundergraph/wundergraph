import { GrpcApi } from '../definition';
import yaml from 'js-yaml';

export const protosetToGrpcApiObject = async (protoset: Buffer | null): Promise<GrpcApi> => {
	try {
		throw new Error('Not implemented');
	} catch (e) {
		throw new Error('cannot read Grpc Protoset');
	}
};
