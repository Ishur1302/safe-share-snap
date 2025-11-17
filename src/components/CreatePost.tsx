import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Image as ImageIcon, Upload } from "lucide-react";

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCreatePost = async () => {
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
      });

      if (insertError) throw insertError;

      toast.success("Post created!");
      setCaption("");
      setImageFile(null);
      onPostCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <Textarea
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
        />
        
        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex-1">
            <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:bg-muted transition-colors">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {imageFile ? imageFile.name : "Choose an image"}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          
          <Button
            onClick={handleCreatePost}
            disabled={uploading || !imageFile}
            className="shadow-glow"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;
