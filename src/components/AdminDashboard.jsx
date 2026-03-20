// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import UploadItemForm from './UploadItemForm';
import axios from 'axios';
import { 
  MdDashboard, 
  MdOutlineLibraryBooks, 
  MdLogout,
  MdSearch,
  MdNotificationsNone,
  MdOutlineKeyboardArrowDown,
  MdAdd,
  MdFileDownload,
  MdVideoLibrary,
  MdEdit,
  MdDelete,
  MdCheckCircle,
  MdError,
  MdList,
  MdReceipt,
  MdComment,
  MdClose,
  MdCloudUpload,
  MdHandshake
} from 'react-icons/md';
import { 
  HiUsers, 
  HiBriefcase, 
  HiOutlineViewColumns, 
  HiOutlineIdentification, 
  HiCalendarDays, 
  HiMap, 
  HiSparkles, 
  HiUserGroup, 
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineBell,
  HiUserCircle
} from 'react-icons/hi2';

const genderOptions = ['men', 'women', 'unisex'];
const basePerfumeNotes = ['Woody', 'Citrus', 'Flower', 'Aromatic'];

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [customLists, setCustomLists] = useState({ brands: [], categories: [], notes: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState({ current: 0, total: 0, errors: [] });
  const [activeTab, setActiveTab] = useState('Manage Products');
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
  const [isMetadataUpdating, setIsMetadataUpdating] = useState(false);
  const [newMetadataVal, setNewMetadataVal] = useState('');
  const [editingMetadata, setEditingMetadata] = useState(null); // { type, oldVal, newVal }
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  // Video management states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoFiles, setVideoFiles] = useState({ 
    heroVideos: [], // Array of files
    stageVideo: null, 
    bannerImage: null, // Changed from bannerVideo
    watchAndBuyVideo: null, // Added for Watch and Buy
    exclusiveOfferImage: null // Added for BannerImg section
  });
  const [currentVideos, setCurrentVideos] = useState({ 
    heroVideoUrls: [], // Array of URLs
    stageVideoUrl: '', 
    bannerImageUrl: '', // Changed from bannerVideoUrl
    watchAndBuyVideos: [], // Array of { url, tag }
    exclusiveOfferImageUrl: '' // Added for BannerImg section
  });
  const [watchAndBuyTag, setWatchAndBuyTag] = useState(''); // Tag for Watch and Buy video
  const [editingWatchAndBuy, setEditingWatchAndBuy] = useState(null); // { url, tag }
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  useEffect(() => {
    const fetchCustomLists = async () => {
      try {
        const docRef = doc(db, 'metadata', 'lists');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomLists(docSnap.data());
        } else {
          await setDoc(docRef, { brands: [], categories: [], notes: [] });
        }
      } catch (error) {
        console.error('Error fetching custom lists:', error);
      }
    };
    fetchCustomLists();
  }, []);

  // Static brand list for dropdown (same as UploadItemForm)
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
  const categories = [...new Set(['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo', ...(customLists.categories || [])])];
  const perfumeNotes = [...new Set([...basePerfumeNotes, ...(customLists.notes || []), 'Custom'])];

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (!price) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const fetchOrders = async () => {
    try {
      setIsOrdersLoading(true);
      const snapshot = await getDocs(collection(db, 'orders'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Helper function to get category icon and color
  const getCategoryInfo = (badge) => {
    if (!badge) return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };

    const badgeLower = badge.toLowerCase();
    switch (badgeLower) {
      case 'designer':
        return { icon: 'fa-user-tie', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
      case 'middle eastern':
        return { icon: 'fa-mosque', bg: 'linear-gradient(135deg, #C9B37E, #D4B04C)' };
      case 'niche':
        return { icon: 'fa-gem', bg: 'linear-gradient(135deg, #A63A27, #D32F2F)' };
      case 'vials':
        return { icon: 'fa-vial', bg: 'linear-gradient(135deg, #2196F3, #1976D2)' };
      case 'gift sets':
        return { icon: 'fa-gift', bg: 'linear-gradient(135deg, #E91E63, #C2185B)' };
      case 'combo':
        return { icon: 'fa-cubes', bg: 'linear-gradient(135deg, #FF6B35, #F7931E)' };
      case 'custom':
        return { icon: 'fa-star', bg: 'linear-gradient(135deg, #3FC53A, #4CAF50)' };
      default:
        return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsReviewsLoading(true);
      const snapshot = await getDocs(collection(db, 'reviews'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(list);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setIsAnnouncementsLoading(true);
      const snapshot = await getDocs(collection(db, 'announcements'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(list);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      setIsAnnouncementsLoading(true);
      const docRef = await addDoc(collection(db, 'announcements'), {
        text: newAnnouncement.trim(),
        createdAt: new Date()
      });
      setAnnouncements(prev => [...prev, { id: docRef.id, text: newAnnouncement.trim() }]);
      setNewAnnouncement('');
      alert('Announcement added!');
    } catch (error) {
      console.error('Error adding announcement:', error);
      alert('Failed to add.');
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      setIsAnnouncementsLoading(true);
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete.');
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
  };

  // Upload video/image to Cloudinary
  const uploadToCloudinary = async (file, type = 'video') => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'Mahirash');
    const endpoint = type === 'video' ? 'video/upload' : 'image/upload';
    const res = await axios.post(`https://api.cloudinary.com/v1_1/djmfxpemz/${endpoint}`, data);
    return res.data.secure_url;
  };

  // Fetch current video URLs
  const fetchCurrentVideos = async () => {
    try {
      const docRef = doc(db, 'siteConfig', 'videos');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentVideos({
          heroVideoUrls: data.heroVideoUrls || [],
          stageVideoUrl: data.stageVideoUrl || '',
          bannerImageUrl: data.bannerImageUrl || '',
          watchAndBuyVideos: data.watchAndBuyVideos || [],
          exclusiveOfferImageUrl: data.exclusiveOfferImageUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching current videos:', error);
    }
  };

  // Handle video upload
  const handleVideoUpload = async () => {
    setIsVideoUploading(true);
    try {
      const updatedVideos = { ...currentVideos };

      // Upload hero videos to Cloudinary
      if (videoFiles.heroVideos.length > 0) {
        const uploadedHeroUrls = await Promise.all(
          videoFiles.heroVideos.map(file => uploadToCloudinary(file, 'video'))
        );
        updatedVideos.heroVideoUrls = [...updatedVideos.heroVideoUrls, ...uploadedHeroUrls];
      }

      // Upload stage video to Cloudinary only
      if (videoFiles.stageVideo) {
        const cloudinaryUrl = await uploadToCloudinary(videoFiles.stageVideo, 'video');
        updatedVideos.stageVideoUrl = cloudinaryUrl;
      }

      // Upload banner image to Cloudinary
      if (videoFiles.bannerImage) {
        const cloudinaryUrl = await uploadToCloudinary(videoFiles.bannerImage, 'image');
        updatedVideos.bannerImageUrl = cloudinaryUrl;
      }

      // Upload exclusive offer image to Cloudinary
      if (videoFiles.exclusiveOfferImage) {
        const cloudinaryUrl = await uploadToCloudinary(videoFiles.exclusiveOfferImage, 'image');
        updatedVideos.exclusiveOfferImageUrl = cloudinaryUrl;
      }

      // Upload Watch and Buy video to Cloudinary
      if (videoFiles.watchAndBuyVideo) {
        if (!watchAndBuyTag) {
          alert('Please enter a tag for the Watch and Buy video.');
          setIsVideoUploading(false);
          return;
        }
        const cloudinaryUrl = await uploadToCloudinary(videoFiles.watchAndBuyVideo, 'video');
        updatedVideos.watchAndBuyVideos = [
          ...(updatedVideos.watchAndBuyVideos || []),
          { url: cloudinaryUrl, tag: watchAndBuyTag }
        ];
      }

      // Save to Firestore
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);

      // Update local state
      setCurrentVideos(updatedVideos);
      setVideoFiles({ heroVideos: [], stageVideo: null, bannerImage: null, watchAndBuyVideo: null, exclusiveOfferImage: null });
      setWatchAndBuyTag('');
      setShowVideoModal(false);
      alert('Assets uploaded successfully!');
    } catch (error) {
      console.error('Error uploading assets:', error);
      alert('Failed to upload. Please try again.');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleReplaceHeroVideo = async (oldUrl, file) => {
    try {
      setIsVideoUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'mahirash_perfumes');
      
      const res = await fetch('https://api.cloudinary.com/v1_1/duv9f7v37/video/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        const docRef = doc(db, 'siteConfig', 'videos');
        const updatedUrls = currentVideos.heroVideoUrls.map(url => url === oldUrl ? data.secure_url : url);
        await updateDoc(docRef, { heroVideoUrls: updatedUrls });
        setCurrentVideos(prev => ({ ...prev, heroVideoUrls: updatedUrls }));
        showToast('Hero video replaced successfully', 'success');
      }
    } catch (error) {
      console.error('Error replacing hero video:', error);
      showToast('Failed to replace video', 'error');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleReplaceSingleAsset = async (field, file) => {
    try {
      setIsVideoUploading(true);
      const isVideo = file.type.startsWith('video/');
      const uploadUrl = `https://api.cloudinary.com/v1_1/duv9f7v37/${isVideo ? 'video' : 'image'}/upload`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'mahirash_perfumes');
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        const docRef = doc(db, 'siteConfig', 'videos');
        await updateDoc(docRef, { [field]: data.secure_url });
        setCurrentVideos(prev => ({ ...prev, [field]: data.secure_url }));
        showToast('Asset replaced successfully', 'success');
      }
    } catch (error) {
      console.error('Error replacing asset:', error);
      showToast('Failed to replace asset', 'error');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const removeHeroVideo = async (url) => {
    if (!window.confirm('Are you sure you want to remove this hero video?')) return;
    try {
      const updatedUrls = currentVideos.heroVideoUrls.filter(u => u !== url);
      const updatedVideos = { ...currentVideos, heroVideoUrls: updatedUrls };
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);
      setCurrentVideos(updatedVideos);
      alert('Video removed successfully!');
    } catch (error) {
      console.error('Error removing video:', error);
      alert('Failed to remove video.');
    }
  };

  const removeWatchAndBuyVideo = async (url) => {
    if (!window.confirm('Are you sure you want to remove this Watch and Buy video?')) return;
    try {
      const updatedWatchVideos = currentVideos.watchAndBuyVideos.filter(v => v.url !== url);
      const updatedVideos = { ...currentVideos, watchAndBuyVideos: updatedWatchVideos };
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);
      setCurrentVideos(updatedVideos);
      alert('Video removed successfully!');
    } catch (error) {
      console.error('Error removing video:', error);
      alert('Failed to remove video.');
    }
  };

  const updateWatchAndBuyTag = async (url, newTag) => {
    if (!newTag) return;
    try {
      const updatedWatchVideos = currentVideos.watchAndBuyVideos.map(v => 
        v.url === url ? { ...v, tag: newTag } : v
      );
      const updatedVideos = { ...currentVideos, watchAndBuyVideos: updatedWatchVideos };
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);
      setCurrentVideos(updatedVideos);
      setEditingWatchAndBuy(null);
      alert('Tag updated successfully!');
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag.');
    }
  };

  const removeSingleAsset = async (field) => {
    if (!window.confirm(`Are you sure you want to remove this ${field.replace('Url', '')}?`)) return;
    try {
      const updatedVideos = { ...currentVideos, [field]: '' };
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);
      setCurrentVideos(updatedVideos);
      alert('Asset removed successfully!');
    } catch (error) {
      console.error('Error removing asset:', error);
      alert('Failed to remove asset.');
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  // CSV Parser function
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  };

  // Transform CSV row to product format
  const transformCsvRowToProduct = (row) => {
    // Normalize column names (handle variations)
    const getValue = (keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== '') return row[key];
      }
      return '';
    };

    const name = getValue(['name', 'product name', 'productname']);
    const brand = getValue(['brand']);
    const data = getValue(['data', 'description', 'desc']);
    const badge = getValue(['badge', 'category', 'cat']);
    const note = getValue(['note', 'perfume note', 'perfumenote']);
    const gender = getValue(['gender', 'gend']);
    const size = getValue(['size']);
    const price = getValue(['price']);
    const oldPrice = getValue(['oldprice', 'old price', 'oldprice']);
    const stock = getValue(['stock', 'quantity', 'qty']);
    const imageUrls = getValue(['imageurls', 'image urls', 'images', 'image', 'imageurl']);
    const isOutOfStock = getValue(['isoutofstock', 'out of stock', 'outofstock', 'oos']);
    const tags = getValue(['tags', 'tag']);

    // Validate required fields
    if (!name || !brand || !size || !price) {
      throw new Error(`Missing required fields: name, brand, size, or price`);
    }

    // Parse images (comma or semicolon separated URLs)
    const images = imageUrls
      ? imageUrls.split(/[,;]/).map(url => url.trim()).filter(url => url.length > 0)
      : [];

    if (images.length === 0) {
      throw new Error(`Product "${name}" must have at least one image URL`);
    }

    // Parse gender
    let finalGender = 'unisex';
    if (gender) {
      const genderLower = gender.toLowerCase();
      if (genderLower.includes('men') || genderLower === 'm') {
        finalGender = 'men';
      } else if (genderLower.includes('women') || genderLower === 'w' || genderLower === 'f') {
        finalGender = 'women';
      } else if (genderLower.includes('unisex') || genderLower === 'u') {
        finalGender = 'unisex';
      }
    }

    // Parse tags
    const parsedTags = tags
      ? tags.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // Parse stock
    const numericStock = Number(stock) || 0;
    // Automatically set isOutOfStock based on stock (0 or less = out of stock)
    const isOutOfStockBool = numericStock <= 0;

    // Build size object
    const sizeObj = {
      size: size,
      price: price,
      oldPrice: oldPrice || '',
      stock: numericStock,
      images: images.slice(0, 4), // Max 4 images
      isOutOfStock: isOutOfStockBool
    };

    return {
      name: name.trim(),
      brand: brand.trim(),
      data: data.trim(),
      badge: badge.trim() || '',
      note: note.trim() || '',
      gender: finalGender,
      sizes: [sizeObj],
      tags: parsedTags,
      isOutOfStock: isOutOfStockBool
    };
  };

  // Handle CSV file upload
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
      e.target.value = '';
    }
  };

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: 'Sample Perfume 1',
        brand: 'CHANEL',
        size: '50ml',
        price: '2999',
        oldPrice: '3499',
        imageUrls: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
        data: 'A luxurious fragrance with notes of jasmine and rose',
        badge: 'Premium',
        note: 'Flower',
        gender: 'women',
        stock: '50',
        isOutOfStock: 'false',
        tags: 'Top Sales,New Arrivals'
      },
      {
        name: 'Sample Perfume 2',
        brand: 'DIOR',
        size: '100ml',
        price: '4999',
        oldPrice: '',
        imageUrls: 'https://example.com/image3.jpg',
        data: 'A fresh and modern scent perfect for everyday wear',
        badge: 'New',
        note: 'Citrus',
        gender: 'unisex',
        stock: '30',
        isOutOfStock: 'false',
        tags: 'Top Ratings'
      }
    ];

    const headers = ['name', 'brand', 'size', 'price', 'oldPrice', 'imageUrls', 'data', 'badge', 'note', 'gender', 'stock', 'isOutOfStock', 'tags'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row =>
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process and upload CSV products
  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }

    setIsCsvUploading(true);
    setCsvUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      setCsvUploadProgress({ current: 0, total: rows.length, errors: [] });
      const errors = [];
      let successCount = 0;

      // Group products by name+brand (in case CSV has multiple sizes per product)
      const productMap = new Map();

      for (let i = 0; i < rows.length; i++) {
        try {
          const product = transformCsvRowToProduct(rows[i]);
          const key = `${product.name}_${product.brand}`;

          if (productMap.has(key)) {
            // Add size to existing product
            const existing = productMap.get(key);
            existing.sizes.push(...product.sizes);
          } else {
            productMap.set(key, product);
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      // Upload products
      const productsToUpload = Array.from(productMap.values());
      setCsvUploadProgress({ current: 0, total: productsToUpload.length, errors });

      for (let i = 0; i < productsToUpload.length; i++) {
        try {
          const product = productsToUpload[i];

          // Automatically update isOutOfStock based on all sizes
          // Product is out of stock if all sizes are out of stock (stock <= 0)
          const allSizesOut = product.sizes.every(sz => sz.isOutOfStock || (Number(sz.stock || 0) <= 0));
          product.isOutOfStock = allSizesOut;

          await addDoc(collection(db, 'products'), product);
          successCount++;
          setCsvUploadProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (error) {
          errors.push(`Product "${productsToUpload[i].name}": ${error.message}`);
        }
      }

      // Show results
      const message = `Upload complete!\n\nSuccessfully uploaded: ${successCount} products\nErrors: ${errors.length}`;
      if (errors.length > 0) {
        alert(`${message}\n\nErrors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`);
      } else {
        alert(message);
      }

      // Refresh products list
      fetchProducts();
      setCsvFile(null);
      setShowCsvModal(false);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('CSV upload error:', error);
      alert(`Failed to process CSV file: ${error.message}`);
    } finally {
      setIsCsvUploading(false);
      setCsvUploadProgress({ current: 0, total: 0, errors: [] });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchOrders();
    fetchCurrentVideos();
    fetchUsers();
    fetchAnnouncements();
  }, []);

  const sidebarItems = [
    { name: 'Manage Products', icon: <MdList className="w-5 h-5" /> },
    { name: 'Manage Videos', icon: <MdVideoLibrary className="w-5 h-5" /> },
    { name: 'Announcements', icon: <MdNotificationsNone className="w-5 h-5" /> },
    { name: 'User', icon: <HiUsers className="w-5 h-5" /> },
    { name: 'Orders', icon: <MdReceipt className="w-5 h-5" /> },
    { name: 'Brands', icon: <HiBriefcase className="w-5 h-5" /> },
    { name: 'Categories', icon: <HiOutlineViewColumns className="w-5 h-5" /> },
    { name: 'Nodes', icon: <HiSparkles className="w-5 h-5" /> },
    { name: 'Reviews', icon: <MdComment className="w-5 h-5" /> },
  ];

  const handleDeleteMetadata = async (type, val) => {
    if (!window.confirm(`Are you sure you want to delete "${val}" from ${type}?`)) return;
    setIsMetadataUpdating(true);
    try {
      const docRef = doc(db, 'metadata', 'lists');
      const fieldMap = { 'Brands': 'brands', 'Categories': 'categories', 'Nodes': 'notes' };
      const field = fieldMap[type];
      const deletedField = `deleted_${field}`;
      
      const currentList = customLists[field] || [];
      const newList = currentList.filter(item => item !== val);
      
      // If it's a base item, we need to track it as deleted
      const baseMap = { 
        'Brands': baseBrands, 
        'Categories': ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'], 
        'Nodes': basePerfumeNotes 
      };
      const isBase = baseMap[type].includes(val);
      
      const updateData = { [field]: newList };
      if (isBase) {
        updateData[deletedField] = arrayUnion(val);
      }
      
      await setDoc(docRef, updateData, { merge: true });
      setCustomLists(prev => ({ 
        ...prev, 
        [field]: newList,
        [deletedField]: isBase ? [...(prev[deletedField] || []), val] : prev[deletedField]
      }));
      showToast(`${type} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting metadata:', error);
      showToast('Failed to delete', 'error');
    } finally {
      setIsMetadataUpdating(false);
    }
  };

  const handleUpdateMetadata = async (type, oldVal, newVal) => {
    if (!newVal || newVal.trim() === '') return;
    setIsMetadataUpdating(true);
    try {
      const docRef = doc(db, 'metadata', 'lists');
      const fieldMap = { 'Brands': 'brands', 'Categories': 'categories', 'Nodes': 'notes' };
      const field = fieldMap[type];
      const deletedField = `deleted_${field}`;
      
      const baseMap = { 
        'Brands': baseBrands, 
        'Categories': ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'], 
        'Nodes': basePerfumeNotes 
      };
      const isBase = baseMap[type].includes(oldVal);
      const formattedNewVal = type === 'Brands' ? newVal.trim().toUpperCase() : newVal.trim();

      let newList;
      const updateData = {};

      if (isBase) {
        // If updating a base item, we "delete" the old one and add the new one
        updateData[deletedField] = arrayUnion(oldVal);
        updateData[field] = arrayUnion(formattedNewVal);
        newList = [...(customLists[field] || []), formattedNewVal];
      } else {
        // Updating a custom item
        newList = (customLists[field] || []).map(item => item === oldVal ? formattedNewVal : item);
        updateData[field] = newList;
      }
      
      await setDoc(docRef, updateData, { merge: true });
      setCustomLists(prev => ({ 
        ...prev, 
        [field]: newList,
        [deletedField]: isBase ? [...(prev[deletedField] || []), oldVal] : prev[deletedField]
      }));
      setEditingMetadata(null);
      showToast(`${type} updated successfully!`, 'success');
    } catch (error) {
      console.error('Error updating metadata:', error);
      showToast('Failed to update', 'error');
    } finally {
      setIsMetadataUpdating(false);
    }
  };

  const handleAddMetadata = async (type, val) => {
    if (!val || val.trim() === '') return;
    setIsMetadataUpdating(true);
    try {
      const docRef = doc(db, 'metadata', 'lists');
      const fieldMap = { 'Brands': 'brands', 'Categories': 'categories', 'Nodes': 'notes' };
      const field = fieldMap[type];
      
      const formattedVal = type === 'Brands' ? val.trim().toUpperCase() : val.trim();
      await setDoc(docRef, { [field]: arrayUnion(formattedVal) }, { merge: true });
      
      setCustomLists(prev => ({
        ...prev,
        [field]: [...new Set([...(prev[field] || []), formattedVal])]
      }));
      setNewMetadataVal('');
      alert(`${type} added successfully!`);
    } catch (error) {
      console.error('Error adding metadata:', error);
      alert('Failed to add. Check permissions.');
    } finally {
      setIsMetadataUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1e2d] text-white flex flex-col fixed h-full z-30">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeTab === item.name 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <HiOutlineHome className="w-5 h-5" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
              <HiOutlineBell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="flex items-center gap-2 cursor-pointer group">
                <HiUserCircle className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800 leading-tight">Admin</p>
                </div>
                <MdOutlineKeyboardArrowDown className="w-4 h-4 text-gray-500" />
              </div>
              <button 
                onClick={handleLogout}
                className="ml-4 p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <MdLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">{activeTab}</h3>
            <div className="flex gap-3">
              {activeTab === 'Manage Products' && (
                <>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <MdAdd className="text-lg" />
                    Add Product
                  </button>
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <MdCloudUpload />
                    Upload CSV
                  </button>
                </>
              )}
              {activeTab === 'Manage Videos' && (
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <MdVideoLibrary />
                  Configure Videos
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid - Only show Manage Products stats in Manage Products tab */}
          {activeTab === 'Manage Products' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                <p className="text-gray-500 font-medium uppercase tracking-wider text-xs text-center">Total Products</p>
                <h4 className="text-4xl font-bold text-gray-800">{products.length}</h4>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                <p className="text-gray-500 font-medium uppercase tracking-wider text-xs text-center">In Stock</p>
                <h4 className="text-4xl font-bold text-gray-800 text-green-600">{products.filter(p => !p.isOutOfStock).length}</h4>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2">
                <p className="text-gray-500 font-medium uppercase tracking-wider text-xs text-center">Out of Stock</p>
                <h4 className="text-4xl font-bold text-gray-800 text-red-600">{products.filter(p => p.isOutOfStock).length}</h4>
              </div>
            </div>
          )}

          {/* Tables Section */}
          <div className="space-y-8">
            {activeTab === 'Manage Products' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MdList className="text-slate-900" />
                    Inventory Overview
                  </h4>
                  <div className="relative max-w-xs w-full">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading inventory...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Image</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Brand</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.filter(p => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <MdList className="w-12 h-12" />
                                <p className="font-medium text-lg">No products found</p>
                                <p className="text-sm">Try adjusting your search or add a new product.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          products.filter(p => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
                          }).map(product => {
                            const sizeList = Array.isArray(product.sizes) ? product.sizes : [];
                            const sizeOutCount = sizeList.filter(sz => sz?.isOutOfStock).length;
                            const allSizesOut = sizeList.length > 0 && sizeOutCount === sizeList.length;
                            const finalOutOfStock = product.isOutOfStock || allSizesOut;
                            
                            return (
                              <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <img
                                    src={(Array.isArray(product.sizes) && product.sizes.find(s => s.size === '50ml' && Array.isArray(s.images) && s.images[0])?.images?.[0])
                                      || (Array.isArray(product.sizes) && product.sizes[0] && Array.isArray(product.sizes[0].images) && product.sizes[0].images[0])
                                      || product.image}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  />
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{product.name}</td>
                                <td className="px-6 py-4 text-gray-600">{product.brand}</td>
                                <td className="px-6 py-4">
                                  {(() => {
                                    const categoryInfo = getCategoryInfo(product.badge);
                                    return (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: categoryInfo.bg }}>
                                        <i className={`fas ${categoryInfo.icon}`} style={{ fontSize: '10px' }}></i>
                                        {product.badge || 'Standard'}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {sizeList.length > 0 ? (
                                      sizeList.map((sz, idx) => {
                                        const isPre = !!sz.isPreOrder;
                                        const isOOS = !isPre && (sz.isOutOfStock || Number(sz.stock || 0) <= 0);
                                        return (
                                          <div key={idx} className={`text-xs font-medium ${isPre ? 'text-amber-600' : (isOOS ? 'text-red-500' : 'text-green-600')}`}>
                                            {sz.size}: {isPre ? 'Pre-Order' : (sz.stock || 0)} {isOOS && '(OOS)'}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <span className="text-red-500 text-xs font-bold">
                                        {finalOutOfStock ? 'Out of Stock' : 'No stock data'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditClick(product)}
                                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <MdEdit className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(product.id)}
                                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      <MdDelete className="w-5 h-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Announcements' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MdNotificationsNone className="text-slate-900" />
                    Header Announcements
                  </h4>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      placeholder="Enter offer or notification text..."
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                    <button
                      onClick={handleAddAnnouncement}
                      disabled={isAnnouncementsLoading}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      Add Announcement
                    </button>
                  </div>

                  {isAnnouncementsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 italic">No announcements found. Default text will be shown.</p>
                      ) : (
                        announcements.map(ann => (
                          <div key={ann.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm text-gray-700">{ann.text}</span>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <MdDelete className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'User' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <HiUsers className="text-slate-900" />
                    Registered Users
                  </h4>
                </div>
                {isUsersLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-10 text-center text-gray-400 italic">No users registered yet</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                                </div>
                                <span className="font-semibold text-gray-800">{user.displayName || 'Anonymous'}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{user.email}</td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Orders' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MdReceipt className="text-slate-900" />
                    Order History
                  </h4>
                </div>
                {isOrdersLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">No orders found</td>
                          </tr>
                        ) : (
                          orders.map(o => {
                            const name = `${o?.customerInfo?.firstName || ''} ${o?.customerInfo?.lastName || ''}`.trim() || (o?.customerInfo?.email || 'Guest');
                            return (
                              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{o.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{name}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">₹{formatPrice(o.total)}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {o.status || 'pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                  {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteOrder(o.id)}
                                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <MdDelete className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MdComment className="text-slate-900" />
                    Customer Reviews
                  </h4>
                </div>
                {isReviewsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reviews.length === 0 ? (
                      <p className="px-6 py-10 text-center text-gray-400 italic">No reviews yet</p>
                    ) : (
                      reviews.map(r => (
                        <div key={r.id} className="px-6 py-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {r.image ? (
                                <img src={r.image} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <HiUserCircle className="w-8 h-8" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-gray-800">{r.name || 'Anonymous'}</p>
                                <div className="flex text-yellow-400 text-[10px]">
                                  {[...Array(5)].map((_, i) => (
                                    <i key={i} className={`fas fa-star ${i < (r.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}></i>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteReview(r.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <MdDelete className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 italic">"{r.message}"</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {['Brands', 'Categories', 'Nodes'].includes(activeTab) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {activeTab === 'Brands' && <HiBriefcase className="text-slate-900" />}
                    {activeTab === 'Categories' && <HiOutlineViewColumns className="text-slate-900" />}
                    {activeTab === 'Nodes' && <HiSparkles className="text-slate-900" />}
                    Manage {activeTab}
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Add new ${activeTab.slice(0, -1)}...`}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={newMetadataVal}
                      onChange={(e) => setNewMetadataVal(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAddMetadata(activeTab, newMetadataVal)}
                      disabled={isMetadataUpdating || !newMetadataVal.trim()}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(() => {
                      const fieldMap = { 'Brands': 'brands', 'Categories': 'categories', 'Nodes': 'notes' };
                      const baseMap = { 
                        'Brands': baseBrands, 
                        'Categories': ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'], 
                        'Nodes': basePerfumeNotes 
                      };
                      const field = fieldMap[activeTab];
                      const deletedField = `deleted_${field}`;
                      const customItems = customLists[field] || [];
                      const deletedItems = customLists[deletedField] || [];
                      const baseItems = baseMap[activeTab].filter(item => !deletedItems.includes(item));
                      
                      // Combine and mark base items
                      const allItems = [
                        ...baseItems.map(item => ({ val: item, isBase: true })),
                        ...customItems.map(item => ({ val: item, isBase: false }))
                      ].sort((a, b) => a.val.localeCompare(b.val));

                      return allItems.map(({ val, isBase }) => (
                        <div key={val} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {val.charAt(0)}
                            </div>
                            {editingMetadata?.type === activeTab && editingMetadata?.oldVal === val ? (
                              <input 
                                autoFocus
                                className="text-xs font-bold text-slate-900 uppercase tracking-tight bg-white border border-slate-300 rounded px-1 w-full"
                                value={editingMetadata.newVal}
                                onChange={(e) => setEditingMetadata({ ...editingMetadata, newVal: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateMetadata(activeTab, val, editingMetadata.newVal);
                                  if (e.key === 'Escape') setEditingMetadata(null);
                                }}
                              />
                            ) : (
                              <div className="flex flex-col overflow-hidden">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">{val}</p>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">
                                  {isBase ? 'System' : 'Custom'} • {products.filter(p => (activeTab === 'Brands' ? p.brand : (activeTab === 'Categories' ? p.badge : p.note)) === val).length} Items
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingMetadata?.type === activeTab && editingMetadata?.oldVal === val ? (
                              <button 
                                onClick={() => handleUpdateMetadata(activeTab, val, editingMetadata.newVal)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              >
                                <MdCheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => setEditingMetadata({ type: activeTab, oldVal: val, newVal: val })}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                              >
                                <MdEdit className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteMetadata(activeTab, val)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Manage Videos' && (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-6 border-b border-gray-100">
                   <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <MdVideoLibrary className="text-slate-900" />
                     Homepage Video Assets
                   </h4>
                 </div>
                 <div className="p-8 space-y-12">
                   {/* Hero Videos Section */}
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Hero Section Videos (Slider)</p>
                         <p className="text-xs text-gray-400 font-medium">Multiple videos will appear in a slider on the homepage</p>
                       </div>
                       <button onClick={() => setShowVideoModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">
                         Add/Manage Videos
                       </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       {currentVideos.heroVideoUrls.map((url, idx) => (
                         <div key={idx} className="space-y-3">
                           <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                             <video src={url} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                         <button 
                           onClick={() => {
                             const input = document.createElement('input');
                             input.type = 'file';
                             input.accept = 'video/*';
                             input.onchange = (e) => {
                               const file = e.target.files[0];
                               if (file) handleReplaceHeroVideo(url, file);
                             };
                             input.click();
                           }}
                           className="p-2 bg-white text-blue-600 rounded-full shadow-xl hover:scale-110 transition-transform"
                           title="Replace Video"
                         >
                           <MdEdit className="w-5 h-5" />
                         </button>
                         <button onClick={() => removeHeroVideo(url)} className="p-2 bg-white text-red-600 rounded-full shadow-xl hover:scale-110 transition-transform" title="Remove Video">
                           <MdDelete className="w-5 h-5" />
                         </button>
                       </div>
                           </div>
                           <p className="text-[10px] text-gray-500 font-bold uppercase text-center">Slide {idx + 1}</p>
                         </div>
                       ))}
                       {currentVideos.heroVideoUrls.length === 0 && (
                         <div className="col-span-full py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2">
                           <MdVideoLibrary className="w-8 h-8 opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-widest">No hero videos uploaded</p>
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-100">
                     {/* Stage Video */}
                     <div className="space-y-4">
                       <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Cinematic Stage Video</p>
                       <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                         {currentVideos.stageVideoUrl ? (
                           <video src={currentVideos.stageVideoUrl} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                         ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                             <MdVideoLibrary className="w-12 h-12" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">No Video Uploaded</span>
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'video/*';
                                input.onchange = (e) => {
                                  const file = e.target.files[0];
                                  if (file) handleReplaceSingleAsset('stageVideoUrl', file);
                                };
                                input.click();
                              }}
                              className="p-3 bg-white text-blue-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                              title="Replace Video"
                            >
                               <MdEdit className="w-6 h-6" />
                            </button>
                            {currentVideos.stageVideoUrl && (
                              <button 
                                onClick={() => removeSingleAsset('stageVideoUrl')} 
                                className="p-3 bg-white text-red-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                                title="Remove Video"
                              >
                                <MdDelete className="w-6 h-6" />
                              </button>
                            )}
                         </div>
                       </div>
                     </div>

                     {/* Bottom Banner Image */}
                     <div className="space-y-4">
                       <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Bottom Banner Image</p>
                       <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                         {currentVideos.bannerImageUrl ? (
                           <img src={currentVideos.bannerImageUrl} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                             <MdCloudUpload className="w-12 h-12" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">No Image Uploaded</span>
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = e.target.files[0];
                                  if (file) handleReplaceSingleAsset('bannerImageUrl', file);
                                };
                                input.click();
                              }}
                              className="p-3 bg-white text-blue-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                              title="Replace Image"
                            >
                               <MdEdit className="w-6 h-6" />
                            </button>
                            {currentVideos.bannerImageUrl && (
                              <button 
                                onClick={() => removeSingleAsset('bannerImageUrl')} 
                                className="p-3 bg-white text-red-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                                title="Remove Image"
                              >
                                <MdDelete className="w-6 h-6" />
                              </button>
                            )}
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Exclusive Offer Banner Image */}
                   <div className="space-y-4 pt-8 border-t border-gray-100">
                     <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Exclusive Offer Banner Image (BannerImg.jsx)</p>
                     <div className="aspect-[21/9] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group max-w-4xl mx-auto">
                       {currentVideos.exclusiveOfferImageUrl ? (
                         <img src={currentVideos.exclusiveOfferImageUrl} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                           <MdCloudUpload className="w-12 h-12" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">No Image Uploaded</span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) handleReplaceSingleAsset('exclusiveOfferImageUrl', file);
                              };
                              input.click();
                            }}
                            className="p-3 bg-white text-blue-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                            title="Replace Image"
                          >
                             <MdEdit className="w-6 h-6" />
                          </button>
                          {currentVideos.exclusiveOfferImageUrl && (
                            <button 
                              onClick={() => removeSingleAsset('exclusiveOfferImageUrl')} 
                              className="p-3 bg-white text-red-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                              title="Remove Image"
                            >
                              <MdDelete className="w-6 h-6" />
                            </button>
                          )}
                       </div>
                     </div>
                   </div>

                   {/* Watch and Buy Videos Section */}
                   <div className="space-y-6 pt-8 border-t border-gray-100">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Watch and Buy Videos</p>
                         <p className="text-xs text-gray-400 font-medium">Videos displayed in the "Watch and Buy" section on the homepage</p>
                       </div>
                       <button onClick={() => setShowVideoModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">
                         Add/Manage Videos
                       </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {currentVideos.watchAndBuyVideos && currentVideos.watchAndBuyVideos.map((video, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="aspect-[9/16] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                              <video src={video.url} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                <button onClick={() => setEditingWatchAndBuy(video)} className="p-2 bg-white text-blue-600 rounded-full shadow-xl hover:scale-110 transition-transform">
                                  <MdEdit className="w-5 h-5" />
                                </button>
                                <button onClick={() => removeWatchAndBuyVideo(video.url)} className="p-2 bg-white text-red-600 rounded-full shadow-xl hover:scale-110 transition-transform">
                                  <MdDelete className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            {editingWatchAndBuy?.url === video.url ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={editingWatchAndBuy.tag} 
                                  onChange={e => setEditingWatchAndBuy({...editingWatchAndBuy, tag: e.target.value})}
                                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                                />
                                <button onClick={() => updateWatchAndBuyTag(video.url, editingWatchAndBuy.tag)} className="text-green-600"><MdCheckCircle /></button>
                                <button onClick={() => setEditingWatchAndBuy(null)} className="text-red-600"><MdClose /></button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-500 font-bold uppercase text-center">{video.tag}</p>
                            )}
                          </div>
                        ))}
                       {(!currentVideos.watchAndBuyVideos || currentVideos.watchAndBuyVideos.length === 0) && (
                         <div className="col-span-full py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2">
                           <MdVideoLibrary className="w-8 h-8 opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-widest">No Watch and Buy videos uploaded</p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h5 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MdAdd className="text-slate-900" />
                Add New Product
              </h5>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <UploadItemForm onUploadSuccess={() => {
                fetchProducts();
                setShowUploadModal(false);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCsvModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MdCloudUpload className="text-blue-600" />
                CSV Bulk Upload
              </h4>
              <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select CSV File</label>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                {csvFile && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <MdCheckCircle /> Selected: {csvFile.name}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-800 flex items-center gap-2">
                    <MdError className="text-blue-600" />
                    CSV Format Guide
                  </p>
                  <button
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800"
                  >
                    <MdFileDownload className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
                <ul className="space-y-1 text-blue-700 text-xs">
                  <li>• Required: <span className="font-bold">name, brand, size, price, imageUrls</span></li>
                  <li>• Image URLs: Comma separated (max 4 per product)</li>
                  <li>• Products with same Name + Brand will be grouped by sizes</li>
                </ul>
              </div>

              {isCsvUploading && csvUploadProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Processing items...</span>
                    <span>{csvUploadProgress.current} / {csvUploadProgress.total}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(csvUploadProgress.current / csvUploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvUpload}
                disabled={isCsvUploading || !csvFile}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
              >
                {isCsvUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MdCloudUpload />}
                {isCsvUploading ? 'Uploading...' : 'Start Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Management Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVideoModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/30">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MdVideoLibrary className="text-orange-500" />
                Manage Homepage Assets
              </h4>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10">
              {/* Hero Videos Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Hero Slider Videos</p>
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Multiple Allowed</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-orange-300 transition-colors relative">
                    <MdCloudUpload className="w-10 h-10 text-gray-300" />
                    <p className="text-xs font-bold text-gray-400 uppercase">Click to upload new video(s)</p>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => setVideoFiles(prev => ({ ...prev, heroVideos: [...prev.heroVideos, ...Array.from(e.target.files)] }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                    {videoFiles.heroVideos.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                        <button 
                          onClick={() => setVideoFiles(prev => ({ ...prev, heroVideos: prev.heroVideos.filter((_, idx) => idx !== i) }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MdClose />
                        </button>
                      </div>
                    ))}
                    {videoFiles.heroVideos.length === 0 && (
                      <p className="text-[10px] text-gray-400 italic text-center py-4">No new videos selected</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Stage Video */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Stage Video</p>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {videoFiles.stageVideo ? (
                      <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-600 text-xs font-bold">
                        {videoFiles.stageVideo.name}
                      </div>
                    ) : (
                      currentVideos.stageVideoUrl ? (
                        <video src={currentVideos.stageVideoUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <MdVideoLibrary className="w-12 h-12" />
                        </div>
                      )
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFiles(prev => ({ ...prev, stageVideo: e.target.files[0] }))}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>

                {/* Banner Image */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Bottom Banner Image</p>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {videoFiles.bannerImage ? (
                      <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-600 text-xs font-bold">
                        {videoFiles.bannerImage.name}
                      </div>
                    ) : (
                      currentVideos.bannerImageUrl ? (
                        <img src={currentVideos.bannerImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <MdCloudUpload className="w-12 h-12" />
                        </div>
                      )
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setVideoFiles(prev => ({ ...prev, bannerImage: e.target.files[0] }))}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>

                {/* Exclusive Offer Image */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Exclusive Offer Image (BannerImg.jsx)</p>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {videoFiles.exclusiveOfferImage ? (
                      <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-600 text-xs font-bold">
                        {videoFiles.exclusiveOfferImage.name}
                      </div>
                    ) : (
                      currentVideos.exclusiveOfferImageUrl ? (
                        <img src={currentVideos.exclusiveOfferImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <MdCloudUpload className="w-12 h-12" />
                        </div>
                      )
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setVideoFiles(prev => ({ ...prev, exclusiveOfferImage: e.target.files[0] }))}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Watch and Buy Video Upload Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Watch and Buy Video</p>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Single Upload per Tag</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video File</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-300 transition-colors relative aspect-video">
                      {videoFiles.watchAndBuyVideo ? (
                        <div className="text-center">
                          <MdCheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                          <p className="text-[10px] font-bold text-green-600 mt-2 truncate max-w-[150px]">{videoFiles.watchAndBuyVideo.name}</p>
                        </div>
                      ) : (
                        <>
                          <MdVideoLibrary className="w-8 h-8 text-gray-300" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Select Video</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFiles(prev => ({ ...prev, watchAndBuyVideo: e.target.files[0] }))}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video Tag / Title</label>
                    <input
                      type="text"
                      value={watchAndBuyTag}
                      onChange={(e) => setWatchAndBuyTag(e.target.value)}
                      placeholder="e.g. New Arrival, Best Seller"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 italic">This tag will appear below the video on the homepage.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleVideoUpload}
                disabled={isVideoUploading || (!videoFiles.heroVideos.length && !videoFiles.stageVideo && !videoFiles.bannerImage && !videoFiles.watchAndBuyVideo && !videoFiles.exclusiveOfferImage)}
                className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-100 transition-all flex items-center gap-2"
              >
                {isVideoUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MdCloudUpload />}
                {isVideoUploading ? 'Uploading Assets...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditItem(null)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h4 className="text-xl font-bold tracking-tight">Edit Product</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Inventory Management</p>
              </div>
              <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-white transition-colors">
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <UploadItemForm 
                editProduct={editItem} 
                onUploadSuccess={() => {
                  fetchProducts();
                  setEditItem(null);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;


