import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Coins,
  Crown,
  Palette,
  Sparkles,
  Package,
  Star,
  Check,
  X,
  Gift,
  Zap,
  Shield,
  Heart,
  ChevronRight,
  CreditCard,
  Wallet,
  Timer,
  Percent,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Mock data
const coinPackages = [
  { id: '1', name: 'Starter Pack', coins: 500, price: 4.99, bonus: 0, popular: false },
  { id: '2', name: 'Value Pack', coins: 1200, price: 9.99, bonus: 200, popular: true },
  { id: '3', name: 'Pro Pack', coins: 2800, price: 19.99, bonus: 600, popular: false },
  { id: '4', name: 'Elite Pack', coins: 6000, price: 39.99, bonus: 1500, popular: false },
  { id: '5', name: 'Champion Pack', coins: 15000, price: 89.99, bonus: 5000, popular: false },
];

const shopItems = [
  {
    id: '1',
    name: 'Royal Crown',
    description: 'A majestic crown to show your dominance',
    price: 2500,
    type: 'avatar_frame',
    category: 'cosmetics',
    image: '👑',
    rarity: 'legendary',
    owned: false,
  },
  {
    id: '2',
    name: 'Golden Pieces',
    description: 'Transform your pieces into gold',
    price: 1500,
    type: 'piece_skin',
    category: 'cosmetics',
    image: '✨',
    rarity: 'epic',
    owned: false,
  },
  {
    id: '3',
    name: 'Victory Dance',
    description: 'Celebrate wins with style',
    price: 800,
    type: 'emote',
    category: 'emotes',
    image: '🎉',
    rarity: 'rare',
    owned: true,
  },
  {
    id: '4',
    name: 'Tournament Pass',
    description: 'Free entry to 5 premium tournaments',
    price: 3000,
    type: 'pass',
    category: 'premium',
    image: '🎫',
    rarity: 'epic',
    owned: false,
  },
  {
    id: '5',
    name: 'XP Booster (7 days)',
    description: 'Double XP for a week',
    price: 1200,
    type: 'booster',
    category: 'boosters',
    image: '⚡',
    rarity: 'rare',
    owned: false,
  },
  {
    id: '6',
    name: 'Diamond Board',
    description: 'A sparkling diamond-themed board',
    price: 5000,
    type: 'board_skin',
    category: 'cosmetics',
    image: '💎',
    rarity: 'legendary',
    owned: false,
  },
  {
    id: '7',
    name: 'Pro Analysis (30 days)',
    description: 'Access to advanced game analysis',
    price: 2000,
    type: 'subscription',
    category: 'premium',
    image: '📊',
    rarity: 'epic',
    owned: false,
  },
  {
    id: '8',
    name: 'Classic Emote Pack',
    description: '10 classic emotes bundle',
    price: 600,
    type: 'emote_pack',
    category: 'emotes',
    image: '😎',
    rarity: 'common',
    owned: false,
  },
];

const featuredBundle = {
  id: 'bundle-1',
  name: 'Champion Bundle',
  description: 'Everything you need to become a champion',
  originalPrice: 8500,
  price: 5999,
  items: ['Royal Crown', 'Golden Pieces', 'Tournament Pass', 'XP Booster'],
  image: '🏆',
  endsIn: '2d 14h 32m',
};

type Category = 'all' | 'cosmetics' | 'emotes' | 'boosters' | 'premium';

