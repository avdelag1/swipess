-- Allow users to delete their conversations
CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);
