import Contentful from 'ember-data-contentful/models/contentful';
import { attr } from '@ember-data/model';

export default Contentful.extend({
  name: attr('string'),
});
