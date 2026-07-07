/* kimarite_lib_v1: KIMARITE_INFO + kimariteKanji винесені з SumoPageClient */
const KIMARITE_EXT = {
  'yorikiri':'jpg','kekaeshi':'jpg','oshidashi':'png','hatakikomi':'png',
  'uwatenage':'jpg','uwatehineri':'png','shitatenage':'jpg','shitatehineri':'png',
  'yoritaoshi':'png','hikiotoshi':'png','tsukiotoshi':'jpg','oshitaoshi':'jpg',
  'okuridashi':'jpg','kotenage':'png','sukuinage':'png','tsukidashi':'png',
  'uwatedashinage':'png','shitatedashinage':'png','sotogake':'jpg','uchigake':'jpg',
  'katasukashi':'jpg','kubinage':'jpg','tottari':'jpg','kimedashi':'jpg',
  'amiuchi':'jpg','tsuridashi':'jpg','tsuriotoshi':'jpg','kawazugake':'jpg',
  'ipponzeoi':'jpg','chongake':'jpg','makiotoshi':'jpg','mitokorozeme':'jpg',
  'watashikomi':'jpg','kirikaeshi':'jpg','uchimuso':'png','ashitori':'png',
  'okurinage':'jpg','okuritsuriotoshi':'jpg','fumidashi':'jpg','isamiashi':'jpg',
  'koshikudake':'jpg',
}
const NSK_IMG = (name) => KIMARITE_EXT[name] ? `/kimarite/${name}.${KIMARITE_EXT[name]}` : null

