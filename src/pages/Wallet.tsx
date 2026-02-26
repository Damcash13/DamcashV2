import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Gift,
  Trophy,
  ShoppingBag,
  Coins,
  TrendingUp,
  Clock,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Crown,
  Star,
  Zap,
  Shield,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Bitcoin // Import Bitcoin icon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Replace with your actual publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'purchase' | 'reward' | 'tournament' | 'gift' | 'refund' | 'deposit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: {
    productName?: string;
    tournamentName?: string;
    senderName?: string;
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

const Wallet: React.FC = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'deposit' | 'withdraw'>('overview');
  const [balance, setBalance] = useState(2450);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  // Modals
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const coinPackages: CoinPackage[] = [
    { id: '1', coins: 500, bonus: 0, price: 4.99 },
    { id: '2', coins: 1200, bonus: 100, price: 9.99, popular: true },
    { id: '3', coins: 2500, bonus: 300, price: 19.99 },
    { id: '4', coins: 5500, bonus: 1000, price: 39.99 },
    { id: '5', coins: 12000, bonus: 3000, price: 79.99, bestValue: true },
    { id: '6', coins: 25000, bonus: 8000, price: 149.99 }
  ];

  useEffect(() => {
    // Mock data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'credit',
        category: 'tournament',
        amount: 500,
        description: 'Prix du tournoi Hebdo #45',
        date: '2024-01-07T15:30:00Z',
        status: 'completed',
        metadata: { tournamentName: 'Tournoi Hebdo #45' }
      },
      {
        id: '2',
        type: 'debit',
        category: 'purchase',
        amount: 150,
        description: 'Achat: Plateau en Marbre',
        date: '2024-01-07T10:00:00Z',
        status: 'completed',
        metadata: { productName: 'Plateau en Marbre' }
      },
      {
        id: '3',
        type: 'credit',
        category: 'deposit',
        amount: 1200,
        description: 'Achat de 1200 coins (+100 bonus)',
        date: '2024-01-06T18:45:00Z',
        status: 'completed'
      },
      {
        id: '4',
        type: 'credit',
        category: 'reward',
        amount: 50,
        description: 'Bonus quotidien',
        date: '2024-01-06T08:00:00Z',
        status: 'completed'
      },
      {
        id: '5',
        type: 'credit',
        category: 'gift',
        amount: 100,
        description: 'Cadeau de GrandMaster42',
        date: '2024-01-05T20:30:00Z',
        status: 'completed',
        metadata: { senderName: 'GrandMaster42' }
      },
      {
        id: '6',
        type: 'debit',
        category: 'purchase',
        amount: 300,
        description: 'Achat: Pack Émojis Premium',
        date: '2024-01-05T14:15:00Z',
        status: 'completed',
        metadata: { productName: 'Pack Émojis Premium' }
      },
      {
        id: '7',
        type: 'credit',
        category: 'tournament',
        amount: 250,
        description: '3ème place - Arena Blitz',
        date: '2024-01-04T22:00:00Z',
        status: 'completed',
        metadata: { tournamentName: 'Arena Blitz' }
      },
      {
        id: '8',
        type: 'credit',
        category: 'refund',
        amount: 200,
        description: 'Remboursement tournoi annulé',
        date: '2024-01-03T16:00:00Z',
        status: 'completed'
      }
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: '2',
        type: 'paypal',
        email: 'user@email.com',
        isDefault: false
      }
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setPaymentMethods(mockPaymentMethods);
      setIsLoading(false);
    }, 500);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'purchase': return <ShoppingBag className="w-5 h-5" />;
      case 'reward': return <Gift className="w-5 h-5" />;
      case 'tournament': return <Trophy className="w-5 h-5" />;
      case 'gift': return <Gift className="w-5 h-5" />;
      case 'refund': return <ArrowDownLeft className="w-5 h-5" />;
      case 'deposit': return <Plus className="w-5 h-5" />;
      default: return <Coins className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string, type: string) => {
    if (type === 'credit') return 'text-green-500 bg-green-500/20';
    return 'text-red-500 bg-red-500/20';
  };

  const handlePurchase = (pkg: CoinPackage) => {
    if (paymentMethods.length === 0) {
      showToast('Veuillez ajouter un moyen de paiement', 'error');
      setShowAddCard(true);
      return;
    }
    setSelectedPackage(pkg);
    setShowPurchaseConfirm(true);
  };

  // Checkout Form Component
  const CheckoutForm = ({ packageItem, onSuccess, onCancel }: { packageItem: CoinPackage, onSuccess: () => void, onCancel: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();

      if (!stripe || !elements || !user) {
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        // 1. Create Payment Intent
        const res = await fetch('http://localhost:8000/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            packageId: packageItem.id,
            amount: packageItem.price,
            coins: packageItem.coins + packageItem.bonus
          })
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const { clientSecret, id: paymentIntentId } = data;

        // 2. Confirm Card Payment
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardName || user.username,
              email: user.email
            },
          },
        });

        if (result.error) {
          setError(result.error.message || 'Payment failed');
          setProcessing(false);
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            // 3. Verify and Complete on Backend
            const verifyRes = await fetch('http://localhost:8000/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentIntentId })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              showToast('Paiement réussi ! Coins ajoutés.', 'success');
              onSuccess();
            } else {
              setError('Payment verification failed on server');
            }
          }
          setProcessing(false);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-xl bg-white/5 border-white/10">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#fff',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }} />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 rounded-xl font-medium bg-white/10 hover:bg-white/20 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${themeColors.buttonPrimary}`}
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              `Payer ${packageItem.price}€`
            )}
          </button>
        </div>
      </form>
    );
  };

  {/* Purchase Confirmation Modal */ }
  <AnimatePresence>
    {showPurchaseConfirm && selectedPackage && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-md w-full p-6 rounded-2xl border shadow-xl"
          style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>
              Confirmer l'achat
            </h3>
            <button onClick={() => setShowPurchaseConfirm(false)} className="p-1 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-white/5 flex items-center justify-between">
            <div>
              <div className="text-sm opacity-60">Pack</div>
              <div className="font-bold text-lg">{selectedPackage.coins} Coins</div>
              {selectedPackage.bonus > 0 && <div className="text-green-400 text-sm">+{selectedPackage.bonus} Bonus</div>}
            </div>
            <div className="text-right">
              <div className="text-sm opacity-60">Prix</div>
              <div className="font-bold text-2xl">{selectedPackage.price}€</div>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              packageItem={selectedPackage}
              onSuccess={() => {
                setShowPurchaseConfirm(false);
                setSelectedPackage(null);
                // Refresh balance or other logic
              }}
              onCancel={() => {
                setShowPurchaseConfirm(false);
                setSelectedPackage(null);
              }}
            />
          </Elements>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>



  const handleCryptoPayment = async () => {
    if (!selectedPackage || !user) return;
    setProcessingPayment(true);

    try {
      const res = await fetch('http://localhost:8000/api/crypto/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          coins: selectedPackage.coins + selectedPackage.bonus
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Redirect to Coinbase Commerce
      window.location.href = data.hosted_url;

    } catch (err: any) {
      showToast(err.message || "Erreur lors du paiement crypto", 'error');
      setProcessingPayment(false);
    }
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    const newCard: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      last4: cardNumber.slice(-4),
      brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
      expiryMonth: parseInt(cardExpiry.split('/')[0]),
      expiryYear: 2000 + parseInt(cardExpiry.split('/')[1]),
      isDefault: paymentMethods.length === 0
    };

    setPaymentMethods(prev => [...prev, newCard]);
    setShowAddCard(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardName('');
    showToast('Carte ajoutée avec succès', 'success');
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    showToast('Moyen de paiement supprimé', 'success');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
    showToast('Moyen de paiement par défaut mis à jour', 'success');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: WalletIcon },
    { id: 'transactions', label: 'Historique', icon: History },
    { id: 'deposit', label: 'Acheter', icon: Plus },
    { id: 'withdraw', label: 'Retirer', icon: ArrowUpRight }
  ];

  // Stats
  const thisMonthEarnings = transactions
    .filter(t => t.type === 'credit' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthSpending = transactions
    .filter(t => t.type === 'debit' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${themeColors.accent} transparent transparent transparent` }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b" style={{ backgroundColor: `${themeColors.background}ee`, borderColor: themeColors.border }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${themeColors.accent}20` }}>
              <WalletIcon className="w-6 h-6" style={{ color: themeColors.accent }} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold" style={{ color: themeColors.text }}>
                Portefeuille
              </h1>
              <p style={{ color: themeColors.textMuted }}>
                Gérez vos coins et paiements
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.id ? 'scale-105' : ''
                  }`}
                style={{
                  backgroundColor: activeTab === tab.id ? themeColors.accent : themeColors.card,
                  color: activeTab === tab.id ? '#fff' : themeColors.textMuted
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Balance Card */}
              <div
                className="p-6 rounded-2xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}aa)`
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                  <Coins className="w-full h-full" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80">Solde disponible</span>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {showBalance ? (
                        <EyeOff className="w-5 h-5 text-white" />
                      ) : (
                        <Eye className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-6">
                    <Coins className="w-8 h-8 text-yellow-300" />
                    <span className="text-4xl font-bold text-white">
                      {showBalance ? balance.toLocaleString() : '•••••'}
                    </span>
                    <span className="text-white/60">coins</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-gray-900 font-medium hover:bg-white/90 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Acheter des coins
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Gains ce mois</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-xl font-bold text-green-500">+{thisMonthEarnings}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Dépenses ce mois</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-xl font-bold text-red-500">-{thisMonthSpending}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="font-medium" style={{ color: themeColors.text }}>Moyens de paiement</span>
                  </div>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-1 text-sm"
                    style={{ color: themeColors.accent }}
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: themeColors.textMuted }} />
                      <p style={{ color: themeColors.textMuted }}>Aucun moyen de paiement</p>
                      <button
                        onClick={() => setShowAddCard(true)}
                        className="mt-3 px-4 py-2 rounded-xl"
                        style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                      >
                        Ajouter une carte
                      </button>
                    </div>
                  ) : (
                    paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: themeColors.hover }}
                      >
                        <div className="flex items-center gap-3">
                          {pm.type === 'card' ? (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              PP
                            </div>
                          )}
                          <div>
                            <div className="font-medium" style={{ color: themeColors.text }}>
                              {pm.type === 'card' ? `${pm.brand} •••• ${pm.last4}` : 'PayPal'}
                            </div>
                            <div className="text-sm" style={{ color: themeColors.textMuted }}>
                              {pm.type === 'card' ? `Expire ${pm.expiryMonth}/${pm.expiryYear}` : pm.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {pm.isDefault && (
                            <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}>
                              Par défaut
                            </span>
                          )}
                          {!pm.isDefault && (
                            <button
                              onClick={() => handleSetDefault(pm.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ backgroundColor: themeColors.card }}
                            >
                              <Check className="w-4 h-4" style={{ color: themeColors.textMuted }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="font-medium" style={{ color: themeColors.text }}>Transactions récentes</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="flex items-center gap-1 text-sm"
                    style={{ color: themeColors.accent }}
                  >
                    Voir tout
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y" style={{ borderColor: themeColors.border }}>
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${getCategoryColor(tx.category, tx.type)}`}>
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" style={{ color: themeColors.text }}>
                          {tx.description}
                        </div>
                        <div className="text-sm" style={{ color: themeColors.textMuted }}>
                          {formatDate(tx.date)}
                        </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: themeColors.textMuted }} />
                  <p style={{ color: themeColors.textMuted }}>Aucune transaction</p>
                </div>
              ) : (
                transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl flex items-center gap-4"
                    style={{ backgroundColor: themeColors.card }}
                  >
                    <div className={`p-3 rounded-xl ${getCategoryColor(tx.category, tx.type)}`}>
                      {getCategoryIcon(tx.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium" style={{ color: themeColors.text }}>
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: themeColors.textMuted }}>
                        <Clock className="w-4 h-4" />
                        {formatDate(tx.date)}
                        {tx.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs">
                            En attente
                          </span>
                        )}
                        {tx.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-xs">
                            Échoué
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm" style={{ color: themeColors.textMuted }}>coins</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Coin Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coinPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer ${pkg.popular ? 'border-yellow-500' : pkg.bestValue ? 'border-green-500' : ''
                      }`}
                    style={{
                      backgroundColor: themeColors.card,
                      borderColor: pkg.popular ? undefined : pkg.bestValue ? undefined : themeColors.border
                    }}
                    onClick={() => handlePurchase(pkg)}
                  >
                    {/* Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Populaire
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Meilleure offre
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Coins className="w-8 h-8 text-yellow-500" />
                        <div>
                          <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                            {pkg.coins.toLocaleString()}
                          </div>
                          {pkg.bonus > 0 && (
                            <div className="flex items-center gap-1 text-green-500 text-sm">
                              <Sparkles className="w-4 h-4" />
                              +{pkg.bonus} bonus
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: themeColors.accent }}>
                          {pkg.price}€
                        </div>
                        <div className="text-xs" style={{ color: themeColors.textMuted }}>
                          {((pkg.price / (pkg.coins + pkg.bonus)) * 100).toFixed(2)}c/coin
                        </div>
                      </div>
                    </div>

                    <button
                      className="w-full py-3 rounded-xl font-medium transition-colors"
                      style={{
                        backgroundColor: pkg.popular ? '#eab308' : pkg.bestValue ? '#22c55e' : themeColors.accent,
                        color: pkg.popular ? '#000' : '#fff'
                      }}
                    >
                      Acheter
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Benefits */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>
                  Utilisez vos coins pour
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: ShoppingBag, text: 'Acheter des items cosmétiques' },
                    { icon: Trophy, text: 'Participer aux tournois premium' },
                    { icon: Gift, text: 'Offrir des cadeaux à vos amis' },
                    { icon: Zap, text: 'Booster votre profil' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.accent}20` }}>
                        <item.icon className="w-5 h-5" style={{ color: themeColors.accent }} />
                      </div>
                      <span className="text-sm" style={{ color: themeColors.textMuted }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: `${themeColors.accent}10` }}>
                <Shield className="w-6 h-6" style={{ color: themeColors.accent }} />
                <div>
                  <div className="font-medium" style={{ color: themeColors.text }}>Paiement sécurisé</div>
                  <div className="text-sm" style={{ color: themeColors.textMuted }}>
                    Vos transactions sont protégées par le chiffrement SSL
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Withdraw Form */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>
                  Retirer des coins
                </h3>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: themeColors.textMuted }}>
                    Montant à retirer
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      max={balance}
                      className="w-full px-4 py-3 rounded-xl pr-16"
                      style={{
                        backgroundColor: themeColors.hover,
                        color: themeColors.text,
                        border: `1px solid ${themeColors.border}`
                      }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm" style={{ color: themeColors.textMuted }}>coins</span>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: themeColors.textMuted }}>
                    Maximum: {balance.toLocaleString()} coins
                  </p>
                </div>

                {/* Quick Amounts */}
                <div className="mb-6">
                  <p className="text-sm mb-2" style={{ color: themeColors.textMuted }}>Montants rapides</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, balance].map((amt, i) => (
                      <button
                        key={i}
                        className="py-2 rounded-lg transition-colors"
                        style={{
                          backgroundColor: themeColors.hover,
                          color: themeColors.text,
                          border: `1px solid ${themeColors.border}`
                        }}
                      >
                        {i === 3 ? 'Tout' : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Withdrawal Methods */}
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3" style={{ color: themeColors.text }}>
                    Méthode de retrait
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-4 rounded-xl border-2 transition-all hover:scale-105" style={{ borderColor: themeColors.accent, backgroundColor: `${themeColors.accent}10` }}>
                      <CreditCard className="mx-auto mb-2" size={24} style={{ color: themeColors.accent }} />
                      <p className="text-sm font-medium" style={{ color: themeColors.text }}>Banque</p>
                    </button>
                    <button className="p-4 rounded-xl border transition-all hover:scale-105" style={{ borderColor: themeColors.border, backgroundColor: themeColors.hover }}>
                      <WalletIcon className="mx-auto mb-2" size={24} style={{ color: themeColors.textMuted }} />
                      <p className="text-sm font-medium" style={{ color: themeColors.text }}>Mobile Money</p>
                    </button>
                    <button className="p-4 rounded-xl border transition-all hover:scale-105" style={{ borderColor: themeColors.border, backgroundColor: themeColors.hover }}>
                      <Coins className="mx-auto mb-2" size={24} style={{ color: themeColors.textMuted }} />
                      <p className="text-sm font-medium" style={{ color: themeColors.text }}>Crypto</p>
                    </button>
                  </div>
                </div>

                {/* Withdraw Button */}
                <button
                  className="w-full py-3 rounded-xl font-medium transition-colors"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  Retirer
                </button>
              </div>

              {/* Withdrawal Info */}
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: `${themeColors.accent}10` }}>
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: themeColors.accent }} />
                <div>
                  <div className="font-medium mb-1" style={{ color: themeColors.text }}>
                    Délai de traitement
                  </div>
                  <ul className="text-sm space-y-1" style={{ color: themeColors.textMuted }}>
                    <li>• Banque: 2-5 jours ouvrables</li>
                    <li>• Mobile Money: Instantané</li>
                    <li>• Crypto: 1-24 heures</li>
                  </ul>
                </div>
              </div>

              {/* Recent Withdrawals */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="p-4 border-b" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="font-medium" style={{ color: themeColors.text }}>Retraits récents</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-center py-8">
                    <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: themeColors.textMuted }} />
                    <p style={{ color: themeColors.textMuted }}>Aucun retrait récent</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAddCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: themeColors.card }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>
                  Ajouter une carte
                </h3>
                <button
                  onClick={() => setShowAddCard(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: themeColors.hover }}
                >
                  <X className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: themeColors.textMuted }}>
                    Numéro de carte
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: themeColors.hover,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: themeColors.textMuted }}>
                    Nom sur la carte
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 rounded-xl uppercase"
                    style={{
                      backgroundColor: themeColors.hover,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: themeColors.textMuted }}>
                      Expiration
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: themeColors.hover,
                        color: themeColors.text,
                        border: `1px solid ${themeColors.border}`
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: themeColors.textMuted }}>
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: themeColors.hover,
                        color: themeColors.text,
                        border: `1px solid ${themeColors.border}`
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddCard}
                  className="w-full py-3 rounded-xl font-medium mt-4"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  Ajouter la carte
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Confirmation Modal (Stripe) */}
      <AnimatePresence>
        {showPurchaseConfirm && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full p-6 rounded-2xl border shadow-xl"
              style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: themeColors.text }}>
                Confirmer l'achat
              </h3>

              <div className="mb-6 p-4 rounded-xl bg-white/5 flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-60">Pack</div>
                  <div className="font-bold text-lg">{selectedPackage.coins} Coins</div>
                  {selectedPackage.bonus > 0 && <div className="text-green-400 text-sm">+{selectedPackage.bonus} Bonus</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-60">Prix</div>
                  <div className="font-bold text-2xl">{selectedPackage.price}€</div>
                </div>
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm
                  packageItem={selectedPackage}
                  onSuccess={() => {
                    setShowPurchaseConfirm(false);
                    // Refresh balance or other logic
                  }}
                  onCancel={() => setShowPurchaseConfirm(false)}
                />
              </Elements>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-gray-400 mb-3">Ou payez avec</p>
                <button
                  onClick={handleCryptoPayment}
                  disabled={processingPayment}
                  className="w-full py-3 rounded-xl font-medium bg-[#1652f0] hover:bg-[#1652f0]/90 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Bitcoin className="w-5 h-5" />
                  Payer en Crypto (Coinbase)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
