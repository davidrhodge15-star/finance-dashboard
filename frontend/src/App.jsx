import React, { useState, useRef } from 'react';
import { Upload, PieChart, DollarSign, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [data, setData] = useState([
    { name: 'Housing', amount: 0 },
    { name: 'Food', amount: 0 },
    { name: 'Transport', amount: 0 },
  ]);
  const [balance, setBalance] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData);
      
      if (response.data.status === "success") {
        setData(response.data.chart_data);
        setBalance(response.data.total_balance);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Backend Not Found! Ensure main.py is running on http://127.0.0.1:8000");
    } finally {
      setUploading(false);
      event.target.value = null; 
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // PDF Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); 
    doc.text("Finance Sentinel: Expense Analytics", 20, 20);
    
    // Report Metadata
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Statement Balance: $${balance.toLocaleString()}`, 20, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 39);

    // Build the Data Table
    const tableRows = data.map(item => [item.name, `$${item.amount.toFixed(2)}`]);
    
    autoTable(doc, {
      startY: 50,
      head: [['Expense Category', 'Total Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { cellPadding: 5, fontSize: 10 }
    });

    doc.save(`Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // UI Helper: Determine color based on balance
  const balanceColor = balance >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="text-emerald-400" /> Finance Sentinel
            </h1>
            <p className="text-slate-400 mt-1">Full-Stack Financial Diagnostics Pipeline</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={generatePDF}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-5 py-2.5 rounded-xl border border-slate-800 transition-all active:scale-95 shadow-lg"
            >
              <FileText className="w-4 h-4 text-emerald-400" /> Export PDF
            </button>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-2xl min-w-[200px]">
              <DollarSign className={balanceColor} />
              <span className={`text-2xl font-mono font-bold ${balanceColor}`}>
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Card */}
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`bg-slate-900 border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer group ${uploading ? 'border-emerald-500 animate-pulse' : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/50'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".csv" />
            <div className="bg-slate-800 p-5 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
              {uploading ? <CheckCircle className="w-10 h-10 text-emerald-400" /> : <Upload className="w-10 h-10 text-emerald-400" />}
            </div>
            <h3 className="text-xl font-semibold mb-2">{uploading ? 'Processing Data...' : 'Import Bank Statement'}</h3>
            <p className="text-slate-500 text-center text-sm max-w-xs">Drop your .csv file here to trigger the Python analysis engine.</p>
          </div>

          {/* Visualization Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-96 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" /> Spending Distribution
              </h3>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Live Diagnostics</span>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={data}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1e293b', radius: 4}} 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;