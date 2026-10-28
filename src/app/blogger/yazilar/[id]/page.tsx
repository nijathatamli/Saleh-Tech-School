import { notFound } from "next/navigation";
import { BloggerTopbar } from "@/components/blog/blogger-topbar";
import { PostEditor } from "@/components/blog/post-editor";
import { bloggerGuard } from "@/lib/blog/guard";
import { getOwnPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const { author } = await bloggerGuard();
  const p = await getOwnPost(author.id, params.id);
  if (!p) notFound();
  return (
    <div>
      <BloggerTopbar title="Yazını redaktə et" subtitle={p.title} />
      <div className="ad-content">
        <PostEditor
          initial={{
            id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, coverUrl: p.coverUrl, coverAlt: p.coverAlt, category: p.category, tags: p.tags,
            status: p.status, publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null, metaTitle: p.metaTitle, metaDescription: p.metaDescription, views: p.views,
          }}
        />
      </div>
    </div>
  );
}
