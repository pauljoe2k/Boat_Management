import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('+91 98450 11223');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, requestOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = phone.trim();
    if (!cleaned || cleaned.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await requestOtp(cleaned);
      showToast(res.message || 'OTP code sent');
      navigate('/auth/otp', { state: { devCode: res.devCode } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
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
          ⚓
        </div>

        <div>
          <h1>Never miss a boat renewal</h1>
          <p className="mu" style={{ marginTop: '8px' }}>
            Add documents once. Get a reminder 60 days before each one expires.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '6px' }}>
          <label style={{ textAlign: 'left' }}>
            Mobile number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98450 11223"
              required
              aria-label="Mobile phone number"
            />
            {error && <span className="field-error">{error}</span>}
          </label>

          <Button
            type="submit"
            isLoading={isSubmitting}
            style={{ padding: '14px', width: '100%', fontSize: '15px' }}
          >
            Get started
          </Button>
        </form>

        <small className="mu" style={{ marginTop: '4px' }}>
          Install: tap Share, then Add to Home Screen, and allow notifications.
        </small>
      </Card>
    </div>
  );
};
