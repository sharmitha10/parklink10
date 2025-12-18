import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalPayment = ({ amount, onPaymentSuccess, onPaymentError, onPaymentCancel }) => {
  // Replace YOUR_CLIENT_ID with your actual PayPal Sandbox Client ID
  const clientId = "Ad9YdzdKfXCIUQmHyQSQUVobta3fRv6iM6xpK2QBze4qdvaDFyKVmOS6hqGHc71QH7o51zxM_oSp2hnH";

  const createOrder = (data, actions) => {
    console.log('Creating PayPal order with amount:', amount);
    console.log('PayPal data:', data);
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: amount.toString(),
          currency_code: "USD"
        }
      }]
    }).then(order => {
      console.log('PayPal order created successfully:', order);
      return order;
    }).catch(err => {
      console.error('PayPal order creation failed:', err);
      throw err;
    });
  };

  const onApprove = (data, actions) => {
    console.log('PayPal payment approved:', data);
    
    return actions.order.capture().then(function (details) {
      console.log('Payment captured successfully:', details);
      
      // Call the success callback with payment details
      if (onPaymentSuccess) {
        onPaymentSuccess({
          paymentId: details.id,
          status: details.status,
          payer: details.payer,
          purchase_units: details.purchase_units,
          amount: details.purchase_units[0].amount.value
        });
      }
    }).catch(err => {
      console.error('PayPal payment capture failed:', err);
      if (onPaymentError) {
        onPaymentError(err);
      }
    });
  };

  const onError = (err) => {
    console.error('PayPal payment error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    if (onPaymentError) {
      onPaymentError(err);
    }
  };

  const onCancel = (data) => {
    console.log('Payment cancelled:', data);
    if (onPaymentCancel) {
      onPaymentCancel(data);
    }
  };

  return (
    <PayPalScriptProvider 
      options={{ 
        "client-id": clientId,
        currency: "USD",
        intent: "capture"
      }}
    >
      <div className="paypal-payment-container">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
          fundingSource={undefined}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;
