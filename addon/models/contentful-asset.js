import Contentful from './contentful';
import { attr } from '@ember-data/model';

export default class ContentfulAssetModel extends Contentful {
  @attr() file;
  @attr('string') title;
  @attr('string') description;
}
