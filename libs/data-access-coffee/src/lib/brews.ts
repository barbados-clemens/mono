import { RawBrew } from './brews.model';
import { DB_CLIENT } from './db-client';
// *[_type == 'brew']{...,brewPic{asset->},brewedWith->{...,beans->{...,image{asset->}}}}
const DAY_IN_MS = 1000 * 60 * 60 * 24;

export async function getBrews() {
	const query = `*[_type == "brew"]{...,brewPic{asset->},brewedWith->{...}} | order(brewedOn desc)`;
	const rawResults = await DB_CLIENT.fetch<RawBrew[]>(query);
	return rawResults.filter((b) => b.brewPic);
}

export function getRelativeDateForBrew(time: string) {
	const rtf = new Intl.RelativeTimeFormat('en-US', {
		style: 'narrow',
	});
	const brewedAt = new Date(time);
	const daysSince = Math.floor((Date.now() - brewedAt.valueOf()) / DAY_IN_MS);
	if (daysSince < 1) {
		return 'Today';
	} else {
		return rtf.format(-daysSince, 'day');
	}
}
