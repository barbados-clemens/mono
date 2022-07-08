import SanityClient from '@sanity/client';

export const DB_CLIENT = new SanityClient({
  projectId: 'x97lzcli',
  dataset: 'production',
  apiVersion: '2022-07-06',
  useCdn: true,
});
