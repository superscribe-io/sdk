import { IAuth, AuthOptions } from '../auth';
import { ISuperscribe } from '../superscribe';
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
	UtilsHandler,
} from '../handlers';
import { IItems } from '../items';
import { ITransport, TransportOptions } from '../transport';
import { ItemsHandler } from './items';
import { Transport } from './transport';
import { Auth } from './auth';
import { IStorage } from '../storage';
import { LocalStorage, MemoryStorage, StorageOptions } from './storage';
import { TypeMap, TypeOf, PartialBy } from '../types';
import { GraphQLHandler } from '../handlers/graphql';
import { ISingleton } from '../singleton';
import { SingletonHandler } from '../handlers/singleton';

export type SuperscribeStorageOptions = StorageOptions & { mode?: 'LocalStorage' | 'MemoryStorage' };

export type SuperscribeOptions<IAuthHandler extends IAuth = Auth> = {
	auth?: IAuthHandler | PartialBy<AuthOptions, 'transport' | 'storage'>;
	transport?: ITransport | Partial<TransportOptions>;
	storage?: IStorage | SuperscribeStorageOptions;
};

export class Superscribe<T extends TypeMap, IAuthHandler extends IAuth = Auth> implements ISuperscribe<T> {
	private _url: string;
	private _options?: SuperscribeOptions<IAuthHandler>;
	private _auth: IAuthHandler;
	private _transport: ITransport;
	private _storage: IStorage;
	private _assets?: AssetsHandler;
	private _activity?: ActivityHandler<TypeOf<T, 'superscribe_activity'>>;
	private _collections?: CollectionsHandler<TypeOf<T, 'superscribe_collections'>>;
	private _fields?: FieldsHandler<TypeOf<T, 'superscribe_fields'>>;
	private _files?: FilesHandler<TypeOf<T, 'superscribe_files'>>;
	private _folders?: FoldersHandler<TypeOf<T, 'superscribe_folders'>>;
	private _permissions?: PermissionsHandler<TypeOf<T, 'superscribe_permissions'>>;
	private _presets?: PresetsHandler<TypeOf<T, 'superscribe_presets'>>;
	private _relations?: RelationsHandler<TypeOf<T, 'superscribe_relations'>>;
	private _revisions?: RevisionsHandler<TypeOf<T, 'superscribe_revisions'>>;
	private _roles?: RolesHandler<TypeOf<T, 'superscribe_roles'>>;
	private _users?: UsersHandler<TypeOf<T, 'superscribe_users'>>;
	private _server?: ServerHandler;
	private _utils?: UtilsHandler;
	private _graphql?: GraphQLHandler;
	private _settings?: SettingsHandler<TypeOf<T, 'superscribe_settings'>>;

	private _items: {
		[collection: string]: ItemsHandler<any>;
	};

	private _singletons: {
		[collection: string]: SingletonHandler<any>;
	};

	constructor(url: string, options?: SuperscribeOptions<IAuthHandler>) {
		this._url = url;
		this._options = options;
		this._items = {};
		this._singletons = {};

		if (this._options?.storage && this._options?.storage instanceof IStorage) this._storage = this._options.storage;
		else {
			const superscribeStorageOptions = this._options?.storage as SuperscribeStorageOptions | undefined;
			const { mode, ...storageOptions } = superscribeStorageOptions ?? {};

			if (mode === 'MemoryStorage' || typeof window === 'undefined') {
				this._storage = new MemoryStorage(storageOptions);
			} else {
				this._storage = new LocalStorage(storageOptions);
			}
		}

		if (this._options?.transport && this._options?.transport instanceof ITransport)
			this._transport = this._options.transport;
		else {
			this._transport = new Transport({
				url: this.url,
				...this._options?.transport,
				beforeRequest: async (config) => {
					if (this._url.indexOf('/auth/refresh') === -1 && config.method?.toLowerCase() !== 'post') {
						await this._auth.refreshIfExpired();
					}

					const token = this.storage.auth_token;
					const bearer = token
						? token.startsWith(`Bearer `)
							? String(this.storage.auth_token)
							: `Bearer ${this.storage.auth_token}`
						: '';

					const authenticatedConfig = {
						...config,
						headers: {
							Authorization: bearer,
							...config.headers,
						},
					};

					if (!(this._options?.transport instanceof ITransport) && this._options?.transport?.beforeRequest) {
						return this._options?.transport?.beforeRequest(authenticatedConfig);
					}
					return authenticatedConfig;
				},
			});
		}

		if (this._options?.auth && this._options?.auth instanceof IAuth) this._auth = this._options.auth;
		else
			this._auth = new Auth({
				transport: this._transport,
				storage: this._storage,
				...this._options?.auth,
			} as AuthOptions) as unknown as IAuthHandler;
	}

