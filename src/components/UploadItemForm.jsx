import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import axios from 'axios';
import { useEffect } from 'react';

const genderOptions = ['men', 'women', 'unisex'];
const basePerfumeNotes = ['Woody', 'Citrus', 'Flower', 'Aromatic'];

const UploadItemForm = ({ onUploadSuccess, editProduct }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [customLists, setCustomLists] = useState({ brands: [], categories: [], notes: [] });
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    customBrand: '',
    data: '',
    badge: '',
    customBadge: '',
    isOutOfStock: false,
    tags: [],
    gender: [],
    note: '',
    customNote: '',
    isAdminLogin: false,
    isPreOrder: false,
  });
  const [sizes, setSizes] = useState([
    { size: '', brand: '', price: '', oldPrice: '', customSize: '', stock: 0, isPreOrder: false, imagesFiles: [], imagesPreview: [] }
  ]);

  useEffect(() => {
    const fetchCustomLists = async () => {
      try {
        const docRef = doc(db, 'metadata', 'lists');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomLists(docSnap.data());
        } else {
          // Initialize if it doesn't exist
          await setDoc(docRef, { brands: [], categories: [], notes: [] });
        }
      } catch (error) {
        console.error('Error fetching custom lists:', error);
      }
    };
    fetchCustomLists();
  }, []);

  const baseBrands = [
     "ACQUA DI PARMA",
    "AFNAN",
    "AJMAL",
    "ANNA SUI",
    "ANTONIO BANDERAS",
    "AQUOLINA",
    "ARD AL ZAAFRAN",
    "ARIANA GRANDE",
    "ARMAF",
    "AZZARO",
    "BENTLEY",
    "BOUCHERON",
    "BRITNEY SPEARS",
    "BURBERRY",
    "BVLGARI",
    "BYREDO",
    "CAROLINA HERRERA",
    "CARTIER",
    "CHANEL",
    "CHLOE",
    "CHOPARD",
    "CALVIN KLEIN",
    "CLINIQUE",
    "COACH",
    "DAVID BECKHAM",
    "DAVIDOFF",
    "DIOR",
    "DIRHAM",
    "DKNY",
    "DOLCE & GABBANA",
    "DUNHILL",
    "ELIE SAAB",
    "ELIZABETH ARDEN",
    "EMPER",
    "ESCADA",
    "ESTEE LAUDER",
    "FENDI",
    "FERRARI",
    "GIORGIO ARMANI",
    "GIVENCHY",
    "GUCCI",
    "GUERLAIN PARIS",
    "GUESS",
    "GUY LAROCHE",
    "HALLOWEEN",
    "HERMES",
    "HUGO BOSS",
    "ISSEY MIYAKE",
    "JAGUAR",
    "JEAN PAUL GAULTIER",
    "JENNIFER LOPEZ",
    "JIMMY CHOO",
    "JO MALONE",
    "JOHN VARVATOS",
    "JUICY COUTURE",
    "JULIETTE HAS A GUN",
    "KENNETH COLE",
    "KENZO",
    "LACOSTE",
    "LANCOME",
    "LANVIN",
    "LATTAFA",
    "LE CHAMEAU",
    "MAISON ALHAMBRA",
    "MAJESTIC",
    "MANCERA",
    "MARC JACOBS",
    "MERCEDEZ BENZ",
    "MICHAEL KORS",
    "MONT BLANC",
    "MOSCHINO",
    "MUGLER",
    "NARCISO RODRIGUEZ",
    "NAUTICA",
    "NINA RICCI",
    "NISHANE",
    "PACO RABANNE",
    "PARFUMS DE MARLY",
    "PARIS HILTON",
    "POLO",
    "PRADA",
    "RALPH LAUREN",
    "RASASI",
    "REPLICA",
    "RIHANNA",
    "RIIFFS",
    "RUE BROCA",
    "SALVATORE FERRAGAMO",
    "SARAH JESSICA PARKER",
    "ST DUPONT",
    "TOM FORD",
    "TOMMY HILFIGER",
    "UCB",
    "VERSACE",
    "VIKTOR & ROLF",
    "VICTORIA SECRET",
    "YVES SAINT LAURENT"
  ];

  // Merge base lists with custom lists
  const brands = [...new Set([...baseBrands, ...(customLists.brands || [])])].sort();
  const categoriesList = [...new Set(['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo', ...(customLists.categories || [])])];
  const perfumeNotes = [...new Set([...basePerfumeNotes, ...(customLists.notes || []), 'Custom'])];

  useEffect(() => {
    if (editProduct) {
      // Handle Brand
      const isBaseBrand = baseBrands.includes(editProduct.brand);
      const isCustomBrandInList = customLists.brands?.includes(editProduct.brand);
      const brandValue = (isBaseBrand || isCustomBrandInList) ? editProduct.brand : 'custom';
      const customBrandValue = brandValue === 'custom' ? editProduct.brand : '';

      // Handle Category (Badge)
      const baseCategories = ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'];
      const isBaseCategory = baseCategories.includes(editProduct.badge);
      const isCustomCategoryInList = customLists.categories?.includes(editProduct.badge);
      const badgeValue = (isBaseCategory || isCustomCategoryInList) ? editProduct.badge : 'custom';
      const customBadgeValue = badgeValue === 'custom' ? editProduct.badge : '';

      // Handle Note
      const isBaseNote = basePerfumeNotes.includes(editProduct.note);
      const isCustomNoteInList = customLists.notes?.includes(editProduct.note);
      const noteValue = (isBaseNote || isCustomNoteInList) ? editProduct.note : 'Custom';
      const customNoteValue = noteValue === 'Custom' ? editProduct.note : '';

      setFormData({
        name: editProduct.name || '',
        brand: brandValue || '',
        customBrand: customBrandValue,
        data: editProduct.data || '',
        badge: badgeValue || '',
        customBadge: customBadgeValue,
        isOutOfStock: editProduct.isOutOfStock || false,
        tags: editProduct.tags || [],
        gender: Array.isArray(editProduct.gender) ? editProduct.gender : (editProduct.gender ? [editProduct.gender] : []),
        note: noteValue || '',
        customNote: customNoteValue,
        isAdminLogin: editProduct.isAdminLogin || false,
        isPreOrder: editProduct.isPreOrder || false,
      });

      if (editProduct.sizes && Array.isArray(editProduct.sizes)) {
        setSizes(editProduct.sizes.map(s => ({
          ...s,
          customSize: '',
          isPreOrder: !!s.isPreOrder,
          imagesFiles: s.images || [],
          imagesPreview: s.images || []
        })));
      }
    }
  }, [editProduct, customLists]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => {
      if (name === 'brand') {
        const newState = { ...prev, brand: value };
        if (value !== 'custom') newState.customBrand = '';
        return newState;
      }
      if (name === 'badge') {
        const newState = { ...prev, badge: value };
        if (value !== 'custom') newState.customBadge = '';
        return newState;
      }
      if (name === 'note') {
        const newState = { ...prev, note: value };
        if (value !== 'Custom') newState.customNote = '';
        return newState;
      }
      if (name === 'tags') {
        const newTags = prev.tags.includes(value)
          ? prev.tags.filter(tag => tag !== value)
          : [...prev.tags, value];
        return { ...prev, tags: newTags };
      }
      if (name === 'gender') {
        if (value === 'unisex') return { ...prev, gender: ['unisex'] };
        const withoutUnisex = prev.gender.filter(g => g !== 'unisex');
        const updated = withoutUnisex.includes(value)
          ? withoutUnisex.filter(g => g !== value)
          : [...withoutUnisex, value];
        return { ...prev, gender: updated };
      }
      return { ...prev, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const handleSizeChange = (idx, field, value) => {
    setSizes(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'size' && value !== 'custom') return { ...s, [field]: value, customSize: '' };
      
      const newState = { ...s, [field]: value };
      if (field === 'stock') {
        const stockValue = Number(value || 0);
        newState.isOutOfStock = stockValue <= 0;
      }
      return newState;
    }));
  };

  const handleSizeImagesChange = (idx, filesList) => {
    const newFiles = Array.from(filesList);
    setSizes(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const combined = [...(s.imagesFiles || []), ...newFiles].slice(0, 4);
      const previews = combined.map(f => (typeof f === 'string' ? f : URL.createObjectURL(f)));
      return { ...s, imagesFiles: combined, imagesPreview: previews };
    }));
  };

  const handleRemoveSizeImage = (idx, imgIdx) => {
    setSizes(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const files = [...(s.imagesFiles || [])];
      const previews = [...(s.imagesPreview || [])];
      files.splice(imgIdx, 1);
      previews.splice(imgIdx, 1);
      return { ...s, imagesFiles: files, imagesPreview: previews };
    }));
  };

  const addMoreSizes = () => {
    setSizes(prev => [...prev, { size: '', price: '', oldPrice: '', customSize: '', stock: 0, isPreOrder: false, imagesFiles: [], imagesPreview: [] }]);
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'Mahirash');
    const res = await axios.post('https://api.cloudinary.com/v1_1/djmfxpemz/image/upload', data);
    return res.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const selectedGenders = Array.isArray(formData.gender) ? formData.gender : [];
      let finalGender = 'unisex';
      if (selectedGenders.includes('unisex')) finalGender = 'unisex';
      else if (selectedGenders.length === 1) finalGender = selectedGenders[0].toLowerCase();

      const finalBrand = formData.brand === 'custom' ? formData.customBrand.trim().toUpperCase() : formData.brand;
      if (formData.brand === 'custom' && !formData.customBrand.trim()) throw new Error('Enter a brand name.');

      const finalBadge = formData.badge === 'custom' ? formData.customBadge.trim() : formData.badge;
      if (formData.badge === 'custom' && !formData.customBadge.trim()) throw new Error('Enter a category name.');

      const finalNote = formData.note === 'Custom' ? formData.customNote.trim() : formData.note;
      if (formData.note === 'Custom' && !formData.customNote.trim()) throw new Error('Enter a custom note.');

      const preparedSizes = [];
      for (const s of sizes) {
        if (!(s.size && s.price)) continue;
        if (!s.imagesFiles || s.imagesFiles.length === 0) throw new Error('Upload at least 1 image per size.');

        let finalSize = s.size === 'custom' ? s.customSize : s.size;
        const uploadedUrls = [];
        for (const file of s.imagesFiles.slice(0, 4)) {
          const url = await uploadToCloudinary(file);
          uploadedUrls.push(url);
        }
        
        // If size is pre-order, set a high stock and ensure it's not out of stock
        const isSizePreOrder = !!s.isPreOrder;
        const numericStock = isSizePreOrder ? 999 : Number(s.stock || 0);
        preparedSizes.push({
          size: finalSize, price: s.price, oldPrice: s.oldPrice || '',
          stock: isNaN(numericStock) ? 0 : numericStock, images: uploadedUrls,
          isPreOrder: isSizePreOrder,
          isOutOfStock: isSizePreOrder ? false : (numericStock <= 0)
        });
      }

      if (preparedSizes.length === 0) throw new Error('Add at least one valid size.');

      const derivedProductOutOfStock = preparedSizes.every(sz => (sz.isOutOfStock || (Number(sz.stock || 0) <= 0)));
      const anySizePreOrder = preparedSizes.some(sz => sz.isPreOrder);

      const finalPayload = {
        ...formData,
        brand: finalBrand,
        badge: finalBadge,
        isOutOfStock: derivedProductOutOfStock,
        isPreOrder: anySizePreOrder, // Keep top-level for backwards compatibility and easy filtering
        gender: finalGender,
        sizes: preparedSizes,
        note: finalNote,
      };

      if (editProduct && editProduct.id) {
        // Update existing product
        await setDoc(doc(db, 'products', editProduct.id), finalPayload, { merge: true });
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), finalPayload);
      }

      // Update custom lists in Firestore
      const docRef = doc(db, 'metadata', 'lists');
      const updates = {};
      if (formData.brand === 'custom') updates.brands = arrayUnion(finalBrand);
      if (formData.badge === 'custom') updates.categories = arrayUnion(finalBadge);
      if (formData.note === 'Custom') updates.notes = arrayUnion(finalNote);

      if (Object.keys(updates).length > 0) {
        await setDoc(docRef, updates, { merge: true });
        // Refresh local state
        setCustomLists(prev => ({
          brands: formData.brand === 'custom' ? [...new Set([...prev.brands, finalBrand])] : prev.brands,
          categories: formData.badge === 'custom' ? [...new Set([...prev.categories, finalBadge])] : prev.categories,
          notes: formData.note === 'Custom' ? [...new Set([...prev.notes, finalNote])] : prev.notes,
        }));
      }

      alert(editProduct ? 'Product updated successfully!' : 'Product uploaded successfully!');
      if (!editProduct) {
        setFormData({ name: '', brand: '', customBrand: '', data: '', badge: '', customBadge: '', isOutOfStock: false, tags: [], gender: [], note: '', customNote: '' });
        setSizes([{ size: '', price: '', oldPrice: '', customSize: '', stock: 0, imagesFiles: [], imagesPreview: [] }]);
      }
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-neutral-100">
      <div className="bg-neutral-900 py-10 px-6 text-center">
        <h3 className="text-white text-3xl font-light tracking-widest uppercase font-serif">
          {editProduct ? 'Edit Acquisition' : 'New Acquisition'}
        </h3>
        <p className="text-neutral-400 text-xs mt-2 tracking-widest uppercase">Inventory Management Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
        {/* Basic Information */}
        <section className="space-y-6">
          <h4 className="text-neutral-900 text-sm font-bold tracking-widest uppercase border-b border-neutral-100 pb-2">
            01. Essential Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Name */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">Product Name</label>
              <input
                name="name"
                value={formData.name}
                placeholder="e.g. Ombre Nomade"
                className="w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 placeholder:text-neutral-300 focus:ring-2 focus:ring-neutral-900 transition-all outline-none"
                onChange={handleChange}
                required
              />
            </div>

            {/* Brand House */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">Brand House</label>
              <div className="relative group">
                <select
                  name="brand"
                  value={formData.brand}
                  className="w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 transition-all outline-none appearance-none cursor-pointer"
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Brand</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="custom">Add New Brand...</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
              </div>
              {formData.brand === 'custom' && (
                <input
                  name="customBrand"
                  placeholder="Enter brand name"
                  className="mt-2 w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 outline-none"
                  value={formData.customBrand}
                  onChange={handleChange}
                  required
                />
              )}
            </div>

            {/* Primary Note */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">Primary Note</label>
              <div className="relative group">
                <select
                  name="note"
                  value={formData.note}
                  className="w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 transition-all outline-none appearance-none cursor-pointer"
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Olfactory Note</option>
                  {perfumeNotes.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                  <i className="fas fa-leaf text-[10px] opacity-40 mr-2"></i> {/* Optional secondary icon */}
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
              </div>
              {formData.note === 'Custom' && (
                <input
                  name="customNote"
                  placeholder="Enter custom perfume node"
                  className="mt-2 w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 outline-none"
                  value={formData.customNote}
                  onChange={handleChange}
                  required
                />
              )}
            </div>

            {/* Classification */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">Classification</label>
              <div className="relative group">
                <select
                  name="badge"
                  value={formData.badge}
                  className="w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 transition-all outline-none appearance-none cursor-pointer"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="custom">custom</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
              </div>
              {formData.badge === 'custom' && (
                <input
                  name="customBadge"
                  placeholder="Enter custom category"
                  className="mt-2 w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 outline-none"
                  value={formData.customBadge}
                  onChange={handleChange}
                  required
                />
              )}
            </div>
          </div>
        </section>

        {/* Sizes & Multi-Upload */}
        <section className="space-y-6">
          <h4 className="text-neutral-900 text-sm font-bold tracking-widest uppercase border-b border-neutral-100 pb-2">02. Variants & Inventory</h4>
          <div className="space-y-8">
            {sizes.map((sz, idx) => (
              <div key={idx} className="relative p-6 bg-neutral-50 rounded-2xl border border-neutral-100 group">
                {idx > 0 && (
                  <button
                    type="button"
                    className="absolute -top-3 -right-3 bg-red-50 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                    onClick={() => setSizes(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Volume</label>
                    <select
                      className="bg-white border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                      value={sz.size}
                      onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                      required
                    >
                      <option value="">Size</option>
                      <option value="10ml">10ml</option><option value="20ml">20ml</option>
                      <option value="50ml">50ml</option><option value="100ml">100ml</option>
                      <option value="custom">Custom</option>
                    </select>
                    {sz.size === 'custom' && (
                      <input
                        placeholder="e.g. 150ml"
                        className="mt-2 bg-white border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                        value={sz.customSize}
                        onChange={e => handleSizeChange(idx, 'customSize', e.target.value)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Price (₹)</label>
                    <input
                      type="number"
                      placeholder="Current"
                      className="bg-white border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                      value={sz.price}
                      onChange={e => handleSizeChange(idx, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Retail (₹)</label>
                    <input
                      type="number"
                      placeholder="Old Price"
                      className="bg-white border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                      value={sz.oldPrice}
                      onChange={e => handleSizeChange(idx, 'oldPrice', e.target.value)}
                    />
                  </div>
                  {!sz.isPreOrder && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Stock Units</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        className="bg-white border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                        value={sz.stock}
                        onChange={e => handleSizeChange(idx, 'stock', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!sz.isPreOrder}
                        onChange={e => handleSizeChange(idx, 'isPreOrder', e.target.checked)}
                        className="w-4 h-4 accent-neutral-900 rounded"
                      />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Pre-Order</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Media Assets (Max 4)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                        onChange={e => handleSizeImagesChange(idx, e.target.files)}
                        required={!(sz.imagesFiles && sz.imagesFiles.length > 0)}
                      />
                    </div>
                  </div>

                  {sz.imagesPreview?.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {sz.imagesPreview.map((src, i) => (
                        <div key={i} className="relative group/img w-20 h-24 rounded-lg overflow-hidden border border-neutral-200">
                          <img src={src} className="w-full h-full object-cover" alt="preview" />
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                            onClick={() => handleRemoveSizeImage(idx, i)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMoreSizes}
              className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 hover:border-neutral-900 hover:text-neutral-900 transition-all"
            >
              + Add Size Variation
            </button>
          </div>
        </section>

        {/* Tags & Settings */}
        <section className="space-y-6">
          <h4 className="text-neutral-900 text-sm font-bold tracking-widest uppercase border-b border-neutral-100 pb-2">03. Curation & Visibility</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Gender Target</label>
                <div className="flex gap-4">
                  {genderOptions.map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="gender"
                        value={g}
                        className="w-5 h-5 accent-neutral-900 rounded"
                        checked={formData.gender.includes(g)}
                        onChange={handleChange}
                      />
                      <span className="text-xs uppercase tracking-tighter text-neutral-600 group-hover:text-black transition-colors">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Product Tags</label>
                <div className="flex flex-wrap gap-3">
                  {['Top Sales', 'New Arrivals', 'Top Ratings'].map(tag => (
                    <label key={tag} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-all ${formData.tags.includes(tag) ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg shadow-neutral-200' : 'bg-white border-neutral-200 text-neutral-400'}`}>
                      <input
                        type="checkbox"
                        name="tags"
                        value={tag}
                        className="hidden"
                        checked={formData.tags.includes(tag)}
                        onChange={handleChange}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">Product Narrative</label>
                <textarea
                  name="data"
                  rows="5"
                  value={formData.data}
                  placeholder="Describe the aromatic experience..."
                  className="w-full bg-neutral-50 border-none rounded-xl p-4 text-neutral-800 focus:ring-2 focus:ring-neutral-900 outline-none resize-none"
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-8 flex justify-center">
          <button
            type="submit"
            disabled={isUploading}
            className={`
    relative flex items-center justify-center gap-3 h-12 px-8 rounded-lg 
    text-[14px] font-bold uppercase tracking-widest transition-all duration-300
    ${isUploading
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-black shadow-sm'
              }
  `}
          >
            {isUploading ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-xs"></i>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span>{editProduct ? 'Update Product' : 'Add Product'}</span>
                <i className="fas fa-arrow-right text-[10px] opacity-50 group-hover:translate-x-1 transition-transform"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadItemForm;