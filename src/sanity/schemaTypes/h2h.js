export const h2hType = {
  name: 'h2h',
  title: 'H2H Зустріч',
  type: 'document',
  fields: [
    {
      name: 'fighter1',
      title: 'Борець 1',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'fighter2',
      title: 'Борець 2',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'winner',
      title: 'Переможець',
      type: 'string',
      description: 'Ім\'я переможця або "pending" якщо ще не зіграли'
    },
    {
      name: 'day',
      title: 'День турніру',
      type: 'number'
    }
  ],
  preview: {
    select: { title: 'fighter1', subtitle: 'fighter2' },
    prepare({ title, subtitle }) {
      return { title: `${title} vs ${subtitle}` }
    }
  }
}