	get url() {
		return this._url;
	}

	get auth(): IAuthHandler {
		return this._auth;
	}

	get storage(): IStorage {
		return this._storage;
	}

	get transport(): ITransport {
		return this._transport;
	}

	get assets(): AssetsHandler {
		return this._assets || (this._assets = new AssetsHandler(this.transport));
	}

	get activity(): ActivityHandler<TypeOf<T, 'superscribe_activity'>> {
		return this._activity || (this._activity = new ActivityHandler<TypeOf<T, 'superscribe_activity'>>(this.transport));
	}

	get collections(): CollectionsHandler<TypeOf<T, 'superscribe_collections'>> {
		return (
			this._collections ||
			(this._collections = new CollectionsHandler<TypeOf<T, 'superscribe_collections'>>(this.transport))
		);
	}

	get fields(): FieldsHandler<TypeOf<T, 'superscribe_fields'>> {
		return this._fields || (this._fields = new FieldsHandler<TypeOf<T, 'superscribe_fields'>>(this.transport));
	}

	get files(): FilesHandler<TypeOf<T, 'superscribe_files'>> {
		return this._files || (this._files = new FilesHandler<TypeOf<T, 'superscribe_files'>>(this.transport));
	}

	get folders(): FoldersHandler<TypeOf<T, 'superscribe_folders'>> {
		return this._folders || (this._folders = new FoldersHandler<TypeOf<T, 'superscribe_folders'>>(this.transport));
	}

	get permissions(): PermissionsHandler<TypeOf<T, 'superscribe_permissions'>> {
		return (
			this._permissions ||
			(this._permissions = new PermissionsHandler<TypeOf<T, 'superscribe_permissions'>>(this.transport))
		);
	}

	get presets(): PresetsHandler<TypeOf<T, 'superscribe_presets'>> {
		return this._presets || (this._presets = new PresetsHandler<TypeOf<T, 'superscribe_presets'>>(this.transport));
	}

	get relations(): RelationsHandler<TypeOf<T, 'superscribe_relations'>> {
		return (
			this._relations || (this._relations = new RelationsHandler<TypeOf<T, 'superscribe_relations'>>(this.transport))
		);
	}

	get revisions(): RevisionsHandler<TypeOf<T, 'superscribe_revisions'>> {
		return (
			this._revisions || (this._revisions = new RevisionsHandler<TypeOf<T, 'superscribe_revisions'>>(this.transport))
		);
	}

	get roles(): RolesHandler<TypeOf<T, 'superscribe_roles'>> {
		return this._roles || (this._roles = new RolesHandler<TypeOf<T, 'superscribe_roles'>>(this.transport));
	}

	get users(): UsersHandler<TypeOf<T, 'superscribe_users'>> {
		return this._users || (this._users = new UsersHandler<TypeOf<T, 'superscribe_users'>>(this.transport));
	}
	get settings(): SettingsHandler<TypeOf<T, 'superscribe_settings'>> {
		return this._settings || (this._settings = new SettingsHandler<TypeOf<T, 'superscribe_settings'>>(this.transport));
	}
	get server(): ServerHandler {
		return this._server || (this._server = new ServerHandler(this.transport));
	}

	get utils(): UtilsHandler {
		return this._utils || (this._utils = new UtilsHandler(this.transport));
	}

	get graphql(): GraphQLHandler {
		return this._graphql || (this._graphql = new GraphQLHandler(this.transport));
	}

	singleton<C extends string, I = TypeOf<T, C>>(collection: C): ISingleton<I> {
		return (
			this._singletons[collection] ||
			(this._singletons[collection] = new SingletonHandler<I>(collection, this.transport))
		);
	}

	items<C extends string, I = TypeOf<T, C>>(collection: C): IItems<I> {
		return this._items[collection] || (this._items[collection] = new ItemsHandler<I>(collection, this.transport));
	}
}