const Shop: React.FC = () => {
  const { themeColors, currentTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'items' | 'coins'>('items');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedItem, setSelectedItem] = useState<typeof shopItems[0] | null>(null);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [coinPurchaseModal, setCoinPurchaseModal] = useState<typeof coinPackages[0] | null>(null);

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Items', icon: <Package size={16} /> },
    { id: 'cosmetics', label: 'Cosmetics', icon: <Palette size={16} /> },
    { id: 'emotes', label: 'Emotes', icon: <Sparkles size={16} /> },
    { id: 'boosters', label: 'Boosters', icon: <Zap size={16} /> },
    { id: 'premium', label: 'Premium', icon: <Crown size={16} /> },
  ];

  const filteredItems = selectedCategory === 'all'
    ? shopItems
    : shopItems.filter(item => item.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'rare': return 'border-blue-500/50';
      default: return 'border-gray-500/50';
    }
  };

  const handlePurchase = (item: typeof shopItems[0]) => {
    setSelectedItem(item);
    setPurchaseModal(true);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      showToast('success', `Successfully purchased ${selectedItem.name}!`);
      setPurchaseModal(false);
      setSelectedItem(null);
    }
  };

  const handleCoinPurchase = (pkg: typeof coinPackages[0]) => {
    setCoinPurchaseModal(pkg);
  };

  const confirmCoinPurchase = () => {
    if (coinPurchaseModal) {
      showToast('success', `Processing payment for ${coinPurchaseModal.name}...`);
      setCoinPurchaseModal(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4" style={{ backgroundColor: themeColors.background }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <ArrowLeft size={20} style={{ color: themeColors.text }} />
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold" style={{ color: themeColors.text }}>
                  Shop
                </h1>
                <p className="text-sm" style={{ color: themeColors.textMuted }}>
                  Customize your experience
                </p>
              </div>
            </div>

            {/* Coins Balance */}
            <Link
              to="/wallet"
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: themeColors.card }}
            >
              <Coins size={20} style={{ color: themeColors.accent }} />
              <span className="font-bold" style={{ color: themeColors.text }}>
                {user?.coins?.toLocaleString() || '2,450'}
              </span>
              <ChevronRight size={16} style={{ color: themeColors.textMuted }} />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {['items', 'coins'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'items' | 'coins')}
                className="flex-1 py-3 rounded-xl font-medium transition-all border-2"
                style={{
                  backgroundColor: activeTab === tab ? `${themeColors.accent}10` : 'transparent',
                  borderColor: activeTab === tab ? themeColors.accent : themeColors.border,
                  color: activeTab === tab ? themeColors.accent : themeColors.textMuted,
                }}
              >
                {tab === 'items' ? 'Items' : 'Buy Coins'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'items' ? (
            <motion.div
              key="items"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Featured Bundle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.card}, ${themeColors.accent}05)`,
                  border: `1px solid ${themeColors.accent}30`,
                }}
              >
                <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-xl flex items-center gap-2"
                  style={{ backgroundColor: themeColors.accent }}>
                  <Timer size={14} className="text-white" />
                  <span className="text-white text-sm font-medium">{featuredBundle.endsIn}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="text-6xl">{featuredBundle.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star size={16} style={{ color: themeColors.accent }} />
                      <span className="text-sm font-medium" style={{ color: themeColors.accent }}>
                        FEATURED BUNDLE
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mt-1" style={{ color: themeColors.text }}>
                      {featuredBundle.name}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
                      {featuredBundle.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {featuredBundle.items.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: themeColors.card, color: themeColors.text }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-sm" style={{ color: themeColors.textMuted }}>
                          {featuredBundle.originalPrice}
                        </span>
                        <div className="flex items-center gap-1">
                          <Coins size={18} style={{ color: themeColors.accent }} />
                          <span className="text-xl font-bold" style={{ color: themeColors.text }}>
                            {featuredBundle.price}
                          </span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-green-500">
                          -30%
                        </span>
                      </div>
                      <button
                        className="px-6 py-2 rounded-xl font-bold text-white"
                        style={{ backgroundColor: '#6B7280' }}
                      >
                        Buy Bundle
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all border"
                    style={{
                      backgroundColor: selectedCategory === cat.id ? `${themeColors.accent}10` : 'transparent',
                      borderColor: selectedCategory === cat.id ? themeColors.accent : themeColors.border,
                      color: selectedCategory === cat.id ? themeColors.accent : themeColors.textMuted,
                    }}
                  >
                    {cat.icon}
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative rounded-2xl overflow-hidden border-2 ${getRarityBorder(item.rarity)}`}
                    style={{ backgroundColor: themeColors.card }}
                  >
                    {/* Rarity gradient top */}
                    <div className={`h-1 bg-gradient-to-r ${getRarityColor(item.rarity)}`} />

                    {item.owned && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="text-4xl text-center mb-3">{item.image}</div>
                      <h3 className="font-bold text-center truncate" style={{ color: themeColors.text }}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-center mt-1 line-clamp-2" style={{ color: themeColors.textMuted }}>
                        {item.description}
                      </p>

                      <div className="mt-3">
                        {item.owned ? (
                          <button
                            className="w-full py-2 rounded-xl font-medium text-sm"
                            style={{ backgroundColor: themeColors.hover, color: themeColors.textMuted }}
                            disabled
                          >
                            Owned
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            className="w-full py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                            style={{ backgroundColor: '#6B7280' }}
                          >
                            <Coins size={14} />
                            {item.price.toLocaleString()}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="coins"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Coin Info */}
              <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.accent}20` }}>
                    <Coins size={24} style={{ color: themeColors.accent }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: themeColors.textMuted }}>Your Balance</p>
                    <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
                      {user?.coins?.toLocaleString() || '2,450'} Coins
                    </p>
                  </div>
                </div>
              </div>

              {/* Coin Packages */}
              <div className="space-y-3">
                {coinPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-4 rounded-2xl border-2 ${pkg.popular ? 'border-yellow-500' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: themeColors.card }}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold">
                        BEST VALUE
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${themeColors.accent}20` }}>
                          <Coins size={28} style={{ color: themeColors.accent }} />
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: themeColors.text }}>{pkg.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold" style={{ color: themeColors.accent }}>
                              {pkg.coins.toLocaleString()}
                            </span>
                            {pkg.bonus > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">
                                +{pkg.bonus} BONUS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCoinPurchase(pkg)}
                        className="px-6 py-3 rounded-xl font-bold text-white"
                        style={{ backgroundColor: '#6B7280' }}
                      >
                        ${pkg.price}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
                <h3 className="font-bold mb-3" style={{ color: themeColors.text }}>Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {['Visa', 'Mastercard', 'PayPal', 'Apple Pay', 'Google Pay'].map((method) => (
                    <div
                      key={method}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: themeColors.hover, color: themeColors.textMuted }}
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: `${themeColors.accent}10` }}>
                <Shield size={20} style={{ color: themeColors.accent }} />
                <div>
                  <h4 className="font-medium" style={{ color: themeColors.text }}>Secure Payments</h4>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>
                    All transactions are encrypted and processed securely via Stripe.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {purchaseModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: themeColors.card }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedItem.image}</div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
                  {selectedItem.name}
                </h2>
                <p className="text-sm mt-2" style={{ color: themeColors.textMuted }}>
                  {selectedItem.description}
                </p>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <Coins size={24} style={{ color: themeColors.accent }} />
                  <span className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    {selectedItem.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setPurchaseModal(false)}
                    className="flex-1 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPurchase}
                    className="flex-1 py-3 rounded-xl font-medium text-white"
                    style={{ backgroundColor: '#6B7280' }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin Purchase Modal */}
      <AnimatePresence>
        {coinPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setCoinPurchaseModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: themeColors.card }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${themeColors.accent}20` }}>
                  <Coins size={32} style={{ color: themeColors.accent }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
                  {coinPurchaseModal.name}
                </h2>

                <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: themeColors.textMuted }}>Coins</span>
                    <span className="font-bold" style={{ color: themeColors.text }}>
                      {coinPurchaseModal.coins.toLocaleString()}
                    </span>
                  </div>
                  {coinPurchaseModal.bonus > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span style={{ color: themeColors.textMuted }}>Bonus</span>
                      <span className="font-bold text-green-500">
                        +{coinPurchaseModal.bonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t mt-3 pt-3" style={{ borderColor: themeColors.card }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: themeColors.text }}>Total</span>
                      <span className="font-bold" style={{ color: themeColors.accent }}>
                        {(coinPurchaseModal.coins + coinPurchaseModal.bonus).toLocaleString()} Coins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCoinPurchaseModal(null)}
                    className="flex-1 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmCoinPurchase}
                    className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#6B7280' }}
                  >
                    <CreditCard size={18} />
                    Pay ${coinPurchaseModal.price}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default Shop;
