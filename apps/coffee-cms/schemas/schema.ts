// First, we must import the schema creator
// @ts-ignore
import createSchema from 'part:@sanity/base/schema-creator';

// Then import schema types from any plugins that might expose them
// @ts-ignore
import schemaTypes from 'all:part:@sanity/base/schema-type';
import beans from './beans';
import brew from './brews';
import orders from './orders';
// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  // We name our schema
  name: 'default',
  // Then proceed to concatenate our document type
  // to the ones provided by any plugins that are installed
  types: schemaTypes.concat([
    /* Your types here! */
    beans,
    orders,
    brew,
  ]),
});
