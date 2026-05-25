'use client'

import { useState, useEffect } from 'react'
import { useLang } from './LangProvider'

const QUESTIONS = [
  // ЛЕГКІ (0-29)
  { ua: 'Яка найпоширеніша техніка перемоги в сумо?', en: 'What is the most common winning technique in sumo?', options: { ua: ['Йорікірі', 'Ошідасі', 'Хатакікомі', 'Уватенаге'], en: ['Yorikiri', 'Oshidashi', 'Hatakikomi', 'Uwatenage'] }, answer: 0 },
  { ua: 'Скільки днів триває стандартний турнір сумо?', en: 'How many days does a standard sumo tournament last?', options: { ua: ['10 днів', '13 днів', '15 днів', '20 днів'], en: ['10 days', '13 days', '15 days', '20 days'] }, answer: 2 },
  { ua: 'Як називається найвищий ранг у сумо?', en: 'What is the highest rank in sumo?', options: { ua: ['Озекі', 'Секіваке', 'Йокодзуна', 'Комусубі'], en: ['Ozeki', 'Sekiwake', 'Yokozuna', 'Komusubi'] }, answer: 2 },
  { ua: 'Як називається пояс борця сумо?', en: 'What is the belt worn by sumo wrestlers called?', options: { ua: ['Кімоно', 'Маваші', 'Юката', 'Обі'], en: ['Kimono', 'Mawashi', 'Yukata', 'Obi'] }, answer: 1 },
  { ua: 'Як називається глиняний майданчик для боротьби в сумо?', en: 'What is the raised clay platform where sumo is fought called?', options: { ua: ['Татамі', 'Доджо', 'Дохьо', 'Хашіра'], en: ['Tatami', 'Dojo', 'Dohyo', 'Hashira'] }, answer: 2 },
  { ua: 'Скільки офіційних технік перемоги (кімаріте) у сумо?', en: 'How many official winning techniques (kimarite) are there in sumo?', options: { ua: ['42', '62', '82', '102'], en: ['42', '62', '82', '102'] }, answer: 2 },
  { ua: 'Скільки турнірів проводиться щороку в сумо?', en: 'How many tournaments are held per year in sumo?', options: { ua: ['4', '5', '6', '8'], en: ['4', '5', '6', '8'] }, answer: 2 },
  { ua: 'Як називається перемога рікіші над йокодзуною для нижчого рангу?', en: 'What is it called when a lower-ranked wrestler defeats a yokozuna?', options: { ua: ['Юшо', 'Кінбоші', 'Сансьо', 'Дохьо'], en: ['Yusho', 'Kinboshi', 'Sansho', 'Dohyo'] }, answer: 1 },
  { ua: 'Як називається перемога на турнірі (чемпіонство)?', en: 'What is the tournament championship called?', options: { ua: ['Кінбоші', 'Сансьо', 'Юшо', 'Басьо'], en: ['Kinboshi', 'Sansho', 'Yusho', 'Basho'] }, answer: 2 },
  { ua: 'Де проводиться Натсу Басьо (травневий турнір)?', en: 'Where is the Natsu Basho (May tournament) held?', options: { ua: ['Осака', 'Токіо', 'Нагоя', 'Фукуока'], en: ['Osaka', 'Tokyo', 'Nagoya', 'Fukuoka'] }, answer: 1 },
  { ua: 'Як називається відсутність борця через травму?', en: 'What is it called when a wrestler withdraws due to injury?', options: { ua: ['Фузен', 'Кюджо', 'Хансоку', 'Акібасьо'], en: ['Fusen', 'Kyujo', 'Hansoku', 'Akibasho'] }, answer: 1 },
  { ua: 'Який рахунок вважається качі-коші (переможний баланс)?', en: 'What record is considered kachi-koshi (winning record)?', options: { ua: ['7-8', '8-7', '9-6', '10-5'], en: ['7-8', '8-7', '9-6', '10-5'] }, answer: 1 },
  { ua: 'Де проводиться Хару Басьо (березневий турнір)?', en: 'Where is the Haru Basho (March tournament) held?', options: { ua: ['Токіо', 'Нагоя', 'Осака', 'Фукуока'], en: ['Tokyo', 'Nagoya', 'Osaka', 'Fukuoka'] }, answer: 2 },
  { ua: 'Як називається суддя в сумо?', en: 'What is the referee in sumo called?', options: { ua: ['Сенсей', 'Гьоджі', 'Ояката', 'Тошійорі'], en: ['Sensei', 'Gyoji', 'Oyakata', 'Toshiyori'] }, answer: 1 },
  { ua: 'Який ранг йде одразу після йокодзуни?', en: 'Which rank comes directly below yokozuna?', options: { ua: ['Секіваке', 'Комусубі', 'Маєґашіра', 'Озекі'], en: ['Sekiwake', 'Komusubi', 'Maegashira', 'Ozeki'] }, answer: 3 },
  { ua: 'Як називається тренувальна стайня борців сумо?', en: 'What is a sumo training stable called?', options: { ua: ['Доджо', 'Хея', 'Рюккаку', 'Джінку'], en: ['Dojo', 'Heya', 'Ryukkaku', 'Jinku'] }, answer: 1 },
  { ua: 'Де проводиться Кюшу Басьо (листопадовий турнір)?', en: 'Where is the Kyushu Basho (November tournament) held?', options: { ua: ['Осака', 'Токіо', 'Нагоя', 'Фукуока'], en: ['Osaka', 'Tokyo', 'Nagoya', 'Fukuoka'] }, answer: 3 },
  { ua: 'Як називається топ-дивізіон у сумо?', en: 'What is the top division in sumo called?', options: { ua: ['Джурьо', 'Макусіта', 'Макуучі', 'Сандамне'], en: ['Juryo', 'Makushita', 'Makuuchi', 'Sandanme'] }, answer: 2 },
  { ua: 'Яка техніка — виштовхування суперника без захвату маваші?', en: 'Which technique involves pushing the opponent out without gripping the mawashi?', options: { ua: ['Йорікірі', 'Ошідасі', 'Цукідасі', 'Окурідасі'], en: ['Yorikiri', 'Oshidashi', 'Tsukidashi', 'Okuridashi'] }, answer: 1 },
  { ua: 'Як називається офіційна таблиця рангів перед турніром?', en: 'What is the official ranking list before a tournament called?', options: { ua: ['Юшо', 'Банзуке', 'Хейя', 'Басьо'], en: ['Yusho', 'Banzuke', 'Heya', 'Basho'] }, answer: 1 },
  { ua: 'Яка країна дала найбільше йокодзун після Японії?', en: 'Which country has produced the most yokozuna after Japan?', options: { ua: ['Казахстан', 'Грузія', 'Монголія', 'США'], en: ['Kazakhstan', 'Georgia', 'Mongolia', 'USA'] }, answer: 2 },
  { ua: 'Як називається спеціальний приз за кращу техніку?', en: 'What is the special prize for best technique called?', options: { ua: ['Кантьо-шо', 'Гіно-шо', 'Шукун-шо', 'Кінбоші'], en: ['Kanto-sho', 'Gino-sho', 'Shukun-sho', 'Kinboshi'] }, answer: 1 },
  { ua: 'Як називається початкове зіткнення борців на початку поєдинку?', en: 'What is the initial charge at the start of a sumo bout called?', options: { ua: ['Шіко', 'Тачіай', 'Матта', 'Хакке'], en: ['Shiko', 'Tachiai', 'Matta', 'Hakke'] }, answer: 1 },
  { ua: 'Що означає "маке-коші"?', en: 'What does "make-koshi" mean?', options: { ua: ['Переможний баланс', 'Програшний баланс', 'Нічия', 'Чемпіонство'], en: ['Winning record', 'Losing record', 'Draw', 'Championship'] }, answer: 1 },
  { ua: 'Де проводиться Нагоя Басьо (липневий турнір)?', en: 'Where is the Nagoya Basho (July tournament) held?', options: { ua: ['Осака', 'Токіо', 'Нагоя', 'Фукуока'], en: ['Osaka', 'Tokyo', 'Nagoya', 'Fukuoka'] }, answer: 2 },
  { ua: 'Як називається другий за рангом дивізіон після макуучі?', en: 'What is the second highest division below Makuuchi?', options: { ua: ['Макусіта', 'Джурьо', 'Сандамне', 'Джонідан'], en: ['Makushita', 'Juryo', 'Sandanme', 'Jonidan'] }, answer: 1 },
  { ua: 'Що таке "фузен"?', en: 'What is "fusen"?', options: { ua: ['Перемога через знімання суперника', 'Технічний нокаут', 'Нічия', 'Дискваліфікація'], en: ['Win by opponent withdrawal', 'Technical knockout', 'Draw', 'Disqualification'] }, answer: 0 },
  { ua: 'Як називається традиційний топ-вузол волосся борців сумо?', en: 'What is the traditional topknot hairstyle of sumo wrestlers called?', options: { ua: ['Моноі', 'Тімаге', 'Сакаяке', 'Магеконо'], en: ['Monoi', 'Chonmage', 'Sakayake', 'Magekono'] }, answer: 1 },
  { ua: 'Скільки борців у топ-дивізіоні макуучі?', en: 'How many wrestlers are in the top Makuuchi division?', options: { ua: ['32', '42', '62', '72'], en: ['32', '42', '62', '72'] }, answer: 1 },
  { ua: 'Що таке "шіко"?', en: 'What is "shiko"?', options: { ua: ['Техніка кидка', 'Ритуальне підняття ноги', 'Тип захвату', 'Назва турніру'], en: ['Throwing technique', 'Ritual leg raise', 'Type of grip', 'Tournament name'] }, answer: 1 },

  // СЕРЕДНІ (30-59)
  { ua: 'Який борець має найбільше перемог на турнірах в історії сумо?', en: 'Which wrestler has the most tournament wins in sumo history?', options: { ua: ['Тайхо', 'Хакухо', 'Кітанофудзі', 'Тіійонофудзі'], en: ['Taiho', 'Hakuho', 'Kitanofuji', 'Chiyonofuji'] }, answer: 1 },
  { ua: 'Скільки разів Хакухо вигравав чемпіонат?', en: 'How many times did Hakuho win the championship?', options: { ua: ['35', '40', '45', '50'], en: ['35', '40', '45', '50'] }, answer: 2 },
  { ua: 'Яка техніка — підйом суперника і винесення його за межі дохьо?', en: 'Which technique involves lifting the opponent and carrying them out?', options: { ua: ['Цурідасі', 'Йорікірі', 'Ошідасі', 'Сукуінаге'], en: ['Tsuridashi', 'Yorikiri', 'Oshidashi', 'Sukuinage'] }, answer: 0 },
  { ua: 'Як називається спеціальний приз за найкращий бойовий дух?', en: 'What is the special prize for best fighting spirit called?', options: { ua: ['Гіно-шо', 'Шукун-шо', 'Кантьо-шо', 'Кінбоші'], en: ['Gino-sho', 'Shukun-sho', 'Kanto-sho', 'Kinboshi'] }, answer: 2 },
  { ua: 'Як називається церемонія після перемоги йокодзуни на турнірі?', en: 'What is the ceremony after a yokozuna wins a tournament called?', options: { ua: ['Юмі-торі', 'Доньо-ірі', 'Тачіай', 'Шіко'], en: ['Yumi-tori', 'Dohyo-iri', 'Tachiai', 'Shiko'] }, answer: 0 },
  { ua: 'Скільки борців грають у дивізіоні Джурьо?', en: 'How many wrestlers are in the Juryo division?', options: { ua: ['20', '26', '28', '32'], en: ['20', '26', '28', '32'] }, answer: 1 },
  { ua: 'Як називається ритуальний вхід йокодзуни на дохьо?', en: 'What is the ritual ring-entering ceremony of a yokozuna called?', options: { ua: ['Юмі-торі', 'Доньо-ірі', 'Матта', 'Шіко'], en: ['Yumi-tori', 'Dohyo-iri', 'Matta', 'Shiko'] }, answer: 1 },
  { ua: 'З якої країни походить борець Теруноф\'ї?', en: 'Which country is wrestler Terunofuji from?', options: { ua: ['Казахстан', 'Монголія', 'Грузія', 'Китай'], en: ['Kazakhstan', 'Mongolia', 'Georgia', 'China'] }, answer: 1 },
  { ua: 'Як називається техніка підсічки зовнішньою ногою?', en: 'What is the outer leg trip technique called?', options: { ua: ['Учігаке', 'Сотогаке', 'Кірікаесі', 'Чонгаке'], en: ['Uchigake', 'Sotogake', 'Kirikaeshi', 'Chongake'] }, answer: 1 },
  { ua: 'Який діаметр дохьо (бойового кола)?', en: 'What is the diameter of the dohyo (fighting circle)?', options: { ua: ['3,55 м', '4,55 м', '5,55 м', '6,55 м'], en: ['3.55 m', '4.55 m', '5.55 m', '6.55 m'] }, answer: 1 },
  { ua: 'Як називається плей-оф при нічиї після 15 днів?', en: 'What is the playoff called when there is a tie after 15 days?', options: { ua: ['Матта', 'Домотої', 'Хансоку', 'Кімаріте'], en: ['Matta', 'Domotoi', 'Hansoku', 'Kimarite'] }, answer: 1 },
  { ua: 'Яка техніка є найрідкіснішою — одночасна атака в три точки?', en: 'Which is the rarest technique — simultaneous attack on three points?', options: { ua: ['Кавадзугаке', 'Мітокоросеме', 'Аміучі', 'Цуріотосі'], en: ['Kawazugake', 'Mitokorozeme', 'Amiuchi', 'Tsuriotoshi'] }, answer: 1 },
  { ua: 'Що означає "хансоку"?', en: 'What does "hansoku" mean?', options: { ua: ['Перемога', 'Нічия', 'Дискваліфікація', 'Травма'], en: ['Victory', 'Draw', 'Disqualification', 'Injury'] }, answer: 2 },
  { ua: 'Скільки спеціальних призів (сансьо) вручається на кожному турнірі?', en: 'How many special prizes (sansho) are awarded at each tournament?', options: { ua: ['2', '3', '4', '5'], en: ['2', '3', '4', '5'] }, answer: 1 },
  { ua: 'Як називається найнижчий дивізіон у сумо?', en: 'What is the lowest division in sumo called?', options: { ua: ['Джонідан', 'Сандамне', 'Джонокучі', 'Макусіта'], en: ['Jonidan', 'Sandanme', 'Jonokuchi', 'Makushita'] }, answer: 2 },
  { ua: 'Скільки йокодзун було в історії сумо станом на 2025 рік?', en: 'How many yokozuna have there been in sumo history as of 2025?', options: { ua: ['56', '68', '73', '80'], en: ['56', '68', '73', '80'] }, answer: 2 },
  { ua: 'Як називається спеціальний приз за перемогу над вищими рангами?', en: 'What is the special prize for defeating higher-ranked opponents called?', options: { ua: ['Гіно-шо', 'Кантьо-шо', 'Шукун-шо', 'Кінбоші'], en: ['Gino-sho', 'Kanto-sho', 'Shukun-sho', 'Kinboshi'] }, answer: 2 },
  { ua: 'В якому місті знаходиться головний стадіон сумо Рьогоку Кокугікан?', en: 'In which city is the main sumo arena Ryogoku Kokugikan located?', options: { ua: ['Осака', 'Нагоя', 'Токіо', 'Фукуока'], en: ['Osaka', 'Nagoya', 'Tokyo', 'Fukuoka'] }, answer: 2 },
  { ua: 'Яка мінімальна кількість перемог для підвищення до озекі?', en: 'What is the minimum wins needed for promotion to ozeki?', options: { ua: ['8', '10', '33 за 3 турніри', '10 за турнір'], en: ['8', '10', '33 over 3 tournaments', '10 per tournament'] }, answer: 2 },
  { ua: 'Що таке "матта"?', en: 'What is "matta"?', options: { ua: ['Перемога', 'Фальстарт', 'Дискваліфікація', 'Травма'], en: ['Victory', 'False start', 'Disqualification', 'Injury'] }, answer: 1 },
  { ua: 'Як називаються мотузки на маваші борця?', en: 'What are the decorative strings hanging from the mawashi called?', options: { ua: ['Хімо', 'Сагарі', 'Тасукі', 'Обіджіме'], en: ['Himo', 'Sagari', 'Tasuki', 'Obijime'] }, answer: 1 },
  { ua: 'Скільки офіційних нетехнік існує в сумо?', en: 'How many official non-techniques exist in sumo?', options: { ua: ['3', '5', '7', '10'], en: ['3', '5', '7', '10'] }, answer: 1 },
  { ua: 'Як називається пояс, який носить гьоджі найвищого рангу?', en: 'What color robes does the top-ranked gyoji wear?', options: { ua: ['Чорний', 'Синій', 'Фіолетово-білий', 'Зелений'], en: ['Black', 'Blue', 'Purple-white', 'Green'] }, answer: 2 },
  { ua: 'Яка техніка — виштовхування суперника ззаду?', en: 'Which technique involves pushing the opponent out from behind?', options: { ua: ['Ошідасі', 'Окурідасі', 'Цукідасі', 'Йорікірі'], en: ['Oshidashi', 'Okuridashi', 'Tsukidashi', 'Yorikiri'] }, answer: 1 },
  { ua: 'Яка техніка — кидок через верхній захват маваші?', en: 'Which technique involves throwing using an overarm grip on the mawashi?', options: { ua: ['Шітатенаге', 'Уватенаге', 'Коtenаge', 'Сукуінаге'], en: ['Shitatenage', 'Uwatenage', 'Kotenage', 'Sukuinage'] }, answer: 1 },
  { ua: 'В якому місяці проводиться Акі Басьо?', en: 'In which month is the Aki Basho held?', options: { ua: ['Серпень', 'Вересень', 'Жовтень', 'Листопад'], en: ['August', 'September', 'October', 'November'] }, answer: 1 },
  { ua: 'Який мінімальний вік для вступу до сумо?', en: 'What is the minimum age to join sumo?', options: { ua: ['13', '15', '16', '18'], en: ['13', '15', '16', '18'] }, answer: 1 },
  { ua: 'Що таке "йобідасі" в сумо?', en: 'What is a "yobidashi" in sumo?', options: { ua: ['Суддя', 'Оголошувач борців', 'Тренер', 'Лікар'], en: ['Referee', 'Ring announcer', 'Coach', 'Doctor'] }, answer: 1 },
  { ua: 'З якої країни перший борець-не японець, який виграв турнір?', en: 'From which country was the first non-Japanese wrestler to win a tournament?', options: { ua: ['Монголія', 'Гавайї/США', 'Казахстан', 'Бразилія'], en: ['Mongolia', 'Hawaii/USA', 'Kazakhstan', 'Brazil'] }, answer: 1 },
  { ua: 'Скільки офіційних стаєнь (хея) існує в сумо приблизно?', en: 'Approximately how many official stables (heya) exist in sumo?', options: { ua: ['20', '30', '45', '60'], en: ['20', '30', '45', '60'] }, answer: 2 },

  // ВАЖКІ (60-89)
  { ua: 'Який борець має найбільшу кількість перемог у вищому дивізіоні?', en: 'Which wrestler holds the record for most wins in the top division?', options: { ua: ['Тайхо', 'Кіріщіма', 'Хакухо', 'Тіійонофудзі'], en: ['Taiho', 'Kirishima', 'Hakuho', 'Chiyonofuji'] }, answer: 2 },
  { ua: 'В якому році Японська асоціація сумо офіційно визнала 82 кімаріте?', en: 'In what year did the Japan Sumo Association officially recognize 82 kimarite?', options: { ua: ['1985', '1993', '2001', '2010'], en: ['1985', '1993', '2001', '2010'] }, answer: 2 },
  { ua: 'Яка техніка — кидок через захват руки під пахву (армлок)?', en: 'Which technique involves an armlock throw?', options: { ua: ['Уватенаге', 'Коtenаge', 'Тотарі', 'Сукуінаге'], en: ['Uwatenage', 'Kotenage', 'Tottari', 'Sukuinage'] }, answer: 1 },
  { ua: 'Скільки перемог підряд здобув Хакухо у своїй рекордній серії?', en: 'How many consecutive wins did Hakuho achieve in his record streak?', options: { ua: ['43', '53', '63', '73'], en: ['43', '53', '63', '73'] }, answer: 2 },
  { ua: 'Хто був першим іноземним йокодзуною?', en: 'Who was the first foreign-born yokozuna?', options: { ua: ['Мусашімару', 'Конішікі', 'Акебоно', 'Хакухо'], en: ['Musashimaru', 'Konishiki', 'Akebono', 'Hakuho'] }, answer: 2 },
  { ua: 'Техніка "кавадзугаке" унікальна тим, що...', en: 'The technique "kawazugake" is unique because...', options: { ua: ['Заборонена в турнірах', 'Борець падає разом з суперником', 'Вимагає двох суддів', 'Дає подвійні очки'], en: ['Banned in tournaments', 'Wrestler falls together with opponent', 'Requires two referees', 'Gives double points'] }, answer: 1 },
  { ua: 'Скільки разів Тайхо вигравав чемпіонат?', en: 'How many times did Taiho win the championship?', options: { ua: ['28', '32', '45', '52'], en: ['28', '32', '45', '52'] }, answer: 1 },
  { ua: 'Що символізує мотузка (цуна) навколо пояса йокодзуни?', en: 'What does the rope (tsuna) around the yokozuna\'s waist symbolize?', options: { ua: ['Силу', 'Богів і чистоту', 'Кількість перемог', 'Вік борця'], en: ['Strength', 'Gods and purity', 'Number of wins', 'Wrestler\'s age'] }, answer: 1 },
  { ua: 'Яка стайня виховала найбільше йокодзун в історії?', en: 'Which stable has produced the most yokozuna in history?', options: { ua: ['Міхановані', 'Тацунамі', 'Міяґіно', 'Кісараґі'], en: ['Mihanoumi', 'Tatsunami', 'Miyagino', 'Kisaragi'] }, answer: 1 },
  { ua: 'Як називається техніка виштовхування з фіксацією рук суперника?', en: 'What is the technique of forcing out while pinning the arms called?', options: { ua: ['Кімедасі', 'Йорікірі', 'Ошідасі', 'Цуріотосі'], en: ['Kimedashi', 'Yorikiri', 'Oshidashi', 'Tsuriotoshi'] }, answer: 0 },
  { ua: 'Скільки часу займає стандартна сутичка в сумо?', en: 'How long does a standard sumo bout typically last?', options: { ua: ['Менше хвилини', '2-3 хвилини', '5 хвилин', '10 хвилин'], en: ['Less than a minute', '2-3 minutes', '5 minutes', '10 minutes'] }, answer: 0 },
  { ua: 'Як називається фан-клуб борця сумо?', en: 'What is a sumo wrestler\'s fan club called?', options: { ua: ['Охея', 'Після-тоя', 'Танімачі', 'Ояката'], en: ['Oheya', 'After-toya', 'Tanimachi', 'Oyakata'] }, answer: 2 },
  { ua: 'Яка техніка є найчастішою після йорікірі та ошідасі?', en: 'Which technique is most common after yorikiri and oshidashi?', options: { ua: ['Уватенаге', 'Хатакікомі', 'Цукіотосі', 'Йорітаосі'], en: ['Uwatenage', 'Hatakikomi', 'Tsukiotoshi', 'Yoritaoshi'] }, answer: 1 },
  { ua: 'Що таке "нагете" в контексті кімаріте?', en: 'What is "nagate" in the context of kimarite?', options: { ua: ['Категорія технік кидків', 'Категорія виштовхувань', 'Спеціальна техніка', 'Назва дивізіону'], en: ['Category of throwing techniques', 'Category of push-outs', 'Special technique', 'Division name'] }, answer: 0 },
  { ua: 'Скільки глядачів вміщує Рьогоку Кокугікан?', en: 'What is the seating capacity of Ryogoku Kokugikan?', options: { ua: ['6,000', '8,000', '11,000', '15,000'], en: ['6,000', '8,000', '11,000', '15,000'] }, answer: 2 },
  { ua: 'Яка техніка — захоплення обох рук суперника і кидок?', en: 'Which technique involves grabbing both arms and throwing?', options: { ua: ['Тотарі', 'Аміучі', 'Коtenаge', 'Уватенаге'], en: ['Tottari', 'Amiuchi', 'Kotenage', 'Uwatenage'] }, answer: 0 },
  { ua: 'Як називається фінальний поклін після поєдинку?', en: 'What is the final bow after a sumo bout called?', options: { ua: ['Рей', 'Шіко', 'Тачіай', 'Матта'], en: ['Rei', 'Shiko', 'Tachiai', 'Matta'] }, answer: 0 },
  { ua: 'В якому році було засновано Японську асоціацію сумо?', en: 'In what year was the Japan Sumo Association founded?', options: { ua: ['1889', '1905', '1925', '1950'], en: ['1889', '1905', '1925', '1950'] }, answer: 2 },
  { ua: 'Що таке "моноі"?', en: 'What is "monoii"?', options: { ua: ['Техніка кидка', 'Нарада суддів для перегляду рішення', 'Ритуальна пісня', 'Тип захвату'], en: ['Throwing technique', 'Judges\' conference to review a decision', 'Ritual song', 'Type of grip'] }, answer: 1 },
  { ua: 'Яка максимальна висота дохьо над рівнем підлоги?', en: 'What is the maximum height of the dohyo above floor level?', options: { ua: ['34 см', '55 см', '66 см', '80 см'], en: ['34 cm', '55 cm', '66 cm', '80 cm'] }, answer: 1 },
  { ua: 'Як називається техніка скручування суперника через верхній захват маваші?', en: 'What is the technique of twisting down using an overarm mawashi grip called?', options: { ua: ['Шітатехінері', 'Уватехінері', 'Коtenаge', 'Тотарі'], en: ['Shitatehineri', 'Uwatehineri', 'Kotenage', 'Tottari'] }, answer: 1 },
  { ua: 'Як називається ритуал очищення дохьо перед турніром?', en: 'What is the ritual purification of the dohyo before a tournament called?', options: { ua: ['Доньо-кіймé', 'Джінку', 'Тачіай', 'Шіо-макі'], en: ['Dohyo-kiyome', 'Jinku', 'Tachiai', 'Shio-maki'] }, answer: 0 },
  { ua: 'Який борець отримав прізвисько "Монстр"?', en: 'Which wrestler was nicknamed "The Monster"?', options: { ua: ['Хакухо', 'Конішікі', 'Теруноф\'ї', 'Асашорью'], en: ['Hakuho', 'Konishiki', 'Terunofuji', 'Asashoryu'] }, answer: 1 },
  { ua: 'Хто з борців здобув юшо на трьох різних позиціях?', en: 'Which wrestler won yusho from three different ranks?', options: { ua: ['Асашорью', 'Хакухо', 'Кіріщіма (сучасний)', 'Тайхо'], en: ['Asashoryu', 'Hakuho', 'Kirishima (modern)', 'Taiho'] }, answer: 2 },
  { ua: 'Як називається хвіртка входу борців на дохьо?', en: 'What is the curtained entrance through which wrestlers enter the dohyo called?', options: { ua: ['Харімаге', 'Сагарі', 'Тобіра', 'Хаймон'], en: ['Harimage', 'Sagari', 'Tobira', 'Haimon'] }, answer: 3 },
  { ua: 'Яка техніка — кидок через шию?', en: 'What is the headlock throw technique called?', options: { ua: ['Коtenаge', 'Кубінаге', 'Сукуінаге', 'Тотарі'], en: ['Kotenage', 'Kubinage', 'Sukuinage', 'Tottari'] }, answer: 1 },
  { ua: 'Який борець має найдовшу кар\'єру йокодзуни?', en: 'Which yokozuna had the longest career?', options: { ua: ['Хакухо', 'Тайхо', 'Кітанофудзі', 'Міяґішіма'], en: ['Hakuho', 'Taiho', 'Kitanofuji', 'Miyagishima'] }, answer: 0 },
  { ua: 'Скільки разів Хакухо здобував юшо поспіль максимально?', en: 'What is the maximum number of consecutive yusho Hakuho won?', options: { ua: ['5', '7', '10', '12'], en: ['5', '7', '10', '12'] }, answer: 1 },
  { ua: 'Яка техніка передбачає одночасне падіння обох борців?', en: 'Which technique involves both wrestlers falling simultaneously?', options: { ua: ['Цуріотосі', 'Кавадзугаке', 'Мітокоросеме', 'Аміучі'], en: ['Tsuriotoshi', 'Kawazugake', 'Mitokorozeme', 'Amiuchi'] }, answer: 1 },
  { ua: 'Яка кількість глядачів відвідує великі турніри сумо в середньому?', en: 'What is the average attendance at major sumo tournaments?', options: { ua: ['Близько 5,000', 'Близько 8,000', 'Близько 11,000', 'Близько 20,000'], en: ['About 5,000', 'About 8,000', 'About 11,000', 'About 20,000'] }, answer: 2 },
  { ua: 'Що таке "цуна" у контексті йокодзуни?', en: 'What is "tsuna" in the context of yokozuna?', options: { ua: ['Назва стайні', 'Товста мотузка навколо пояса', 'Тип техніки', 'Ритуальний танець'], en: ['Name of the stable', 'Thick rope around the waist', 'Type of technique', 'Ritual dance'] }, answer: 1 },
]

