import Contentful from 'ember-data-contentful/models/contentful';
import { attr } from '@ember-data/model';
import { hasMany, belongsTo } from '@ember-data/model';

export default class PostModel extends Contentful {
  @attr('string') body;
  @attr('date') date;
  @attr('string') slug;
  @attr('string') title;

  @belongsTo('contentful-asset', { async: false, inverse: null }) featuredImage;
  @hasMany('author') author;
}
