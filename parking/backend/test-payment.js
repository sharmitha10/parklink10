const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/payments';
const TEST_BOOKING_ID = 'test_booking_' + Math.random().toString(36).substr(2, 9);

// Helper function to make API calls
async function testPaymentFlow() {
  try {
    console.log('🚀 Starting mock payment test...');
    
    // 1. Get payment key
    console.log('\n1. Getting payment key...');
    const keyResponse = await axios.get(`${BASE_URL}/key`);
    console.log('✅ Payment key:', keyResponse.data.key);
    
    // 2. Create payment order
    console.log('\n2. Creating payment order...');
    const orderResponse = await axios.post(
      `${BASE_URL}/create-order`,
      { bookingId: TEST_BOOKING_ID },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const orderData = orderResponse.data;
    console.log('✅ Order created:', {
      orderId: orderData.order.id,
      amount: orderData.order.amount,
      currency: orderData.order.currency
    });
    
    // 3. Simulate payment verification
    console.log('\n3. Verifying payment...');
    const paymentData = {
      orderId: orderData.order.id,
      paymentId: `mock_pay_${Math.random().toString(36).substr(2, 9)}`,
      signature: 'mock_signature_' + Math.random().toString(36).substr(2, 16),
      bookingId: TEST_BOOKING_ID
    };
    
    const verifyResponse = await axios.post(
      `${BASE_URL}/verify`,
      paymentData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Payment verification result:', {
      success: verifyResponse.data.success,
      message: verifyResponse.data.message,
      paymentId: verifyResponse.data.payment?.paymentId,
      bookingStatus: verifyResponse.data.booking?.status
    });
    
    console.log('\n🎉 Payment test completed successfully!');
    
  } catch (error) {
    console.error('❌ Payment test failed:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testPaymentFlow();
