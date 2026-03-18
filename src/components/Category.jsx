import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { usePreloader } from '../context/PreloaderContext';
import QuickView from './QuickView';
import WishlistButton from './WishlistButton';
import { useCart } from '../context/CartContext';

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

const Category = () => {
  const { badge } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showPreloader, hidePreloader } = usePreloader();
  const { addToCart, isInCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sidebar Accordion State - Closed by default
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
  const [selectedCategories, setSelectedCategories] = useState(badge ? [decodeURIComponent(badge)] : []);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [selectedGenders, setSelectedGenders] = useState(['All']);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState('default');
  
  // Action loading states
  const [loadingQuickView, setLoadingQuickView] = useState(null);
  const [loadingAddToCart, setLoadingAddToCart] = useState(null);

  // --- Helper Functions ---
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
    return sz ? { price: sz.price, oldPrice: sz.oldPrice, size: sz.size, isPreOrder: !!sz.isPreOrder } : { price: null, oldPrice: null, size: null, isPreOrder: false };
  };

  const getNumericSizeValue = (label) => {
    if (!label) return null;
    const match = label.toString().match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  const getAvailableSizes = (product) => {
    if (!Array.isArray(product.sizes)) return [];
    const uniqueMap = new Map();
    product.sizes.forEach(sz => {
      const label = sz && sz.size ? sz.size : (typeof sz === 'string' ? sz : null);
      if (!label) return;
      if (!uniqueMap.has(label)) {
        uniqueMap.set(label, getNumericSizeValue(label) ?? Infinity);
      }
    });
    return [...uniqueMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
  };

  const isOutOfStock = (product) => {
    const sz = getSelectedSize(product);
    if (sz?.isPreOrder) return false;

    if (product.isOutOfStock) return true;
    
    // Check if total stock across all sizes is zero
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.every(sz => (sz.stock === 0 || sz.stock === '0' || sz.isOutOfStock));
    }
    
    // If no sizes, check top-level stock if it exists
    return product.stock === 0 || product.stock === '0';
  };

  const formatPrice = (p) => {
    const n = typeof p === 'string' ? parseFloat(p) : p;
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCategoryInfo = (badge) => {
    if (!badge) return { icon: 'fa-tag', color: '#fff', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    const b = badge.toLowerCase();
    switch (b) {
      case 'new': return { icon: 'fa-star', color: '#fff', bg: 'linear-gradient(135deg, #3FC53A, #4CAF50)' };
      case 'premium': return { icon: 'fa-crown', color: '#fff', bg: 'linear-gradient(135deg, #C9B37E, #D4B04C)' };
      case 'designer': return { icon: 'fa-user-tie', color: '#fff', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
      case 'middle eastern': return { icon: 'fa-mosque', color: '#fff', bg: 'linear-gradient(135deg, #C9B37E, #D4B04C)' };
      case 'niche': return { icon: 'fa-gem', color: '#fff', bg: 'linear-gradient(135deg, #A63A27, #D32F2F)' };
      case 'vials': return { icon: 'fa-vial', color: '#fff', bg: 'linear-gradient(135deg, #2196F3, #1976D2)' };
      case 'gift sets': return { icon: 'fa-gift', color: '#fff', bg: 'linear-gradient(135deg, #E91E63, #C2185B)' };
      case 'combo': return { icon: 'fa-cubes', color: '#fff', bg: 'linear-gradient(135deg, #FF6B35, #F7931E)' };
      case 'custom': return { icon: 'fa-star', color: '#fff', bg: 'linear-gradient(135deg, #3FC53A, #4CAF50)' };
      default: return { icon: 'fa-tag', color: '#fff', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    }
  };

  // --- Data Fetching ---
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

  // Sync with URL params
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    const searchParam = searchParams.get('search');
    const priceParam = searchParams.get('price');
    const sizeParam = searchParams.get('size');

    if (brandParam) {
      setSelectedBrands([brandParam]);
      setOpenSections(prev => ({ ...prev, brand: true }));
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (sizeParam) {
      const range = SIZE_RANGES.find(r => r.id === sizeParam);
      if (range) {
        setSelectedSizes([sizeParam]);
        setOpenSections(prev => ({ ...prev, size: true }));
      }
    }
    if (priceParam) {
        const range = PRICE_RANGES.find(r => r.id === priceParam);
        if (range) {
          setSelectedPrices([priceParam]);
          setPriceRange([range.min, range.max === Infinity ? 100000 : range.max]);
          setOpenSections(prev => ({ ...prev, price: true }));
        }
      }
    
    if (badge) {
      const b = decodeURIComponent(badge);
      if (CATEGORIES.includes(b)) {
        setSelectedCategories([b]);
        setOpenSections(prev => ({ ...prev, category: true }));
      } else if (COLLECTIONS.includes(b)) {
        setSelectedCollections([b]);
        setOpenSections(prev => ({ ...prev, collection: true }));
      }
    }
  }, [badge, searchParams]);

  // --- Derived Counts & Brands ---
  const brands = useMemo(() => {
    const bSet = new Set();
    products.forEach(p => { if (p.brand) bSet.add(p.brand); });
    return Array.from(bSet).sort();
  }, [products]);

  const counts = useMemo(() => {
    const c = { brands: {}, categories: {}, collections: {}, genders: { All: 0, Men: 0, Women: 0, Unisex: 0 }, availability: { inStock: 0 }, sizes: {} };
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
      
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach(sz => {
          const match = sz.size?.toString().match(/(\d+(?:\.\d+)?)/);
          if (match) {
            const val = parseFloat(match[1]);
            SIZE_RANGES.forEach(range => {
              if (val >= range.min && val <= range.max) {
                c.sizes[range.id] = (c.sizes[range.id] || 0) + 1;
              }
            });
          }
        });
      }
    });
    return c;
  }, [products]);

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    let filtered = products;

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

    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => (p.sizes || []).some(sz => {
        const match = sz.size?.toString().match(/(\d+(?:\.\d+)?)/);
        if (!match) return false;
        const val = parseFloat(match[1]);
        return selectedSizes.some(rangeId => {
          const range = SIZE_RANGES.find(r => r.id === rangeId);
          return range && val >= range.min && val <= range.max;
        });
      }));
    }

    filtered = filtered.filter(p => {
      const price = getLowestPrice(p);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (selectedPrices.length > 0) {
        return selectedPrices.some(rangeId => {
          const range = PRICE_RANGES.find(r => r.id === rangeId);
          return range && price >= range.min && price <= range.max;
        });
      }
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
  }, [products, searchTerm, selectedBrands, selectedCategories, selectedCollections, availabilityFilter, selectedGenders, selectedSizes, selectedPrices, priceRange, sortType]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

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

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedCollections([]);
    setAvailabilityFilter(null);
    setSelectedGenders(['All']);
    setSelectedSizes([]);
    setSelectedPrices([]);
    setPriceRange([0, 25000]);
    setSearchTerm('');
    setSortType('default');
    setCurrentPage(1);
    navigate('/category');
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    const sz = getSelectedSize(product);
    const sizeName = sz ? sz.size : (product.size || '');
    const isPreOrder = !!product.isPreOrder;
    if (!isPreOrder && (isOutOfStock(product) || isInCart(product.id, sizeName))) return;

    setLoadingAddToCart(product.id);
    await new Promise(r => setTimeout(r, 600));
    addToCart({ ...product, selectedSize: sz || { size: sizeName, price: product.price, oldPrice: product.oldPrice } });
    setLoadingAddToCart(null);
    const offcanvas = document.getElementById('shoppingCart');
    const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
    bsOffcanvas.show();
  };

  const handleQuickView = async (e, product) => {
    e.stopPropagation();
    if (window.innerWidth < 768) return; // Disable on mobile
    setLoadingQuickView(product.id);
    await new Promise(r => setTimeout(r, 400));
    setSelectedProduct(product);
    setLoadingQuickView(null);
  };

  return (
    <div className="bg-white min-h-screen selection:bg-[#640d14]/10 selection:text-[#640d14]">
      {/* Header */}
      <section className="relative py-12 bg-neutral-50 border-b border-neutral-100">
        <div className="px-4 text-center">
          <span className="text-[14px] text-[#640d14] uppercase tracking-[0.5em] mb-4 block">The Collection</span>
          <h1 className="text-3xl md:text-4xl font-serif text-neutral-900 mb-6 uppercase tracking-widest">Masterpieces of Scent</h1>
          <div className="w-16 h-0.5 bg-[#640d14] mx-auto opacity-20 rounded-full"></div>
        </div>
      </section>

      <div className="px-4 py-8 flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
        {/* Sidebar Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          
          {/* Active Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {availabilityFilter && (
              <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[9px] uppercase tracking-widest shadow-lg">
                <span>IN STOCK</span>
                <button onClick={() => setAvailabilityFilter(null)}><i className="fas fa-times text-[8px]"></i></button>
              </div>
            )}
            {selectedGenders.filter(g => g !== 'All').map(g => (
              <div key={g} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[9px] uppercase tracking-widest shadow-lg">
                <span>{g}</span>
                <button onClick={() => toggleFilter(selectedGenders, setSelectedGenders, g)}><i className="fas fa-times text-[8px]"></i></button>
              </div>
            ))}
          </div>

          {/* BRAND Accordion */}
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
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{b} ({counts.brands[b] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY Accordion */}
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
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{c} ({counts.categories[c] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* COLLECTIONS Accordion */}
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
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{c} ({counts.collections[c] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* AVAILABILITY Accordion */}
          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('availability')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>AVAILABILITY</span>
              <i className={`fas fa-chevron-${openSections.availability ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.availability && (
              <div className="pb-4 py-0.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={availabilityFilter === 'inStock'} onChange={() => setAvailabilityFilter(prev => prev === 'inStock' ? null : 'inStock')} className="w-4 h-4 accent-black rounded border-neutral-300" />
                  <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>In Stock ({counts.availability.inStock})</span>
                </label>
              </div>
            )}
          </div>

          {/* GENDER Accordion */}
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
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{g} ({counts.genders[g] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SIZE Accordion */}
          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('size')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>SIZE</span>
              <i className={`fas fa-chevron-${openSections.size ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.size && (
              <div className="pb-4 space-y-2">
                {SIZE_RANGES.map(r => (
                  <label key={r.id} className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <input type="checkbox" checked={selectedSizes.includes(r.id)} onChange={() => toggleFilter(selectedSizes, setSelectedSizes, r.id)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                    <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{r.label} ({counts.sizes[r.id] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* PRICE Accordion */}
          <div className="border-b border-neutral-100 py-1">
            <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between py-3 text-[14px] uppercase tracking-[0.2em] text-neutral-900">
              <span>PRICE</span>
              <i className={`fas fa-chevron-${openSections.price ? 'up' : 'down'} text-[8px]`}></i>
            </button>
            {openSections.price && (
              <div className="pb-6 pt-4 px-2 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[14px] text-neutral-800">
                    <span>Rs. {priceRange[0].toFixed(2)}</span>
                    <span>Rs. {priceRange[1].toFixed(2)}</span>
                  </div>
                  <div className="relative h-1.5 bg-neutral-100 rounded-full">
                    <div className="absolute h-full bg-[#e7e7e7] rounded-full" style={{ left: `${(priceRange[0] / 100000) * 100}%`, right: `${100 - (priceRange[1] / 100000) * 100}%` }}></div>
                    <input type="range" min="0" max="100000" step="100" value={priceRange[0]} onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none" />
                    <input type="range" min="0" max="100000" step="100" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])} className="absolute w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  {PRICE_RANGES.map(p => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer group py-0.5">
                      <input type="checkbox" checked={selectedPrices.includes(p.id)} onChange={() => toggleFilter(selectedPrices, setSelectedPrices, p.id)} className="w-4 h-4 accent-black rounded border-neutral-300" />
                      <span className="text-[14px] text-neutral-500 uppercase tracking-widest group-hover:text-black transition-colors" style={{fontWeight:300}}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

        <button
          onClick={clearAllFilters}
          className="w-full mt-6 py-3 border border-[#454545] text-[11px] font-medium uppercase tracking-[0.25em]
          flex items-center justify-center text-[#454545] hover:bg-[#454545] hover:text-white
          transition-all duration-300"
        >
          Clear Filters
        </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="Search Masterpiece..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-10 py-3 text-[14px] uppercase tracking-widest focus:ring-1 focus:ring-black/5 outline-none" />
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
              <i className="fas fa-search text-neutral-200 text-3xl mb-4"></i>
              <p className="text-[14px] uppercase tracking-widest text-neutral-400">No results found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {currentProducts.map(product => {
                  const sizeInfo = getSelectedSizePrice(product);
                  const badgeInfo = getCategoryInfo(product.badge);
                  const availableSizes = getAvailableSizes(product);
                  return (
                    <div 
                      key={product.id} 
                      className="group relative flex flex-col bg-white transition-all duration-500"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                        <img 
                          src={getPrimaryImage(product)} 
                          alt={product.name} 
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock(product) ? 'grayscale opacity-50' : ''}`} 
                        />
                        
                        {/* Minimalist Badge */}
                        {product.badge && (
                          <div className="absolute top-4 left-4 z-10 bg-[#454545] text-white px-3 py-1 text-[9px] uppercase tracking-widest font-medium">
                            {product.badge}
                          </div>
                        )}

                        {/* Quick View Button (Task 6) */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickView(e, product);
                            }}
                            className="w-full bg-[#640d14] text-white py-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors"
                          >
                            Quick View
                          </button>
                        </div>

                        {/* Wishlist Action */}
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <WishlistButton 
                            product={product} 
                            className="!bg-white !w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-[#454545] hover:!bg-[#454545] hover:!text-white transition-all shadow-sm" 
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-5 text-center">
                        <h3 className="text-[14px] font-medium text-[#454545] uppercase tracking-[0.15em] mb-2 px-2 line-clamp-1">
                          {product.name}
                        </h3>
                        
                        <div className="flex flex-col items-center gap-1">
                          {sizeInfo.oldPrice ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#999] uppercase tracking-wider">Regular price</span>
                                <span className="text-[13px] text-[#999] line-through">₹{formatPrice(sizeInfo.oldPrice)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#454545] uppercase tracking-wider">Sale price</span>
                                <span className="text-[14px] font-semibold text-[#454545]">From ₹{formatPrice(sizeInfo.price)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#454545] uppercase tracking-wider">Regular price</span>
                              <span className="text-[14px] font-semibold text-[#454545]">From ₹{formatPrice(sizeInfo.price)}</span>
                            </div>
                          )}
                        </div>

                        {/* Minimalist Sale Tag */}
                        {sizeInfo.oldPrice && (
                          <div className="mt-2 inline-block border border-[#454545] px-2 py-0.5 text-[9px] text-[#454545] uppercase tracking-widest font-medium">
                            Sale
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
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

      {selectedProduct && <QuickView product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
};

export default Category;
