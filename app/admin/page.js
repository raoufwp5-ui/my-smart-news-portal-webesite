'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertTriangle, ExternalLink, Image as ImageIcon, Upload, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch articles
    useEffect(() => {
        fetch('/api/admin/list-articles')
            .then(res => res.json())
            .then(data => {
                setArticles(data.articles || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load articles');
                setLoading(false);
            });
    }, []);

    const handleUpdateImage = async (slug, newUrl) => {
        if (!newUrl) return;

        try {
            const res = await fetch('/api/admin/update-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, imageUrl: newUrl })
            });

            if (res.ok) {
                // Optimistic update
                setArticles(prev => prev.map(a =>
                    a.slug === slug ? { ...a, image: newUrl, isCustomImage: true } : a
                ));
                alert('✅ Image Updated & Locked!');
            } else {
                alert('🔴 Failed to update');
            }
        } catch (e) {
            alert('🔴 Error: ' + e.message);
        }
    };

    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        if (!confirm('Sync all changes to GitHub?')) return;

        setSyncing(true);
        try {
            const res = await fetch('/api/admin/sync', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
            } else {
                alert('Sync Failed: ' + data.error);
            }
        } catch (e) {
            alert('Error syncing: ' + e.message);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading Dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-10 border-b border-gray-800 pb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Global Brief Admin
                    </h1>
                    <p className="text-gray-400 mt-2">Manage article images & lock content.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`px-6 py-3 rounded-xl flex items-center gap-3 font-bold shadow-lg transition-all ${syncing ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-900/20'
                        }`}
                >
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync to GitHub'}
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {articles.map((article) => (
                    <AdminCard
                        key={article.slug}
                        article={article}
                        onSave={handleUpdateImage}
                    />
                ))}
            </div>
        </div>
    );
}

function AdminCard({ article, onSave }) {
    const [url, setUrl] = useState(article.image);
    const [isDirty, setIsDirty] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                setUrl(data.url);
                setIsDirty(true);
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 bg-gray-800/50 border border-gray-700 p-6 rounded-xl hover:border-gray-500 transition-colors">
            {/* Thumbnail */}
            <div className="w-full md:w-64 shrink-0 relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-black border border-gray-700">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = '/default-news.jpg'} />
                </div>
                {article.isCustomImage && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg" title="Manual Image Locked">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-mono uppercase text-blue-400 mb-1 block">{article.category}</span>
                        <h3 className="text-xl font-bold leading-tight">{article.title}</h3>
                    </div>
                    <a href={`/article/${article.slug}`} target="_blank" className="text-gray-500 hover:text-white">
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>

                {/* Edit Controls */}
                <div className="flex gap-3 items-center pt-2">
                    <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); setIsDirty(true); }}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-10 pr-12 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-gray-300"
                            placeholder="https://..."
                        />
                        {/* Upload Button */}
                        <label className="absolute right-2 top-2 p-1 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer transition-colors" title="Upload Local Image">
                            {uploading ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Upload className="w-5 h-5 text-blue-400" />
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <button
                        onClick={() => { onSave(article.slug, url); setIsDirty(false); }}
                        disabled={!isDirty}
                        className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${isDirty
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>

                {article.isCustomImage ? (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Image manually verified & locked.
                    </p>
                ) : (
                    <p className="text-xs text-gray-500">Auto-generated image. Can be overwritten by AI.</p>
                )}
            </div>
        </div>
    );
}
