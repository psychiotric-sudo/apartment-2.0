import React, { useState } from 'react';
import { X, Smartphone, CheckCircle2, Loader2, Clock, Copy, Check } from 'lucide-react';
import { useNotify } from '../../context/NotificationContext';

const GCashPaymentModal = ({ isOpen, onClose }) => {
  const { showToast } = useNotify();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [copied, setCopied] = useState(false);

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
    // Simulate a brief "sending" state
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
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '10px' }}>
              <Smartphone size={20} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>GCash Pay</h3>
          </div>
          {!isProcessing && !isDone && (
            <button onClick={handleClose} className="icon-btn" style={{ border: 'none', background: 'none' }}><X size={20} /></button>
          )}
        </div>

        {isDone ? (
          <div className="fade-in" style={{ padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              border: '2px solid rgba(34, 197, 94, 0.2)'
            }}>
              <Clock size={40} className="animate-pulse" color="#22c55e" />
            </div>
            <h4 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '12px', color: 'white' }}>Payment Reported!</h4>
            <p style={{ color: 'var(--text2)', lineHeight: '1.6', fontSize: '15px', marginBottom: '32px' }}>
              We've notified the admin. Please wait for them to verify your transaction and update your balance.
            </p>
            <button 
              onClick={handleClose} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '700' }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '24px', 
              marginBottom: '24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              display: 'inline-block',
              width: '100%',
              aspectRatio: '1/1',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: '#f3f4f6', 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
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
                <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Smartphone size={48} color="var(--accent)" style={{ opacity: 0.2 }} />
                    <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '600' }}>QR Code Placeholder</p>
                    <p style={{ color: '#9ca3af', fontSize: '12px' }}>Upload gcash-qr.jpg to public folder</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 125, 254, 0.05)', border: '1px dashed #007dfe', borderRadius: '16px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: '#007dfe', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>GCash Number</p>
                <p style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>
                  {gcashNumber.slice(0, 4)}•••••{gcashNumber.slice(-2)}
                </p>
              </div>
              <button 
                onClick={handleCopy}
                style={{ 
                  background: copied ? 'var(--success)' : '#007dfe', 
                  border: 'none', 
                  borderRadius: '10px', 
                  padding: '8px 12px', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ textAlign: 'left', background: 'var(--glass)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--accent)' }}>Instructions:</p>
              <ol style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>Open your GCash app</li>
                <li>Scan this QR code to pay</li>
                <li>Send a screenshot of the receipt to the admin</li>
              </ol>
            </div>

            <button 
              onClick={handleDone} 
              disabled={isProcessing}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isProcessing ? 'Processing...' : "I've Done the Payment"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GCashPaymentModal;

