import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  post: {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
    likes: { id: string; user_id: string }[];
  };
  currentUserId?: string;
  onLike: (postId: string, isLiked: boolean) => void;
}

const PostCard = ({ post, currentUserId, onLike }: PostCardProps) => {
  const isLiked = post.likes.some((like) => like.user_id === currentUserId);
  const likeCount = post.likes.length;

  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-glow transition-shadow">
      <div className="p-4 flex items-center gap-3">
        <Avatar>
          <AvatarImage src={post.profiles.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {post.profiles.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.profiles.username}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <img
        src={post.image_url}
        alt={post.caption || "Post"}
        className="w-full aspect-square object-cover"
      />
      
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(post.id, isLiked)}
            className={isLiked ? "text-accent" : ""}
          >
            <Heart
              className={`w-5 h-5 mr-1 ${isLiked ? "fill-current" : ""}`}
            />
            {likeCount}
          </Button>
        </div>
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            {post.caption}
          </p>
        )}
      </div>
    </Card>
  );
};

export default PostCard;
