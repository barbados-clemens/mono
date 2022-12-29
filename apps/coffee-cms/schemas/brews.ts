import ComputedField from 'sanity-plugin-computed-field';

export default {
	name: 'brew',
	type: 'document',
	title: 'Brew',
	fields: [
		{
			type: 'reference',
			title: 'Brewed with',
			name: 'brewedWith',
			to: { type: 'beans' },
		},
		{
			type: 'string',
			name: 'method',
			title: 'Method',
			options: {
				list: [
					// TODO variables like temp and grind size
					{ title: 'Pourover', value: 'Pourover' },
					{ title: 'AreoPress', value: 'AreoPress' },
				],
				layout: 'dropdown',
			},
		},
		{
			type: 'array',
			name: 'equipment',
			title: 'Equipment',
			of: [{ type: 'string' }],
		},
		{
			type: 'date',
			name: 'brewedOn',
			title: 'Brewed on',
			initialValue: () => new Date(),
		},
		{
			type: 'number',
			name: 'in',
			title: 'Grams In',
		},
		{
			type: 'number',
			name: 'out',
			title: 'Grams Out',
		},
		{
			type: 'array',
			name: 'addIns',
			title: 'Add Ins',
			of: [{ type: 'string' }],
			options: {
				list: [
					{
						title: 'Reddi-wip Nitro Creamer',
						value: 'reddi-wip nitro creamer',
					},
					{ title: 'Chobani Sweet Cream', value: 'sweet cream' },
				],
				layout: 'tags',
			},
		},
		{
			type: 'image',
			name: 'brewPic',
			title: 'Brew Picture',
		},
		{
			type: 'string',
			name: 'rating',
			title: 'Rating',
			options: {
				list: [
					{ title: '⭐', value: '1' },
					{ title: '⭐⭐', value: '2' },
					{ title: '⭐⭐⭐', value: '3' },
					{ title: '⭐⭐⭐⭐', value: '4' },
					{ title: '⭐⭐⭐⭐⭐', value: '5' },
				],
			},
		},
		{
			name: 'name',
			description:
				'Publish record with "Brewed With" and "Brewed On" filled out first before trying to generate a name',
			type: 'string',
			inputComponent: ComputedField,
			options: {
				editable: true,
				documentQuerySelection: `
        "records": *[_type == 'brew']{..., brewedWith->{name}}
        `,
				reduceQueryResult: (query) => {
					console.log('ComputedField query result:', query);
					if (query && query.records) {
						const foundRecord = query.records.find(
							({ _id }) => _id === query._id
						);
						if (foundRecord) {
							return `${foundRecord.brewedOn} brew with ${foundRecord.brewedWith.name}`;
						}
					}
					return 'Unable to compute. try publishing and then rerunning';
				},
			},
		},
		{
			type: 'array',
			name: 'info',
			title: 'Info',
			of: [{ type: 'block' }],
		},
	],
};
