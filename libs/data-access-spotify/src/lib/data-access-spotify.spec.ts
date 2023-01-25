import { dataAccessSpotify } from './data-access-spotify';

describe('dataAccessSpotify', () => {
	it('should work', () => {
		expect(dataAccessSpotify()).toEqual('data-access-spotify');
	});
});
