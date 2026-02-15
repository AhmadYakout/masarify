import { SmsDetectionSource } from '../../types';

export interface PaymentMessageIngestionEvent {
  rawMessage: string;
  source: SmsDetectionSource;
  receivedAt: string;
}

type IngestionHandler = (event: PaymentMessageIngestionEvent) => void;

const INGESTION_EVENT_NAME = 'masarify:payment-message';

export const startPaymentMessageIngestion = (handler: IngestionHandler): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<PaymentMessageIngestionEvent>;
    if (!customEvent.detail?.rawMessage || !customEvent.detail?.source) {
      return;
    }
    handler(customEvent.detail);
  };

  window.addEventListener(INGESTION_EVENT_NAME, listener);
  return () => window.removeEventListener(INGESTION_EVENT_NAME, listener);
};

export const emitPaymentMessageForTesting = (
  rawMessage: string,
  source: SmsDetectionSource = 'notification_listener'
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<PaymentMessageIngestionEvent>(INGESTION_EVENT_NAME, {
      detail: {
        rawMessage,
        source,
        receivedAt: new Date().toISOString(),
      },
    })
  );
};
