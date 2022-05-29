export interface MusicLink {
  title: string;
  slug: string;
}

export async function getLinks(): Promise<MusicLink[]> {
  return [
    { slug: 'blah', title: 'Blah' },
    { slug: 'blah2', title: 'Blah2' },
  ];
}
