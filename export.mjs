export function cardsCsv(cards){
 const cell=value=>{
  let text=String(value??'');
  if(/^[\s]*[=+\-@]/.test(text)||/^[\t\r]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
 };
 const rows=[['卡片编号','提交时间（北京时间）','昵称','常用 AI 工具','对 AI 未来的看法','期待举办的活动','AI 兴趣卡创造比赛兴趣']];
 const time=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
 for(const card of cards)rows.push([card.id,time.format(new Date(Number(card.createdAt))),card.nickname,card.tools,card.outlook,card.wish,card.interest]);
 return '\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
