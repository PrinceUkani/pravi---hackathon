import React, { useState, useEffect } from 'react';
import { Download, Printer, QrCode as QrIcon, Check, Copy, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { assetService } from '../../services/assetService';
import toast from 'react-hot-toast';

export const QRCodeModal = ({ isOpen, onClose, asset }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && asset?._id) {
      const fetchQR = async () => {
        setLoading(true);
        try {
          const res = await assetService.getAssetQR(asset._id);
          if (res.success && res.data) {
            setQrData(res.data);
          }
        } catch (err) {
          toast.error('Failed to generate asset QR code.');
        } finally {
          setLoading(false);
        }
      };
      fetchQR();
    }
  }, [isOpen, asset]);

  const handleDownload = () => {
    if (!qrData?.qrCode) return;
    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `Infraro_QR_${asset.assetId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded QR code for ${asset.assetId}`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Tag - ${asset.assetId}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; }
            .tag-card { border: 2px solid #042716; padding: 24px; text-align: center; border-radius: 12px; width: 300px; }
            .brand { font-size: 14px; font-weight: 800; color: #042716; letter-spacing: 2px; }
            .tagline { font-size: 8px; color: #666; margin-bottom: 12px; }
            .qr-img { width: 180px; height: 180px; margin: 0 auto; display: block; }
            .asset-id { font-size: 20px; font-weight: 900; color: #042716; margin-top: 10px; font-family: monospace; }
            .asset-name { font-size: 12px; color: #333; margin-top: 4px; font-weight: 600; }
            .serial { font-size: 10px; color: #777; margin-top: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="brand">INFRARO</div>
            <div class="tagline">ENTERPRISE INFRASTRUCTURE ASSET</div>
            <img class="qr-img" src="${qrData?.qrCode}" alt="Asset QR" />
            <div class="asset-id">${asset.assetId}</div>
            <div class="asset-name">${asset.name}</div>
            <div class="serial">SN: ${asset.serialNumber}</div>
          </div>
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyLink = () => {
    if (!qrData?.assetUrl) return;
    navigator.clipboard.writeText(qrData.assetUrl);
    setCopied(true);
    toast.success('Asset URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset QR Code & Tag"
      subtitle={`Hardware identification label for ${asset?.assetId}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center">
        {loading ? (
          <div className="h-64 w-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : qrData ? (
          <div className="w-full flex flex-col items-center">
            {/* Tag Preview Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-emeraldInk-950 border-2 border-emeraldInk-900/40 dark:border-champagne-400/40 shadow-lg text-center w-full max-w-xs flex flex-col items-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <span className="text-xs font-black tracking-widest text-emeraldInk-950 dark:text-emerald-300">
                  INFRARO
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-champagne-400"></span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium mb-3">
                Secure Hardware ID
              </p>

              <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                <img
                  src={qrData.qrCode}
                  alt={`QR Code for ${asset.assetId}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="mt-3 font-mono text-lg font-bold text-slate-900 dark:text-champagne-300 tracking-wider">
                {asset.assetId}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[220px]">
                {asset.name}
              </p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[220px]">
                SN: {asset.serialNumber}
              </p>
            </div>

            {/* Direct Link Box */}
            <div className="mt-4 w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-xs">
              <span className="truncate text-slate-500 font-mono pr-2">
                {qrData.assetUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3 w-full">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-surface-darkBorder hover:bg-slate-50 dark:hover:bg-surface-darkHover text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Physical Tag
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
