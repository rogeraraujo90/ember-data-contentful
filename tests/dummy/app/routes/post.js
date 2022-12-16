import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class extends Route {
  @service store;

  model(params) {
    return this.store.queryRecord('post', {
      'fields.slug': params.post_slug,
    });
  }

  serialize(model) {
    return { post_slug: model.slug };
  }
}
