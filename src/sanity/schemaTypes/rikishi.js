export const rikishiType = {
  name: 'rikishi',
  title: 'Рікіші',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Ім\'я',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'rank',
      title: 'Ранг (скорочено)',
      type: 'string',
      description: 'Наприклад: O2e, M15e, K1e'
    },
    {
      name: 'rankFull',
      title: 'Ранг (повний)',
      type: 'string',
      description: 'Наприклад: Озекі, Маєґашіра 15'
    },
    {
      name: 'wins',
      title: 'Перемог',
      type: 'number'
    },
    {
      name: 'losses',
      title: 'Поразок',
      type: 'number'
    },
    {
      name: 'yushoChance',
      title: 'Шанс на юшо (%)',
      type: 'number'
    },
    {
      name: 'chanceDelta',
      title: 'Зміна шансу (δ)',
      type: 'number',
      description: 'Наприклад: +2 або -1'
    },
    {
      name: 'status',
      title: 'Статус',
      type: 'string',
      options: {
        list: [
          { title: 'Лідер', value: 'lead' },
          { title: 'Переслідувач', value: 'chase' },
          { title: 'Вибув', value: 'out' }
        ]
      }
    },
    {
      name: 'nextOpponent',
      title: 'Суперник наступного дня',
      type: 'string'
    },
    {
      name: 'note',
      title: 'Примітка',
      type: 'string',
      description: 'Наприклад: захисник титулу, 3-й турнір у макуучі'
    },
    {
      name: 'order',
      title: 'Порядок відображення',
      type: 'number'
    }
  ],
  orderings: [
    {
      title: 'За порядком',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'rank'
    }
  }
}
