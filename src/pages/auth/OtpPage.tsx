import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const OtpPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  const { pendingPhone, verifyOtp, requestOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const devCode = (location.state as { devCode?: string } | null)?.devCode || '123456';

  useEffect(() => {
    if (!pendingPhone) {
      navigate('/login', { replace: true });
    }
  }, [pendingPhone, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code || code.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    try {
      setIsVerifying(true);
      await verifyOtp(code);
      showToast('Welcome aboard');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid verification code';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !pendingPhone) return;
    try {
      const res = await requestOtp(pendingPhone);
      setResendCooldown(30);
      showToast(res.message || 'New OTP sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code';
      setError(msg);
    }
  };

  const handleUseDevCode = () => {
    setCode(devCode);
  };

  return (
    <div
      className="welcome"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, var(--pri), var(--l) 55%, var(--r))',
      }}
    >
      <Card
        className="wc"
        style={{
          maxWidth: '430px',
          width: '100%',
          padding: '32px',
          display: 'grid',
          gap: '16px',
          textAlign: 'center',
          boxShadow: '0 16px 36px rgba(40, 60, 110, 0.12)',
        }}
      >
        <div
          className="ic"
          style={{
            background: 'var(--pri)',
            color: 'var(--pt)',
            margin: '0 auto',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '32px',
          }}
        >
          🔐
        </div>

        <div>
          <h1>Enter verification code</h1>
          <p className="mu" style={{ marginTop: '8px' }}>
            We sent a verification code to <b>{pendingPhone}</b>
          </p>
        </div>

        {devCode && (
          <div
            style={{
              background: 'var(--s)',
              color: 'var(--st)',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={handleUseDevCode}
            title="Click to auto-fill development code"
          >
            Development code: <b>{devCode}</b> (click to fill)
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ textAlign: 'left' }}>
            Verification code
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              autoFocus
              style={{
                textAlign: 'center',
                letterSpacing: '0.25em',
                fontSize: '20px',
                fontWeight: 700,
              }}
              aria-label="6-digit verification code"
            />
            {error && <span className="field-error">{error}</span>}
          </label>

          <Button
            type="submit"
            isLoading={isVerifying}
            style={{ padding: '14px', width: '100%', fontSize: '15px' }}
          >
            Verify & Sign in
          </Button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="mu"
            onClick={() => navigate('/login')}
            style={{ textDecoration: 'underline', fontSize: '12px' }}
          >
            Change number
          </button>

          <button
            type="button"
            className="mu"
            disabled={resendCooldown > 0}
            onClick={handleResend}
            style={{
              textDecoration: resendCooldown === 0 ? 'underline' : 'none',
              cursor: resendCooldown === 0 ? 'pointer' : 'default',
              fontSize: '12px',
            }}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </Card>
    </div>
  );
};
