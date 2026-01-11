import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PODUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchExistingPod = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('pod_path')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data?.pod_path) {
        // Normalize: handle comma-separated string or JSON array
        let urls = [];
        if (typeof data.pod_path === 'string') {
          urls = data.pod_path.split(',').filter(u => u.trim());
        } else if (Array.isArray(data.pod_path)) {
          urls = data.pod_path;
        }
        setExistingUrls(urls);
      }
    } catch (err) {
      console.error('Error fetching existing POD:', err);
    }
  };

  React.useEffect(() => {
    if (id) fetchExistingPod();
  }, [id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary credentials missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image to Cloudinary');
    const data = await response.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (images.length === 0) return;
    setUploading(true);
    setError('');

    try {
      // 1. Upload all to Cloudinary
      const uploadPromises = images.map(img => uploadToCloudinary(img.file));
      const urls = await Promise.all(uploadPromises);

      // 2. Refresh existing URLs right before update to prevent race conditions
      const { data: latestData } = await supabase
        .from('trips')
        .select('pod_path')
        .eq('id', id)
        .single();

      let currentUrls = [];
      if (latestData?.pod_path) {
        if (typeof latestData.pod_path === 'string') {
          currentUrls = latestData.pod_path.split(',').filter(u => u.trim());
        } else if (Array.isArray(latestData.pod_path)) {
          currentUrls = latestData.pod_path;
        }
      }

      // 3. Combine and Update Supabase
      const combinedUrls = [...currentUrls, ...urls];
      const podPath = combinedUrls.join(',');

      const { error: dbError } = await supabase
        .from('trips')
        .update({
          pod_path: podPath,
          pod_status: 'Received'
        })
        .eq('id', id);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => navigate(`/trips/${id}`), 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload POD');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h2>Upload POD</h2>
      </div>

      <div className="glass upload-area">
        <div className="upload-options">
          <label className="option-btn cam">
            <Camera size={24} />
            <span>Camera</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} hidden />
          </label>
          <label className="option-btn gal">
            <ImageIcon size={24} />
            <span>Gallery</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
          </label>
        </div>

        <div className="preview-grid">
          {images.map((img, idx) => (
            <div key={idx} className="preview-item">
              <img src={img.preview} alt="POD Preview" />
              <button className="remove-btn" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}>
                <X size={14} />
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <p className="empty-text">No images selected</p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-box">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-box">
          <CheckCircle2 size={18} />
          <span>POD Uploaded Successfully!</span>
        </div>
      )}

      <button
        className="btn btn-primary upload-submit"
        onClick={handleUpload}
        disabled={uploading || images.length === 0 || success}
      >
        <Upload size={20} />
        <span>{uploading ? 'Uploading...' : 'Submit POD'}</span>
      </button>

      <style jsx>{`
        .upload-page {
          padding-top: 0.5rem;
        }
        .upload-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
        }
        .upload-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }

        .upload-area {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .upload-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .option-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 1.5rem;
          border: 1px dashed var(--glass-border);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .option-btn:active {
          background: var(--glass-bg);
          border-color: var(--accent-color);
          color: var(--accent-color);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .preview-item {
          aspect-ratio: 1;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
        }
        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.5);
          border: none;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .empty-text {
          grid-column: span 3;
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem 0;
          font-style: italic;
        }

        .error-box, .success-box {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .error-box { background: rgba(248, 81, 73, 0.1); color: #f85149; }
        .success-box { background: rgba(63, 185, 80, 0.1); color: #3fb950; }

        .upload-submit {
          width: 100%;
          margin-top: 2rem;
          padding: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
      `}</style>
    </div>
  );
};

export default PODUpload;
