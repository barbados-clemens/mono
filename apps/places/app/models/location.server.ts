import { SanityDocument } from '@sanity/client';
import { GeoPoint } from '~/models/city.server';
import { DB_CLIENT } from '~/models/db.server';

export interface Location extends SanityDocument {
  coordinates: GeoPoint;
  name: string;
  images: {
    _key: string;
    asset: {
      altText: string;
      url: string;
    };
  }[];
}
export async function getLocationById(locationId: string) {
  const query = `*[_type == 'location' && _id == $locationId]{...,images[]{...,asset->{altText, url}}}[0]`;
  const p = await DB_CLIENT.fetch<Location>(query, { locationId });
  console.log(p);
  return p;
}
