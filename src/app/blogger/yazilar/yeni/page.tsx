import { BloggerTopbar } from "@/components/blog/blogger-topbar";
import { PostEditor } from "@/components/blog/post-editor";
import { bloggerGuard } from "@/lib/blog/guard";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await bloggerGuard();
  return (
    <div>
      <BloggerTopbar title="Yeni yazı" subtitle="Qaralama kimi saxlayın və ya dərc edin" />
      <div className="ad-content"><PostEditor /></div>
    </div>
  );
}
