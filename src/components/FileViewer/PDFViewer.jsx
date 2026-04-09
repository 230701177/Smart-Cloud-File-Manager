import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

// Set worker from CDN for simplicity in Vite environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;

export default function PDFViewer({ url }) {
    const [pdf, setPdf] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const renderTaskRef = useRef(null);

    useEffect(() => {
        const loadPdf = async () => {
            setLoading(true);
            try {
                const loadingTask = pdfjsLib.getDocument(url);
                const pdfData = await loadingTask.promise;
                setPdf(pdfData);
                setNumPages(pdfData.numPages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setLoading(false);
            }
        };
        loadPdf();
    }, [url]);

    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        const renderPage = async () => {
            // Cancel previous render task if it exists
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const page = await pdf.getPage(pageNumber);
            const outputScale = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // High-DPI handling: set internal resolution higher than visual size
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";

            const transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                transform: transform
            };
            
            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;
            
            try {
                await renderTask.promise;
                renderTaskRef.current = null;
            } catch (err) {
                if (err.name !== 'RenderingCancelledException') {
                    console.error('Render error:', err);
                }
            }
        };

        renderPage();
    }, [pdf, pageNumber, scale]);

    const changePage = (offset) => {
        setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages));
    };

    const changeZoom = (factor) => {
        setScale(prev => {
            const next = Math.round((prev + factor) * 10) / 10;
            return Math.min(Math.max(0.5, next), 4.0);
        });
    };

    return (
        <div className="pdf-viewer-container" ref={containerRef}>
            {loading ? (
                <div className="pdf-viewer__loading">
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading PDF engine...</p>
                </div>
            ) : (
                <>
                    <div className="pdf-viewer__canvas-wrapper">
                        <canvas ref={canvasRef} />
                    </div>
                    
                    <div className="pdf-viewer__controls clay-card">
                        <div className="pdf-viewer__pagination">
                            <button 
                                className="btn-icon btn-icon--sm" 
                                onClick={() => changePage(-1)} 
                                disabled={pageNumber <= 1}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="pdf-viewer__page-info">
                                {pageNumber} / {numPages}
                            </span>
                            <button 
                                className="btn-icon btn-icon--sm" 
                                onClick={() => changePage(1)} 
                                disabled={pageNumber >= numPages}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        
                        <div className="pdf-viewer__divider" />
                        
                        <div className="pdf-viewer__zoom">
                            <button className="btn-icon btn-icon--sm" onClick={() => changeZoom(-0.2)}>
                                <ZoomOut size={16} />
                            </button>
                            <span className="pdf-viewer__zoom-info">{Math.round(scale * 100)}%</span>
                            <button className="btn-icon btn-icon--sm" onClick={() => changeZoom(0.2)}>
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
