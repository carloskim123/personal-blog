import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, description, pubDatetime, content, slug } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate a clean slug from title if not provided
    const postSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const date = pubDatetime || new Date().toISOString();

    // Construct standard Astro frontmatter + Markdown
    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
pubDatetime: ${date}
description: "${(description || "").replace(/"/g, '\\"')}"
featured: false
draft: false
tags:
  - general
---

${content}
`;

    // Save directly into the Astro content collection directory
    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "blog",
      `${postSlug}.md`
    );
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Post published successfully!",
        slug: postSlug,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create post on server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
