import { json, LinksFunction, LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import MapboxGLCss from 'mapbox-gl/dist/mapbox-gl.css';
import type { Location } from '~/models/location.server';
import { getLocationById } from '~/models/location.server';
import styles from '~/styles/map.css';
import { Mapbox } from '~/ui/map';

export const links: LinksFunction = () => {
  return [
    { href: styles, rel: 'stylesheet' },
    { href: MapboxGLCss, rel: 'stylesheet' },
  ];
};
export const loader: LoaderFunction = async ({ params }) => {
  if (!params.location) {
    throw new Error('Missing location');
  }

  return json(await getLocationById(params.location));
};

export default function LocationPage() {
  const location = useLoaderData<Location>();
  return (
    <main>
      <h1>{location.name}</h1>
      <Mapbox
        {...{
          ...location.coordinates,
          zoom: 13,
          style: 'mapbox://styles/mapbox/streets-v11',
          showMarker: true,
        }}
      />
      {location.images.map((i) => (
        <img
          key={i._key}
          alt={i.asset.altText}
          src={`${i.asset.url}?auto=format`}
          style={{ height: 'auto', width: '100%' }}
        />
      ))}
    </main>
  );
}
