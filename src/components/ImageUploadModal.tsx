import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader } from 'lucide-react';
import { DEFAULT_BACKGROUNDS, BACKGROUND_CATEGORIES } from '../lib/default-backgrounds';

interface ImageUploadModalProps {
  currentImageUrl: string;
  currentPosition?: string;
  currentOpacity?: number;
  onSave: (imageUrl: string, position: string, opacity: number) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
  onClose: () => void;
}

export function ImageUploadModal({
  currentImageUrl,
  currentPosition = 'center',
  currentOpacity = 0.5,
  onSave,
  onUpload,
  onClose,
}: ImageUploadModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImageUrl, setSelectedImageUrl] = useState(currentImageUrl);
  const [imagePosition, setImagePosition] = useState(currentPosition);
  const [overlayOpacity, setOverlayOpacity] = useState(currentOpacity);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBackgrounds = selectedCategory === 'all'
    ? DEFAULT_BACKGROUNDS
    : DEFAULT_BACKGROUNDS.filter(bg => bg.category === selectedCategory);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const url = await onUpload(file);
      setSelectedImageUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(selectedImageUrl, imagePosition, overlayOpacity);
      onClose();
    } catch (error) {
      console.error('Error saving background:', error);
      alert('Failed to save background. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Change Background Image</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
            <div
              className="relative h-48 rounded-xl bg-cover bg-center overflow-hidden"
              style={{
                backgroundImage: `url(${selectedImageUrl})`,
                backgroundPosition: imagePosition,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, rgba(0, 0, 0, ${overlayOpacity * 0.8}), rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity * 1.2}))`,
                }}
              />
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold">Preview Text</h3>
                  <p className="text-white/90">Your content will appear here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image Position
              </label>
              <select
                value={imagePosition}
                onChange={(e) => setImagePosition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Overlay Opacity: {Math.round(overlayOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Your Own Image</h3>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-8 h-8 text-primary-500 animate-spin" />
                  <p className="text-gray-600">Uploading image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-gray-900 font-medium mb-1">
                      Drag and drop your image here
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      or click to browse files
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Recommended: 1920x1080px or larger, JPG/PNG/WebP, max 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Or Choose from Gallery
            </h3>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {BACKGROUND_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {filteredBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedImageUrl(bg.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden group ${
                    selectedImageUrl === bg.url
                      ? 'ring-4 ring-primary-500'
                      : 'ring-2 ring-gray-200 hover:ring-gray-300'
                  }`}
                >
                  <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  {selectedImageUrl === bg.url && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-white rotate-45" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white font-medium truncate">{bg.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Background'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
