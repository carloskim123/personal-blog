import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
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

    if (!token || !repoOwner || !repoName) {
      return new Response(
        JSON.stringify({ error: "Server environment configuration missing" }),
        { status: 500 }
      );
    }

    // Format strictly to Astro Paper schema requirements
    const formattedPubDate = pubDate
      ? new Date(pubDate).toISOString()
      : new Date().toISOString();

    // Construct frontmatter using exact Astro Paper keys
    let frontmatter = `---\n`;
    frontmatter += `title: "${title.replace(/"/g, '\\"')}"\n`;
    frontmatter += `pubDatetime: ${formattedPubDate}\n`;
    frontmatter += `description: "${(description || "").replace(
      /"/g,
      '\\"'
    )}"\n`;
    frontmatter += `draft: ${Boolean(draft)}\n`;
    frontmatter += `featured: ${Boolean(featured)}\n`;
    frontmatter += `tags:\n${tags
      .map((t: string) => `  - "${t}"`)
      .join("\n")}\n`;

    if (heroImage) {
      frontmatter += `ogImage: "${heroImage}"\n`;
    }

    frontmatter += `---\n\n${content}`;

    const filePath = `src/content/blog/${slug}.md`;
    const getFileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    // Check if file exists to get SHA for overwrite
    let sha: string | undefined;
    const checkRes = await fetch(getFileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Astro-Admin-Publisher",
      },
    });

    if (checkRes.ok) {
      const existingData = await checkRes.json();
      sha = existingData.sha;
    }

    const commitRes = await fetch(getFileUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Astro-Admin-Publisher",
      },
      body: JSON.stringify({
        message: `feat(blog): publish post "${title}"`,
        content: Buffer.from(frontmatter).toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    });

    if (!commitRes.ok) {
      const errData = await commitRes.json();
      return new Response(
        JSON.stringify({ error: errData.message || "GitHub API error" }),
        { status: commitRes.status }
      );
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
