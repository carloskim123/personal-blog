import type { APIRoute } from "astro";

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

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({
          error:
            "GITHUB_TOKEN environment variable is not configured on Vercel.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const postSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const date = pubDatetime || new Date().toISOString();

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

    const contentEncoded = Buffer.from(fileContent).toString("base64");

    const repoOwner = "carloskim123";
    const repoName = "personal-blog";
    const filePath = `src/content/blog/${postSlug}.md`;

    const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const githubRes = await fetch(githubUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Astro-Publish-API",
      },
      body: JSON.stringify({
        message: `feat(blog): add post "${title}"`,
        content: contentEncoded,
        branch: "main",
      }),
    });

    const githubData = await githubRes.json();

    if (!githubRes.ok) {
      return new Response(
        JSON.stringify({
          error: githubData.message || "GitHub API commit failed.",
        }),
        {
          status: githubRes.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Post committed successfully!",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
