import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ContentfulModel from 'ember-data-contentful/models/contentful';
import ContentfulAdapter from 'ember-data-contentful/adapters/contentful';
import { attr } from '@ember-data/model';

let Post;

module('Unit | Adapter | contentful', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    Post = ContentfulModel.extend({
      title: attr('string'),
    });

    this.owner.register('model:post', Post);
  });

  test('queryRecord calls _getContent with correct parameters when query is empty', async function (assert) {
    assert.expect(1);

    let ApplicationAdapter = class extends ContentfulAdapter {
      _getContent(type, params) {
        assert.deepEqual(params, {
          content_type: 'post',
          skip: 0,
          limit: 1,
        });
        return super._getContent(...arguments);
      }
    };

    this.owner.register('adapter:application', ApplicationAdapter);

    const store = this.owner.lookup('service:store');
    await store.queryRecord('post', {});
  });

  test('queryRecord calls _getContent with correct parameters', async function (assert) {
    assert.expect(1);

    let ApplicationAdapter = class extends ContentfulAdapter {
      _getContent(type, params) {
        assert.deepEqual(params, {
          content_type: 'post',
          order: 'fields.title',
          skip: 0,
          limit: 1,
        });
        return super._getContent(...arguments);
      }
    };

    this.owner.register('adapter:application', ApplicationAdapter);

    let store = this.owner.lookup('service:store');

    await store.queryRecord('post', { order: 'fields.title' });
  });
});
