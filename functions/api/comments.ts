// 文章评论 API（Cloudflare Pages Function）
// 复用留言板的 GUESTBOOK R2 绑定，评论按文章 slug 分目录存储
// GET  /api/comments?slug=xxx  → 该文章的评论列表（新的在前）
// POST /api/comments?slug=xxx  → 新增评论

interface R2ObjectInfo {
  key: string;
}
interface R2ListResult {
  objects: R2ObjectInfo[];
  truncated: boolean;
  cursor?: string;
}
interface R2ObjectBody {
  json<T>(): Promise<T>;
}
interface R2Bucket {
  put(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: { limit?: number; prefix?: string; cursor?: string }): Promise<R2ListResult>;
}
interface Env {
  GUESTBOOK: R2Bucket;
}

interface Comment {
  name: string;
  text: string;
  time: string;
  key: string;
}

const MAX_NAME_LEN = 24;
const MAX_TEXT_LEN = 500;
const RATE_LIMIT_MS = 60_000; // 同 IP 60 秒一条
const MAX_COMMENTS_RETURNED = 200;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const clean = (s: unknown, max: number): string =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

// slug 白名单校验：只允许字母数字下划线连字符（防止路径穿越）
const validSlug = (s: unknown): string | null => {
  const slug = clean(s, 100);
  return /^[A-Za-z0-9_-]+$/.test(slug) ? slug : null;
};

type Handler = (ctx: {
  request: Request;
  env: Env;
  url: URL;
}) => Promise<Response>;

export const onRequestGet: Handler = async ({ env, url }) => {
  if (!env.GUESTBOOK) {
    return json({ ok: false, error: 'R2 绑定未配置（GUESTBOOK）' }, 500);
  }
  const slug = validSlug(url.searchParams.get('slug'));
  if (!slug) return json({ ok: false, error: '文章参数错误' }, 400);

  const prefix = `comments/${slug}/`;
  const listed = await env.GUESTBOOK.list({ prefix, limit: 1000 });
  const keys = listed.objects.map((o) => o.key).sort().reverse();

  const comments: Comment[] = [];
  for (const key of keys.slice(0, MAX_COMMENTS_RETURNED)) {
    const obj = await env.GUESTBOOK.get(key);
    if (!obj) continue;
    try {
      const m = await obj.json<Omit<Comment, 'key'>>();
      comments.push({ ...m, key });
    } catch {
      // 跳过损坏的数据
    }
  }

  return json({ ok: true, comments });
};

export const onRequestPost: Handler = async ({ request, env, url }) => {
  if (!env.GUESTBOOK) {
    return json({ ok: false, error: 'R2 绑定未配置（GUESTBOOK）' }, 500);
  }
  const slug = validSlug(url.searchParams.get('slug'));
  if (!slug) return json({ ok: false, error: '文章参数错误' }, 400);

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
  if (!text || text.length < 2) {
    return json({ ok: false, error: '留言太短啦' }, 400);
  }

  // 同 IP 限频：检查该文章最近的评论
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const prefix = `comments/${slug}/`;
  const listed = await env.GUESTBOOK.list({ prefix, limit: 1000 });
  const recentKeys = listed.objects.map((o) => o.key).sort().reverse().slice(0, 5);
  for (const key of recentKeys) {
    const obj = await env.GUESTBOOK.get(key);
    if (!obj) continue;
    try {
      const m = await obj.json<{ ip?: string; time?: string }>();
      if (m.ip === ip && m.time && Date.now() - new Date(m.time).getTime() < RATE_LIMIT_MS) {
        return json({ ok: false, error: '评论太快啦，喝口水休息一分钟~' }, 429);
      }
    } catch {
      // 忽略解析失败
    }
  }

  const now = new Date();
  const rand = Math.random().toString(36).slice(2, 10);
  const key = `${prefix}${now.toISOString().replace(/[:.]/g, '-')}-${rand}.json`;

  await env.GUESTBOOK.put(
    key,
    // ip 仅用于服务端限频，不返回给前端
    JSON.stringify({ name, text, time: now.toISOString(), ip })
  );

  return json({ ok: true, comment: { name, text, time: now.toISOString(), key } });
};
