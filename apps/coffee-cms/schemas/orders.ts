import ComputedField from 'sanity-plugin-computed-field';

export default {
	type: 'document',
	name: 'order',
	title: 'Order',
	fields: [
		{
			type: 'reference',
			name: 'beans',
			title: 'Beans',
			to: [{ type: 'beans' }],
		},
		{
			type: 'date',
			name: 'receivedOn',
			title: 'Received On',
			initialValue: () => new Date(),
		},
		{
			name: 'name',
			description:
				'Publish record with "Beans" and "Received on" filled out first before trying to generate a name',
			type: 'string',
			inputComponent: ComputedField,
			options: {
				editable: true,
				documentQuerySelection: `
        "records": *[_type == 'order']{..., beans->{name}}
        `,
				reduceQueryResult: (query) => {
					console.log('ComputedField query result:', query);
					if (query && query.records) {
						const foundRecord = query.records.find(
							({ _id }) => _id === query._id
						);
						if (foundRecord) {
							return `${foundRecord.receivedOn} - ${foundRecord.beans.name}`;
						}
					}
					return 'Unable to compute. try publishing and then rerunning';
				},
			},
		},
		{
			type: 'number',
			name: 'weight',
			title: 'Weight (in grams)',
		},
		{
			type: 'number',
			name: 'price',
			title: 'Price (in cents)',
		},
		{
			type: 'array',
			name: 'info',
			title: 'Info',
			of: [{ type: 'block' }],
		},
	],
};