export const KIMARITE_INFO = {
  'yorikiri':         { ua: 'Виштовхування суперника за межі дохьо грудьми або тулубом, тримаючи його за маваші. Найпоширеніша техніка в сумо.', en: 'Forcing the opponent out of the ring by pushing with the chest or body while holding the mawashi. The most common technique in sumo.', ja: '寄り切り。四つに組んで前進し、相手を土俵外へ出す。最も多い決まり手。', img: NSK_IMG('yorikiri') },
  'oshidashi':        { ua: 'Виштовхування суперника обома руками без захвату маваші. Друга за популярністю техніка.', en: 'Pushing the opponent out with both hands without gripping the mawashi. The second most common technique.', ja: '押し出し。まわしを取らず両手で押して土俵外へ出す。', img: NSK_IMG('oshidashi') },
  'hatakikomi':       { ua: 'Збивання суперника вниз ударом долонею по спині або плечу.', en: 'Slapping the opponent down by striking the back or shoulder when they lose balance.', ja: '叩き込み。前に出る相手の肩や背中を叩いて落とす。', img: NSK_IMG('hatakikomi') },
  'uwatenage':        { ua: 'Кидок суперника через верхній захват маваші зовнішньою рукою.', en: 'Throwing the opponent using an overarm grip on the mawashi with the outer arm.', ja: '上手投げ。上手からまわしを取って投げる。', img: NSK_IMG('uwatenage') },
  'yoritaoshi':       { ua: 'Суперника виштовхують і він падає за межами дохьо.', en: 'The opponent is forced out and falls outside the ring.', ja: '寄り倒し。寄りながら相手を土俵外へ倒す。', img: NSK_IMG('yoritaoshi') },
  'hikiotoshi':       { ua: 'Різке притягування суперника вниз за руку або плече.', en: 'Sharply pulling the opponent down by the arm or shoulder.', ja: '引き落とし。相手の腕や肩を引いて落とす。', img: NSK_IMG('hikiotoshi') },
  'tsukiotoshi':      { ua: 'Збивання суперника поштовхом в бік або вниз.', en: 'Knocking the opponent down with a thrust to the side or downward.', ja: '突き落とし。相手を斜め下に突いて倒す。', img: NSK_IMG('tsukiotoshi') },
  'oshitaoshi':       { ua: 'Суперника штовхають і він падає за межами дохьо.', en: 'The opponent is pushed and falls outside the ring.', ja: '押し倒し。押しながら相手を倒す。', img: NSK_IMG('oshitaoshi') },
  'shitatenage':      { ua: 'Кидок суперника через нижній захват маваші внутрішньою рукою.', en: 'Throwing the opponent using an underarm grip on the mawashi.', ja: '下手投げ。下手からまわしを取って投げる。', img: NSK_IMG('shitatenage') },
  'okuridashi':       { ua: 'Виштовхування суперника ззаду обома руками.', en: 'Pushing the opponent out from behind with both hands.', ja: '送り出し。相手の背後に回り、押して土俵外へ出す。', img: NSK_IMG('okuridashi') },
  'kotenage':         { ua: 'Кидок через захват руки суперника під пахву.', en: 'Throwing by gripping the opponent\'s arm under the armpit.', ja: '小手投げ。相手の差し手を抱えて投げる。', img: NSK_IMG('kotenage') },
  'sukuinage':        { ua: 'Кидок через підхват — захоплення руки суперника знизу.', en: 'A scoop throw — grabbing the opponent\'s arm from below.', ja: '掬い投げ。まわしを取らず掬うように投げる。', img: NSK_IMG('sukuinage') },
  'tsukidashi':       { ua: 'Виштовхування суперника серією поштовхів без захвату маваші.', en: 'Pushing the opponent out with a series of thrusts without gripping the mawashi.', ja: '突き出し。突っ張りで相手を土俵外へ突き出す。', img: NSK_IMG('tsukidashi') },
  'uwatedashinage':   { ua: 'Кидок суперника вниз через верхній захват маваші.', en: 'Pulling the opponent down using an overarm grip on the mawashi.', ja: '上手出し投げ。上手を取り、引き出すように投げる。', img: NSK_IMG('uwatedashinage') },
  'sotogake':         { ua: 'Підсічка зовнішньою ногою — зачіп ноги суперника зовні.', en: 'An outer leg trip — hooking the opponent\'s leg from the outside.', ja: '外掛け。外側から足を掛けて倒す。', img: NSK_IMG('sotogake') },
  'katasukashi':      { ua: 'Суперника перекидають через плече захопивши його руку під пахву.', en: 'The opponent is thrown over the shoulder by grabbing their arm under the armpit.', ja: '肩透かし。相手の肩を叩いて手前に引き落とす。', img: NSK_IMG('katasukashi') },
  'kubinage':         { ua: 'Кидок через шию — суперника захоплюють за шию і кидають.', en: 'A headlock throw — grabbing the opponent\'s neck and throwing them.', ja: '首投げ。相手の首に腕を巻いて投げる。', img: NSK_IMG('kubinage') },
  'uwatehineri':      { ua: 'Скручування суперника через верхній захват маваші.', en: 'Twisting the opponent down using an overarm grip on the mawashi.', ja: '上手捻り。上手を取って捻り倒す。', img: NSK_IMG('uwatehineri') },
  'tottari':          { ua: 'Захоплення обох рук суперника і перекидання.', en: 'Grabbing both of the opponent\'s arms and throwing them.', ja: 'とったり。相手の腕を両手で取って引き倒す。', img: NSK_IMG('tottari') },
  'uchigake':         { ua: 'Підсічка внутрішньою ногою — зачіп ноги суперника зсередини.', en: 'An inner leg trip — hooking the opponent\'s leg from the inside.', ja: '内掛け。内側から足を掛けて倒す。', img: NSK_IMG('uchigake') },
  'kimedashi':        { ua: 'Виштовхування суперника з фіксацією його рук.', en: 'Forcing the opponent out while pinning their arms.', ja: '極め出し。相手の両腕を極めて土俵外へ出す。', img: NSK_IMG('kimedashi') },
  'amiuchi':          { ua: 'Кидок через закидання руки через плече суперника.', en: 'A throw by swinging the arm over the opponent\'s shoulder.', ja: '網打ち。相手の腕を両手で引き、網を打つように倒す。', img: NSK_IMG('amiuchi') },
  'shitatedashinage': { ua: 'Кидок суперника вниз через нижній захват маваші.', en: 'Pulling the opponent down using an underarm grip on the mawashi.', ja: '下手出し投げ。下手を取り、引き出すように投げる。', img: NSK_IMG('shitatedashinage') },
  'haritaoshi':       { ua: 'Збивання суперника ляпасом з одночасним поштовхом.', en: 'Slapping the opponent down while simultaneously pushing.', ja: '張り倒し。張り手で相手を倒す。', img: NSK_IMG('haritaoshi') },
  'makiotoshi':       { ua: 'Скручування та збивання суперника вниз.', en: 'Twisting and knocking the opponent down.', ja: '巻き落とし。組んだ相手を捻り落とす。', img: NSK_IMG('makiotoshi') },
  'kirikaeshi':       { ua: 'Підсічка з одночасним відштовхуванням тулубом.', en: 'A leg trip combined with a body push.', ja: '切り返し。相手の膝に自分の膝を当てて捻り倒す。', img: NSK_IMG('kirikaeshi') },
  'chongake':         { ua: 'Підсічка п\'ятою — зачіп п\'яти суперника.', en: 'A heel trip — hooking the opponent\'s heel.', ja: 'ちょん掛け。相手の足首を蹴るように掛けて倒す。', img: NSK_IMG('chongake') },
  'kawazugake':       { ua: 'Обхват ноги суперника своєю ногою з падінням на нього.', en: 'Wrapping the leg around the opponent\'s leg and falling on them.', ja: '河津掛け。相手の足に自分の足を絡めて後ろへ倒す。', img: NSK_IMG('kawazugake') },
  'tsuridashi':       { ua: 'Підняття суперника і винесення його за межі дохьо.', en: 'Lifting the opponent and carrying them out of the ring.', ja: '吊り出し。まわしを取って吊り上げ、土俵外へ出す。', img: NSK_IMG('tsuridashi') },
  'tsuriotoshi':      { ua: 'Підняття суперника і скидання його на землю.', en: 'Lifting the opponent and throwing them to the ground.', ja: '吊り落とし。相手を吊り上げて土俵に落とす。', img: NSK_IMG('tsuriotoshi') },
  'fumidashi':        { ua: 'Суперник сам виходить за межі дохьо, переступаючи ногою.', en: 'The opponent steps out of the ring on their own.', ja: '踏み出し。攻められていない状態で自ら土俵を踏み出す。', img: NSK_IMG('fumidashi') },
  'isamiashi':        { ua: 'Суперник сам виходить за межі дохьо після власної атаки.', en: 'The opponent steps out of the ring after their own charge.', ja: '勇み足。攻めながら勢い余って自分の足が先に出る。', img: NSK_IMG('isamiashi') },
  'koshikudake':      { ua: 'Суперник падає через власну нестійкість або втому.', en: 'The opponent falls due to their own instability or exhaustion.', ja: '腰砕け。相手の攻めなしに自ら腰から崩れ落ちる。', img: NSK_IMG('koshikudake') },
  'watashikomi':      { ua: 'Захоплення ноги суперника рукою з виштовхуванням.', en: 'Grabbing the opponent\'s leg and forcing them out.', ja: '渡し込み。相手の膝や太ももを手で払い、押し倒す。', img: NSK_IMG('watashikomi') },
  'uchimuso':         { ua: 'Удар по внутрішній стороні стегна суперника.', en: 'Striking the opponent\'s inner thigh.', ja: '内無双。相手の内股を手で払って倒す。', img: NSK_IMG('uchimuso') },
  'ipponzeoi':        { ua: 'Кидок через спину — класичний кидок через плече.', en: 'A back throw — a classic over-the-shoulder throw.', ja: '一本背負い。相手の腕を担いで投げる大技。', img: NSK_IMG('ipponzeoi') },
  'shitatehineri':    { ua: 'Скручування суперника через нижній захват маваші.', en: 'Twisting the opponent down using an underarm grip on the mawashi.', ja: '下手捻り。下手を取って捻り倒す。', img: NSK_IMG('shitatehineri') },
  'ashitori':         { ua: 'Захоплення ноги суперника і повалення його на землю.', en: 'Grabbing the opponent\'s leg and bringing them down.', ja: '足取り。相手の足を両手で取って倒す。', img: NSK_IMG('ashitori') },
  'kekaeshi':         { ua: 'Відбивання ноги суперника своєю ногою.', en: 'Deflecting the opponent\'s leg with your own foot.', ja: '蹴返し。相手の足を内側から蹴って払う。', img: NSK_IMG('kekaeshi') },
  'mitokorozeme':     { ua: 'Одночасна атака в три точки — найрідкісніша техніка.', en: 'Simultaneous attack on three points — the rarest technique.', ja: '三所攻め。掛け・取り・突きを同時に行う極めて稀な技。', img: NSK_IMG('mitokorozeme') },
  'okurinage':        { ua: 'Кидок суперника збоку або ззаду.', en: 'Throwing the opponent from the side or behind.', ja: '送り投げ。背後から相手を投げる。', img: NSK_IMG('okurinage') },
  'okuritsuriotoshi': { ua: 'Підняття суперника ззаду і скидання його на землю.', en: 'Lifting the opponent from behind and throwing them down.', ja: '送り吊り落とし。背後から吊り上げて落とす極めて稀な技。', img: NSK_IMG('okuritsuriotoshi') },
  'okuriashi':        { ua: 'Виштовхування суперника ззаду поштовхом в спину.', en: 'Pushing the opponent out from behind with a push to the back.', ja: '送り足。吊られた相手を背後へ送る際の足の運び。', img: NSK_IMG('okuriashi') },
}

const KANJI_EXTRA = {  /* ja_champ_kanji: техніки без описів у KIMARITE_INFO */
  'fusen': '不戦', 'utchari': 'うっちゃり', 'okuritaoshi': '送り倒し',
  'abisetaoshi': '浴びせ倒し', 'tsukitaoshi': '突き倒し', 'kakenage': '掛け投げ',
  'tsuridashi': '吊り出し', 'kimedashi': '極め出し', 'okuriashi': '送り足',
  'fumidashi': '踏み出し', 'isamiashi': '勇み足', 'koshikudake': '腰砕け',
}
export function kimariteKanji(name) {
  const info = KIMARITE_INFO[name]
  if (!info?.ja) return KANJI_EXTRA[name] || name
  return info.ja.split('。')[0] || name
}
