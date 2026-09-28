import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { assetService } from '../../services/assetService';
import toast from 'react-hot-toast';

export const CSVImportModal = ({ isOpen, onClose, onImportCompleted }) => {
  const [file, setFile] = useState(null);
  const [csvContent, setCsvContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const sampleTemplate = `name,brand,model,serialNumber,category,purchaseCost,purchaseDate,condition
Dell PowerEdge R650,Dell,R650 1U Server,SN-SRV-2024-887121,Server,11500,2024-01-15,EXCELLENT
Cisco Catalyst 9300,Cisco Systems,C9300-24P-A,SN-SWT-2024-912831,Switch,5800,2024-02-10,GOOD
Lenovo ThinkPad P16,Lenovo Enterprise,ThinkPad P16,SN-LAP-2024-441299,Laptop,3200,2024-03-01,EXCELLENT`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'infraro_asset_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.readAsText(selectedFile);
  };

  const parseCsvToJson = (text) => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      if (currentline.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        rows.push(obj);
      }
    }
    return rows;
  };

  const handleUpload = async () => {
    if (!csvContent) {
      toast.error('Please select a valid CSV file first.');
      return;
    }

    const rows = parseCsvToJson(csvContent);
    if (rows.length === 0) {
      toast.error('CSV appears to be empty or improperly formatted.');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const res = await assetService.importCSV(rows);
      if (res.success) {
        setResults(res.data);
        toast.success(`Import finished: ${res.data.successful} imported.`);
        if (onImportCompleted) onImportCompleted();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Asset CSV Import"
      subtitle="Import new hardware into Infraro inventory with row-by-row validation"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Sample Download Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Need standard CSV structure?
            </span>
          </div>
          <button
            onClick={handleDownloadSample}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-emeraldInk-800 dark:text-emerald-400 hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>

        {/* File Drag/Drop or Select */}
        <div className="border-2 border-dashed border-slate-300 dark:border-surface-darkBorder rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {file ? file.name : 'Select or drop CSV spreadsheet'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Supports standard CSV formatting</p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
        </div>

        {/* Results / Feedback */}
        {results && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/70 dark:bg-surface-dark space-y-3">
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Successfully Imported: {results.successful}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-600">
                <AlertCircle className="w-4 h-4" />
                <span>Failed Rows: {results.failed}</span>
              </div>
            </div>

            {results.errors?.length > 0 && (
              <div className="mt-2 text-xs max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-surface-darkBorder">
                <p className="font-semibold text-rose-600 mb-1">Row-Level Errors:</p>
                {results.errors.map((err, idx) => (
                  <div key={idx} className="py-1 text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Row {err.row}:</span> {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darkHover"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!csvContent || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <Upload className={`w-3.5 h-3.5 ${isProcessing ? 'animate-bounce' : ''}`} />
            {isProcessing ? 'Validating & Importing...' : 'Import Assets'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
