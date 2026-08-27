import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("x-admin-passcode");
    const validPasscode = process.env.ADMIN_PASSCODE;

    if (validPasscode && authHeader !== validPasscode) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid passcode" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      content,
      tags,
      draft,
      featured,
      pubDate,
      heroImage,
    } = body;

    const token = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_OWNER;
    const repoName = process.env.GITHUB_REPO;
    const deployHook = process.env.VERCEL_DEPLOY_HOOK;

    if (!token || !repoOwner || !repoName) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500 }
      );
    }

    const formattedPubDate = pubDate
      ? new Date(pubDate).toISOString()
      : new Date().toISOString();
    const tagList = Array.isArray(tags) && tags.length > 0 ? tags : ["others"];

    let frontmatter = `---\n`;
    frontmatter += `title: "${title}"\n`;
    frontmatter += `pubDatetime: ${formattedPubDate}\n`;
    frontmatter += `description: "${description || ""}"\n`;
    frontmatter += `draft: ${Boolean(draft)}\n`;
    frontmatter += `featured: ${Boolean(featured)}\n`;
    frontmatter += `tags:\n${tagList
      .map((t: string) => `  - "${t}"`)
      .join("\n")}\n`;
    if (heroImage) {
      frontmatter += `ogImage: "${heroImage}"\n`;
    }
    frontmatter += `---\n\n${content}`;

    const filePath = `src/content/blog/${slug}.md`;
    const getFileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Astro-Admin-Publisher",
      "Content-Type": "application/json",
    };

    let sha: string | undefined;
    const checkRes = await fetch(getFileUrl, { headers });
    if (checkRes.ok) {
      const existingData = await checkRes.json();
      sha = existingData.sha;
    }

    const fileContentBase64 = Buffer.from(frontmatter, "utf-8").toString(
      "base64"
    );

    const commitRes = await fetch(getFileUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat(blog): publish post "${title}"`,
        content: fileContentBase64,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!commitRes.ok) {
      const errData = await commitRes.json();
      return new Response(
        JSON.stringify({ error: errData.message || "GitHub commit failed" }),
        { status: commitRes.status }
      );
    }

    if (deployHook) {
      await fetch(deployHook, { method: "POST" });
    }

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500 }
    );
  }
};
