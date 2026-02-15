import postgres from 'postgres';
import { config } from './config.js';

const postgresClient =
  config.authStore.mode === 'postgres' && config.databaseUrl
    ? postgres(config.databaseUrl, {
        prepare: false,
        max: 5,
      })
    : null;

export const sql = postgresClient as unknown as ReturnType<typeof postgres>;

export const checkDbConnection = async (): Promise<void> => {
  if (!postgresClient) {
    return;
  }
  await postgresClient`select 1`;
};

export const migrate = async (): Promise<void> => {
  if (!postgresClient) {
    return;
  }

  await postgresClient`
    create table if not exists users (
      mobile text primary key,
      password_hash text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await postgresClient`
    create table if not exists otp_requests (
      request_id uuid primary key,
      mobile text not null,
      purpose text not null check (purpose in ('register', 'reset')),
      code text not null,
      expires_at timestamptz not null,
      verify_attempts integer not null default 0,
      created_at timestamptz not null default now()
    )
  `;

  await postgresClient`
    create table if not exists verification_tokens (
      token uuid primary key,
      mobile text not null,
      purpose text not null check (purpose in ('register', 'reset')),
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;

  await postgresClient`
    create table if not exists otp_rate_events (
      id bigserial primary key,
      mobile text not null,
      requested_at timestamptz not null default now()
    )
  `;

  await postgresClient`create index if not exists idx_otp_rate_events_mobile_time on otp_rate_events (mobile, requested_at)`;
  await postgresClient`create index if not exists idx_otp_requests_mobile on otp_requests (mobile)`;
  await postgresClient`create index if not exists idx_verification_tokens_mobile on verification_tokens (mobile)`;
};
