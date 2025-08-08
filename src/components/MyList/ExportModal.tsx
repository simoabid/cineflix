import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Copy, 
  Check,
  Link,
  FileJson
} from 'lucide-react';
import { MyListItem } from '../../types/myList';

interface ExportModalProps {
  items: MyListItem[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  items,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json' | 'text'>('pdf');
  const [includeProgress, setIncludeProgress] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [shareableLink, setShareableLink] = useState('');
  const [copied, setCopied] = useState(false);

  const getTitle = (item: MyListItem) => {
    return (item.content as any).title || (item.content as any).name || 'Unknown Title';
  };

  const getYear = (item: MyListItem) => {
    const date = (item.content as any).release_date || (item.content as any).first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const generateCSV = () => {
    const headers = [
      'Title',
      'Year',
      'Type',
      'Runtime',
      'Status',
      'Rating',
      'Date Added',
      ...(includeProgress ? ['Progress'] : []),
      ...(includeNotes ? ['Notes'] : []),
      ...(includeTags ? ['Tags'] : [])
    ];

    const rows = items.map(item => [
      getTitle(item),
      getYear(item),
      item.contentType,
      formatRuntime(item.estimatedRuntime),
      item.status,
      item.content.vote_average.toFixed(1),
      new Date(item.dateAdded).toLocaleDateString(),
      ...(includeProgress ? [`${item.progress}%`] : []),
      ...(includeNotes ? [item.personalNotes || ''] : []),
      ...(includeTags ? [item.customTags.join(', ')] : [])
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generateJSON = () => {
    const exportData = items.map(item => ({
      title: getTitle(item),
      year: getYear(item),
      type: item.contentType,
      runtime: item.estimatedRuntime,
      status: item.status,
      rating: item.content.vote_average,
      dateAdded: item.dateAdded,
      ...(includeProgress && { progress: item.progress }),
      ...(includeNotes && item.personalNotes && { notes: item.personalNotes }),
      ...(includeTags && item.customTags.length > 0 && { tags: item.customTags }),
      tmdbId: item.contentId,
      overview: item.content.overview,
      posterPath: item.content.poster_path
    }));

    return JSON.stringify(exportData, null, 2);
  };

  const generateText = () => {
    let content = `My CineFlix Watchlist\n`;
    content += `Generated on ${new Date().toLocaleDateString()}\n`;
    content += `Total items: ${items.length}\n\n`;

    items.forEach((item, index) => {
      content += `${index + 1}. ${getTitle(item)} (${getYear(item)})\n`;
      content += `   Type: ${item.contentType}\n`;
      content += `   Runtime: ${formatRuntime(item.estimatedRuntime)}\n`;
      content += `   Status: ${item.status}\n`;
      content += `   Rating: ${item.content.vote_average.toFixed(1)}/10\n`;
      content += `   Added: ${new Date(item.dateAdded).toLocaleDateString()}\n`;
      
      if (includeProgress && item.progress > 0) {
        content += `   Progress: ${item.progress}%\n`;
      }
      
      if (includeNotes && item.personalNotes) {
        content += `   Notes: ${item.personalNotes}\n`;
      }
      
      if (includeTags && item.customTags.length > 0) {
        content += `   Tags: ${item.customTags.join(', ')}\n`;
      }
      
      content += '\n';
    });

    return content;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (exportFormat) {
      case 'csv':
        downloadFile(
          generateCSV(),
          `cineflix-watchlist-${timestamp}.csv`,
          'text/csv'
        );
        break;
      case 'json':
        downloadFile(
          generateJSON(),
          `cineflix-watchlist-${timestamp}.json`,
          'application/json'
        );
        break;
      case 'text':
        downloadFile(
          generateText(),
          `cineflix-watchlist-${timestamp}.txt`,
          'text/plain'
        );
        break;
      case 'pdf':
        // For PDF generation, you would typically use a library like jsPDF
        // For now, we'll export as text
        downloadFile(
          generateText(),
          `cineflix-watchlist-${timestamp}.txt`,
          'text/plain'
        );
        break;
    }
    
    onClose();
  };

  const generateShareableLink = () => {
    // In a real app, this would create a shareable link on your server
    const listData = btoa(JSON.stringify(items.slice(0, 10))); // Limit for URL length
    const link = `${window.location.origin}/shared-list?data=${listData}`;
    setShareableLink(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-netflix-red" />
            <h2 className="text-2xl font-bold text-white">Export My List</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-white mb-2">
              Exporting <span className="font-semibold text-netflix-red">{items.length}</span> items from your list
            </p>
            <p className="text-gray-400 text-sm">
              Choose your preferred format and customize what information to include.
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Export Format</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'pdf'
                    ? 'border-netflix-red bg-netflix-red/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <FileText className="w-6 h-6 text-netflix-red mx-auto mb-2" />
                <div className="text-white font-medium">PDF</div>
                <div className="text-gray-400 text-xs">Formatted document</div>
              </button>

              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-netflix-red bg-netflix-red/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <FileText className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-white font-medium">CSV</div>
                <div className="text-gray-400 text-xs">Spreadsheet format</div>
              </button>

              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'json'
                    ? 'border-netflix-red bg-netflix-red/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <FileJson className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-medium">JSON</div>
                <div className="text-gray-400 text-xs">Developer format</div>
              </button>

              <button
                onClick={() => setExportFormat('text')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'text'
                    ? 'border-netflix-red bg-netflix-red/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <div className="text-white font-medium">Text</div>
                <div className="text-gray-400 text-xs">Plain text file</div>
              </button>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Include Information</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeProgress}
                  onChange={(e) => setIncludeProgress(e.target.checked)}
                  className="w-4 h-4 text-netflix-red bg-gray-800 border-gray-600 rounded focus:ring-netflix-red"
                />
                <span className="text-white">Watch progress</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 text-netflix-red bg-gray-800 border-gray-600 rounded focus:ring-netflix-red"
                />
                <span className="text-white">Personal notes</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="w-4 h-4 text-netflix-red bg-gray-800 border-gray-600 rounded focus:ring-netflix-red"
                />
                <span className="text-white">Custom tags</span>
              </label>
            </div>
          </div>

          {/* Sharing Options */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Share Your List</h3>
            <div className="space-y-3">
              <button
                onClick={generateShareableLink}
                className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Link className="w-5 h-5 text-blue-400" />
                <span className="text-white">Generate Shareable Link</span>
              </button>

              {shareableLink && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 bg-netflix-red hover:bg-red-700 text-white rounded transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Share this link with friends to show them your watchlist (first 10 items)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-netflix-red hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Export {exportFormat.toUpperCase()}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
