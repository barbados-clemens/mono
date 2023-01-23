const API_URL = new URL('https://api.discogs.com/');
const COLLECTION_URL = new URL(
	`${API_URL}users/Barbados_Clemens/collection/folders/0/releases?sort=added&sort_order=desc&per_page=100`
);

interface Record {
	id: number;
	instance_id: number;
	date_added: string;
	rating: number;
	basic_information: {
		id: number;
		master_id: number;
		master_url: string;
		resource_url: string;
		thumb: string;
		cover_image: string;
		title: string;
		year: number;
		formats: [
			{
				name: string;
				qty: string;
				descriptions: string[];
			}
		];
		labels: {
			name: string;
			catno: string;
			entity_type: string;
			entity_type_name: string;
			id: number;
			resource_url: string;
		}[];
		artists: {
			name: string;
			anv: string;
			join: string;
			role: string;
			tracks: string;
			id: number;
			resource_url: string;
		}[];
		genres: string[];
		styles: string[];
	};
	folder_id: number;
	notes: { field_id: number; value: string }[];
}
export async function getAllRecords(): Promise<Record[]> {
	return await getRecordsRecursive(COLLECTION_URL);
}

async function getRecordsRecursive(url: URL): Promise<any[]> {
	const records = [];
	const res = await executeApiRequest<{
		pagination: { urls?: { next?: string } };
		releases: any;
	}>(url);
	records.push(...res.releases);

	if (res.pagination?.urls?.next) {
		const nextPage = await getRecordsRecursive(
			new URL(res.pagination.urls.next)
		);
		records.push(...nextPage);
	}

	return records;
}

async function executeApiRequest<T>(url: URL) {
	if (!process.env.DISCOGS_TOKEN) {
		throw new Error('DISCOGS_TOKEN not set');
	}
	url.searchParams.append('token', process.env.DISCOGS_TOKEN);
	return (await fetch(url, {
		method: 'GET',
		headers: {
			'content-type': 'application/json',
			// v2 of the API
			accept: 'application/vnd.discogs.v2.discogs+json',
			'user-agent': 'CalebUkleCom/1.0',
		},
	}).then((r) => r.json())) as Promise<T>;
}
