// 留言板 API（Cloudflare Pages Function）
// 绑定：Pages 项目 → Settings → Bindings → R2 bucket bindings
//       变量名 GUESTBOOK → 选择 R2 桶
// 存储：桶内 messages/ 前缀，一条留言一个 JSON 文件

// ===== 最小类型声明（避免引入额外依赖）=====
interface R2ObjectInfo {
  key: string;
}
interface R2ListResult {
  objects: R2ObjectInfo[];
  truncated: boolean;
  cursor?: string;
}
interface R2Bucket {
  put(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<unknown>;
  list(options?: { limit?: number; prefix?: string; cursor?: string }): Promise<R2ListResult>;
}
interface Env {
  GUESTBOOK: R2Bucket;
}

interface GuestMessage {
  name: string;
  text: string;
  time: string;
  key: string;
}

const PREFIX = 'messages/';
const MAX_MESSAGES_RETURNED = 200;
const MAX_NAME_LEN = 24;
const MAX_TEXT_LEN = 500;
const RATE_LIMIT_MS = 60_000; // 同 IP 60 秒一条

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

// 清理输入：去首尾空白、去控制字符、限长
const clean = (s: unknown, max: number): string =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

type Handler = (ctx: { request: Request; env: Env }) => Promise<Response>;

// ===== GET /api/guestbook：返回最新留言（新的在前）=====
export const onRequestGet: Handler = async ({ env }) => {
  if (!env.GUESTBOOK) {
    return json({ ok: false, error: 'R2 绑定未配置（GUESTBOOK）' }, 500);
  }

  const listed = await env.GUESTBOOK.list({ prefix: PREFIX, limit: 1000 });
  const keys = listed.objects.map((o) => o.key).sort().reverse();

  const messages: GuestMessage[] = [];
  for (const key of keys.slice(0, MAX_MESSAGES_RETURNED)) {
    const obj = (await env.GUESTBOOK.get(key)) as { text: string } | null;
    if (!obj) continue;
    try {
      const m = JSON.parse(obj.text) as Omit<GuestMessage, 'key'>;
      messages.push({ ...m, key });
    } catch {
      // 跳过损坏的数据
    }
  }

  return json({ ok: true, messages });
};

// ===== POST /api/guestbook：新增留言 =====
export const onRequestPost: Handler = async ({ request, env }) => {
  if (!env.GUESTBOOK) {
    return json({ ok: false, error: 'R2 绑定未配置（GUESTBOOK）' }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: '请求格式错误' }, 400);
  }

  // 蜜罐：机器人通常会填隐藏字段
  if (clean(body.honeypot, 100)) {
    return json({ ok: false, error: '发送失败，请稍后再试' }, 400);
  }

  const name = clean(body.name, MAX_NAME_LEN) || '匿名访客';
  const text = clean(body.text, MAX_TEXT_LEN);
  if (!text) {
    return json({ ok: false, error: '留言内容不能为空' }, 400);
  }
  if (text.length < 2) {
    return json({ ok: false, error: '留言太短啦' }, 400);
  }

  // 简单限频：最近 5 条里有没有同 IP 且 1 分钟内的
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const listed = await env.GUESTBOOK.list({ prefix: PREFIX, limit: 1000 });
  const recentKeys = listed.objects.map((o) => o.key).sort().reverse().slice(0, 5);
  for (const key of recentKeys) {
    const obj = (await env.GUESTBOOK.get(key)) as { text: string } | null;
    if (!obj) continue;
    try {
      const m = JSON.parse(obj.text) as { ip?: string; time?: string };
      if (m.ip === ip && m.time && Date.now() - new Date(m.time).getTime() < RATE_LIMIT_MS) {
        return json({ ok: false, error: '发言太快啦，喝口水休息一分钟~' }, 429);
      }
    } catch {
      // 忽略解析失败
    }
  }

  const now = new Date();
  // key 用时间戳+随机数，字典序即时间序
  const rand = Math.random().toString(36).slice(2, 10);
  const key = `${PREFIX}${now.toISOString().replace(/[:.]/g, '-')}-${rand}.json`;

  await env.GUESTBOOK.put(
    key,
    // ip 仅用于服务端限频，不返回给前端
    JSON.stringify({ name, text, time: now.toISOString(), ip })
  );

  return json({ ok: true, message: { name, text, time: now.toISOString(), key } });
};
