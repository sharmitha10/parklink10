import React, { useState } from 'react';
import { X, CreditCard, Check, Lock, AlertCircle, Loader2 } from 'lucide-react';
import './PaymentModal.css';

const PaymentModal = ({ amount, onSuccess, onClose, bookingDetails }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails({...cardDetails, number: value});
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardDetails({...cardDetails, expiry: value});
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardDetails({...cardDetails, cvv: value});
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (paymentMethod === 'card') {
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number');
        return;
      }
      if (!cardDetails.name) {
        setError('Please enter cardholder name');
        return;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
        setError('Please enter a valid expiry date');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    }

    setIsProcessing(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random success/failure (90% success rate for demo)
      const isSuccess = Math.random() < 0.9;
      
      if (isSuccess) {
        setPaymentSuccess(true);
        // Wait a moment before calling onSuccess
        setTimeout(() => {
          onSuccess({
            paymentId: 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            amount: amount,
            method: paymentMethod,
            timestamp: new Date().toISOString()
          });
        }, 1000);
      } else {
        throw new Error('Payment processing failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal success">
          <div className="payment-success">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your booking has been confirmed.</p>
            <div className="payment-details">
              <p>Amount: <strong>${amount.toFixed(2)}</strong></p>
              <p>Payment Method: <strong>{paymentMethod === 'card' ? 'Credit/Debit Card' : 'E-Wallet'}</strong></p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2>Complete Payment</h2>
        <p className="amount-due">Amount Due: <span>${amount.toFixed(2)}</span></p>
        
        <div className="payment-tabs">
          <button 
            className={`tab ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <CreditCard size={18} /> Credit/Debit Card
          </button>
          <button 
            className={`tab ${paymentMethod === 'wallet' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('wallet')}
          >
            <img src="/wallet-icon.png" alt="Wallet" width={18} style={{marginRight: '8px'}} />
            E-Wallet
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {paymentMethod === 'card' ? (
          <form onSubmit={handlePayment} className="payment-form">
            <div className="form-group">
              <label>Card Number</label>
              <input 
                type="text" 
                placeholder="1234 5678 9012 3456" 
                value={cardDetails.number}
                onChange={handleCardNumberChange}
                maxLength="19"
                disabled={isProcessing}
              />
              <div className="card-icons">
                <img src="/visa.png" alt="Visa" width="40" />
                <img src="/mastercard.png" alt="Mastercard" width="40" />
                <img src="/amex.png" alt="American Express" width="40" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Cardholder Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                disabled={isProcessing}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={handleExpiryChange}
                  maxLength="5"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="form-group">
                <label>CVV</label>
                <input 
                  type="password" 
                  placeholder="•••"
                  value={cardDetails.cvv}
                  onChange={handleCVVChange}
                  maxLength="4"
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <div className="secure-checkout">
              <Lock size={14} />
              <span>Secure SSL encrypted payment</span>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary pay-now-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </form>
        ) : (
          <div className="wallet-payment">
            <div className="wallet-option">
              <input 
                type="radio" 
                id="paypal" 
                name="wallet" 
                defaultChecked 
                disabled={isProcessing}
              />
              <label htmlFor="paypal">
                <img src="/paypal.png" alt="PayPal" width="80" />
                <span>Pay with PayPal</span>
              </label>
            </div>
            
            <div className="wallet-option">
              <input 
                type="radio" 
                id="googlepay" 
                name="wallet" 
                disabled={isProcessing}
              />
              <label htmlFor="googlepay">
                <img src="/google-pay.png" alt="Google Pay" width="60" />
                <span>Google Pay</span>
              </label>
            </div>
            
            <div className="wallet-option">
              <input 
                type="radio" 
                id="applepay" 
                name="wallet" 
                disabled={isProcessing}
              />
              <label htmlFor="applepay">
                <img src="/apple-pay.png" alt="Apple Pay" width="60" />
                <span>Apple Pay</span>
              </label>
            </div>
            
            <button 
              className="btn btn-primary pay-now-btn"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </div>
        )}
        
        <div className="payment-footer">
          <div className="secure-badge">
            <Lock size={14} />
            <span>Your payment is secure and encrypted</span>
          </div>
          <div className="accepted-cards">
            <span>We accept:</span>
            <img src="/visa.png" alt="Visa" width="30" />
            <img src="/mastercard.png" alt="Mastercard" width="30" />
            <img src="/amex.png" alt="American Express" width="30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
