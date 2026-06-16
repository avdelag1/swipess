import i18n from '@/i18n';
import { appToast } from '@/utils/appNotification';
import { NO_TOKENS_ERROR } from '@/utils/messagingEntitlements';
import { useModalStore } from '@/state/modalStore';

export function openTokensModal(): void {
  useModalStore.getState().setModal('showTokensModal', true);
}

/** Pre-flight gate before opening a new-conversation flow. Returns false when blocked. */
export function guardNewConversation(canStart: boolean): boolean {
  if (canStart) return true;
  appToast.error(i18n.t('tokens.outOfTokens'), i18n.t('tokens.noTokensError'));
  openTokensModal();
  return false;
}

export function isNoTokensError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return message === NO_TOKENS_ERROR || message.includes('message tokens');
}

export function handleStartConversationError(err: unknown, fallbackTitle = 'Could not start conversation'): void {
  if (isNoTokensError(err)) {
    appToast.error(i18n.t('tokens.outOfTokens'), i18n.t('tokens.noTokensError'));
    openTokensModal();
    return;
  }
  const message = err instanceof Error ? err.message : 'Please try again';
  appToast.error(fallbackTitle, message);
}