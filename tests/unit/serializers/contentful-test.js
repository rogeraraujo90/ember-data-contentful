import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ContentfulModel from 'ember-data-contentful/models/contentful';
import ContentfulAsset from 'ember-data-contentful/models/contentful-asset';
import ContentfulAdapter from 'ember-data-contentful/adapters/contentful';
import ContentfulSerializer from 'ember-data-contentful/serializers/contentful';
import { attr, belongsTo } from '@ember-data/model';

let Post, post, image;

module('Unit | Serializer | contentful', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    const ApplicationAdapter = class extends ContentfulAdapter {};
    this.owner.register('adapter:application', ApplicationAdapter);

    const ApplicationSerializer = class extends ContentfulSerializer {};
    this.owner.register('serializer:application', ApplicationSerializer);

    Post = class extends ContentfulModel {
      @attr('string') title;
      @belongsTo('contentful-asset', { async: false, inverse: null }) image;
      @attr() location;
    };

    this.owner.register('model:post', Post);
    post = {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'foobar',
          },
        },
        id: '1',
        type: 'Entry',
        createdAt: '2017-02-23T21:40:37.180Z',
        updatedAt: '2017-02-27T21:24:26.007Z',
        revision: 3,
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'post',
          },
        },
        locale: 'en-US',
      },
      fields: {
        title: 'Example Post',
        image: {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '2',
          },
        },
        location: {
          lon: -0.1055993,
          lat: 51.5109263,
        },
      },
    };

    image = {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'foobar',
          },
        },
        id: '2',
        type: 'Asset',
        createdAt: '2017-02-23T21:35:47.892Z',
        updatedAt: '2017-02-23T21:35:47.892Z',
        revision: 1,
        locale: 'en-US',
      },
      fields: {
        title: 'Sample Image',
        file: {
          url: '//example.com/image.jpg',
          details: {
            size: 651763,
            image: {
              width: 931,
              height: 1071,
            },
          },
          fileName: 'image.jpg',
          contentType: 'image/jpeg',
        },
      },
    };
  });

  // Sanity check to make sure everything is setup correctly.
  test('returns correct serializer for Post', function (assert) {
    let serializer = this.owner.lookup('service:store').serializerFor('post');

    assert.ok(
      serializer instanceof ContentfulSerializer,
      'serializer returned from serializerFor is an instance of ContentfulSerializer'
    );
  });

  test('modelNameFromPayloadType for Asset', function (assert) {
    let sys = image.sys;
    let serializer = this.owner.lookup('service:store').serializerFor('post');

    assert.strictEqual(
      serializer.modelNameFromPayloadType(sys),
      'contentful-asset'
    );
  });

  test('modelNameFromPayloadType for Entry', function (assert) {
    let sys = post.sys;
    let serializer = this.owner.lookup('service:store').serializerFor('post');

    assert.strictEqual(serializer.modelNameFromPayloadType(sys), 'post');
  });

  test('normalize with empty resourceHash', function (assert) {
    let resourceHash = null;
    let serializer = this.owner.lookup('service:store').serializerFor('post');

    assert.deepEqual(serializer.normalize(Post, resourceHash), { data: null });
  });

  test('normalize with Entry payload', function (assert) {
    let serializer = this.owner.lookup('service:store').serializerFor('post');
    let resourceHash = post;

    let normalizedPost = serializer.normalize(Post, resourceHash);
    assert.strictEqual(normalizedPost.data.attributes.contentType, 'post');
    assert.strictEqual(normalizedPost.data.attributes.title, post.fields.title);

    let expectedCreatedAt = new Date(normalizedPost.data.attributes.createdAt);
    let actualCreatedAt = new Date(post.sys.createdAt);
    assert.strictEqual(
      expectedCreatedAt.toString(),
      actualCreatedAt.toString()
    );

    let expectedUpdatedAt = new Date(normalizedPost.data.attributes.updatedAt);
    let actualUpdatedAt = new Date(post.sys.updatedAt);
    assert.strictEqual(
      expectedUpdatedAt.toString(),
      actualUpdatedAt.toString()
    );

    assert.strictEqual(normalizedPost.data.id, post.sys.id);
    assert.strictEqual(normalizedPost.data.type, 'post');
    assert.deepEqual(normalizedPost.data.relationships, {
      image: {
        data: {
          id: '2',
          type: 'contentful-asset',
        },
      },
    });
  });

  test('normalize with Asset payload', function (assert) {
    let serializer = this.owner
      .lookup('service:store')
      .serializerFor('contentful-asset');
    let resourceHash = image;

    let normalizedAsset = serializer.normalize(ContentfulAsset, resourceHash);

    assert.strictEqual(normalizedAsset.data.attributes.contentType, 'asset');
    assert.strictEqual(normalizedAsset.data.id, image.sys.id);
    assert.strictEqual(normalizedAsset.data.type, 'contentful-asset');
    assert.strictEqual(
      normalizedAsset.data.attributes.title,
      image.fields.title
    );
    assert.deepEqual(normalizedAsset.data.attributes.file, {
      contentType: 'image/jpeg',
      details: {
        size: 651763,
        image: {
          width: 931,
          height: 1071,
        },
      },
      fileName: 'image.jpg',
      url: '//example.com/image.jpg',
    });

    let expectedAssetCreatedAt = new Date(
      normalizedAsset.data.attributes.createdAt
    );
    let actualAssetCreatedAt = new Date(image.sys.createdAt);
    assert.strictEqual(
      expectedAssetCreatedAt.toString(),
      actualAssetCreatedAt.toString()
    );

    let expectedAssetUpdatedAt = new Date(
      normalizedAsset.data.attributes.updatedAt
    );
    let actualAssetUpdatedAt = new Date(image.sys.updatedAt);
    assert.strictEqual(
      expectedAssetUpdatedAt.toString(),
      actualAssetUpdatedAt.toString()
    );
  });

  test('normalize with Location payload', function (assert) {
    let serializer = this.owner.lookup('service:store').serializerFor('post');
    let resourceHash = post;

    let normalizedPost = serializer.normalize(Post, resourceHash);
    assert.strictEqual(
      normalizedPost.data.attributes.location,
      post.fields.location
    );
  });

  test('normalizeQueryRecordResponse with empty items', function (assert) {
    let id = '';
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 0,
      skip: 0,
      limit: 100,
      items: [],
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let documentHash = serializer.normalizeQueryRecordResponse(
      this.owner.lookup('service:store'),
      Post,
      payload,
      id,
      'queryRecord'
    );

    assert.deepEqual(documentHash, { data: null, included: [] });
  });

  test('normalizeQueryRecordResponse with an item with includes', function (assert) {
    let id = '';
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1,
      items: [post],
      includes: {
        Asset: [image],
      },
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let documentHash = serializer.normalizeQueryRecordResponse(
      this.owner.lookup('service:store'),
      Post,
      payload,
      id,
      'queryRecord'
    );

    assert.strictEqual(documentHash.data.attributes.contentType, 'post');
    assert.strictEqual(documentHash.data.attributes.title, post.fields.title);

    let expectedCreatedAt = new Date(documentHash.data.attributes.createdAt);
    let actualCreatedAt = new Date(post.sys.createdAt);
    assert.strictEqual(
      expectedCreatedAt.toString(),
      actualCreatedAt.toString()
    );

    let expectedUpdatedAt = new Date(documentHash.data.attributes.updatedAt);
    let actualUpdatedAt = new Date(post.sys.updatedAt);
    assert.strictEqual(
      expectedUpdatedAt.toString(),
      actualUpdatedAt.toString()
    );

    assert.strictEqual(documentHash.data.id, post.sys.id);
    assert.strictEqual(documentHash.data.type, 'post');
    assert.deepEqual(documentHash.data.relationships, {
      image: {
        data: {
          id: '2',
          type: 'contentful-asset',
        },
      },
    });

    assert.strictEqual(documentHash.included.length, 1);
    let asset = documentHash.included[0];
    assert.strictEqual(asset.attributes.contentType, 'asset');
    assert.strictEqual(asset.id, image.sys.id);
    assert.strictEqual(asset.type, 'contentful-asset');
    assert.strictEqual(asset.attributes.title, image.fields.title);
    assert.deepEqual(asset.attributes.file, {
      contentType: 'image/jpeg',
      details: {
        size: 651763,
        image: {
          width: 931,
          height: 1071,
        },
      },
      fileName: 'image.jpg',
      url: '//example.com/image.jpg',
    });

    let expectedAssetCreatedAt = new Date(asset.attributes.createdAt);
    let actualAssetCreatedAt = new Date(image.sys.createdAt);
    assert.strictEqual(
      expectedAssetCreatedAt.toString(),
      actualAssetCreatedAt.toString()
    );

    let expectedAssetUpdatedAt = new Date(asset.attributes.updatedAt);
    let actualAssetUpdatedAt = new Date(image.sys.updatedAt);
    assert.strictEqual(
      expectedAssetUpdatedAt.toString(),
      actualAssetUpdatedAt.toString()
    );

    assert.deepEqual(asset.relationships, {});
  });

  test('normalizeQueryRecordResponse with an item w/o includes', function (assert) {
    let id = '';
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1,
      items: [
        {
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'foobar',
              },
            },
            id: '1',
            type: 'Entry',
            createdAt: '2017-02-23T21:40:37.180Z',
            updatedAt: '2017-02-27T21:24:26.007Z',
            revision: 3,
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'post',
              },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Example Post',
          },
        },
      ],
    };

    Post = class extends ContentfulModel {
      @attr('string') title;
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let documentHash = serializer.normalizeQueryRecordResponse(
      this.owner.lookup('service:store'),
      Post,
      payload,
      id,
      'queryRecord'
    );

    assert.strictEqual(documentHash.data.attributes.contentType, 'post');
    assert.strictEqual(documentHash.data.attributes.title, post.fields.title);

    let expectedCreatedAt = new Date(documentHash.data.attributes.createdAt);
    let actualCreatedAt = new Date(post.sys.createdAt);
    assert.strictEqual(
      expectedCreatedAt.toString(),
      actualCreatedAt.toString()
    );

    let expectedUpdatedAt = new Date(documentHash.data.attributes.updatedAt);
    let actualUpdatedAt = new Date(post.sys.updatedAt);
    assert.strictEqual(
      expectedUpdatedAt.toString(),
      actualUpdatedAt.toString()
    );

    assert.strictEqual(documentHash.data.id, post.sys.id);
    assert.strictEqual(documentHash.data.type, 'post');
    assert.deepEqual(documentHash.data.relationships, {});
    assert.strictEqual(documentHash.included.length, 0);
  });

  test('normalizeQueryResponse with an item with includes', function (assert) {
    let id = '';
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1,
      items: [post],
      includes: {
        Asset: [image],
      },
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let documentHash = serializer.normalizeQueryResponse(
      this.owner.lookup('service:store'),
      Post,
      payload,
      id,
      'queryRecord'
    );

    // Items (Posts)
    assert.strictEqual(documentHash.data.length, 1);

    let postData = documentHash.data[0];
    assert.strictEqual(postData.attributes.contentType, 'post');
    assert.strictEqual(postData.attributes.title, post.fields.title);

    let expectedCreatedAt = new Date(postData.attributes.createdAt);
    let actualCreatedAt = new Date(post.sys.createdAt);
    assert.strictEqual(
      expectedCreatedAt.toString(),
      actualCreatedAt.toString()
    );

    let expectedUpdatedAt = new Date(postData.attributes.updatedAt);
    let actualUpdatedAt = new Date(post.sys.updatedAt);
    assert.strictEqual(
      expectedUpdatedAt.toString(),
      actualUpdatedAt.toString()
    );

    assert.strictEqual(postData.id, post.sys.id);
    assert.strictEqual(postData.type, 'post');
    assert.deepEqual(postData.relationships, {
      image: {
        data: {
          id: '2',
          type: 'contentful-asset',
        },
      },
    });

    // Includes
    assert.strictEqual(documentHash.included.length, 1);
    let asset = documentHash.included[0];
    assert.strictEqual(asset.attributes.contentType, 'asset');
    assert.strictEqual(asset.id, image.sys.id);
    assert.strictEqual(asset.type, 'contentful-asset');
    assert.strictEqual(asset.attributes.title, image.fields.title);
    assert.deepEqual(asset.attributes.file, {
      contentType: 'image/jpeg',
      details: {
        size: 651763,
        image: {
          width: 931,
          height: 1071,
        },
      },
      fileName: 'image.jpg',
      url: '//example.com/image.jpg',
    });

    let expectedAssetCreatedAt = new Date(asset.attributes.createdAt);
    let actualAssetCreatedAt = new Date(image.sys.createdAt);
    assert.strictEqual(
      expectedAssetCreatedAt.toString(),
      actualAssetCreatedAt.toString()
    );

    let expectedAssetUpdatedAt = new Date(asset.attributes.updatedAt);
    let actualAssetUpdatedAt = new Date(image.sys.updatedAt);
    assert.strictEqual(
      expectedAssetUpdatedAt.toString(),
      actualAssetUpdatedAt.toString()
    );

    assert.deepEqual(asset.relationships, {});

    // Meta
    let meta = serializer.extractMeta(
      this.owner.lookup('service:store'),
      Post,
      payload
    );
    assert.deepEqual(documentHash.meta, meta);
  });

  test('normalizeQueryResponse with an item w/o includes', function (assert) {
    let id = '';
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 1,
      skip: 0,
      limit: 1,
      items: [
        {
          sys: {
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'foobar',
              },
            },
            id: '1',
            type: 'Entry',
            createdAt: '2017-02-23T21:40:37.180Z',
            updatedAt: '2017-02-27T21:24:26.007Z',
            revision: 3,
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'post',
              },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Example Post',
          },
        },
      ],
    };

    Post = class extends ContentfulModel {
      @attr('string') title;
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let documentHash = serializer.normalizeQueryResponse(
      this.owner.lookup('service:store'),
      Post,
      payload,
      id,
      'queryRecord'
    );

    // Items (Posts)
    assert.strictEqual(documentHash.data.length, 1);

    let postData = documentHash.data[0];
    assert.strictEqual(postData.attributes.contentType, 'post');
    assert.strictEqual(postData.attributes.title, post.fields.title);

    let expectedCreatedAt = new Date(postData.attributes.createdAt);
    let actualCreatedAt = new Date(post.sys.createdAt);
    assert.strictEqual(
      expectedCreatedAt.toString(),
      actualCreatedAt.toString()
    );

    let expectedUpdatedAt = new Date(postData.attributes.updatedAt);
    let actualUpdatedAt = new Date(post.sys.updatedAt);
    assert.strictEqual(
      expectedUpdatedAt.toString(),
      actualUpdatedAt.toString()
    );

    assert.strictEqual(postData.id, post.sys.id);
    assert.strictEqual(postData.type, 'post');
    assert.deepEqual(postData.relationships, {});

    // Includes
    assert.strictEqual(documentHash.included.length, 0);

    // Meta
    let meta = serializer.extractMeta(
      this.owner.lookup('service:store'),
      Post,
      payload
    );
    assert.deepEqual(documentHash.meta, meta);
  });

  test('extractMeta returns null without a payload', function (assert) {
    let serializer = this.owner.lookup('service:store').serializerFor('post');
    let meta = serializer.extractMeta(
      this.owner.lookup('service:store'),
      Post,
      null
    );

    assert.notOk(meta);
  });

  test('extractMeta returns meta from payload', function (assert) {
    let payload = {
      sys: {
        type: 'Array',
      },
      total: 3,
      skip: 1,
      limit: 2,
      items: [post],
      includes: {
        Asset: [image],
      },
    };

    let serializer = this.owner.lookup('service:store').serializerFor('post');

    let meta = serializer.extractMeta(
      this.owner.lookup('service:store'),
      Post,
      payload
    );

    assert.deepEqual(meta, {
      total: 3,
      skip: 1,
      limit: 2,
    });
  });
});
