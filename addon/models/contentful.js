import Model from '@ember-data/model';
import { attr } from '@ember-data/model';

export default class ContentfulModel extends Model {
  @attr contentType;
  @attr('date') createdAt;
  @attr('date') updatedAt;
}
