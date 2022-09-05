// allows for correct caching of remote sanity content.
const SanityClient = require('@sanity/client');
const {createHash} = require('crypto')

/**
 * @returns {Promise<{_updatedAt: string}[]>}
 */
async function getBrewTimestaps() {
  const DB_CLIENT = new SanityClient({
    projectId: 'n1ith7fn',
    dataset: 'production',
    apiVersion: '2022-07-06',
    useCdn: false,
  });
  const query = `*[_type == "brew"]{_updatedAt}`
  const rawResults = await DB_CLIENT.fetch(query);
  return rawResults;
}

getBrewTimestaps().then(r => {
  const hash = createHash('sha256')
  for (const u of r) {
    hash.update(u._updatedAt)
  }
  // logging to stdout so nx knows the hash
  console.log(hash.digest('hex'));
})