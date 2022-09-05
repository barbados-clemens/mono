import SanityClient from '@sanity/client';

export const DB_CLIENT = new SanityClient({
  projectId: 'n1ith7fn',
  dataset: 'production',
  apiVersion: '2022-07-06',
  useCdn: true,
});