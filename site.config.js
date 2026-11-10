/** Shared by the browser and API. Public values only: never put tokens here. */
const site = {
  name: '灵感漂流墙',
  subtitle: 'CREATE WITH US · 一起创造',
  tagline: '让每一个小小的想法，都有机会被看见。',
  formIntro: '欢迎来到脑洞收集站，分享你的探索与期待～',
  logo: '/logo.svg',
  accentColor: '#ed3fb3',
  qrCaption: '扫码写下卡片，让灵感相遇',
  pollIntervalMs: 5000,
  maxVisibleCards: 150,
  questions: {
    nickname: '给自己起个出场昵称吧！',
    tools: '平时都和哪些 AI 搭子一起玩？',
    outlook: '未来的 AI，你怎么看？',
    wish: '期待我们举办什么活动？',
    interest: 'AI 创意活动，要一起玩吗？',
  },
  tools: ['ChatGPT','DeepSeek','豆包','Claude','Cursor','即梦','Midjourney','Gemini','Codex','WorkBuddy','可灵','千问'],
  interestOptions: ['冲！我超感兴趣','有点心动，想先了解','先围观，给大家打 call'],
  successMessage: '已保存成功！你的卡片将在大屏下一次刷新时出现。',
  // Optional post-submit instructions. Images belong in public/; use your own assets.
  // Example: { title: '加入活动群', text: '保存下方群码，扫码加入。', image: '/your-group-code.png' }
  successSteps: [],
};
if (!Number.isInteger(site.maxVisibleCards) || site.maxVisibleCards<1 || site.maxVisibleCards>150) throw Error('maxVisibleCards must be 1..150');
if (site.pollIntervalMs<2000) throw Error('pollIntervalMs must be at least 2000');
if (site.interestOptions.length!==3 || site.interestOptions.some(x=>!x || x.length>30)) throw Error('Provide three nonempty interest options, up to 30 characters each');
export default site;
