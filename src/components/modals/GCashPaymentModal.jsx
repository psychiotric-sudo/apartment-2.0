import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle2, Loader2, Clock, Copy, Check, Scan, Info } from 'lucide-react';
import { useNotify } from '../../context/NotificationContext';

const GCashPaymentModal = ({ isOpen, onClose }) => {
  const { showToast } = useNotify();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const gcashNumber = "09687522945";

  const handleCopy = () => {
    navigator.clipboard.writeText(gcashNumber);
    setCopied(true);
    showToast("Number copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 1500);
  };

  const handleClose = () => {
    setIsProcessing(false);
    setIsDone(false);
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal" style={{ maxWidth: '440px', textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
        <div className="modal-header" style={{ border: 'none', padding: '24px 32px 0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '14px', boxShadow: '0 0 20px var(--accent-glow)' }}>
                <Smartphone size={22} color="white" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '950', color: 'white', letterSpacing: '-0.8px' }}>GCash Payment</h3>
                <p style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Core Payment Gateway</p>
              </div>
            </div>
            {!isProcessing && !isDone && (
              <button onClick={handleClose} className="icon-btn" style={{ borderRadius: '50%', width: '40px', height: '40px' }}><X size={20} /></button>
            )}
          </div>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
        {isDone ? (
          <div className="fade-in" style={{ padding: '20px 0' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              borderRadius: '35px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: '2px solid rgba(34, 197, 94, 0.2)',
              transform: 'rotate(-5deg)'
            }}>
              <CheckCircle2 size={50} color="#22c55e" />
            </div>
            <h4 style={{ fontSize: '26px', fontWeight: '950', marginBottom: '12px', color: 'white', letterSpacing: '-1px' }}>PAYMENT REPORTED!</h4>
            <p style={{ color: 'var(--text2)', lineHeight: '1.7', fontSize: '14px', marginBottom: '32px', fontWeight: '500' }}>
              We've notified the system administrator. Please wait for verification. Your balance will update automatically once confirmed.
            </p>
            <button 
              onClick={handleClose} 
              className="btn btn-primary" 
              style={{ width: '100%', height: '60px', borderRadius: '18px', fontSize: '16px' }}
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        ) : (
          <>
            {/* QR CODE CONTAINER - MORE PREMIUM */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              padding: '16px', 
              borderRadius: '28px', 
              marginBottom: '24px',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'white',
                padding: '12px',
                borderRadius: '20px',
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <img 
                  src="/gcash-qr.jpg" 
                  alt="GCash QR Code" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#6b7280' }}>
                    <Scan size={64} style={{ opacity: 0.1 }} />
                    <p style={{ fontSize: '14px', fontWeight: '800' }}>QR Code Unavailable</p>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text2)', fontSize: '11px', fontWeight: '800' }}>
                <Scan size={14} color="var(--accent)" /> SCAN TO PAY DIRECTLY
              </div>
            </div>

            {/* GCASH NUMBER DISPLAY */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(0, 125, 254, 0.1) 0%, rgba(0, 0, 0, 0) 100%)', 
              border: '1px solid rgba(0, 125, 254, 0.2)', 
              borderRadius: '20px', 
              padding: '16px 20px', 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>GCash Number</p>
                <p style={{ fontSize: '22px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '1px' }}>
                  {gcashNumber.slice(0, 4)} ••• ••{gcashNumber.slice(-2)}
                </p>
              </div>
              <button 
                onClick={handleCopy}
                className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                style={{ 
                  height: '48px', 
                  padding: '0 16px', 
                  borderRadius: '12px',
                  boxShadow: copied ? '0 0 15px var(--success-glow)' : '0 0 15px var(--accent-glow)'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span style={{ fontSize: '12px' }}>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Info size={16} color="var(--accent)" />
                <p style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>How to complete:</p>
              </div>
              <ol style={{ paddingLeft: '0', listStyle: 'none', fontSize: '13px', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '10px', margin: 0 }}>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: '900' }}>01.</span>
                  <span>Scan QR or Copy the number above in your app.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: '900' }}>02.</span>
                  <span>Send the payment and capture the receipt.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: '900' }}>03.</span>
                  <span>Click the button below to notify the admin.</span>
                </li>
              </ol>
            </div>

            <button 
              onClick={handleDone} 
              disabled={isProcessing}
              className="btn btn-primary" 
              style={{ width: '100%', height: '64px', borderRadius: '20px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
            >
              {isProcessing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <CheckCircle2 size={24} />
              )}
              <span>{isProcessing ? 'SYNCHRONIZING...' : "I'VE DONE THE PAYMENT"}</span>
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default GCashPaymentModal;