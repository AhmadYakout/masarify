import { SmsDetectionSource } from '../../types';
import { emitPaymentMessageForTesting } from './ingestion';

declare global {
  interface Window {
    masarifyNativePaymentMessage?: (rawMessage: string, source: SmsDetectionSource) => void;
  }
}

export const attachNativePaymentBridge = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.masarifyNativePaymentMessage = (rawMessage: string, source: SmsDetectionSource) => {
    emitPaymentMessageForTesting(rawMessage, source);
  };

  return () => {
    delete window.masarifyNativePaymentMessage;
  };
};
