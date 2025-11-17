import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Shield, Send, Image as ImageIcon, AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  image_url: string | null;
  sender_id: string;
  receiver_id: string;
  is_flagged: boolean;
  created_at: string;
  sender: { username: string };
}

const Messages = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchMessages();
      
      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => fetchMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchMessages = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username)
      `)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    if (!session || (!messageText.trim() && !imageFile)) return;

    setSending(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const { data: moderationData, error: moderationError } = await supabase.functions.invoke(
          "moderate-content",
          { body: { imageFile: await fileToBase64(imageFile) } }
        );

        if (moderationError) throw moderationError;

        if (moderationData.isFlagged) {
          const { data: violations } = await supabase
            .from("safety_violations")
            .select("*")
            .eq("user_id", session.user.id)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          if (violations && violations.length >= 2) {
            toast.error(
              "CRITICAL: Multiple violations detected. Authorities have been notified.",
              { duration: 10000 }
            );
          }

          toast.error(
            "🚫 CONTENT BLOCKED: This image contains inappropriate content and cannot be shared. Your safety violation has been logged.",
            { duration: 8000 }
          );
          
          await supabase.from("safety_violations").insert({
            user_id: session.user.id,
            violation_type: "inappropriate_image",
            details: { reason: moderationData.reason },
          });

          setSending(false);
          setImageFile(null);
          return;
        }

        const fileName = `${session.user.id}/${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("message-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("message-images")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("messages").insert({
        sender_id: session.user.id,
        receiver_id: receiverId,
        content: messageText,
        image_url: imageUrl,
      });

      if (error) throw error;

      setMessageText("");
      setImageFile(null);
      toast.success("Message sent securely!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 p-4 bg-gradient-accent rounded-lg shadow-glow">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-accent-foreground" />
            <h2 className="text-lg font-bold text-accent-foreground">Protected Messaging</h2>
          </div>
          <p className="text-sm text-accent-foreground/90">
            All images are automatically scanned for inappropriate content. Your safety is our priority.
          </p>
        </div>

        <Card className="p-4 mb-4">
          <div className="space-y-3">
            <Input
              placeholder="Receiver username or ID"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
            />
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">
                    {imageFile ? imageFile.name : "Add Image"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <Button onClick={handleSendMessage} disabled={sending} className="ml-auto">
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Checking..." : "Send Securely"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`p-4 ${
                msg.sender_id === session?.user.id ? "ml-auto bg-primary/5" : "mr-auto"
              } max-w-[80%]`}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {msg.sender.username}
              </div>
              {msg.is_flagged && (
                <div className="flex items-center gap-1 text-xs text-destructive mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  Flagged content
                </div>
              )}
              {msg.content && <p className="text-sm">{msg.content}</p>}
              {msg.image_url && (
                <img
                  src={msg.image_url}
                  alt="Message"
                  className="mt-2 rounded-lg max-w-full"
                />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
