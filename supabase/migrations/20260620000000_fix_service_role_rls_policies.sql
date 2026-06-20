-- ============================================================
-- SECURITY FIX: "service role" RLS policies that unintentionally
-- granted full access to ALL roles (anon + authenticated).
--
-- These policies were written as:
--     USING (true) WITH CHECK (true)
-- with NO `TO service_role` clause. Because the service_role key
-- BYPASSES RLS entirely, such a policy never needs to exist for the
-- service role — its only practical effect is to grant the same
-- access to the `anon` and `authenticated` roles, i.e. everyone.
--
-- Restricting each policy to `TO service_role` removes the public
-- grant. Where public/owner read access is legitimately needed it is
-- already covered by a separate, scoped SELECT policy (see notes).
-- ============================================================

-- 1. google_play_transactions — payment / subscription records.
--    Not read from the client; managed exclusively by the
--    validate-google-play-purchase edge function (service role).
DROP POLICY IF EXISTS "Service role can manage google play transactions" ON public.google_play_transactions;
CREATE POLICY "Service role can manage google play transactions"
    ON public.google_play_transactions
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. purchase_audit_log — fraud / replay-attack audit trail.
--    Must never be readable or writable by end users.
DROP POLICY IF EXISTS "Service role can manage purchase audit log" ON public.purchase_audit_log;
CREATE POLICY "Service role can manage purchase audit log"
    ON public.purchase_audit_log
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. legal_service_packages — public READ stays open via the existing
--    "Allow public read access on legal_service_packages" SELECT policy.
--    Only the write/management grant is locked down to the service role.
DROP POLICY IF EXISTS "Allow service role full access on legal_service_packages" ON public.legal_service_packages;
CREATE POLICY "Allow service role full access on legal_service_packages"
    ON public.legal_service_packages
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
