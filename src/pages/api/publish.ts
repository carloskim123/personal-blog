import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { title, description, tags, content, secret } = data;

    // Check passcode against Vercel environment variable
    if (secret !== import.meta.env.ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ message: "Unauthorized: Invalid passcode" }),
        { status: 401 }
      );
    }

    // Format filename and slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const filename = `${slug}.md`;
    const dateStr = new Date().toISOString();

    // Format frontmatter specifically for Astro-Paper
    const fileContent = `---
author: Carlos
pubDatetime: ${dateStr}
title: "${title}"
postSlug: "${slug}"
featured: false
draft: false
tags:
${tags
  .split(",")
  .map((t: string) => `  - ${t.trim()}`)
  .join("\n")}
description: "${description}"
---

${content}
`;

    const contentBase64 = Buffer.from(fileContent).toString("base64");

    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const REPO_OWNER = import.meta.env.GITHUB_OWNER;
    const REPO_NAME = import.meta.env.GITHUB_REPO;

    // Send file to GitHub repository
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/src/content/blog/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "Astro-Publish-API",
        },
        body: JSON.stringify({
          message: `Add post: ${title}`,
          content: contentBase64,
          branch: "main",
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return new Response(JSON.stringify({ message: err.message }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: "Post published successfully!" }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
};
