import axios from 'axios';

class IAuth {
    constructor() {
        this.mode = (typeof window === 'undefined' ? 'json' : 'cookie');
    }
}

var Meta;
(function (Meta) {
    Meta["TOTAL_COUNT"] = "total_count";
    Meta["FILTER_COUNT"] = "filter_count";
})(Meta || (Meta = {}));
class EmptyParamError extends Error {
    constructor(paramName) {
        super(`${paramName !== null && paramName !== void 0 ? paramName : 'ID'} cannot be an empty string`);
    }
}

class ItemsHandler {
    constructor(collection, transport) {
        this.collection = collection;
        this.transport = transport;
        this.endpoint = collection.startsWith('superscribe_') ? `/${collection.replace('superscribe_', '')}` : `/items/${collection}`;
    }
    async readOne(id, query, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`${this.endpoint}/${encodeURI(id)}`, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return response.data;
    }
    async readMany(ids, query, options) {
        var _a;
        const collectionFields = await this.transport.get(`/fields/${this.collection}`);
        const primaryKeyField = (_a = collectionFields.data) === null || _a === void 0 ? void 0 : _a.find((field) => field.schema.is_primary_key === true);
        const { data, meta } = await this.transport.get(`${this.endpoint}`, {
            params: {
                ...query,
                filter: {
                    [primaryKeyField.field]: { _in: ids },
                    ...query === null || query === void 0 ? void 0 : query.filter,
                },
                sort: (query === null || query === void 0 ? void 0 : query.sort) || primaryKeyField.field,
            },
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return {
            data,
            ...(meta && { meta }),
        };
    }
    async readByQuery(query, options) {
        const { data, meta } = await this.transport.get(`${this.endpoint}`, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
        return {
            data,
            ...(meta && { meta }),
        };
    }
    async createOne(item, query, options) {
        return (await this.transport.post(`${this.endpoint}`, item, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        })).data;
    }
    async createMany(items, query, options) {
        return await this.transport.post(`${this.endpoint}`, items, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateOne(id, item, query, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        return (await this.transport.patch(`${this.endpoint}/${encodeURI(id)}`, item, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        })).data;
    }
    async updateMany(ids, data, query, options) {
        return await this.transport.patch(`${this.endpoint}`, {
            keys: ids,
            data,
        }, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateBatch(items, query, options) {
        return await this.transport.patch(`${this.endpoint}`, items, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async updateByQuery(updateQuery, data, query, options) {
        return await this.transport.patch(`${this.endpoint}`, {
            query: updateQuery,
            data,
        }, {
            params: query,
            ...options === null || options === void 0 ? void 0 : options.requestOptions,
        });
    }
    async deleteOne(id, options) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        await this.transport.delete(`${this.endpoint}/${encodeURI(id)}`, undefined, options === null || options === void 0 ? void 0 : options.requestOptions);
    }
    async deleteMany(ids, options) {
        await this.transport.delete(`${this.endpoint}`, ids, options === null || options === void 0 ? void 0 : options.requestOptions);
    }
}

class CommentsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async create(comment) {
        const response = await this.transport.post('/activity/comment', comment);
        return response.data;
    }
    async update(comment_activity_id, comment) {
        if (`${comment_activity_id}` === '')
            throw new EmptyParamError('comment_activity_id');
        const response = await this.transport.patch(`/activity/comment/${encodeURI(comment_activity_id)}`, {
            comment,
        });
        return response.data;
    }
    async delete(comment_activity_id) {
        if (`${comment_activity_id}` === '')
            throw new EmptyParamError('comment_activity_id');
        await this.transport.delete(`/activity/comment/${encodeURI(comment_activity_id)}`);
    }
}

/**
 * Activity handler
 */
class ActivityHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_activity', transport);
        this._comments = new CommentsHandler(this.transport);
    }
    get comments() {
        return this._comments;
    }
}

class AssetsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(id) {
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/assets/${id}`, {
            responseType: 'stream',
        });
        return response.raw;
    }
}

/**
 * Collections handler
 */
class CollectionsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/collections/${collection}`);
        return response.data;
    }
    async readAll() {
        const { data, meta } = await this.transport.get(`/collections`);
        return {
            data,
            meta,
        };
    }
    async createOne(collection) {
        return (await this.transport.post(`/collections`, collection)).data;
    }
    async createMany(collections) {
        const { data, meta } = await this.transport.post(`/collections`, collections);
        return {
            data,
            meta,
        };
    }
    async updateOne(collection, item, query) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        return (await this.transport.patch(`/collections/${collection}`, item, {
            params: query,
        })).data;
    }
    async deleteOne(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        await this.transport.delete(`/collections/${collection}`);
    }
}

