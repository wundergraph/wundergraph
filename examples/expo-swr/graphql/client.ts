import {
	Client,
	ClientConfig,
	User,
	UploadRequestOptions,
	OperationMetadata,
	OperationsDefinition,
	OperationRequestOptions,
	SubscriptionRequestOptions,
	SubscriptionEventHandler,
	FetchUserRequestOptions,
} from "@wundergraph/sdk/client";
import type {
	DragonsResponse,
	DragonsResponseData,
	MissionsResponse,
	MissionsInput,
	MissionsResponseData,
} from "./models";

export type UserRole = "admin" | "user";

export const WUNDERGRAPH_S3_ENABLED = false;
export const WUNDERGRAPH_AUTH_ENABLED = false;

export type UploadConfig = UploadRequestOptions<never>;

export const defaultClientConfig: ClientConfig = {
	applicationHash: "6e4eb66f",
	applicationPath: "app/main",
	baseURL: "http://localhost:9991",
	sdkVersion: "0.121.0",
};

export const operationMetadata: OperationMetadata = {
	Dragons: {
		requiresAuthentication: false,
	},
	Missions: {
		requiresAuthentication: false,
	},
};

type PrivateConfigProperties = "applicationHash" | "applicationPath" | "sdkVersion" | "operationMetadata";

export class WunderGraphClient extends Client {
	query<
		OperationName extends Extract<keyof Operations["queries"], string>,
		Input extends Operations["queries"][OperationName]["input"] = Operations["queries"][OperationName]["input"],
		Data extends Operations["queries"][OperationName]["data"] = Operations["queries"][OperationName]["data"]
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.query<OperationRequestOptions, Data>(options);
	}
	mutate<
		OperationName extends Extract<keyof Operations["mutations"], string>,
		Input extends Operations["mutations"][OperationName]["input"] = Operations["mutations"][OperationName]["input"],
		Data extends Operations["mutations"][OperationName]["data"] = Operations["mutations"][OperationName]["data"]
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.mutate<OperationRequestOptions, Data>(options);
	}
	subscribe<
		OperationName extends Extract<keyof Operations["subscriptions"], string>,
		Input extends Operations["subscriptions"][OperationName]["input"] = Operations["subscriptions"][OperationName]["input"],
		Data extends Operations["subscriptions"][OperationName]["data"] = Operations["subscriptions"][OperationName]["data"]
	>(
		options: OperationName extends string
			? SubscriptionRequestOptions<OperationName, Input>
			: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<Data>
	) {
		return super.subscribe(options, cb);
	}
	public async uploadFiles(config: UploadConfig) {
		return super.uploadFiles(config);
	}
	public login(authProviderID: Operations["authProvider"], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends User = User<UserRole>>(options: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
}

export const createClient = (config?: Partial<Omit<ClientConfig, PrivateConfigProperties>>) => {
	return new WunderGraphClient({
		...defaultClientConfig,
		...config,
		operationMetadata,
	});
};

export type Queries = {
	Dragons: {
		input?: undefined;
		data: DragonsResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	Missions: {
		input: MissionsInput;
		data: MissionsResponseData;
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {};

export type Subscriptions = {};

export type LiveQueries = {
	Dragons: {
		input?: undefined;
		data: DragonsResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
	Missions: {
		input: MissionsInput;
		data: MissionsResponseData;
		liveQuery: true;
		requiresAuthentication: false;
	};
};

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, UserRole> {}
