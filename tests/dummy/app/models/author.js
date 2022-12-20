import Contentful from 'ember-data-contentful/models/contentful';
import { attr } from '@ember-data/model';

export default class AuthorMode extends Contentful {
  @attr('string') name;
}
