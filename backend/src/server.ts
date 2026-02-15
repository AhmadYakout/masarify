import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ensureSeedUser } from './authService.js';
import { config } from './config.js';
import { migrate } from './db.js';
import { router } from './routes.js';
import { setBackendDegraded, setBackendReady } from './runtimeState.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', router);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const mapStartupError = (error: unknown): string => {
  const profileEnvPath = `backend/${config.primaryEnvironmentFile}`;

  if (error instanceof Error && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
    const code = (error as { code: string }).code;
    if (code === '28P01') {
      return `Database authentication failed (Postgres 28P01). Check DATABASE_URL credentials in ${profileEnvPath}.`;
    }
    if (code === '3D000') {
      return 'Database does not exist (Postgres 3D000). Create the database referenced by DATABASE_URL.';
    }
    if (code === 'ECONNREFUSED') {
      return 'Could not connect to Postgres server (ECONNREFUSED). Verify host/port and that Postgres is running.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown startup error';
};

const bootstrapDatabase = async (): Promise<void> => {
  try {
    await migrate();
    if (config.seedUser.enabled && config.seedUser.mobile && config.seedUser.password) {
      const seedStatus = await ensureSeedUser(
        config.seedUser.mobile,
        config.seedUser.password,
        config.seedUser.overwrite
      );
      console.log(
        `Mock seed user ${seedStatus}: ${config.seedUser.mobile} (overwrite=${String(
          config.seedUser.overwrite
        )})`
      );
    }
    setBackendReady();
    if (config.authStore.usesDatabase) {
      console.log('Database bootstrap completed.');
    } else {
      console.log('Auth store initialized in memory mode.');
    }
  } catch (error) {
    const message = mapStartupError(error);
    setBackendDegraded(message);
    console.error(`Database bootstrap failed: ${message}`);
  }
};

const start = async () => {
  const server = app.listen(config.port, () => {
    console.log(
      `Masarify auth backend listening on http://localhost:${config.port} (${config.environment}, auth-store=${config.authStore.mode})`
    );
  });

  server.on('error', (error) => {
    const message =
      error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'EADDRINUSE'
        ? `Port ${config.port} is already in use. Change PORT in backend/${config.primaryEnvironmentFile} or stop the other process.`
        : mapStartupError(error);

    console.error(`Failed to bind HTTP server: ${message}`);
    process.exit(1);
  });

  await bootstrapDatabase();
};

void start().catch((error) => {
  const message = mapStartupError(error);
  setBackendDegraded(message);
  console.error(`Failed to start backend: ${message}`);
  process.exit(1);
});
