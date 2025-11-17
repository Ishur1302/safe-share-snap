import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Heart, AlertTriangle } from "lucide-react";

const safetyQuotes = [
  "Your voice matters. Your safety matters. You are never alone.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "You are brave. You are strong. You are valued.",
  "No one can make you feel inferior without your consent. - Eleanor Roosevelt",
  "The most courageous act is still to think for yourself. Aloud. - Coco Chanel",
  "A strong woman understands that gifts such as logic, decisiveness, and strength are just as feminine as intuition and emotional connection.",
];

interface Violation {
  id: string;
  violation_type: string;
  created_at: string;
  details: any;
}

const Safety = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    setRandomQuote(safetyQuotes[Math.floor(Math.random() * safetyQuotes.length)]);

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
      fetchViolations();
    }
  }, [session]);

  const fetchViolations = async () => {
    if (!session) return;

    const { data } = await supabase
      .from("safety_violations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setViolations(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-glow bg-gradient-accent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent-foreground" />
              <Heart className="w-6 h-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl text-accent-foreground">Safety Center</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-accent-foreground/90 italic text-lg leading-relaxed">
              "{randomQuote}"
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              How We Keep You Safe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">AI Content Moderation</h3>
              <p className="text-sm text-muted-foreground">
                Every image shared in messages is automatically scanned using advanced AI to detect inappropriate content, including nudity and offensive material.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Three-Strike Policy</h3>
              <p className="text-sm text-muted-foreground">
                If someone attempts to share inappropriate content three times within 24 hours, local authorities are automatically notified to ensure your safety.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Your Privacy Matters</h3>
              <p className="text-sm text-muted-foreground">
                All safety checks happen automatically and securely. Your private conversations remain private - we only flag harmful content.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Recent Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {violations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No security incidents. Your account is in good standing. ✨
              </p>
            ) : (
              <div className="space-y-3">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                  >
                    <p className="text-sm font-medium text-destructive capitalize">
                      {violation.violation_type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(violation.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Emergency Resources</h3>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                🚨 <strong>National Domestic Violence Hotline:</strong> 1-800-799-7233
              </p>
              <p className="text-muted-foreground">
                🌐 <strong>RAINN National Sexual Assault Hotline:</strong> 1-800-656-4673
              </p>
              <p className="text-muted-foreground">
                📞 <strong>Crisis Text Line:</strong> Text HOME to 741741
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Safety;
