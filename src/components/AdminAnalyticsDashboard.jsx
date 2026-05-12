import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  MdTrendingUp, 
  MdShoppingCart, 
  MdInventory, 
  MdAttachMoney,
  MdCalendarToday,
  MdFilterList,
  MdStar,
  MdWarning,
  MdCheckCircle
} from 'react-icons/md';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

const AdminAnalyticsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);

        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate analytics data based on time range
  const analyticsData = useMemo(() => {
    const now = new Date();
    let startDate;
    let dateFormat;

    switch (timeRange) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        dateFormat = 'MMM DD';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12 * 7);
        dateFormat = 'MMM DD';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        dateFormat = 'MMM YYYY';
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        dateFormat = 'YYYY';
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        dateFormat = 'MMM YYYY';
    }

    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= now;
    });

    // Calculate order statistics
    const orderStats = {
      total: filteredOrders.length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue: filteredOrders.length > 0 ? 
        filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / filteredOrders.length : 0
    };

    // Group orders by time period
    const groupedOrders = {};
    const groupedRevenue = {};

    filteredOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      let key;

      switch (timeRange) {
        case 'daily':
          key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'weekly':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          key = `Week ${Math.ceil((orderDate.getDate() - weekStart.getDate() + 1) / 7)}`;
          break;
        case 'monthly':
          key = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'yearly':
          key = orderDate.getFullYear().toString();
          break;
        default:
          key = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      groupedOrders[key] = (groupedOrders[key] || 0) + 1;
      groupedRevenue[key] = (groupedRevenue[key] || 0) + (order.totalAmount || 0);
    });

    // Calculate stock levels
    const stockLevels = {
      low: 0,
      medium: 0,
      good: 0
    };

    products.forEach(product => {
      const totalStock = product.sizes?.reduce((sum, size) => sum + (size.stock || 0), 0) || product.stock || 0;
      
      if (totalStock <= 10) {
        stockLevels.low++;
      } else if (totalStock <= 50) {
        stockLevels.medium++;
      } else {
        stockLevels.good++;
      }
    });

    // Calculate most sold products
    const productSales = {};
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const productId = item.productId || item.id;
          productSales[productId] = (productSales[productId] || 0) + (item.quantity || 1);
        });
      }
    });

    const mostSoldProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([productId, sales]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown Product',
          brand: product?.brand || 'Unknown Brand',
          sales,
          image: product?.image || (product?.sizes?.[0]?.images?.[0]) || '/placeholder.png'
        };
      });

    return {
      orderStats,
      groupedOrders,
      groupedRevenue,
      stockLevels,
      mostSoldProducts,
      labels: Object.keys(groupedOrders).sort(),
      orderData: Object.keys(groupedOrders).sort().map(key => groupedOrders[key]),
      revenueData: Object.keys(groupedRevenue).sort().map(key => groupedRevenue[key])
    };
  }, [orders, products, timeRange]);

  // Chart configurations
  const ordersChartConfig = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Orders',
        data: analyticsData.orderData,
        borderColor: 'rgb(100, 13, 20)',
        backgroundColor: 'rgba(100, 13, 20, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const revenueChartConfig = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData.revenueData,
        backgroundColor: 'rgba(100, 13, 20, 0.8)',
        borderColor: 'rgb(100, 13, 20)',
        borderWidth: 1
      }
    ]
  };

  const stockChartConfig = {
    labels: ['Low Stock', 'Medium Stock', 'Good Stock'],
    datasets: [
      {
        data: [analyticsData.stockLevels.low, analyticsData.stockLevels.medium, analyticsData.stockLevels.good],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor your business performance and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'daily' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'weekly' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'monthly' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === 'yearly' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{analyticsData.orderStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MdShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{analyticsData.orderStats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <MdAttachMoney className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{analyticsData.orderStats.averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MdTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <MdInventory className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders Over Time</h3>
          <div className="h-80">
            <Line data={ordersChartConfig} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
          <div className="h-80">
            <Bar data={revenueChartConfig} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Stock Levels and Most Sold Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Levels</h3>
          <div className="h-80">
            <Doughnut data={stockChartConfig} options={{ ...chartOptions, scales: undefined }} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Low Stock (≤10)</span>
              </div>
              <span className="font-semibold">{analyticsData.stockLevels.low}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium Stock (11-50)</span>
              </div>
              <span className="font-semibold">{analyticsData.stockLevels.medium}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Good Stock (&gt;50)</span>
              </div>
              <span className="font-semibold">{analyticsData.stockLevels.good}</span>
            </div>
          </div>
        </div>

        {/* Most Sold Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Sold Products</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analyticsData.mostSoldProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sales data available</p>
            ) : (
              analyticsData.mostSoldProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-xs">No Image</span></div>';
                      }}
                    />
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <MdStar className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{product.sales}</p>
                    <p className="text-xs text-gray-600">sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      {(analyticsData.stockLevels.low > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <MdWarning className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Low Stock Alert</h3>
          </div>
          <p className="text-red-700">
            You have {analyticsData.stockLevels.low} products with low stock levels. Consider restocking these items soon.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
