import { json, LinksFunction, LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import MapboxGLCss from 'mapbox-gl/dist/mapbox-gl.css';
import { City, getCityById } from '~/models/city.server';
import styles from '~/styles/map.css';
import { Mapbox } from '~/ui/map';

export const links: LinksFunction = () => {
  return [
    { href: styles, rel: 'stylesheet' },
    { href: MapboxGLCss, rel: 'stylesheet' },
  ];
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.city) {
    throw new Error('Missing city');
  }

  return json(await getCityById(params.city));
};

export default function CityPage() {
  const city = useLoaderData<City>();
  console.log(city);
  return (
    <main>
      <h1>{city.name}</h1>
      <p>{city.description}</p>
      <Mapbox
        {...{
          ...city.coordinates,
          zoom: 11,
          style: 'mapbox://styles/mapbox/streets-v11',
        }}
      />
      <ul>
        {city.locations.map((l) => (
          <li key={l._id}>
            <Link to={`${l._id}`}>{l.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Oops issue loading this location!</h1>
      <p>{error.message}</p>
      <pre>{error.stack}</pre>
    </div>
  );
}
