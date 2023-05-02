import { IAuth } from './auth';
import {
	ActivityHandler,
	AssetsHandler,
	CollectionsHandler,
	FieldsHandler,
	FilesHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
	RelationsHandler,
	RevisionsHandler,
	RolesHandler,
	ServerHandler,
	SettingsHandler,
	UsersHandler,
} from './handlers';

import { IItems } from './items';
import { ITransport } from './transport';
import { UtilsHandler } from './handlers/utils';
import { IStorage } from './storage';
import { TypeMap, TypeOf } from './types';
import { GraphQLHandler } from './handlers/graphql';
import { ISingleton } from './singleton';

export type SuperscribeTypes = {
	activity: undefined;
	assets: undefined;
	collections: undefined;
	fields: undefined;
	files: undefined;
	folders: undefined;
	permissions: undefined;
	presets: undefined;
	relations: undefined;
	revisions: undefined;
	roles: undefined;
	settings: undefined;
	users: undefined;
};

export interface ISuperscribeBase {
	readonly url: string;
	readonly auth: IAuth;
	readonly storage: IStorage;
	readonly transport: ITransport;
	readonly server: ServerHandler;
	readonly utils: UtilsHandler;
	readonly graphql: GraphQLHandler;
}

export interface ISuperscribe<T extends TypeMap> extends ISuperscribeBase {
	readonly activity: ActivityHandler<TypeOf<T, 'superscribe_activity'>>;
	readonly assets: AssetsHandler;
	readonly collections: CollectionsHandler<TypeOf<T, 'superscribe_collections'>>;
	readonly files: FilesHandler<TypeOf<T, 'superscribe_files'>>;
	readonly fields: FieldsHandler<TypeOf<T, 'superscribe_fields'>>;
	readonly folders: FoldersHandler<TypeOf<T, 'superscribe_folders'>>;
	readonly permissions: PermissionsHandler<TypeOf<T, 'superscribe_permissions'>>;
	readonly presets: PresetsHandler<TypeOf<T, 'superscribe_presets'>>;
	readonly revisions: RevisionsHandler<TypeOf<T, 'superscribe_revisions'>>;
	readonly relations: RelationsHandler<TypeOf<T, 'superscribe_relations'>>;
	readonly roles: RolesHandler<TypeOf<T, 'superscribe_roles'>>;
	readonly users: UsersHandler<TypeOf<T, 'superscribe_users'>>;
	readonly settings: SettingsHandler<TypeOf<T, 'superscribe_settings'>>;

	items<C extends string, I = TypeOf<T, C>>(collection: C): IItems<I>;
	singleton<C extends string, I = TypeOf<T, C>>(collection: C): ISingleton<I>;
}