/**
 * Fields handler
 */
class FieldsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection, id) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/fields/${collection}/${id}`);
        return response.data;
    }
    async readMany(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/fields/${collection}`);
        return {
            data: response.data,
            meta: undefined,
        };
    }
    async readAll() {
        const response = await this.transport.get(`/fields`);
        return {
            data: response.data,
            meta: undefined,
        };
    }
    async createOne(collection, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        return (await this.transport.post(`/fields/${collection}`, item)).data;
    }
    async updateOne(collection, field, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        return (await this.transport.patch(`/fields/${collection}/${field}`, item)).data;
    }
    async deleteOne(collection, field) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        await this.transport.delete(`/fields/${collection}/${field}`);
    }
}

/**
 * Files handler
 */
class FilesHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_files', transport);
    }
    async import(body) {
        const response = await this.transport.post(`/files/import`, body);
        return response.data;
    }
}

/**
 * Folders handler
 */
class FoldersHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_folders', transport);
    }
}

/**
 * Permissions handler
 */
class PermissionsHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_permissions', transport);
    }
}

/**
 * Presets handler
 */
class PresetsHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_presets', transport);
    }
}

/**
 * Relations handler
 */
class RelationsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async readOne(collection, id) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${id}` === '')
            throw new EmptyParamError('id');
        const response = await this.transport.get(`/relations/${collection}/${id}`);
        return response.data;
    }
    async readMany(collection) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        const response = await this.transport.get(`/relations/${collection}`);
        return response.data;
    }
    async readAll() {
        const response = await this.transport.get(`/relations`);
        return response.data;
    }
    async createOne(item) {
        return (await this.transport.post(`/relations`, item)).data;
    }
    async updateOne(collection, field, item) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        return (await this.transport.patch(`/relations/${collection}/${field}`, item)).data;
    }
    async deleteOne(collection, field) {
        if (`${collection}` === '')
            throw new EmptyParamError('collection');
        if (`${field}` === '')
            throw new EmptyParamError('field');
        await this.transport.delete(`/relations/${collection}/${field}`);
    }
}

/**
 * Revisions handler
 */
class RevisionsHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_revisions', transport);
    }
}

/**
 * Roles handler
 */
class RolesHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_roles', transport);
    }
}

/**
 * Server handler
 */
class ServerHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async ping() {
        return (await this.transport.get('/server/ping')).raw;
    }
    async info() {
        return (await this.transport.get('/server/info')).data;
    }
    async oas() {
        return (await this.transport.get('/server/specs/oas')).raw;
    }
}

class SingletonHandler {
    constructor(collection, transport) {
        this.collection = collection;
        this.transport = transport;
        this.endpoint = collection.startsWith('superscribe_') ? `/${collection.replace('superscribe_', '')}` : `/items/${collection}`;
    }
    async read(query) {
        const item = await this.transport.get(`${this.endpoint}`, {
            params: query,
        });
        return item.data;
    }
    async update(data, _query) {
        const item = await this.transport.patch(`${this.endpoint}`, data, {
            params: _query,
        });
        return item.data;
    }
}

class SettingsHandler extends SingletonHandler {
    constructor(transport) {
        super('superscribe_settings', transport);
    }
}

class InvitesHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async send(email, role, invite_url) {
        await this.transport.post('/users/invite', {
            email,
            role,
            invite_url,
        });
    }
    async accept(token, password) {
        await this.transport.post(`/users/invite/accept`, {
            token,
            password,
        });
    }
}

class TFAHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async generate(password) {
        const result = await this.transport.post('/users/me/tfa/generate', { password });
        return result.data;
    }
    async enable(secret, otp) {
        await this.transport.post('/users/me/tfa/enable', { secret, otp });
    }
    async disable(otp) {
        await this.transport.post('/users/me/tfa/disable', { otp });
    }
}

class MeHandler {
    constructor(transport) {
        this._transport = transport;
    }
    get tfa() {
        return this._tfa || (this._tfa = new TFAHandler(this._transport));
    }
    async read(query) {
        const response = await this._transport.get('/users/me', {
            params: query,
        });
        return response.data;
    }
    async update(data, query) {
        const response = await this._transport.patch(`/users/me`, data, {
            params: query,
        });
        return response.data;
    }
}

/**
 * Users handler
 */
class UsersHandler extends ItemsHandler {
    constructor(transport) {
        super('superscribe_users', transport);
    }
    get invites() {
        return this._invites || (this._invites = new InvitesHandler(this.transport));
    }
    get me() {
        return this._me || (this._me = new MeHandler(this.transport));
    }
}

/**
 * Utils handler
 */
class UtilsHandler {
    constructor(transport) {
        this.random = {
            string: async (length = 32) => {
                const result = await this.transport.get('/utils/random/string', { params: { length } });
                return result.data;
            },
        };
        this.hash = {
            generate: async (string) => {
                const result = await this.transport.post('/utils/hash/generate', { string });
                return result.data;
            },
            verify: async (string, hash) => {
                const result = await this.transport.post('/utils/hash/verify', { string, hash });
                return result.data;
            },
        };
        this.transport = transport;
    }
    async sort(collection, item, to) {
        await this.transport.post(`/utils/sort/${encodeURI(collection)}`, { item, to });
    }
    async revert(revision) {
        await this.transport.post(`/utils/revert/${encodeURI(revision)}`);
    }
}

class IStorage {
}

class ITransport {
}
class TransportError extends Error {
    constructor(parent, response) {
        var _a, _b;
        if ((_a = response === null || response === void 0 ? void 0 : response.errors) === null || _a === void 0 ? void 0 : _a.length) {
            super((_b = response === null || response === void 0 ? void 0 : response.errors[0]) === null || _b === void 0 ? void 0 : _b.message);
        }
        else {
            super((parent === null || parent === void 0 ? void 0 : parent.message) || 'Unknown transport error');
        }
        this.parent = parent;
        this.response = response;
        this.errors = (response === null || response === void 0 ? void 0 : response.errors) || [];
        if (!Object.values(response || {}).some((value) => value !== undefined)) {
            this.response = undefined;
        }
        Object.setPrototypeOf(this, TransportError.prototype);
    }
}

var Keys;
(function (Keys) {
    Keys["AuthToken"] = "auth_token";
    Keys["RefreshToken"] = "auth_refresh_token";
    Keys["Expires"] = "auth_expires";
    Keys["ExpiresAt"] = "auth_expires_at";
})(Keys || (Keys = {}));
class BaseStorage extends IStorage {
    constructor(options) {
        var _a;
        super();
        this.prefix = (_a = options === null || options === void 0 ? void 0 : options.prefix) !== null && _a !== void 0 ? _a : '';
    }
    get auth_token() {
        return this.get(Keys.AuthToken);
    }
    set auth_token(value) {
        if (value === null) {
            this.delete(Keys.AuthToken);
        }
        else {
            this.set(Keys.AuthToken, value);
        }
    }
    get auth_expires() {
        const value = this.get(Keys.Expires);
        if (value === null) {
            return null;
        }
        return parseInt(value);
    }
    set auth_expires(value) {
        if (value === null) {
            this.delete(Keys.Expires);
        }
        else {
            this.set(Keys.Expires, value.toString());
        }
    }
    get auth_expires_at() {
        const value = this.get(Keys.ExpiresAt);
        if (value === null) {
            return null;
        }
        return parseInt(value);
    }
    set auth_expires_at(value) {
        if (value === null) {
            this.delete(Keys.ExpiresAt);
        }
        else {
            this.set(Keys.ExpiresAt, value.toString());
        }
    }
    get auth_refresh_token() {
        return this.get(Keys.RefreshToken);
    }
    set auth_refresh_token(value) {
        if (value === null) {
            this.delete(Keys.RefreshToken);
        }
        else {
            this.set(Keys.RefreshToken, value);
        }
    }
}

class MemoryStorage extends BaseStorage {
    constructor() {
        super(...arguments);
        this.values = {};
    }
    get(key) {
        const k = this.key(key);
        if (k in this.values) {
            return this.values[k];
        }
        return null;
    }
    set(key, value) {
        this.values[this.key(key)] = value;
        return value;
    }
    delete(key) {
        const value = this.get(key);
        delete this.values[this.key(key)];
        return value;
    }
    key(name) {
        return `${this.prefix}${name}`;
    }
}

class LocalStorage extends BaseStorage {
    get(key) {
        const value = localStorage.getItem(this.key(key));
        if (value !== null) {
            return value;
        }
        return null;
    }
    set(key, value) {
        localStorage.setItem(this.key(key), value);
        return value;
    }
    delete(key) {
        const value = this.get(key);
        localStorage.removeItem(this.key(key));
        return value;
    }
    key(name) {
        return `${this.prefix}${name}`;
    }
}

/**
 * Transport implementation
 */
class Transport extends ITransport {
    constructor(config) {
        var _a;
        super();
        this.config = config;
        this.axios = axios.create({
            baseURL: this.config.url,
            params: this.config.params,
            headers: this.config.headers,
            onUploadProgress: this.config.onUploadProgress,
            maxBodyLength: this.config.maxBodyLength,
            maxContentLength: this.config.maxContentLength,
            withCredentials: true,
        });
        if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.beforeRequest)
            this.beforeRequest = this.config.beforeRequest;
    }
    async beforeRequest(config) {
        return config;
    }
    get url() {
        return this.config.url;
    }
    async request(method, path, data, options) {
        var _a, _b, _c, _d, _e;
        try {
            let config = {
                method,
                url: path,
                data: data,
                params: options === null || options === void 0 ? void 0 : options.params,
                headers: options === null || options === void 0 ? void 0 : options.headers,
                responseType: options === null || options === void 0 ? void 0 : options.responseType,
                onUploadProgress: options === null || options === void 0 ? void 0 : options.onUploadProgress,
            };
            config = await this.beforeRequest(config);
            const response = await this.axios.request(config);
            const content = {
                raw: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data.data,
                meta: response.data.meta,
                errors: response.data.errors,
            };
            if (response.data.errors) {
                throw new TransportError(null, content);
            }
            return content;
        }
        catch (err) {
            if (!err || err instanceof Error === false) {
                throw err;
            }
            if (axios.isAxiosError(err)) {
                const data = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data;
                throw new TransportError(err, {
                    raw: (_b = err.response) === null || _b === void 0 ? void 0 : _b.data,
                    status: (_c = err.response) === null || _c === void 0 ? void 0 : _c.status,
                    statusText: (_d = err.response) === null || _d === void 0 ? void 0 : _d.statusText,
                    headers: (_e = err.response) === null || _e === void 0 ? void 0 : _e.headers,
                    data: data === null || data === void 0 ? void 0 : data.data,
                    meta: data === null || data === void 0 ? void 0 : data.meta,
                    errors: data === null || data === void 0 ? void 0 : data.errors,
                });
            }
            throw new TransportError(err);
        }
    }
    async get(path, options) {
        return await this.request('get', path, undefined, options);
    }
    async head(path, options) {
        return await this.request('head', path, undefined, options);
    }
    async options(path, options) {
        return await this.request('options', path, undefined, options);
    }
    async delete(path, data, options) {
        return await this.request('delete', path, data, options);
    }
    async put(path, data, options) {
        return await this.request('put', path, data, options);
    }
    async post(path, data, options) {
        return await this.request('post', path, data, options);
    }
    async patch(path, data, options) {
        return await this.request('patch', path, data, options);
    }
}

class PasswordsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async request(email, reset_url) {
        await this.transport.post('/auth/password/request', { email, reset_url });
    }
    async reset(token, password) {
        await this.transport.post('/auth/password/reset', { token, password });
    }
}

class Auth extends IAuth {
    constructor(options) {
        var _a, _b, _c;
        super();
        this.autoRefresh = true;
        this.msRefreshBeforeExpires = 30000;
        this.staticToken = '';
        this._transport = options.transport;
        this._storage = options.storage;
        this.autoRefresh = (_a = options === null || options === void 0 ? void 0 : options.autoRefresh) !== null && _a !== void 0 ? _a : this.autoRefresh;
        this.mode = (_b = options === null || options === void 0 ? void 0 : options.mode) !== null && _b !== void 0 ? _b : this.mode;
        this.msRefreshBeforeExpires = (_c = options === null || options === void 0 ? void 0 : options.msRefreshBeforeExpires) !== null && _c !== void 0 ? _c : this.msRefreshBeforeExpires;
        if (options === null || options === void 0 ? void 0 : options.staticToken) {
            this.staticToken = options === null || options === void 0 ? void 0 : options.staticToken;
            this.updateStorage({
                access_token: this.staticToken,
                expires: null,
                refresh_token: null,
            });
        }
    }
    get storage() {
        return this._storage;
    }
    get transport() {
        return this._transport;
    }
    get token() {
        return (async () => {
            if (this._refreshPromise) {
                try {
                    await this._refreshPromise;
                }
                finally {
                    this._refreshPromise = undefined;
                }
            }
            return this._storage.auth_token;
        })();
    }
    get password() {
        return (this.passwords = this.passwords || new PasswordsHandler(this._transport));
    }
    resetStorage() {
        this._storage.auth_token = null;
        this._storage.auth_refresh_token = null;
        this._storage.auth_expires = null;
        this._storage.auth_expires_at = null;
    }
    updateStorage(result) {
        var _a, _b;
        const expires = (_a = result.expires) !== null && _a !== void 0 ? _a : null;
        this._storage.auth_token = result.access_token;
        this._storage.auth_refresh_token = (_b = result.refresh_token) !== null && _b !== void 0 ? _b : null;
        this._storage.auth_expires = expires;
        this._storage.auth_expires_at = new Date().getTime() + (expires !== null && expires !== void 0 ? expires : 0);
    }
    async refreshIfExpired() {
        if (this.staticToken)
            return;
        if (!this.autoRefresh)
            return;
        if (!this._storage.auth_expires_at) {
            // wait because resetStorage() call in refresh()
            try {
                await this._refreshPromise;
            }
            finally {
                this._refreshPromise = undefined;
            }
            return;
        }
        if (this._storage.auth_expires_at < new Date().getTime() + this.msRefreshBeforeExpires) {
            this.refresh();
        }
        try {
            await this._refreshPromise; // wait for refresh
        }
        finally {
            this._refreshPromise = undefined;
        }
    }
    refresh() {
        const refreshPromise = async () => {
            var _a;
            const refresh_token = this._storage.auth_refresh_token;
            this.resetStorage();
            const response = await this._transport.post('/auth/refresh', {
                refresh_token: this.mode === 'json' ? refresh_token : undefined,
            });
            this.updateStorage(response.data);
            return {
                access_token: response.data.access_token,
                ...(((_a = response.data) === null || _a === void 0 ? void 0 : _a.refresh_token) && { refresh_token: response.data.refresh_token }),
                expires: response.data.expires,
            };
        };
        return (this._refreshPromise = refreshPromise());
    }
    async login(credentials) {
        var _a;
        this.resetStorage();
        const response = await this._transport.post('/auth/login', { mode: this.mode, ...credentials }, { headers: { Authorization: null } });
        this.updateStorage(response.data);
        return {
            access_token: response.data.access_token,
            ...(((_a = response.data) === null || _a === void 0 ? void 0 : _a.refresh_token) && {
                refresh_token: response.data.refresh_token,
            }),
            expires: response.data.expires,
        };
    }
    async static(token) {
        if (!this.staticToken)
            this.staticToken = token;
        await this._transport.get('/users/me', {
            params: { access_token: token },
            headers: { Authorization: null },
        });
        this.updateStorage({
            access_token: token,
            expires: null,
            refresh_token: null,
        });
        return true;
    }
    async logout() {
        let refresh_token;
        if (this.mode === 'json') {
            refresh_token = this._storage.auth_refresh_token || undefined;
        }
        await this._transport.post('/auth/logout', { refresh_token });
        this.updateStorage({
            access_token: null,
            expires: null,
            refresh_token: null,
        });
    }
}

class GraphQLHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async request(base, query, variables) {
        return await this.transport.post(base, {
            query,
            variables: typeof variables === 'undefined' ? {} : variables,
        });
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async items(query, variables) {
        return await this.request('/graphql', query, variables);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async system(query, variables) {
        return await this.request('/graphql/system', query, variables);
    }
}

class Superscribe {
    constructor(url, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this._url = url;
        this._options = options;
        this._items = {};
        this._singletons = {};
        if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.storage) && ((_b = this._options) === null || _b === void 0 ? void 0 : _b.storage) instanceof IStorage)
            this._storage = this._options.storage;
        else {
            const superscribeStorageOptions = (_c = this._options) === null || _c === void 0 ? void 0 : _c.storage;
            const { mode, ...storageOptions } = superscribeStorageOptions !== null && superscribeStorageOptions !== void 0 ? superscribeStorageOptions : {};
            if (mode === 'MemoryStorage' || typeof window === 'undefined') {
                this._storage = new MemoryStorage(storageOptions);
            }
            else {
                this._storage = new LocalStorage(storageOptions);
            }
        }
        if (((_d = this._options) === null || _d === void 0 ? void 0 : _d.transport) && ((_e = this._options) === null || _e === void 0 ? void 0 : _e.transport) instanceof ITransport)
            this._transport = this._options.transport;
        else {
            this._transport = new Transport({
                url: this.url,
                ...(_f = this._options) === null || _f === void 0 ? void 0 : _f.transport,
                beforeRequest: async (config) => {
                    var _a, _b, _c, _d, _e, _f;
                    if (this._url.indexOf('/auth/refresh') === -1 && ((_a = config.method) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'post') {
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
                    if (!(((_b = this._options) === null || _b === void 0 ? void 0 : _b.transport) instanceof ITransport) && ((_d = (_c = this._options) === null || _c === void 0 ? void 0 : _c.transport) === null || _d === void 0 ? void 0 : _d.beforeRequest)) {
                        return (_f = (_e = this._options) === null || _e === void 0 ? void 0 : _e.transport) === null || _f === void 0 ? void 0 : _f.beforeRequest(authenticatedConfig);
                    }
                    return authenticatedConfig;
                },
            });
        }
        if (((_g = this._options) === null || _g === void 0 ? void 0 : _g.auth) && ((_h = this._options) === null || _h === void 0 ? void 0 : _h.auth) instanceof IAuth)
            this._auth = this._options.auth;
        else
            this._auth = new Auth({
                transport: this._transport,
                storage: this._storage,
                ...(_j = this._options) === null || _j === void 0 ? void 0 : _j.auth,
            });
    }
    get url() {
        return this._url;
    }
    get auth() {
        return this._auth;
    }
    get storage() {
        return this._storage;
    }
    get transport() {
        return this._transport;
    }
    get assets() {
        return this._assets || (this._assets = new AssetsHandler(this.transport));
    }
    get activity() {
        return this._activity || (this._activity = new ActivityHandler(this.transport));
    }
    get collections() {
        return (this._collections ||
            (this._collections = new CollectionsHandler(this.transport)));
    }
    get fields() {
        return this._fields || (this._fields = new FieldsHandler(this.transport));
    }
    get files() {
        return this._files || (this._files = new FilesHandler(this.transport));
    }
    get folders() {
        return this._folders || (this._folders = new FoldersHandler(this.transport));
    }
    get permissions() {
        return (this._permissions ||
            (this._permissions = new PermissionsHandler(this.transport)));
    }
    get presets() {
        return this._presets || (this._presets = new PresetsHandler(this.transport));
    }
    get relations() {
        return (this._relations || (this._relations = new RelationsHandler(this.transport)));
    }
    get revisions() {
        return (this._revisions || (this._revisions = new RevisionsHandler(this.transport)));
    }
    get roles() {
        return this._roles || (this._roles = new RolesHandler(this.transport));
    }
    get users() {
        return this._users || (this._users = new UsersHandler(this.transport));
    }
    get settings() {
        return this._settings || (this._settings = new SettingsHandler(this.transport));
    }
    get server() {
        return this._server || (this._server = new ServerHandler(this.transport));
    }
    get utils() {
        return this._utils || (this._utils = new UtilsHandler(this.transport));
    }
    get graphql() {
        return this._graphql || (this._graphql = new GraphQLHandler(this.transport));
    }
    singleton(collection) {
        return (this._singletons[collection] ||
            (this._singletons[collection] = new SingletonHandler(collection, this.transport)));
    }
    items(collection) {
        return this._items[collection] || (this._items[collection] = new ItemsHandler(collection, this.transport));
    }
}

export { ActivityHandler, AssetsHandler, Auth, BaseStorage, CollectionsHandler, CommentsHandler, EmptyParamError, FieldsHandler, FilesHandler, FoldersHandler, IAuth, IStorage, ITransport, ItemsHandler, LocalStorage, MemoryStorage, Meta, PermissionsHandler, PresetsHandler, RelationsHandler, RevisionsHandler, RolesHandler, ServerHandler, SettingsHandler, Superscribe, Transport, TransportError, UsersHandler, UtilsHandler };
//# sourceMappingURL=sdk.bundler.js.map
