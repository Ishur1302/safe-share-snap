-- Fix critical RLS policies for safety violations and messages

-- Allow users to insert their own safety violations
CREATE POLICY "Users can insert own violations" 
ON safety_violations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own sent messages
CREATE POLICY "Users can delete own sent messages" 
ON messages 
FOR DELETE 
USING (auth.uid() = sender_id);