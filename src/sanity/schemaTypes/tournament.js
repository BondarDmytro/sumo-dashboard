export const tournamentType = {
  name: 'tournament',
  title: 'Турнір',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Назва',
      type: 'string',
      description: 'Наприклад: Натсу Басьо 2026'
    },
    {
      name: 'location',
      title: 'Місце',
      type: 'string'
    },
    {
      name: 'currentDay',
      title: 'Поточний день',
      type: 'number'
    },
    {
      name: 'totalDays',
      title: 'Всього днів',
      type: 'number'
    },
    {
      name: 'leaders',
      title: 'Лідери (текст)',
      type: 'string',
      description: 'Наприклад: Kirishima, Tobizaru, Kotoeiho'
    },
    {
      name: 'kyujoCount',
      title: 'Кількість кюджо',
      type: 'number'
    },
    {
      name: 'updatedNote',
      title: 'Примітка про оновлення',
      type: 'string',
      description: 'Наприклад: після дня 11 · розклад дня 12'
    }
  ],
  preview: {
    select: { title: 'name' }
  }
}
