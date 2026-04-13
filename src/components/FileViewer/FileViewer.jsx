import React, { useState, useEffect } from 'react';
import {
    X, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight, FileText, Loader2, Sparkles, Brain, Copy, RotateCw, Check
} from 'lucide-react';
import { useFiles } from '../../contexts/FileContext';
import { formatBytes } from '../../utils/helpers';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PDFViewer from './PDFViewer';
import './FileViewer.css';
import './AIView.css';

export default function FileViewer() {
    const { viewingFile, showViewer, dispatch, summarizeFile } = useFiles();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [aiError, setAiError] = useState(null);

    useEffect(() => {
        if (!showViewer) {
            setShowAI(false);
            setAiSummary(null);
            setAiError(null);
        }
    }, [showViewer]);

    useEffect(() => {
        if (showViewer && viewingFile) {
            loadFileContent();
        } else {
            setContent(null);
            setError(null);
        }
    }, [showViewer, viewingFile]);

    const loadFileContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const fileExt = viewingFile?.name?.split('.').pop()?.toLowerCase();

            if (!token) {
                throw new Error('Missing auth token');
            }

            if (!viewingFile?.id || !viewingFile?.name) {
                throw new Error('Invalid file metadata for preview');
            }

            // Render PDFs from the authenticated download URL directly.
            // This avoids blob conversion issues that can fail on some environments.
            if (fileExt === 'pdf') {
                const pdfUrl = `/api/files/download/${viewingFile.id}?token=${encodeURIComponent(token)}`;
                setContent(<PDFViewer url={pdfUrl} />);
                return;
            }

            const response = await fetch(`/api/files/download/${viewingFile.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load file content');

            const blob = await response.blob();

            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
                setContent(<img src={URL.createObjectURL(blob)} alt={viewingFile.name} className="viewer__image" />);
            } else if (fileExt === 'docx') {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setContent(<div className="viewer__docx" dangerouslySetInnerHTML={{ __html: result.value }} />);
            } else if (fileExt === 'csv') {
                const text = await blob.text();
                const result = Papa.parse(text, { header: true });
                setContent(
                    <div className="viewer__table-container">
                        <table className="viewer__table">
                            <thead>
                                <tr>
                                    {result.meta.fields?.map(f => <th key={f}>{f}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {result.data.slice(0, 100).map((row, i) => (
                                    <tr key={i}>
                                        {result.meta.fields?.map(f => <td key={f}>{row[f]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {result.data.length > 100 && <p className="text-xs text-center py-2 text-tertiary">Showing first 100 rows</p>}
                    </div>
                );
            } else if (['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'json', 'py', 'java', 'c', 'cpp', 'sql', 'md'].includes(fileExt)) {
                const text = await blob.text();
                setContent(
                    <SyntaxHighlighter
                        language={fileExt === 'jsx' ? 'javascript' : fileExt}
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, borderRadius: 'var(--radius-lg)', background: 'transparent' }}
                    >
                        {text}
                    </SyntaxHighlighter>
                );
            } else {
                const text = await blob.text();
                setContent(<pre className="viewer__text">{text}</pre>);
            }
        } catch (err) {
            console.error(err);
            setError('Could not preview this file. You can still download it.');
        } finally {
            setLoading(false);
        }
    };

    if (!showViewer || !viewingFile) return null;

    const handleDownload = () => {
        const token = localStorage.getItem('token');
        window.open(`/api/files/download/${viewingFile.id}?token=${token}`, '_blank');
    };

    const handleSummarize = async (force = false) => {
        if (aiSummary && !force) {
            setShowAI(!showAI);
            return;
        }
        
        setShowAI(true);
        setIsSummarizing(true);
        setAiError(null);
        if (force) setAiSummary(null);
        
        try {
            const summary = await summarizeFile(viewingFile.id);
            setAiSummary(summary);
        } catch (err) {
            console.error('Summarization failed', err);
            setAiError(err.message || 'Gemini couldn\'t read this document.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const copySummary = () => {
        if (!aiSummary) return;

        let textToCopy = "";
        try {
            const raw = aiSummary.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(raw);
            
            textToCopy += `📌 OVERVIEW\n${parsed.overview}\n\n`;
            if (parsed.keyPoints?.length > 0) {
                textToCopy += `🔑 KEY POINTS\n${parsed.keyPoints.map(p => `• ${p}`).join('\n')}\n\n`;
            }
            if (parsed.details?.length > 0) {
                textToCopy += `📊 DETAILS\n${parsed.details.map(p => `• ${p}`).join('\n')}\n\n`;
            }
            textToCopy += `✅ TAKEAWAY\n${parsed.takeaway}`;
        } catch {
            textToCopy = aiSummary; // Fallback to raw text
        }

        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`viewer-overlay ${isMaximized ? 'viewer-overlay--maximized' : ''}`} onClick={() => dispatch({ type: 'CLOSE_VIEWER' })}>
            <div className="viewer-container animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="viewer__header">
                    <div className="viewer__info">
                        <div className="viewer__icon-wrapper">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="viewer__filename truncate">{viewingFile.name}</h3>
                            <p className="viewer__filesize">{formatBytes(viewingFile.size)}</p>
                        </div>
                    </div>
                    <div className="viewer__actions">
                        {['pdf', 'docx', 'txt', 'md'].includes(viewingFile.name.split('.').pop().toLowerCase()) && (
                            <button 
                                className={`btn-icon ${showAI ? 'btn-icon--active' : ''}`} 
                                onClick={handleSummarize} 
                                title="Summarize with Gemini"
                                style={{ color: 'var(--color-primary)' }}
                            >
                                <Sparkles size={18} />
                            </button>
                        )}
                        <button className="btn-icon" onClick={handleDownload} title="Download"><Download size={18} /></button>
                        <button className="btn-icon" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Restore" : "Maximize"}>
                            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className="btn-icon viewer__close" onClick={() => dispatch({ type: 'CLOSE_VIEWER' })}><X size={18} /></button>
                    </div>
                </div>

                <div className={`viewer__layout ${showAI ? 'viewer__layout--split' : ''}`}>
                    <div className="viewer__body">
                        {loading ? (
                            <div className="viewer__status">
                                <Loader2 size={40} className="animate-spin text-primary" />
                                <p>Reading document...</p>
                            </div>
                        ) : error ? (
                            <div className="viewer__status viewer__status--error">
                                <p>{error}</p>
                                <button className="btn btn-primary mt-4" onClick={handleDownload}>Download File</button>
                            </div>
                        ) : (
                            <div className="viewer__content clay-card">
                                {content}
                            </div>
                        )}
                    </div>

                    {showAI && (
                        <div className="viewer__ai-panel animate-slide-left">
                            <div className="ai-panel__header">
                                <div className="flex items-center gap-2">
                                    <Brain size={16} className="text-primary" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Gemini Insights</span>
                                </div>
                                <button className="btn-icon-sm" onClick={() => setShowAI(false)}><X size={14} /></button>
                            </div>

                            <div className="ai-panel__body">
                                {isSummarizing ? (
                                    <div className="ai-panel__loading">
                                        <div className="ai-panel__shimmer" />
                                        <div className="ai-panel__skeleton" />
                                        <div className="ai-panel__skeleton" />
                                        <div className="ai-panel__skeleton" style={{ width: '60%' }} />
                                        <p className="text-xs text-center mt-4 text-tertiary">Analyzing document content...</p>
                                    </div>
                                ) : aiError ? (
                                    <div className="ai-panel__error animate-fade-in">
                                        <p className="text-sm text-center text-danger mb-4">{aiError}</p>
                                        <button className="btn btn-primary btn-sm w-full" onClick={handleSummarize}>
                                            <RotateCw size={14} /> Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ai-panel__content animate-fade-in">
                                        <div className="ai-panel__actions-row">
                                            <button className="btn-ghost-sm" onClick={copySummary}>
                                                {isCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Summary</>}
                                            </button>
                                            <button className="btn-ghost-sm" onClick={() => handleSummarize(true)}>
                                                <RotateCw size={14} /> Regenerate
                                            </button>
                                        </div>
                                        {(() => {
                                            let parsed;
                                            try {
                                                const raw = aiSummary.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                                                parsed = JSON.parse(raw);
                                            } catch {
                                                // Fallback: render raw text
                                                return (
                                                    <div className="ai-panel__text">
                                                        {aiSummary?.split('\n').map((line, i) => 
                                                            line.trim() ? <p key={i}>{line}</p> : null
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="ai-panel__sections">
                                                    {parsed.overview && (
                                                        <div className="ai-section">
                                                            <div className="ai-section__title">
                                                                <span className="ai-section__icon">🧠</span> Overview
                                                            </div>
                                                            <p className="ai-section__text">{parsed.overview}</p>
                                                        </div>
                                                    )}

                                                    {parsed.keyPoints?.length > 0 && (
                                                        <div className="ai-section">
                                                            <div className="ai-section__title">
                                                                <span className="ai-section__icon">🔑</span> Key Points
                                                            </div>
                                                            <ul className="ai-section__list">
                                                                {parsed.keyPoints.map((pt, i) => (
                                                                    <li key={i}>{pt}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {parsed.details?.length > 0 && (
                                                        <div className="ai-section">
                                                            <div className="ai-section__title">
                                                                <span className="ai-section__icon">📊</span> Important Details
                                                            </div>
                                                            <ul className="ai-section__list ai-section__list--details">
                                                                {parsed.details.map((d, i) => (
                                                                    <li key={i}>{d}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {parsed.takeaway && (
                                                        <div className="ai-section ai-section--takeaway">
                                                            <div className="ai-section__title">
                                                                <span className="ai-section__icon">✅</span> Takeaway
                                                            </div>
                                                            <p className="ai-section__text">{parsed.takeaway}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
