"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { 
  ArrowLeft, Search, Filter, ArrowUpDown, Download, 
  FileText, CheckCircle2, User, ImageIcon 
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [isExporting, setIsExporting] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState("PENDING");

  // Fetch Data
  const { data: tripData, isLoading: isLoadingTrip } = useSWR(`/api/trips/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  
  const { data: invoiceData, isLoading: isLoadingInvoice, mutate: mutateInvoice } = useSWR(`/api/invoice/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  useEffect(() => {
    if (invoiceData?.invoice?.paymentStatus) {
      setInvoiceStatus(invoiceData.invoice.paymentStatus.toUpperCase());
    }
  }, [invoiceData]);

  // Mock Fallbacks
  const mockTrip = {
    _id: tripId,
    name: "Paris & Rome Adventure",
    startDate: new Date(Date.now() - 864000000).toISOString(),
    endDate: new Date(Date.now() + 864000000).toISOString(),
    budget: 1500,
    createdBy: "Alex Johnson",
    citiesCount: 2
  };
  const trip = tripData || mockTrip;

  const invoice = invoiceData?.invoice;

  // Recharts Data Transformation
  const pieData = useMemo(() => {
    if (!invoice?.items) return [];
    return invoice.items.reduce((acc: any[], item: any) => {
      const existing = acc.find(x => x.name === item.category);
      const amt = Number(item.amount) || 0;
      if (existing) {
        existing.value += amt;
      } else {
        acc.push({ name: item.category || 'Other', value: amt });
      }
      return acc;
    }, []);
  }, [invoice.items]);

  const COLORS: Record<string, string> = {
    hotel: '#9333ea',     // purple
    transport: '#2563eb', // blue
    food: '#ea580c',      // orange
    activity: '#0d9488',  // teal
    other: '#475569'      // gray
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hotel': return 'bg-purple-100 text-purple-700';
      case 'transport': return 'bg-blue-100 text-blue-700';
      case 'food': return 'bg-orange-100 text-orange-700';
      case 'activity': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Actions
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById('invoice-document');
      if (!element) throw new Error("Invoice element not found");
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate aspect ratio to fit A4 page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Traveloop-Invoice-${invoice.invoiceId}.pdf`);
      
      toast.success("Invoice exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setInvoiceStatus("PAID");
      await fetch(`/api/invoice/${tripId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' }) 
      });
      mutateInvoice();
      toast.success("Invoice marked as PAID!");
    } catch (e) {
      toast.error("Failed to update invoice status");
      setInvoiceStatus(invoiceData?.invoice?.paymentStatus?.toUpperCase() || "PENDING");
    }
  };

  if (isLoadingTrip || isLoadingInvoice) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex flex-col lg:flex-row gap-8">
          <Skeleton className="flex-1 h-[800px] rounded-2xl" />
          <Skeleton className="w-[280px] h-[400px] rounded-2xl shrink-0" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <p>We couldn't retrieve the invoice for this trip.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const isPaid = invoiceStatus === "PAID";
  const currentBudget = trip.budget ?? trip.totalBudget ?? 0;
  const remainingBudget = currentBudget - (invoice.grandTotal || 0);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* 1. TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => router.push('/trips')} 
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Trips
        </button>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search invoices..." className="pl-9 h-9 bg-white" />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><Filter className="w-4 h-4 text-gray-600" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ArrowUpDown className="w-4 h-4 text-gray-600" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full ml-2">
            <User className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* 2. MAIN INVOICE DOCUMENT */}
        <div className="flex-1 w-full space-y-6">
          <div 
            id="invoice-document" 
            className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 w-full max-w-[900px] mx-auto overflow-hidden"
            style={{ padding: '40px' }} // Inline styles help html2canvas render correctly
          >
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-5">
                <div className="w-[120px] h-[120px] bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">{trip.title || trip.name || "Untitled Trip"}</h1>
                  <p className="text-gray-500 font-medium">
                    {(() => {
                      try {
                        return (trip.startDate ? format(new Date(trip.startDate), "MMM d, yyyy") : "N/A") + " - " + (trip.endDate ? format(new Date(trip.endDate), "MMM d, yyyy") : "N/A");
                      } catch (e) {
                        return "N/A";
                      }
                    })()}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {(trip.citiesCount ?? trip.stops?.length ?? 0)} {(trip.citiesCount ?? trip.stops?.length ?? 0) === 1 ? "city" : "cities"}
                    {trip.createdBy && ` • Created by ${trip.createdBy}`}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right space-y-2">
                <h2 className="text-gray-400 font-bold tracking-wider text-sm uppercase">Invoice Id</h2>
                <p className="text-gray-900 font-medium">{invoice.invoiceId}</p>
                
                <h2 className="text-gray-400 font-bold tracking-wider text-sm uppercase mt-4">Generated</h2>
                <p className="text-gray-900 font-medium">
                  {(() => {
                    try {
                      return format(new Date(invoice.generatedDate), "MMMM d, yyyy");
                    } catch(e) {
                      return "N/A";
                    }
                  })()}
                </p>
                
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <h2 className="text-gray-400 font-bold tracking-wider text-sm uppercase mb-1">Status</h2>
                  {isPaid ? (
                    <Badge className="bg-green-100 hover:bg-green-100 text-green-700 px-3 py-1 font-bold border-none text-sm">PAID</Badge>
                  ) : (
                    <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-700 px-3 py-1 font-bold border-none text-sm">PENDING</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Travelers section */}
            <div className="mb-8">
              <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase mb-2">Traveler Details:</h3>
              <p className="text-gray-900 font-medium">{invoice.travelers.join(", ")}</p>
            </div>

            {/* Line Items Table */}
            <div className="mb-8 rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm">#</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm">Category</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm w-full">Description</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm whitespace-nowrap">Qty/Days</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm text-right whitespace-nowrap">Unit Cost</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 text-gray-500 text-sm">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <Badge className={`${getCategoryBadge(item.category)} border-none capitalize font-semibold`}>
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{item.description}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm text-center">{item.qty}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm text-right">${(item.unitCost || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 font-semibold text-gray-900 text-right">${(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Empty rows for visual padding */}
                  <tr><td colSpan={6} className="py-6 border-transparent"></td></tr>
                  <tr><td colSpan={6} className="py-6 border-transparent bg-gray-50/30"></td></tr>
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-3 text-right">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">${(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tax (5%):</span>
                  <span className="font-medium text-gray-900">${(invoice.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Discount:</span>
                  <span className="font-medium text-gray-900">${(invoice.discount || 0).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-200 my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Grand Total:</span>
                  <span className="font-bold text-teal-600 text-2xl">${(invoice.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Footer Note */}
            <div className="mt-16 text-center text-sm text-gray-400 font-medium">
              <p>Generated by Traveloop • Have a safe and wonderful trip!</p>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-[900px] mx-auto pt-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none border-gray-300 text-gray-700 bg-white">
                <Download className="w-4 h-4 mr-2" /> Download JSON
              </Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" /> {isExporting ? "Generating PDF..." : "Export as PDF"}
              </Button>
            </div>
            
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={isPaid}
              className={`w-full sm:w-auto shadow-sm ${isPaid ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              {isPaid ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Paid</> : "Mark as Paid"}
            </Button>
          </div>
        </div>

        {/* 3. BUDGET INSIGHTS SIDEBAR */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-xl text-gray-900 mb-6">Budget Insights</h2>
            
            {/* Donut Chart */}
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || COLORS.other} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Budget</p>
                <p className="text-xl font-bold text-gray-900">${(currentBudget).toFixed(2)}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Spent</p>
                <p className="text-xl font-bold text-amber-600">${(invoice.grandTotal || 0).toFixed(2)}</p>
              </div>

              <div className={`rounded-xl p-4 ${remainingBudget < 0 ? 'bg-red-50' : 'bg-teal-50'}`}>
                <p className={`text-sm font-medium mb-1 ${remainingBudget < 0 ? 'text-red-600' : 'text-teal-700'}`}>Remaining</p>
                <p className={`text-xl font-bold ${remainingBudget < 0 ? 'text-red-700' : 'text-teal-800'}`}>
                  ${remainingBudget.toFixed(2)}
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-6 border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={() => router.push(`/trips/${tripId}`)}
            >
              View Full Budget
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
