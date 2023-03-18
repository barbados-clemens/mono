import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
	name: 'brew',
	type: 'document',
	title: 'Brew',
	initialValue: () => {
		const today = new Date()
		return {
			name: `${today.toISOString().split('T')[0]} Brew`,
			method: 'Pourover',
			brewed_on: new Date(),
			equipment: ['Ode@', 'Stagg EKG@', 'Stagg XL'],
		}
	},
	fields: [
		defineField({name: 'name', type: 'string', title: 'Title'}),
		defineField({
			name: 'method',
			type: 'string',
			title: 'Brew Method',
			options: {
				list: [
					{title: 'Pourover', value: 'Pourover'},
					{title: 'AreoPress', value: 'AreoPress'},
					{title: 'French Press', value: 'French Press'},
					{title: 'Cold Brew', value: 'Cold Brew'},
					{title: 'Espresso', value: 'Espresso'},
				],
			},
		}),
		defineField({
			name: 'grams_in',
			type: 'number',
			title: 'Grams in',
		}),
		defineField({
			name: 'grams_out',
			type: 'number',
			title: 'Grams out',
		}),
		defineField({
			name: 'equipment',
			type: 'array',
			title: 'Equipment',
			of: [{type: 'string'}],
		}),
		defineField({
			name: 'beans_used',
			type: 'reference',
			title: 'Beans Used',
			to: {type: 'beans'},
		}),
		defineField({
			name: 'brewed_on',
			type: 'date',
			title: 'Brewed on',
		}),
		defineField({
			name: 'notes',
			type: 'array',
			title: 'Notes',
			of: [defineArrayMember({type: 'block'})],
		}),
		defineField({type: 'image', name: 'brew_pic', title: 'Brew Picture'}),
	],
})
