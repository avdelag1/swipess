/**
 * delete-user — Permanently deletes a user account and all associated data.
 *
 * Called by the frontend's useDeleteAccount hook when a user requests account deletion.
 * Requires a valid user JWT (verify_jwt = true in config.toml).
 *
 * Deletion order (respects FK constraints):
 *  1. conversation_messages (FK → conversations)
 *  2. messages (FK → conversations)
 *  3. conversations (FK → listings)
 *  4. contract_signatures (FK → digital_contracts)
 *  5. deal_status_tracking (FK → digital_contracts)
 *  6. dispute_reports (FK → digital_contracts)
 *  7. digital_contracts
 *  8. matches (FK → listings)
 *  9. likes
 * 10. swipes (FK → listings)
 * 11. reviews (FK → listings)
 * 12. listings (FK → profiles)
 * 13. tokens, user_subscriptions, push_subscriptions, notifications
 * 14. profile_views, content_shares, content_flags, user_reports, user_blocks
 * 15. support_tickets, saved_searches, message_activations
 * 16. legal_documents, legal_document_quota
 * 17. user_radio_playlists, user_security_settings
 * 18. client_filter_preferences, saved_filters, owner_client_preferences
 * 19. client_profiles, owner_profiles
 * 20. user_roles
 * 21. profiles
 * 22. Storage files (profile images, listing images, legal documents, contracts)
 * 23. Auth user (via admin API)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Step 1: Delete conversation messages ---
    const { data: userConversations } = await adminClient
      .from("conversations")
      .select("id")
      .or(`client_id.eq.${userId},owner_id.eq.${userId}`);

    if (userConversations && userConversations.length > 0) {
      const convIds = userConversations.map((c: any) => c.id);
      await adminClient
        .from("conversation_messages")
        .delete()
        .in("conversation_id", convIds);
    }

    // --- Step 2: Delete messages (legacy table) ---
    if (userConversations && userConversations.length > 0) {
      const convIds = userConversations.map((c: any) => c.id);
      await adminClient
        .from("messages")
        .delete()
        .in("conversation_id", convIds);
    }

    // --- Step 3: Delete conversations ---
    await adminClient
      .from("conversations")
      .delete()
      .or(`client_id.eq.${userId},owner_id.eq.${userId}`);

    // --- Step 4-6: Delete contract-related data ---
    const { data: userContracts } = await adminClient
      .from("digital_contracts")
      .select("id")
      .or(`owner_id.eq.${userId},client_id.eq.${userId}`);

    if (userContracts && userContracts.length > 0) {
      const contractIds = userContracts.map((c: any) => c.id);
      await Promise.all([
        adminClient.from("contract_signatures").delete().in("contract_id", contractIds),
        adminClient.from("deal_status_tracking").delete().in("contract_id", contractIds),
        adminClient.from("dispute_reports").delete().in("contract_id", contractIds),
      ]);
    }

    // --- Step 7: Delete digital contracts ---
    await adminClient
      .from("digital_contracts")
      .delete()
      .or(`owner_id.eq.${userId},client_id.eq.${userId}`);

    // --- Step 8: Delete matches ---
    await adminClient
      .from("matches")
      .delete()
      .or(`user_id.eq.${userId},owner_id.eq.${userId}`);

    // --- Step 9: Delete likes ---
    await adminClient.from("likes").delete().eq("user_id", userId);

    // --- Step 10: Delete swipes ---
    await adminClient.from("swipes").delete().eq("user_id", userId);

    // --- Step 11: Delete reviews ---
    await adminClient.from("reviews").delete().eq("reviewer_id", userId);

    // --- Step 12: Get listing IDs then delete listings ---
    const { data: userListings } = await adminClient
      .from("listings")
      .select("id")
      .eq("owner_id", userId);

    if (userListings && userListings.length > 0) {
      const listingIds = userListings.map((l: any) => l.id);

      // Delete listing images from storage
      const { data: imageFiles } = await adminClient.storage
        .from("listing-images")
        .list(userId);

      if (imageFiles && imageFiles.length > 0) {
        const filePaths = imageFiles.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from("listing-images").remove(filePaths);
      }

      // Also clean up reviews/likes/swipes that reference these listings
      await Promise.all([
        adminClient.from("reviews").delete().in("listing_id", listingIds),
        adminClient.from("likes").delete().in("target_id", listingIds),
        adminClient.from("swipes").delete().in("listing_id", listingIds),
      ]);

      await adminClient.from("listings").delete().in("id", listingIds);
    }

    // --- Step 13: Delete tokens, subscriptions, notifications, push subscriptions ---
    await Promise.all([
      adminClient.from("tokens").delete().eq("user_id", userId),
      adminClient.from("user_subscriptions").delete().eq("user_id", userId),
      adminClient.from("notifications").delete().eq("user_id", userId),
      adminClient.from("push_subscriptions").delete().eq("user_id", userId),
    ]);

    // --- Step 14: Delete profile views, content shares, flags, reports, blocks ---
    await Promise.all([
      adminClient.from("profile_views").delete().or(`user_id.eq.${userId},viewed_profile_id.eq.${userId}`),
      adminClient.from("content_shares").delete().eq("sharer_id", userId),
      adminClient.from("content_flags").delete().eq("user_id", userId),
      adminClient.from("user_reports").delete().eq("reporter_id", userId),
      adminClient.from("user_blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ]);

    // --- Step 15: Delete support tickets, saved searches, message activations ---
    await Promise.all([
      adminClient.from("support_tickets").delete().eq("user_id", userId),
      adminClient.from("saved_searches").delete().eq("user_id", userId),
      adminClient.from("message_activations").delete().eq("user_id", userId),
    ]);

    // --- Step 16: Delete legal documents and quota ---
    // Delete legal document files from storage first
    const { data: legalDocs } = await adminClient
      .from("legal_documents")
      .select("file_path")
      .eq("user_id", userId);

    if (legalDocs && legalDocs.length > 0) {
      const paths = legalDocs.map((d: any) => d.file_path).filter(Boolean);
      if (paths.length > 0) {
        await adminClient.storage.from("legal-documents").remove(paths);
      }
    }

    await Promise.all([
      adminClient.from("legal_documents").delete().eq("user_id", userId),
      adminClient.from("legal_document_quota").delete().eq("user_id", userId),
    ]);

    // --- Step 17: Delete radio playlists and security settings ---
    await Promise.all([
      adminClient.from("user_radio_playlists").delete().eq("user_id", userId),
      adminClient.from("user_security_settings").delete().eq("user_id", userId),
    ]);

    // --- Step 18: Delete preferences and filters ---
    await Promise.all([
      adminClient.from("client_filter_preferences").delete().eq("user_id", userId),
      adminClient.from("saved_filters").delete().eq("user_id", userId),
      adminClient.from("owner_client_preferences").delete().eq("user_id", userId),
    ]);

    // --- Step 19: Delete specialized profiles ---
    await Promise.all([
      adminClient.from("client_profiles").delete().eq("user_id", userId),
      adminClient.from("owner_profiles").delete().eq("user_id", userId),
    ]);

    // --- Step 20: Delete user role ---
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // --- Step 21: Delete profile and profile image ---
    const { data: profile } = await adminClient
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.avatar_url) {
      try {
        const url = new URL(profile.avatar_url);
        const pathParts = url.pathname.split("/avatars/");
        if (pathParts.length > 1) {
          await adminClient.storage.from("avatars").remove([pathParts[1]]);
        }
      } catch {
        // Non-critical: storage cleanup failure should not block account deletion
      }
    }

    // Delete profile images from storage
    try {
      const { data: profileImages } = await adminClient.storage
        .from("profile-images")
        .list(userId);
      if (profileImages && profileImages.length > 0) {
        const paths = profileImages.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from("profile-images").remove(paths);
      }
    } catch {
      // Non-critical
    }

    await adminClient.from("profiles").delete().eq("user_id", userId);

    // --- Step 22: Delete auth user (must be last) ---
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-user] Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to delete auth account", details: deleteAuthError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-user] Successfully deleted user ${userId}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[delete-user] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
