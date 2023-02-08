import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
	type: 'document',
	name: 'beans',
	title: 'Beans',
	fields: [
		defineField({name: 'name', type: 'string', title: 'Name'}),
		defineField({name: 'roaster', type: 'string', title: 'Roaster'}),
		defineField({name: 'seller', type: 'string', title: 'Seller'}),
		defineField({name: 'url', type: 'url', title: 'Url'}),
		defineField({name: 'image', type: 'image', title: 'Image'}),
		defineField({name: 'price', type: 'number', title: 'Price (in Cents)'}),
		defineField({name: 'weight', type: 'number', title: 'Weight (in Grams)'}),
		defineField({name: 'order_date', type: 'date', title: 'Order Date'}),
		defineField({
			name: 'info',
			type: 'array',
			title: 'Info',
			of: [defineArrayMember({type: 'block'})],
		}),
	],
})
