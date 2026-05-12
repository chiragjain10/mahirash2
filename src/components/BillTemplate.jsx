import React, { useState } from 'react';
import { MdClose, MdDownload, MdPrint, MdLocalShipping, MdPhone, MdEmail, MdLocationOn, MdPerson, MdReceipt } from 'react-icons/md';

const BillTemplate = ({ order, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const customerInfo = order.customerInfo || {};
  const shippingInfo = order.shippingInfo || {};
  const items = order.items || [];
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = order.shippingCost || 0;
  const tax = order.tax || 0;
  const total = order.total || subtotal + shipping + tax;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dateString.seconds ? new Date(dateString.seconds * 1000) : new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    // Create a temporary element for printing
    const printContent = document.getElementById('bill-content');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; }
            .bill-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #640d14; padding-bottom: 20px; }
            .company-info { margin-bottom: 20px; }
            .bill-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-section, .order-section { flex: 1; }
            .section-title { font-weight: bold; color: #640d14; margin-bottom: 10px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f8f9fa; font-weight: bold; }
            .totals-section { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 18px; color: #640d14; border-top: 2px solid #640d14; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Invoice / Bill</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download Bill"
            >
              <MdDownload className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Print Bill"
            >
              <MdPrint className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div id="bill-content" className="p-8">
          {/* Company Header */}
          <div className="header">
            <div className="company-info">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">MAHIRASH PERFUMES</h1>
              <p className="text-gray-600">Premium Fragrance Collection</p>
              <p className="text-sm text-gray-500">GSTIN: [Your GSTIN]</p>
              <p className="text-sm text-gray-500">Email: info@mahirash.com</p>
              <p className="text-sm text-gray-500">Phone: +91 XXXXX XXXXX</p>
            </div>
          </div>

          {/* Bill and Order Details */}
          <div className="bill-details">
            <div className="order-section">
              <div className="section-title">Order Details</div>
              <div className="space-y-2">
                <p><strong>Order ID:</strong> {order.id}</p>
                <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status?.toUpperCase() || 'PENDING'}
                  </span>
                </p>
                <p><strong>Payment Method:</strong> {order.paymentMethod || 'Online Payment'}</p>
              </div>
            </div>

            <div className="customer-section">
              <div className="section-title">Customer Information</div>
              <div className="space-y-2">
                <p><strong>Name:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p><strong>Email:</strong> {customerInfo.email}</p>
                <p><strong>Phone:</strong> {customerInfo.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          {(shippingInfo.address || shippingInfo.city || shippingInfo.postalCode) && (
            <div className="mb-6">
              <div className="section-title">Shipping Address</div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{shippingInfo.address}</p>
                <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}</p>
                <p>{shippingInfo.country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <div className="section-title">Order Items</div>
            <div className="overflow-x-auto">
              <table className="items-table">
                <thead>
                  <tr>
                    <th className="text-left">Product</th>
                    <th className="text-center">Size</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/48x48/f0f0f0/666?text=Product';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.brand || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{item.size || 'N/A'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatPrice(item.price)}</td>
                      <td className="text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="totals-section">
            <div className="max-w-xs ml-auto">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {shipping > 0 && (
                <div className="total-row">
                  <span>Shipping:</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="total-row">
                  <span>Tax:</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Total Amount:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Terms & Conditions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Goods once sold cannot be returned or exchanged</li>
              <li>• All products are 100% authentic and genuine</li>
              <li>• Delivery within 5-7 working days</li>
              <li>• For any queries, contact us at info@mahirash.com</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="footer mt-8 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500">This is a computer-generated invoice and does not require signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillTemplate;
