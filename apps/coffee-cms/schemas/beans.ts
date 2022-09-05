export default {
  name: 'beans',
  type: 'document',
  title: 'Beans',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: 'Name',
    },
    {
      type: 'string',
      name: 'roaster',
      title: 'Roaster',
    },
    {
      type: 'string',
      name: 'Seller',
      title: 'Seller',
    },
    {
      type: 'url',
      name: 'url',
      title: 'Url',
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
    {
      type: 'array',
      name: 'info',
      title: 'Info',
      of: [{type: 'block'}]
    }
  ]
}
