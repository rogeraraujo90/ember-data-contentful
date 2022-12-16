import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import EmberRouter from '@ember/routing/router';
import config from 'dummy/config/environment';

export default class Router extends EmberRouter {
  @service metrics;

  location = config.locationType;
  rootURL = config.rootURL;

  didTransition() {
    super.didTransition(...arguments);
    if (typeof FastBoot === 'undefined') {
      scheduleOnce('afterRender', this, this.trackPage);
    }
  }

  trackPage() {
    const page = document.location.pathname;
    const title =
      this.currentRouteName === undefined ? 'unknown' : this.currentRouteName;

    this.metrics.trackPage({ page, title });
  }
}

Router.map(function () {
  this.route('posts', { path: '/' });
  this.route('post', { path: 'posts/:post_slug' });
});
