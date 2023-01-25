const BASE_URL = 'https://api.spotify.com/v1';
const NOW_PLAYING_URL = `${BASE_URL}/me/player/currently-playing?market=US`;
export async function getNowPlaying() {
	if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
		throw new Error('No Spotify tokens found');
	}
	const token = await getToken();

	console.log({ token });
	const response = await fetch(NOW_PLAYING_URL, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
			'user-agent': 'CalebUkleCom/1.0',
		},
	}).then((r) => r.json());

	return response;
}

async function getToken() {
	const data = new FormData();
	data.append('grant_type', 'client_credentials');
	data.append('json', 'true');

	const res = await fetch(`${BASE_URL}/api/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${btoa(
				`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
			)}`,
		},
		body: data,
	}).then((r) => r.json());
	console.log('res', res);
	return res.access_token;
}
