import { json, LoaderFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { getLinks, MusicLink } from '~/models/link.server';

export const loader: LoaderFunction = async () => {
  return json<MusicLink[]>(await getLinks());
};

export default function Links() {
  const links = useLoaderData<MusicLink[]>();
  console.log(links);
  return (
    <main>
      <h1>Links</h1>
      <ul>
        {links.map((link) => (
          <li key={link.slug}>
            <Link to={link.slug}>{link.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
