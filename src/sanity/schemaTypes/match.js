export const matchType = {
  name: 'match',
  title: 'Поєдинок',
  type: 'document',
  fields: [
    {
      name: 'fighterA',
      title: 'Борець A',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'fighterB',
      title: 'Борець B',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'day',
      title: 'День',
      type: 'number'
    },
    {
      name: 'importance',
      title: 'Важливість',
      type: 'string',
      options: {
        list: [
          { title: '⭐ Критичний', value: 'critical' },
          { title: 'Важливий', value: 'important' },
          { title: 'Звичайний', value: 'normal' }
        ]
      }
    },
    {
      name: 'label',
      title: 'Підпис',
      type: 'string',
      description: 'Наприклад: Лідер vs небезпечний суперник'
    },
    {
      name: 'note',
      title: 'Примітка',
      type: 'text',
      rows: 2
    },
    {
      name: 'order',
      title: 'Порядок',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'fighterA',
      subtitle: 'fighterB'
    },
    prepare({ title, subtitle }) {
      return { title: `${title} vs ${subtitle}` }
    }
  }
}
