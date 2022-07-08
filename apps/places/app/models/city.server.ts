import { SanityDocument } from '@sanity/client';
import { DB_CLIENT } from '~/models/db.server';
import type { Location } from '~/models/location.server';

export interface City extends SanityDocument {
  coordinates: GeoPoint;
  description: string;
  locations: Location[];
  name: string;
}
export interface RangeQueryOptions {
  start: number;
  end: number;
}

export type GeoPoint = {
  _type: 'geopoint';
  lat: number;
  lng: number;
};

export async function getCities(
  options: RangeQueryOptions = { start: 0, end: 10 }
): Promise<City[]> {
  const query = `*[_type == 'city']|order(name asc)[$start..$end]`;
  const p = await DB_CLIENT.fetch<City[]>(query, { ...options });
  console.log(p);
  return p;
}

export async function getCityById(cityId: string) {
  const query = `*[_type == 'city' && _id == $cityId]{..., locations[]->{...,images[]{...,asset->{altText, url}}}}[0]`;
  const p = await DB_CLIENT.fetch<City>(query, { cityId });
  console.log(JSON.stringify(p, null, 2));
  return p;
}
