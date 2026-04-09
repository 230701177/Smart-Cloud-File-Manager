import { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useFiles } from '../../contexts/FileContext';
import { formatBytes } from '../../utils/helpers';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PDFViewer from './PDFViewer';
import './FileViewer.css';

export default function FileViewer() {
    const { viewingFile, showViewer, dispatch } = useFiles();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);

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
            const response = await fetch(`/api/files/download/${viewingFile.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load file content');

            const blob = await response.blob();
            const fileExt = viewingFile.name.split('.').pop().toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
                setContent(<img src={URL.createObjectURL(blob)} alt={viewingFile.name} className="viewer__image" />);
            } else if (fileExt === 'pdf') {
                const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                const url = URL.createObjectURL(pdfBlob);
                setContent(<PDFViewer url={url} />);
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
            setError('Could not preview this file format. You can still download it.');
        } finally {
            setLoading(false);
        }
    };

    if (!showViewer || !viewingFile) return null;

    const handleDownload = () => {
        const token = localStorage.getItem('token');
        window.open(`/api/files/download/${viewingFile.id}?token=${token}`, '_blank');
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
                        <button className="btn-icon" onClick={handleDownload} title="Download"><Download size={18} /></button>
                        <button className="btn-icon" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Restore" : "Maximize"}>
                            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className="btn-icon viewer__close" onClick={() => dispatch({ type: 'CLOSE_VIEWER' })}><X size={18} /></button>
                    </div>
                </div>

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
            </div>
        </div>
    );
}
