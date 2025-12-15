import React from 'react';
import { X, Download, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { AIAnalysisReport } from '../types';

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: AIAnalysisReport | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const AIReportModal: React.FC<AIReportModalProps> = ({ isOpen, onClose, report, onSuccess, onError }) => {
    if (!isOpen || !report) return null;

    const handleExport = async () => {
        const markdown = `
# AI Dependency Analysis Report
**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Summary
${report.summary}

## Issues Identified
${report.issues.length > 0 ? report.issues.map(i => `- ${i}`).join('\n') : "No critical issues identified."}

## Suggested Dependencies
| Predecessor | Successor | Confidence | Reasoning |
|-------------|-----------|------------|-----------|
${report.suggestions.map(s => `| **${s.sourceName}** | **${s.targetName}** | ${s.confidence} | ${s.reason} |`).join('\n')}
        `;

        const filename = `AI_Report_${new Date().toISOString().slice(0, 10)}.md`;

        if (window.electronAPI?.isElectron) {
            try {
                const result = await window.electronAPI.saveFile(filename, markdown, [{ name: 'Markdown', extensions: ['md'] }]);
                if (result.success) {
                    if (onSuccess) onSuccess("AI Report exported successfully!");
                } else if (result.canceled) {
                    // User canceled, do nothing
                } else {
                    if (onError) onError(result.error || "Failed to save file");
                }
            } catch (e: any) {
                if (onError) onError(e.message || "Unknown error during export");
            }
        } else {
            try {
                const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();

                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess("AI Report exported successfully!");
                    }, 100);
                }
            } catch (e: any) {
                if (onError) onError(e.message || "Export failed");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={24} className="text-yellow-300" />
                        <div>
                            <h2 className="text-xl font-bold">Analysis Report</h2>
                            <p className="text-xs text-blue-100 opacity-80">{new Date(report.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Download size={16} /> Export MD
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
                    {/* Summary */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Summary</h3>
                        <p className="text-gray-600 leading-relaxed">{report.summary}</p>
                    </div>

                    {/* Issues */}
                    {report.issues.length > 0 ? (
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <div className="flex items-center gap-2 mb-4 text-red-700">
                                <AlertTriangle size={20} />
                                <h3 className="text-lg font-bold">Issues Identified</h3>
                            </div>
                            <ul className="space-y-2">
                                {report.issues.map((issue, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-red-800 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 text-green-700">
                            <CheckCircle2 size={24} />
                            <span className="font-medium">No circular dependencies or logical gaps found.</span>
                        </div>
                    )}

                    {/* Suggestions */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Dependency Suggestions</h3>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 w-1/4">Predecessor</th>
                                        <th className="px-6 py-3 w-1/4">Successor</th>
                                        <th className="px-6 py-3 w-24 text-center">Confidence</th>
                                        <th className="px-6 py-3">Reasoning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.suggestions.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.sourceName}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.targetName}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.confidence === 'High' ? 'bg-green-100 text-green-800' :
                                                    s.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {s.confidence}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic">"{s.reason}"</td>
                                        </tr>
                                    ))}
                                    {report.suggestions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                No dependencies suggested.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIReportModal;
