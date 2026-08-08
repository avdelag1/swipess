import { supabase } from '@/integrations/supabase/client';

export type LegalVideoCallStatus =
  | 'ringing'
  | 'accepted'
  | 'declined'
  | 'ended'
  | 'missed'
  | 'cancelled';

export type LegalVideoCall = {
  id: string;
  client_user_id: string;
  client_name: string | null;
  client_email: string | null;
  lawyer_id: string | null;
  lawyer_user_id: string | null;
  status: LegalVideoCallStatus;
  room_id: string;
  topic: string;
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
};

export function legalVideoRoomUrl(roomId: string, displayName: string): string {
  const safeRoom = roomId.replace(/[^a-zA-Z0-9_-]/g, '');
  const name = encodeURIComponent(displayName.slice(0, 40) || 'Guest');
  return `https://meet.jit.si/${safeRoom}#userInfo.displayName="${name}"&config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
}

export async function countAvailableLawyers(): Promise<number> {
  const { data, error } = await supabase.rpc('count_available_lawyers');
  if (error) throw error;
  return Number(data ?? 0);
}

export async function startLegalVideoCall(input: {
  clientUserId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  topic?: string;
}): Promise<LegalVideoCall> {
  const available = await countAvailableLawyers();
  if (available < 1) {
    throw new Error('NO_LAWYERS_AVAILABLE');
  }

  const id = crypto.randomUUID();
  const room_id = `SwipessLegal-${id.replace(/-/g, '').slice(0, 16)}`;

  const { data, error } = await supabase
    .from('legal_video_calls' as any)
    .insert({
      id,
      client_user_id: input.clientUserId,
      client_name: input.clientName || null,
      client_email: input.clientEmail || null,
      status: 'ringing',
      room_id,
      topic: input.topic || 'Legal consultation',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as LegalVideoCall;
}

export async function updateLegalVideoCallStatus(
  callId: string,
  status: LegalVideoCallStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'ended' || status === 'missed' || status === 'cancelled' || status === 'declined') {
    patch.ended_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from('legal_video_calls' as any)
    .update(patch)
    .eq('id', callId);
  if (error) throw error;
}
