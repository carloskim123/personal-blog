import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDatetime: z.date().or(z.string().transform(str => new Date(str))),
      description: z.string(),
      draft: z.boolean().optional(),
      featured: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: z.string().optional(),
    }),
});

export const collections = { blog };
