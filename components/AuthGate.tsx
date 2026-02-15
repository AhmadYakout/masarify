import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AuthApiError,
  AuthSession,
  checkAuthHealth,
  login,
  register,
  requestOtp,
  resetPassword,
  verifyOtp,
} from '../modules/auth';
import { appEnv } from '../modules/config/env';

type AuthMode = 'login' | 'register' | 'reset';
type OtpStep = 'request' | 'verify' | 'password';
type BackendHealthState = 'checking' | 'ready' | 'unreachable';

let didRunInitialHealthCheck = false;

interface AuthGateProps {
  onAuthenticated: (session: AuthSession) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [backendHealthState, setBackendHealthState] = useState<BackendHealthState>('checking');
  const [backendHealthMessage, setBackendHealthMessage] = useState('Checking auth backend...');
  const isHealthCheckInFlightRef = useRef(false);

  const title = useMemo(() => {
    if (mode === 'login') {
      return 'Welcome Back';
    }
    if (mode === 'register') {
      return 'Create Account';
    }
    return 'Reset Password';
  }, [mode]);

  const clearFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const resetOtpFlow = () => {
    setOtpStep('request');
    setOtp('');
    setRequestId('');
    setVerificationToken('');
    setPassword('');
    setConfirmPassword('');
    setDebugOtp('');
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearFeedback();
    resetOtpFlow();
  };

  const refreshBackendHealth = async () => {
    if (isHealthCheckInFlightRef.current) {
      return;
    }

    isHealthCheckInFlightRef.current = true;
    setBackendHealthState('checking');
    setBackendHealthMessage('Checking auth backend...');

    try {
      await checkAuthHealth();
      setBackendHealthState('ready');
      setBackendHealthMessage('Auth backend is reachable.');
    } catch (error) {
      const fallbackMessage = 'Auth backend is unavailable. Start backend with "npm run dev:backend".';
      const message = error instanceof AuthApiError ? error.message : fallbackMessage;

      setBackendHealthState('unreachable');
      setBackendHealthMessage(message);
    } finally {
      isHealthCheckInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV && didRunInitialHealthCheck) {
      return;
    }
    didRunInitialHealthCheck = true;
    void refreshBackendHealth();
  }, []);

  useEffect(() => {
    if (appEnv.mode !== 'mock') {
      return;
    }
    if (!mobile && appEnv.testLoginMobile) {
      setMobile(appEnv.testLoginMobile);
    }
    if (!password && appEnv.testLoginPassword) {
      setPassword(appEnv.testLoginPassword);
    }
  }, [mobile, password]);

  const ensureBackendAvailable = (): boolean => {
    if (backendHealthState === 'unreachable') {
      setErrorMessage(backendHealthMessage);
      return false;
    }
    return true;
  };

  const formatAuthError = (error: unknown, fallback: string): string => {
    if (error instanceof AuthApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!ensureBackendAvailable()) {
      return;
    }
    setIsLoading(true);
    try {
      const session = await login(mobile, password);
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(formatAuthError(error, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentPurpose = mode === 'register' ? 'register' : 'reset';

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!ensureBackendAvailable()) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await requestOtp(mobile, currentPurpose);
      setRequestId(result.requestId);
      setDebugOtp(result.debugOtp || '');
      setOtpStep('verify');
      setSuccessMessage('OTP sent successfully.');
    } catch (error) {
      setErrorMessage(formatAuthError(error, 'Could not request OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!ensureBackendAvailable()) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyOtp(mobile, currentPurpose, requestId, otp);
      setVerificationToken(result.verificationToken);
      setOtpStep('password');
      setSuccessMessage('OTP verified successfully.');
    } catch (error) {
      setErrorMessage(formatAuthError(error, 'OTP verification failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOrReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!ensureBackendAvailable()) {
      return;
    }
    setIsLoading(true);
    try {
      const session =
        mode === 'register'
          ? await register(mobile, verificationToken, password, confirmPassword)
          : await resetPassword(mobile, verificationToken, password, confirmPassword);
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(formatAuthError(error, 'Request failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">Secure mobile authentication</p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => changeMode('login')}
              className={`py-2 rounded-md text-sm font-medium ${
                mode === 'login' ? 'bg-white text-cib-blue shadow-sm' : 'text-gray-500'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => changeMode('register')}
              className={`py-2 rounded-md text-sm font-medium ${
                mode === 'register' ? 'bg-white text-cib-blue shadow-sm' : 'text-gray-500'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => changeMode('reset')}
              className={`py-2 rounded-md text-sm font-medium ${
                mode === 'reset' ? 'bg-white text-cib-blue shadow-sm' : 'text-gray-500'
              }`}
            >
              Forgot
            </button>
          </div>

          {errorMessage && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}

          <div
            className={`text-xs rounded-lg px-3 py-2 border ${
              backendHealthState === 'ready'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : backendHealthState === 'checking'
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-amber-800 bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p>{backendHealthMessage}</p>
              <button
                type="button"
                onClick={() => void refreshBackendHealth()}
                disabled={backendHealthState === 'checking'}
                className="text-xs font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          </div>

          {appEnv.mode === 'mock' && appEnv.testLoginMobile && appEnv.testLoginPassword && (
            <div className="text-xs rounded-lg px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-800">
              <p className="font-semibold">Mock Login Profile</p>
              <p>Mobile: {appEnv.testLoginMobile}</p>
              <p>Password: {appEnv.testLoginPassword}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || backendHealthState === 'checking'}
                className="w-full py-3 rounded-lg bg-cib-blue text-white font-semibold disabled:opacity-60"
              >
                {isLoading ? 'Please wait...' : 'Login'}
              </button>
            </form>
          ) : (
            <>
              {otpStep === 'request' && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                      placeholder="01xxxxxxxxx"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || backendHealthState === 'checking'}
                    className="w-full py-3 rounded-lg bg-cib-blue text-white font-semibold disabled:opacity-60"
                  >
                    {isLoading ? 'Requesting OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {otpStep === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      required
                    />
                    {debugOtp && (
                      <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Dev OTP: {debugOtp}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || backendHealthState === 'checking'}
                    className="w-full py-3 rounded-lg bg-cib-blue text-white font-semibold disabled:opacity-60"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              )}

              {otpStep === 'password' && (
                <form onSubmit={handleRegisterOrReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || backendHealthState === 'checking'}
                    className="w-full py-3 rounded-lg bg-cib-blue text-white font-semibold disabled:opacity-60"
                  >
                    {isLoading
                      ? 'Please wait...'
                      : mode === 'register'
                      ? 'Create Account'
                      : 'Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
