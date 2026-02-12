
-- 1. Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL DEFAULT 'system_announcement',
  title text,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link_url text,
  related_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- 2. Saved filters/searches table
CREATE TABLE public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filter_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_role text NOT NULL DEFAULT 'client',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saved filters" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved filters" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved filters" ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved filters" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Digital contracts table
CREATE TABLE public.digital_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  client_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id),
  template_type text NOT NULL DEFAULT 'rental',
  title text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'draft',
  owner_signature text,
  client_signature text,
  owner_signed_at timestamptz,
  client_signed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.digital_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own contracts" ON public.digital_contracts FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = client_id);
CREATE POLICY "Owners can create contracts" ON public.digital_contracts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Participants can update contracts" ON public.digital_contracts FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = client_id);
CREATE TRIGGER update_digital_contracts_updated_at BEFORE UPDATE ON public.digital_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Subscription packages table
CREATE TABLE public.subscription_packages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MXN',
  tier text NOT NULL DEFAULT 'basic',
  package_category text NOT NULL DEFAULT 'client_monthly',
  duration_days integer DEFAULT 30,
  features jsonb DEFAULT '[]'::jsonb,
  message_activations integer DEFAULT 0,
  legal_documents_included integer DEFAULT 0,
  best_deal_notifications integer DEFAULT 0,
  max_listings integer DEFAULT 1,
  early_profile_access boolean DEFAULT false,
  advanced_match_tips boolean DEFAULT false,
  seeker_insights boolean DEFAULT false,
  availability_sync boolean DEFAULT false,
  market_reports boolean DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.subscription_packages FOR SELECT USING (true);

-- 5. User subscriptions table
CREATE TABLE public.user_subscriptions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  package_id integer REFERENCES public.subscription_packages(id),
  is_active boolean NOT NULL DEFAULT true,
  payment_status text DEFAULT 'pending',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Message activations (pay-per-use)
CREATE TABLE public.message_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activations_remaining integer NOT NULL DEFAULT 0,
  total_purchased integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_activations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activations" ON public.message_activations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activations" ON public.message_activations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activations" ON public.message_activations FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_message_activations_updated_at BEFORE UPDATE ON public.message_activations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Conversation messages table (used by messaging hooks)
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON public.conversation_messages FOR SELECT USING (public.is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Users can send messages in their conversations" ON public.conversation_messages FOR INSERT WITH CHECK (public.is_conversation_participant(auth.uid(), conversation_id) AND sender_id = auth.uid());
CREATE POLICY "Users can update their own messages" ON public.conversation_messages FOR UPDATE USING (sender_id = auth.uid());

-- Enable realtime for notifications and conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

-- Seed some default subscription packages
INSERT INTO public.subscription_packages (name, description, price, tier, package_category, duration_days, message_activations, max_listings, features) VALUES
('Basic Client', 'Basic monthly plan for clients', 99, 'basic', 'client_monthly', 30, 6, 0, '["basic_search","save_listings"]'),
('Premium Client', 'Premium monthly plan for clients', 249, 'premium', 'client_monthly', 30, 12, 0, '["basic_search","save_listings","advanced_filters","super_likes"]'),
('Unlimited Client', 'Unlimited monthly plan for clients', 499, 'unlimited', 'client_monthly', 30, 30, 0, '["all_features"]'),
('Basic Owner', 'Basic monthly plan for owners', 149, 'basic', 'owner_monthly', 30, 6, 3, '["basic_listing","basic_analytics"]'),
('Premium Owner', 'Premium monthly plan for owners', 349, 'premium', 'owner_monthly', 30, 12, 10, '["basic_listing","advanced_analytics","property_boost"]'),
('Unlimited Owner', 'Unlimited monthly plan for owners', 699, 'unlimited', 'owner_monthly', 30, 30, 999, '["all_features"]'),
('5 Message Pack', '5 message activations', 49, 'pay_per_use', 'client_pay_per_use', 365, 5, 0, '[]'),
('10 Message Pack', '10 message activations', 89, 'pay_per_use', 'client_pay_per_use', 365, 10, 0, '[]'),
('5 Owner Message Pack', '5 message activations for owners', 59, 'pay_per_use', 'owner_pay_per_use', 365, 5, 0, '[]'),
('10 Owner Message Pack', '10 message activations for owners', 109, 'pay_per_use', 'owner_pay_per_use', 365, 10, 0, '[]');
