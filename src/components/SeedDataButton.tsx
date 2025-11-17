import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Loader2 } from "lucide-react";
import samplePost1 from "@/assets/sample-post-1.jpg";
import samplePost2 from "@/assets/sample-post-2.jpg";
import samplePost3 from "@/assets/sample-post-3.jpg";

const sampleUsers = [
  {
    email: "sarah@safeconnect.demo",
    password: "demo123456",
    username: "sarah_shield",
    fullName: "Sarah Shield",
  },
  {
    email: "emma@safeconnect.demo",
    password: "demo123456",
    username: "emma_secure",
    fullName: "Emma Secure",
  },
  {
    email: "maya@safeconnect.demo",
    password: "demo123456",
    username: "maya_protect",
    fullName: "Maya Protect",
  },
];

const samplePosts = [
  {
    caption: "Together we stand stronger! 💪 #WomensSafety #SafeConnect",
    image: samplePost1,
    userIndex: 0,
  },
  {
    caption: "Never forget: Your voice matters. You are never alone. ✨",
    image: samplePost2,
    userIndex: 1,
  },
  {
    caption: "Building safe communities, one connection at a time ☕️ #Community",
    image: samplePost3,
    userIndex: 2,
  },
];

const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);

  const createSampleData = async () => {
    setLoading(true);
    const createdUsers: string[] = [];

    try {
      toast.info("Creating sample accounts...");

      // Create sample users
      for (const user of sampleUsers) {
        try {
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              data: {
                username: user.username,
                full_name: user.fullName,
              },
            },
          });

          if (signUpError) {
            if (signUpError.message.includes("already registered")) {
              console.log(`User ${user.email} already exists, skipping...`);
              // Try to sign in to get the user ID
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: user.password,
              });
              if (signInData.user) {
                createdUsers.push(signInData.user.id);
              }
            } else {
              throw signUpError;
            }
          } else if (authData.user) {
            createdUsers.push(authData.user.id);
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error creating user ${user.email}:`, error);
        }
      }

      toast.success(`Created ${createdUsers.length} sample accounts!`);
      toast.info("Creating sample posts...");

      // Create posts for each user
      for (let i = 0; i < samplePosts.length; i++) {
        const post = samplePosts[i];
        if (createdUsers[post.userIndex]) {
          try {
            // Sign in as this user temporarily
            const user = sampleUsers[post.userIndex];
            await supabase.auth.signInWithPassword({
              email: user.email,
              password: user.password,
            });

            // Convert image to blob
            const response = await fetch(post.image);
            const blob = await response.blob();
            const file = new File([blob], `sample-${i}.jpg`, { type: "image/jpeg" });

            // Upload image
            const fileName = `${createdUsers[post.userIndex]}/${Date.now()}-sample-${i}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("post-images")
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from("post-images").getPublicUrl(fileName);

            // Create post
            const { error: postError } = await supabase.from("posts").insert({
              user_id: createdUsers[post.userIndex],
              image_url: publicUrl,
              caption: post.caption,
            });

            if (postError) throw postError;
          } catch (error) {
            console.error(`Error creating post for user ${i}:`, error);
          }
        }
      }

      toast.success("✅ Sample data created successfully!");
      toast.info("Refresh the page to see the demo posts!");
    } catch (error: any) {
      console.error("Seed error:", error);
      toast.error(error.message || "Failed to create sample data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={createSampleData}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Database className="w-4 h-4" />
          Load Demo Data
        </>
      )}
    </Button>
  );
};

export default SeedDataButton;
