import Adapter from '@ember-data/adapter';
import config from 'ember-get-config';
import fetch from 'fetch';

export default class ContentfulAdapter extends Adapter {
  /**
   @property coalesceFindRequests
   @type {boolean}
   @public
   */
  coalesceFindRequests = true;

  /**
   Currently not implemented as this is adapter only implements the
   READ ONLY Content Delivery API (https://www.contentful.com/developers/docs/references/content-delivery-api/).
   For more information on the Content Management API,
   see https://www.contentful.com/developers/docs/references/content-management-api/

   @method createRecord
   @public
   */
  createRecord = null;

  /**
   Currently not implemented as this is adapter only implements the
   READ ONLY Content Delivery API (https://www.contentful.com/developers/docs/references/content-delivery-api/).
   For more information on the Content Management API,
   see https://www.contentful.com/developers/docs/references/content-management-api/

   @method updateRecord
   @public
   */
  updateRecord = null;

  /**
   Currently not implemented as this is adapter only implements the
   READ ONLY Content Delivery API (https://www.contentful.com/developers/docs/references/content-delivery-api/).
   For more information on the Content Management API,
   see https://www.contentful.com/developers/docs/references/content-management-api/

   @method deleteRecord
   @public
   */
  deleteRecord = null;

  /**
   Allows the adapter to override the content type param used in api calls where
   content type param is needed. (e.g. `findAll`, `query`, `queryRecord`)

   @method contentTypeParam
   @param {String} modelName
   @return {String}
   @public
   */
  contentTypeParam(modelName) {
    return modelName;
  }

  /**
   Called by the store in order to fetch the JSON for a given
   type and ID.

   The `findRecord` method makes a fetch (HTTP GET) request to a URL, and returns a
   promise for the resulting payload.

   @method findRecord
   @param {Store} store
   @param {Model} type
   @param {String} id
   @return {Promise} promise
   @public
   */
  findRecord(store, type, id) {
    let contentType =
      type.modelName === 'asset' || type.modelName === 'contentful-asset'
        ? 'assets'
        : 'entries';

    return this._getContent(`${contentType}/${id}`);
  }

  /**
   Called by the store in order to fetch several records together.

   The `findMany` method makes a fetch (HTTP GET) request to a URL, and returns a
   promise for the resulting payload.

   @method findMany
   @param {Store} store
   @param {Model} type
   @param {Array} ids
   @return {Promise} promise
   @public
   */
  findMany(store, type, ids) {
    let contentType =
      type.modelName === 'asset' || type.modelName === 'contentful-asset'
        ? 'assets'
        : 'entries';

    return this._getContent(contentType, { 'sys.id[in]': ids.toString() });
  }

  /**
   Called by the store in order to fetch a JSON array for all
   of the records for a given type.

   The `findAll` method makes a fetch (HTTP GET) request to a URL, and returns a
   promise for the resulting payload.

   @method findAll
   @param {Store} store
   @param {Model} type
   @return {Promise} promise
   @public
   */
  findAll(store, type) {
    return this._getContent('entries', {
      content_type: this.contentTypeParam(type.modelName),
    });
  }

  /**
   Called by the store in order to fetch a JSON array for
   the records that match a particular query.

   The `query` method makes a fetch (HTTP GET) request to a URL
   and returns a promise for the resulting payload.

   The `query` argument is a simple JavaScript object that will be passed directly
   to the server as parameters.

   @method query
   @param {Store} store
   @param {Model} type
   @param {Object} query
   @return {Promise} promise
   @public
   */
  query(store, type, query) {
    query = query || {};
    query['content_type'] = this.contentTypeParam(type.modelName);
    return this._getContent('entries', query);
  }

  /**
   Called by the store in order to fetch a JSON object for
   the record that matches a particular query.

   The `queryRecord` method makes a fetch (HTTP GET) request to a URL
   and returns a promise for the resulting payload.

   The `query` argument is a simple JavaScript object that will be passed directly
   to the server as parameters.

   @method queryRecord
   @param {Store} store
   @param {Model} type
   @param {Object} query
   @return {Promise} promise
   @public
   */
  async queryRecord(store, type, query) {
    query = query || {};
    query['content_type'] = this.contentTypeParam(type.modelName);
    query['limit'] = 1;
    query['skip'] = 0;

    return this._getContent('entries', query);
  }

  /**
   `_getContent` makes all requests to the contentful.com content delivery API
   @method _getContent
   @param {String} type
   @param {Object} params
   @return {Promise} promise
   @private
   */
  async _getContent(type, params) {
    let data = params || {};
    let { accessToken, api, space, environment } = this._getConfig();

    const response = await fetch(
      `https://${api}.contentful.com/spaces/${space}${environment}/${type}/${this._serializeQueryParams(
        data
      )}`,
      {
        headers: {
          Accept: 'application/json; charset=utf-8',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.json();
  }

  /**
   `_setContent` makes all requests to the contentful.com content management API

   @method _setContent
   @param {String} type
   @param {Object} params
   @return {Promise} promise
   @private
   */
  _setContent() {
    console.warn(
      `The Contentful Content Management API has not yet been implemented`
    ); /* eslint-disable-line no-console */
  }

  /**
   `_serializeQueryParams` is a private utility used to
   stringify the query param object to be used with the fetch API.

   @method _serializeQueryParams
   @param {Object} obj
   @return {String} query string
   @private
   */
  _serializeQueryParams(obj) {
    let str = [];
    for (let p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        str.push(`${encodeURIComponent(p)}=${encodeURIComponent(obj[p])}`);
      }
    }
    return str.length ? `?${str.join('&')}` : '';
  }

  /**
   `_getConfig` returns the config from your `config/environment.js`

   @method _getConfig
   @return {Object} params
   @private
   */
  _getConfig() {
    let accessToken = config.contentful
      ? config.contentful.accessToken
      : config.contentfulAccessToken;
    let api = 'cdn';
    let space = config.contentful
      ? config.contentful.space
      : config.contentfulSpace;
    let environment = config.contentful.environment
      ? `/environments/${config.contentful.environment}`
      : '';
    let previewAccessToken = config.contentful
      ? config.contentful.previewAccessToken
      : config.contentfulPreviewAccessToken;

    if (config.contentful.usePreviewApi || config.contentfulUsePreviewApi) {
      if (!previewAccessToken) {
        console.warn(
          'You have specified to use the Contentful Preview API; However, no `previewAccessToken` has been specified in config/environment.js'
        ); /* eslint-disable-line no-console */
      } else {
        accessToken = previewAccessToken;
        api = 'preview';
      }
    }
    if (config.contentfulAccessToken || config.contentfulSpace) {
      /* eslint-disable-next-line no-console */
      console.warn(`DEPRECATION: Use of 'contentfulAccessToken' and 'contentfulSpace' will be removed in ember-data-contentful@1.0.0. please migrate to the contentful object syntax:
      contentful: {
        accessToken: '${accessToken}',
        space: '${space}'
      }`);
    }
    return {
      accessToken,
      api,
      space,
      environment,
    };
  }
}
