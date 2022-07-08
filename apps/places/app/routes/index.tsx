import { json, LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { City, getCities } from '~/models/city.server';

export const loader: LoaderFunction = async () => {
  return json<City[]>(await getCities());
};
export default function Cities() {
  const cities = useLoaderData<City[]>();
  return (
    <main>
      <h1>Cities</h1>
      <ul>
        {cities.map((place) => (
          <li key={place._id}>
            <Link to={`/city/${place._id}`}>{place.name}</Link>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(cities, null, 2)}</pre>
    </main>
  );
}
