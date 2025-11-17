import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TestModeration = () => {
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTesting(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;

        toast.info("🤖 Analyzing image with AI...");

        const { data, error } = await supabase.functions.invoke("moderate-content", {
          body: { imageFile: base64 },
        });

        if (error) throw error;

        setResult(data);

        if (data.isFlagged) {
          toast.error("🚫 CONTENT FLAGGED: " + data.reason, { duration: 8000 });
        } else {
          toast.success("✅ Content appears safe", { duration: 5000 });
        }
      };
    } catch (error: any) {
      toast.error(error.message || "Failed to test image");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-glow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>AI Content Moderation Test</CardTitle>
            <CardDescription>
              Test our AI-powered image detection system. Upload any image to see if it contains
              inappropriate content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Click to upload an image for testing
              </p>
              <Button 
                disabled={testing}
                onClick={() => fileInputRef.current?.click()}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Choose Image"
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleTestImage}
                className="hidden"
                disabled={testing}
              />
            </div>

            {result && (
              <Card className={result.isFlagged ? "border-destructive" : "border-primary"}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {result.isFlagged ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    <CardTitle className="text-lg">
                      {result.isFlagged ? "Content Flagged" : "Content Safe"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={result.isFlagged ? "text-destructive font-semibold" : "text-primary font-semibold"}>
                      {result.isFlagged ? "BLOCKED" : "APPROVED"}
                    </span>
                  </div>
                  {result.reason && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="font-medium">{result.reason}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                How It Works
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>AI analyzes every uploaded image in real-time</li>
                <li>Detects nudity, violence, and offensive content</li>
                <li>Blocks inappropriate images before they're sent</li>
                <li>Logs violations for safety tracking</li>
                <li>After 3 violations, authorities are notified</li>
              </ul>
            </div>

            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => navigate("/messages")}>
                Test in Actual Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestModeration;
