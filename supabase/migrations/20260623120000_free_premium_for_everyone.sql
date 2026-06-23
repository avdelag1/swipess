-- ============================================================
-- Free premium for everyone
-- ------------------------------------------------------------
-- Grants unlimited messaging to ALL users by overriding
-- user_has_unlimited_messaging() to always return true.
--
-- Because start_conversation_with_message() (see
-- 20260615120000_messaging_token_enforcement.sql, section 8) checks this
-- helper both to gate new conversations AND to decide whether to deduct a
-- token, returning true here means:
--   * every user can start unlimited conversations, and
--   * no tokens are ever deducted.
--
-- To re-enable paid messaging later, restore the original definition from
-- 20260615120000_messaging_token_enforcement.sql (section 2) and flip the
-- client flag PREMIUM_FOR_EVERYONE in src/utils/messagingEntitlements.ts.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_unlimited_messaging(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Promo: everyone gets premium/unlimited messaging for free.
  SELECT true;
$$;
