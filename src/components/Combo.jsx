import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { usePreloader } from '../context/PreloaderContext';
import QuickView from './QuickView';
import WishlistButton from './WishlistButton';

const CATEGORIES = ['New', 'Premium', 'Budget', 'Clearence', 'Special Edition', 'Sale'];
const COLLECTIONS = ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'];
const ITEMS_PER_PAGE = 12;
const GENDERS = ['All', 'Men', 'Women', 'Unisex'];
const SIZE_RANGES = [
  { id: '1-10', label: '1-10ml', min: 1, max: 10 },
  { id: '10-20', label: '10-20ml', min: 10, max: 20 },
  { id: '20-50', label: '20-50ml', min: 20, max: 50 },
  { id: '50-100', label: '50-100ml', min: 50, max: 100 },
  { id: '100+', label: '>100ml', min: 101, max: Infinity }
];
const PRICE_RANGES = [
  { id: 'lt1000', label: 'Under ₹1,000', min: 0, max: 1000 },
  { id: '1000-2500', label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { id: '2500-5000', label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { id: '5000-10000', label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { id: '10000+', label: 'Over ₹10,000', min: 10000, max: Infinity }
];

const Combo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, isInCart, applyCoupon } = useCart();
  const { showPreloader, hidePreloader } = usePreloader();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [comboAddCount, setComboAddCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingQuickView, setLoadingQuickView] = useState(null);
  const [showComboSuccess, setShowComboSuccess] = useState(false);

  // Sidebar Accordion State
  const [openSections, setOpenSections] = useState({
    brand: false,
    category: false,
    collection: false,
    availability: false,
    gender: false,
    size: false,
    price: false,
    slider: true
  });

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]); // Default to empty to show all products initially
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [selectedGenders, setSelectedGenders] = useState(['All']);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState('default');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getLowestPrice = (product) => {
    if (!product.sizes || !Array.isArray(product.sizes) || product.sizes.length === 0) {
      const p = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      return typeof p === 'number' && !isNaN(p) ? p : Infinity;
    }
    const prices = product.sizes.map(s => {
      const p = typeof s.price === 'string' ? parseFloat(s.price) : s.price;
      return typeof p === 'number' && !isNaN(p) ? p : null;
    }).filter(p => p !== null);
    return prices.length === 0 ? Infinity : Math.min(...prices);
  };

  const getSelectedSize = (product) => {
    if (!product.sizes || !Array.isArray(product.sizes) || product.sizes.length === 0) return null;
    return product.sizes.find(s => s.size === '50ml') || product.sizes[0];
  };

  const getPrimaryImage = (product) => {
    const sz = getSelectedSize(product);
    return (sz && sz.images?.[0]) || product.image;
  };

  const getSelectedSizePrice = (product) => {
    const sz = getSelectedSize(product);
    return sz
      ? { price: sz.price, oldPrice: sz.oldPrice, size: sz.size, isPreOrder: !!sz.isPreOrder }
      : { price: product.price, oldPrice: product.oldPrice, size: product.size, isPreOrder: !!product.isPreOrder };
  };

  const isOutOfStock = (product) => {
    const sz = getSelectedSize(product);
    if (sz?.isPreOrder) return false;
    if (product.isOutOfStock) return true;
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.every(s => (s.stock === 0 || s.stock === '0' || s.isOutOfStock));
    }
    return product.stock === 0 || product.stock === '0';
  };

  const formatPrice = (p) => {
    const n = typeof p === 'string' ? parseFloat(p) : p;
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    // Filter out items that are out of stock or are pre-order
    let filtered = products.filter(p => !isOutOfStock(p) && !getSelectedSizePrice(p).isPreOrder);

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s));
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.badge));
    }

    if (selectedCollections.length > 0) {
      filtered = filtered.filter(p => selectedCollections.includes(p.badge));
    }

    if (availabilityFilter === 'inStock') {
      filtered = filtered.filter(p => !p.isOutOfStock);
    }

    if (selectedGenders.length > 0) {
      filtered = filtered.filter(p => {
        const pg = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : 'Unisex';
        if (selectedGenders.includes('All')) return true;
        return selectedGenders.includes(pg);
      });
    }

    filtered = filtered.filter(p => {
      const price = getLowestPrice(p);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (sortType) {
      case 'price-asc': return sorted.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      case 'price-desc': return sorted.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
      case 'alpha-asc': return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'alpha-desc': return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      default: return sorted;
    }
  }, [products, searchTerm, selectedBrands, selectedCategories, selectedCollections, availabilityFilter, selectedGenders, priceRange, sortType]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Derived Counts ---
  const brands = useMemo(() => {
    const bSet = new Set();
    products.forEach(p => { if (p.brand) bSet.add(p.brand); });
    return Array.from(bSet).sort();
  }, [products]);

  const counts = useMemo(() => {
    const c = { brands: {}, categories: {}, collections: {}, genders: { All: 0, Men: 0, Women: 0, Unisex: 0 }, availability: { inStock: 0 } };
    products.forEach(p => {
      if (p.brand) c.brands[p.brand] = (c.brands[p.brand] || 0) + 1;
      if (p.badge) {
        if (CATEGORIES.includes(p.badge)) c.categories[p.badge] = (c.categories[p.badge] || 0) + 1;
        if (COLLECTIONS.includes(p.badge)) c.collections[p.badge] = (c.collections[p.badge] || 0) + 1;
      }
      const g = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : 'Unisex';
      if (c.genders[g] !== undefined) c.genders[g]++;
      if (g === 'Men' || g === 'Women') c.genders.All++;
      if (!p.isOutOfStock) c.availability.inStock++;
    });
    return c;
  }, [products]);

  // --- Handlers ---
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (list, setList, item) => {
    setList(prev => {
      const newList = prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item];
      if (item === 'All' && !prev.includes('All')) return ['All'];
      if (item !== 'All' && newList.includes('All')) return newList.filter(i => i !== 'All');
      return newList.length === 0 && setList === setSelectedGenders ? ['All'] : newList;
    });
    setCurrentPage(1);
  };

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    const sizeInfo = getSelectedSizePrice(product);
    const sizeName = sizeInfo.size || product.size || '';

    if (!sizeInfo.price) return;
    if (!product.isPreOrder && (isOutOfStock(product) || isInCart(product.id, sizeName))) return;

    addToCart({
      ...product,
      selectedSize: {
        size: sizeName,
        price: sizeInfo.price,
        oldPrice: sizeInfo.oldPrice,
        isPreOrder: sizeInfo.isPreOrder
      }
    });

    setComboAddCount(prev => {
      const next = prev + 1;
      if (next === 1) {
        setShowPopup(true);
      } else if (next === 2) {
        applyCoupon && applyCoupon('SAVE5');
        setShowComboSuccess(true);
      }
      return next;
    });
  };

  const handleQuickView = async (e, product) => {
    e.stopPropagation();
    setLoadingQuickView(product.id);
    await new Promise(r => setTimeout(r, 400));
    setSelectedProduct(product);
    setLoadingQuickView(null);
  };

  return (
    <div className="bg-white mt-5 min-h-screen selection:bg-[#640d14]/10 selection:text-[#640d14]">
      {/* Header */}
      <section className="relative py-12 bg-neutral-50 border-b border-neutral-100">
        <div className="px-4 text-center">
          <span className="text-[14px] text-[#640d14] uppercase tracking-[0.5em] mb-4 block">Combo Collection</span>
          <h1 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-6 uppercase tracking-widest">Create Your Perfect Mix</h1>
          <div className="w-16 h-0.5 bg-[#640d14] mx-auto opacity-20 rounded-full"></div>
        </div>
      </section>

      <div className="px-4 py-8 flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
        {/* Sidebar Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('brand')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>BRAND</span>
              <i className={`fas fa-chevron-${openSections.brand ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.brand && (
              <div className="pb-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {brands.map(b => (
                  <label key={b} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleFilter(selectedBrands, setSelectedBrands, b)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{ fontWeight: 300 }}>{b} ({counts.brands[b] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>CATEGORY</span>
              <i className={`fas fa-chevron-${openSections.category ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.category && (
              <div className="pb-4 space-y-2">
                {CATEGORIES.map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <input type="checkbox" checked={selectedCategories.includes(c)} onChange={() => toggleFilter(selectedCategories, setSelectedCategories, c)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{ fontWeight: 300 }}>{c} ({counts.categories[c] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('collection')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>COLLECTIONS</span>
              <i className={`fas fa-chevron-${openSections.collection ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.collection && (
              <div className="pb-4 space-y-2">
                {COLLECTIONS.map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <input type="checkbox" checked={selectedCollections.includes(c)} onChange={() => toggleFilter(selectedCollections, setSelectedCollections, c)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{ fontWeight: 300 }}>{c} ({counts.collections[c] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('gender')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>GENDER</span>
              <i className={`fas fa-chevron-${openSections.gender ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.gender && (
              <div className="pb-4 space-y-2">
                {GENDERS.map(g => (
                  <label key={g} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <input type="checkbox" checked={selectedGenders.includes(g)} onChange={() => toggleFilter(selectedGenders, setSelectedGenders, g)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{ fontWeight: 300 }}>{g} ({counts.genders[g] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>PRICE</span>
              <i className={`fas fa-chevron-${openSections.price ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.price && (
              <div className="pb-6 pt-4 px-2 space-y-4">
                <div className="flex justify-between items-center text-[14px] text-neutral-800">
                  <span>Rs. {priceRange[0].toFixed(2)}</span>
                  <span>Rs. {priceRange[1].toFixed(2)}</span>
                </div>
                <div className="relative h-1.5 bg-neutral-100 rounded-full">
                  <div className="absolute h-full bg-[#e7e7e7] rounded-full" style={{ left: `${(priceRange[0] / 100000) * 100}%`, right: `${100 - (priceRange[1] / 100000) * 100}%` }}></div>
                  <input type="range" min="0" max="100000" step="100" value={priceRange[0]} onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full" />
                  <input type="range" min="0" max="100000" step="100" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full" />
                </div>
              </div>
            )}
          </div>

          <button onClick={() => {
            setSearchTerm(''); setSelectedBrands([]); setSelectedCategories([]); setSelectedCollections([]); setSelectedGenders(['All']); setPriceRange([0, 100000]); setSortType('default');
          }} className="w-full mt-6 py-3 border border-[#454545] text-[14px] font-medium uppercase tracking-[0.25em] flex items-center justify-center text-[#454545] hover:bg-[#454545] hover:text-white transition-all duration-300">
            Clear Filters
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="Search Masterpiece..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-10 py-3 text-[14px] uppercase tracking-widest outline-none" />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 text-[14px]"></i>
            </div>
            <select value={sortType} onChange={(e) => setSortType(e.target.value)} className="w-full sm:w-48 bg-neutral-50 border-none rounded-xl px-4 py-3 text-[14px] uppercase tracking-widest outline-none cursor-pointer">
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="alpha-asc">A to Z</option>
              <option value="alpha-desc">Z to A</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-neutral-100 rounded-[40px]"></div>)}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-32 bg-neutral-50 rounded-[40px] border-2 border-dashed border-neutral-100">
              <p className="text-[14px] uppercase tracking-widest text-neutral-400">No products available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {currentProducts.map(product => {
                  const sizeInfo = getSelectedSizePrice(product);
                  return (
                    <div key={product.id} className="group relative flex flex-col bg-white transition-all duration-500 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                        <img src={getPrimaryImage(product)} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock(product) ? 'grayscale opacity-50' : ''}`} />

                        {product.badge && (
                          <div className="absolute top-4 left-4 z-10 bg-[#454545] text-white px-3 py-1 text-[9px] uppercase tracking-widest font-medium">
                            {product.badge}
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <button onClick={(e) => handleQuickView(e, product)} className="w-full bg-[#640d14] text-white py-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors flex items-center justify-center">
                            Quick View
                          </button>
                        </div>

                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <WishlistButton product={product} className="!bg-white !w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-[#454545] hover:!bg-[#454545] hover:!text-white transition-all shadow-sm" />
                        </div>
                      </div>

                      <div className="pt-5 text-center flex flex-col items-center gap-3">
                        <h3 className="text-[14px] font-medium text-[#454545] uppercase tracking-[0.15em] line-clamp-1">{product.name}</h3>
                        <div className="flex flex-col items-center gap-1">
                          {sizeInfo.oldPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-[#999] line-through">₹{formatPrice(sizeInfo.oldPrice)}</span>
                              <span className="text-[14px] font-semibold text-[#454545]">₹{formatPrice(sizeInfo.price)}</span>
                            </div>
                          ) : (
                            <span className="text-[14px] font-semibold text-[#454545]">₹{formatPrice(sizeInfo.price)}</span>
                          )}
                          {sizeInfo.size && <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{sizeInfo.size}</span>}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={isOutOfStock(product) || isInCart(product.id, sizeInfo.size || product.size || '')}
                          className={`mt-2 w-full max-w-[200px] py-2.5 rounded-full text-[11px] tracking-[0.28em] flex items-center justify-center gap-2 transition-all duration-300
  ${(isOutOfStock(product) || isInCart(product.id, sizeInfo.size || product.size || ''))
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : 'bg-white text-black border border-neutral-300 hover:bg-black hover:text-white hover:border-black shadow-sm hover:shadow-md'
                            }`}
                        >
                          {isOutOfStock(product) ? (
                            'OUT OF STOCK'
                          ) : isInCart(product.id, sizeInfo.size || product.size || '') ? (
                            'ALREADY IN CART'
                          ) : (
                            <>
                              ADD TO CART
                              <span className="text-sm">+</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-16">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400 hover:border-black disabled:opacity-20 transition-all"><i className="fas fa-chevron-left text-[14px]"></i></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => handlePageChange(p)} className={`w-10 h-10 rounded-xl text-[14px] transition-all ${currentPage === p ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}>{p}</button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400 hover:border-black disabled:opacity-20 transition-all"><i className="fas fa-chevron-right text-[14px]"></i></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">

          <div className="relative bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-scaleUp">

            {/* Subtle Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

            <h2 className="text-xl font-semibold tracking-[0.25em] uppercase text-neutral-900 mb-3">
              Add Another Perfume
            </h2>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Add one more fragrance and unlock an exclusive <span className="text-black font-medium">5% luxury discount</span>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="w-1/2 py-3 text-xs uppercase tracking-[0.2em] border border-neutral-300 text-neutral-600 rounded-full hover:bg-neutral-100 transition-all flex items-center justify-center"
              >
                Maybe Later
              </button>

              <button
                onClick={() => setShowPopup(false)}
                className="w-1/2 py-3 text-xs uppercase tracking-[0.2em] bg-black text-white rounded-full hover:bg-neutral-900 transition-all shadow-lg flex items-center justify-center"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {showComboSuccess && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">

          <div className="relative bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-scaleUp">

            {/* Glow Layer */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-50/40 to-transparent pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <i className="fas fa-check text-xl"></i>
            </div>

            <h2 className="text-xl font-semibold tracking-[0.25em] uppercase text-green-600 mb-2">
              Combo Success
            </h2>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              You've unlocked a <span className="font-medium text-black">5% exclusive discount</span> on your premium selection.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowComboSuccess(false);
                  navigate('/chart');
                }}
                className="w-full py-3 text-xs uppercase tracking-[0.2em] bg-black text-white rounded-full hover:bg-neutral-900 transition-all shadow-lg flex items-center justify-center"
              >
                View Cart
              </button>

              <button
                onClick={() => setShowComboSuccess(false)}
                className="w-full py-2 text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-all flex items-center justify-center"
              >
                Keep Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && <QuickView product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
};

export default Combo;
