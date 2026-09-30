import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    author: z.string().default('Zhou'),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/photos' }),
  schema: z.object({
    title: z.string(),
    category: z.string().default('未分类'),
    // 本地路径 /images/... 或 R2 地址 https://assets.zhoudaniu.party/... 均可
    src: z.string(),
    order: z.number().default(99),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    // 视频地址，建议 R2：https://assets.zhoudaniu.party/videos/xxx.mp4
    src: z.string().optional(),
    // 封面图，本地或 R2 地址均可
    cover: z.string().optional(),
    description: z.string().default(''),
    order: z.number().default(99),
  }),
});

export const collections = { blog, photos, videos };
