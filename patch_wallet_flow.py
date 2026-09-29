import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Add states
state_insert = """  const [amount, setAmount] = useState('');"""
new_states = """  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);"""
content = content.replace(state_insert, new_states)

# Replace handleSubmit
old_submit = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val < 100) {
      showError('Minimum deposit amount is ₹100');
      return;
    }
    
    try {
      const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      await requestDeposit(val, orderId);

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          order_id: orderId,
          redirect_url: window.location.origin + '/wallet?order_id=' + orderId
        })
      });
      
      const data = await res.json();
      if (data.status === true || data.payment_url || data.url) {
        window.location.href = data.payment_url || data.url;
      } else {
        showError(data.message || 'Payment gateway configuration error');
      }
    } catch (err) {
      showError('Failed to initiate payment. Please try again.');
    }
  };"""

new_submit = """  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val < 100) {
      showError('Minimum deposit amount is ₹100');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      showError('Please enter a valid phone number');
      return;
    }
    setActualPaymentAmount(val);
    setAddStep('pay');
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 12) {
      showError('Please enter a valid 12-digit UTR / Reference number');
      return;
    }
    setIsSubmittingUtr(true);
    
    try {
      // Custom heavy animation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const val = actualPaymentAmount || Number(amount);
      await requestDeposit(val, utrNumber, val);
      
      setIsSubmittingUtr(false);
      setAddStep('success'); // Show success animation
    } catch (err) {
      showError('Failed to submit UTR. Please try again.');
      setIsSubmittingUtr(false);
    }
  };"""
content = content.replace(old_submit, new_submit)

# Replace the Form rendering
old_form = """        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key="add"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >"""

new_form = """        ) : (
          <form onSubmit={addStep === 'amount' ? handleAmountSubmit : handleUtrSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={addStep}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="space-y-6"
              >"""
content = content.replace(old_form, new_form)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Replaced states and form wrapper")