function pickQuestions(allQ) {
  const easy = allQ.slice(0, 30)
  const medium = allQ.slice(30, 60)
  const hard = allQ.slice(60, 90)
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
  return [
    ...shuffle(easy).slice(0, 5),
    ...shuffle(medium).slice(0, 5),
    ...shuffle(hard).slice(0, 5),
  ]
}

const DIFF_LABEL = {
  ua: ['ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ'],
  uk: ['ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','ЛЕГКИЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','СЕРЕДНІЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ','ВАЖКИЙ'],
  en: ['EASY','EASY','EASY','EASY','EASY','MEDIUM','MEDIUM','MEDIUM','MEDIUM','MEDIUM','HARD','HARD','HARD','HARD','HARD'],
}
const DIFF_COLOR = ['#1a6b5c', '#1a6b5c', '#1a6b5c', '#1a6b5c', '#1a6b5c', '#b8860b', '#b8860b', '#b8860b', '#b8860b', '#b8860b', '#c0392b', '#c0392b', '#c0392b', '#c0392b', '#c0392b']

export default function SumoQuiz({ onClose }) {
  const { lang } = useLang()
  const [questions] = useState(() => pickQuestions(QUESTIONS))
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase] = useState('quiz') // quiz | result

  const q = questions[current]
  const opts = q.options[lang] || q.options['ua']
  const totalCorrect = answers.filter(Boolean).length

  function handleSelect(idx) {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === q.answer
    setTimeout(() => {
      const newAnswers = [...answers, correct]
      setAnswers(newAnswers)
      if (current + 1 >= 15) {
        setPhase('result')
      } else {
        setCurrent(c => c + 1)
        setSelected(null)
      }
    }, 900)
  }

  function restart() {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setPhase('quiz')
  }

  const isKachiKoshi = totalCorrect >= 8

  const resultText = isKachiKoshi
    ? { uk: '勝ち越し · Качі-коші', ua: '勝ち越し · Качі-коші', en: '勝ち越し · Kachi-koshi' }
    : { uk: '負け越し · Маке-коші', ua: '負け越し · Маке-коші', en: '負け越し · Make-koshi' }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          maxWidth: 540,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Фонові ієрогліфи */}
        <div style={{
          position: 'absolute', right: -10, top: -10,
          fontSize: '8rem', fontWeight: 800, opacity: 0.04,
          lineHeight: 1, pointerEvents: 'none', color: 'var(--ink)',
          fontFamily: 'serif',
        }}>相撲</div>

        {/* Header */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)' }}>
            {lang === 'en' ? 'Sumo Quiz · 15 Bouts' : 'Сумо Квіз · 15 Поєдинків'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--mid)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
          >
            {'✕'}
          </button>
        </div>

        {phase === 'quiz' && (
          <div style={{ padding: '1.5rem' }}>
            {/* Прогрес — 15 клітинок як дні турніру */}
            <div style={{ display: 'flex', gap: 3, marginBottom: '1.25rem' }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 1,
                  background: i < answers.length
                    ? (answers[i] ? '#1a6b5c' : '#c0392b')
                    : i === current ? 'var(--ink)' : 'var(--bg2)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            {/* День і складність */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)' }}>
                {lang === 'en' ? `Day ${current + 1}` : `День ${current + 1}`} · {current + 1}/15
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.1em',
                color: DIFF_COLOR[current],
                background: `${DIFF_COLOR[current]}18`,
                border: `1px solid ${DIFF_COLOR[current]}40`,
                padding: '2px 8px', borderRadius: 2,
              }}>
                {DIFF_LABEL[lang][current]}
              </div>
            </div>

            {/* Питання */}
            <div style={{
              fontSize: '1rem', fontWeight: 700, lineHeight: 1.4,
              marginBottom: '1.25rem', color: 'var(--ink)', minHeight: 60,
            }}>
              {lang === 'en' ? q.en : q.ua}
            </div>

            {/* Варіанти */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {opts.map((opt, idx) => {
                let bg = 'var(--bg2)'
                let border = 'var(--border)'
                let color = 'var(--ink)'
                if (selected !== null) {
                  if (idx === q.answer) { bg = 'rgba(26,107,92,0.15)'; border = '#1a6b5c'; color = '#1a6b5c' }
                  else if (idx === selected && idx !== q.answer) { bg = 'rgba(192,57,43,0.15)'; border = '#c0392b'; color = '#c0392b' }
                  else { bg = 'var(--bg2)'; border = 'var(--border)'; color = 'var(--mid)' }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 2,
                      padding: '0.65rem 0.9rem',
                      textAlign: 'left',
                      cursor: selected !== null ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.2s',
                      color,
                    }}
                  >
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.62rem',
                      width: 20, height: 20, borderRadius: '50%',
                      background: `${border}20`,
                      border: `1px solid ${border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontWeight: 700,
                    }}>
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{opt}</span>
                    {selected !== null && idx === q.answer && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓</span>}
                    {selected !== null && idx === selected && idx !== q.answer && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Поточний рахунок */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--mid)' }}>
                {answers.filter(Boolean).length}–{answers.filter(x => !x).length}
              </span>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {isKachiKoshi ? '🏆' : '💪'}
            </div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.6rem', fontWeight: 800,
              color: isKachiKoshi ? '#b8860b' : '#c0392b',
              marginBottom: '0.5rem',
            }}>
              {resultText[lang]}
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700,
              marginBottom: '0.25rem', color: 'var(--ink)',
            }}>
              {totalCorrect}–{15 - totalCorrect}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--mid)', marginBottom: '1.5rem' }}>
              {lang === 'en' ? `${totalCorrect} correct out of 15` : `${totalCorrect} правильних з 15`}
            </div>

            {/* Розбивка по блоках */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.5rem' }}>
              {[
                { label: lang === 'en' ? 'Easy' : 'Легкі', color: '#1a6b5c', slice: answers.slice(0, 5) },
                { label: lang === 'en' ? 'Medium' : 'Середні', color: '#b8860b', slice: answers.slice(5, 10) },
                { label: lang === 'en' ? 'Hard' : 'Важкі', color: '#c0392b', slice: answers.slice(10, 15) },
              ].map(({ label, color, slice }) => (
                <div key={label} style={{ background: 'var(--bg2)', padding: '0.75rem', borderRadius: 2, border: `1px solid ${color}30` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.55rem', color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color }}>
                    {slice.filter(Boolean).length}/5
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                    {slice.map((v, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: v ? color : '#c0392b', opacity: v ? 1 : 0.5 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={restart}
                style={{
                  background: 'var(--ink)', color: 'var(--bg)',
                  border: 'none', borderRadius: 2,
                  padding: '0.6rem 1.5rem',
                  fontFamily: 'monospace', fontSize: '0.72rem',
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'REMATCH' : 'РЕВАНШ'}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--bg2)', color: 'var(--mid)',
                  border: '1px solid var(--border)', borderRadius: 2,
                  padding: '0.6rem 1.5rem',
                  fontFamily: 'monospace', fontSize: '0.72rem',
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'CLOSE' : 'ЗАКРИТИ'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
