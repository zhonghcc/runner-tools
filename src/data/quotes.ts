// 名言库：跑步、坚持、努力主题。只收出处可靠的句子，外文取常见中译
// 增删直接改这个数组即可

export interface Quote {
  text: string
  source: string
}

export const QUOTES: Quote[] = [
  // 古籍与诗文
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', source: '《荀子·劝学》' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', source: '《荀子·劝学》' },
  { text: '道虽迩，不行不至；事虽小，不为不成。', source: '《荀子·修身》' },
  { text: '千里之行，始于足下。', source: '《老子》第六十四章' },
  { text: '天行健，君子以自强不息。', source: '《周易·乾·象传》' },
  { text: '行百里者半九十。', source: '《战国策·秦策五》' },
  { text: '人一能之，己百之；人十能之，己千之。', source: '《礼记·中庸》' },
  { text: '路漫漫其修远兮，吾将上下而求索。', source: '屈原《离骚》' },
  { text: '古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。', source: '苏轼《晁错论》' },
  { text: '千磨万击还坚劲，任尔东西南北风。', source: '郑燮《竹石》' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', source: '陆游《冬夜读书示子聿》' },
  { text: '老骥伏枥，志在千里；烈士暮年，壮心不已。', source: '曹操《龟虽寿》' },
  { text: '会当凌绝顶，一览众山小。', source: '杜甫《望岳》' },
  { text: '世之奇伟、瑰怪，非常之观，常在于险远，而人之所罕至焉，故非有志者不能至也。', source: '王安石《游褒禅山记》' },
  { text: '故天将降大任于是人也，必先苦其心志，劳其筋骨。', source: '《孟子·告子下》' },

  // 跑者与作家
  { text: '痛楚难以避免，而磨难可以选择。', source: '村上春树《当我谈跑步时我谈些什么》' },
  { text: '至少是跑到了最后。', source: '村上春树为自己拟的墓志铭，《当我谈跑步时我谈些什么》' },
  { text: '如果你想跑步，跑一英里就够了；如果你想体验另一种人生，那就去跑一场马拉松。', source: '埃米尔·扎托佩克' },
  { text: '人类没有极限。', source: '埃鲁德·基普乔格' },
  { text: '只有自律的人，才能在生活中获得自由。', source: '埃鲁德·基普乔格' },
  { text: '不竭尽全力，就是辜负了天赋。', source: '史蒂夫·普里方坦' },
  { text: '奇迹不在于我跑完了，而在于我有勇气出发。', source: '约翰·宾厄姆' },
  { text: '能跑就跑，跑不动就走，走不动就爬，只是永远不要放弃。', source: '迪恩·卡纳泽斯' },
  { text: '每个人都是运动员，区别只在于有人在训练，有人没有。', source: '乔治·希恩' },
  { text: '如果你对人性失去了信心，就去看一场马拉松吧。', source: '凯瑟琳·斯威策' },
]

/** 随机取一句，尽量不与上一句重复 */
export function pickQuote(exclude?: number): number {
  if (QUOTES.length <= 1) return 0
  let i = Math.floor(Math.random() * QUOTES.length)
  if (i === exclude) i = (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length
  return i
}
