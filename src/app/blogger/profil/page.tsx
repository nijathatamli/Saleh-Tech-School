import { BloggerTopbar } from "@/components/blog/blogger-topbar";
import { ProfileForm } from "@/components/blog/profile-form";
import { bloggerGuard } from "@/lib/blog/guard";

export const dynamic = "force-dynamic";

export default async function BloggerProfilePage() {
  const { author } = await bloggerGuard();
  return (
    <div>
      <BloggerTopbar title="Profil" subtitle="Məqalələrin altında görünən müəllif məlumatları" />
      <div className="ad-content">
        <ProfileForm initial={{ name: author.user.name, email: author.user.email, avatarUrl: author.user.avatarUrl, position: author.position, bio: author.bio }} />
      </div>
    </div>
  );
}
