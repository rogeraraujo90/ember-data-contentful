import Contentful from './contentful';
import { attr } from '@ember-data/model';

export default Contentful.extend({
  file: attr(),
  title: attr('string'),
  description: attr('string'),
});
