export const translations = {
  uk: {
    nav: {
      tournament: 'Турнір',
      rikishi: 'Рікіші',
      ranks: 'Прогноз рангів',
      archive: 'Архів',
      sumo: 'Про сумо',
    },
    header: {
      subtitle: 'Великий турнір сумо · Токіо · 2026',
      title: 'Прогноз Юшо',
      titleSub: 'Макуучі',
      dayOf: 'з 15',
      daysLeft: 'днів залишилось',
      contenders: 'претендентів',
    },
    table: {
      title: 'Турнірна таблиця — всі рікіші макуучі',
      day: 'День',
      rikishi: 'Рікіші',
      rank: 'Ранг',
      record: 'Рекорд',
      matches: 'Матчі',
      status: 'Статус',
      chance: 'Шанс на юшо',
      leader: 'лідер',
      eliminated: 'вибув',
    },
    status: {
      leaders: 'Лідери',
      chasers: 'Переслідувачі',
      daysLeft: 'Днів залишилось',
      toFinal: 'до фіналу',
      kyujo: 'Кюджо',
      absent: 'відсутні',
      contenders: 'Претендентів',
      chanceAbove: 'шанс > 0%',
      record: 'рекорд',
    },
    sections: {
      tournament: 'Стан турніру',
      chart: 'Графік ймовірностей юшо',
      chartSub: 'Динаміка шансів на юшо по днях турніру',
      h2h: 'Очні зустрічі — цей турнір (топ претенденти)',
      eliminated: 'Вибули з гонки юшо',
      kyujo: 'Кюджо — відсутні',
    },
    misc: {
      loading: 'Завантаження...',
      expected: 'очікується',
      today: 'Сьогодні',
    }
  },
  en: {
    nav: {
      tournament: 'Tournament',
      rikishi: 'Rikishi',
      ranks: 'Rank Forecast',
      archive: 'Archive',
      sumo: 'About Sumo',
    },
    header: {
      subtitle: 'Grand Sumo Tournament · Tokyo · 2026',
      title: 'Yusho Forecast',
      titleSub: 'Makuuchi',
      dayOf: 'of 15',
      daysLeft: 'days remaining',
      contenders: 'contenders',
    },
    table: {
      title: 'Standings — all Makuuchi rikishi',
      day: 'Day',
      rikishi: 'Rikishi',
      rank: 'Rank',
      record: 'Record',
      matches: 'Matches',
      status: 'Status',
      chance: 'Yusho chance',
      leader: 'leader',
      eliminated: 'out',
    },
    status: {
      leaders: 'Leaders',
      chasers: 'Chasers',
      daysLeft: 'Days remaining',
      toFinal: 'to final',
      kyujo: 'Kyujo',
      absent: 'absent',
      contenders: 'Contenders',
      chanceAbove: 'chance > 0%',
      record: 'record',
    },
    sections: {
      tournament: 'Tournament status',
      chart: 'Yusho probability chart',
      chartSub: 'Yusho chance dynamics by tournament day',
      h2h: 'Head-to-head — this tournament (top contenders)',
      eliminated: 'Eliminated from yusho race',
      kyujo: 'Kyujo — absent',
    },
    misc: {
      loading: 'Loading...',
      expected: 'upcoming',
      today: 'Today',
    }
  },
  ja: {
    nav: {
      tournament: '場所',
      rikishi: '力士',
      ranks: '番付予想',
      archive: 'アーカイブ',
      sumo: '相撲について',
    },
    header: {
      subtitle: '大相撲本場所 · 東京 · 2026年',
      title: '優勝予想',
      titleSub: '幕内',
      dayOf: '／15日',
      daysLeft: '日残り',
      contenders: '優勝候補',
    },
    table: {
      title: '幕内力士 全員成績表',
      day: '日目',
      rikishi: '力士',
      rank: '番付',
      record: '成績',
      matches: '取組',
      status: '状態',
      chance: '優勝確率',
      leader: 'トップ',
      eliminated: '脱落',
    },
    status: {
      leaders: 'トップ',
      chasers: '追う力士',
      daysLeft: '残り日数',
      toFinal: '千秋楽まで',
      kyujo: '休場',
      absent: '不在',
      contenders: '優勝候補',
      chanceAbove: '確率 > 0%',
      record: '成績',
    },
    sections: {
      tournament: '場所の状況',
      chart: '優勝確率グラフ',
      chartSub: '日ごとの優勝確率の推移',
      h2h: '直接対決 — 今場所（上位候補）',
      eliminated: '優勝争い脱落',
      kyujo: '休場力士',
    },
    misc: {
      loading: '読み込み中...',
      expected: '予定',
      today: '今日',
    }
  }
}

export const defaultLang = 'uk'
export function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}