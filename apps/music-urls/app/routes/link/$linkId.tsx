import { json, LoaderFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

export const loader: LoaderFunction = async ({ params }) => {
  return json({ slug: params.linkId });
};
export default function LinkSlug() {
  const { slug } = useLoaderData();

  return (
    <main>
      <h1>Link Slug</h1>
      <p>{slug}</p>
    </main>
  );
}
