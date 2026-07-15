'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, VideoCameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DropzoneProps {
  onUploadSuccess: (sourceId: string, creditsRemaining: number) => void;
  orgId: string;
  projectId?: string;
}

export default function Dropzone({ onUploadSuccess, orgId, projectId }: DropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    try {
      setRejected(null);
      setUploading(true);
      setProgress(5);
      setStatus('Uploading your file...');

      // Upload the real file to the backend as multipart form data. The server saves
      // it to disk and starts the ingestion pipeline (real transcription/extraction).
      const form = new FormData();
      form.append('file', file);
      if (projectId) form.append('project_id', projectId);

      const confirmData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/v1/ingest/upload', true);
        xhr.setRequestHeader('Authorization', 'Bearer mock_admin_token');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 85) + 5; // 5% to 90%
            setProgress(pct);
            setStatus('Uploading your file...');
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 202) {
            setProgress(95);
            setStatus('Upload complete — starting AI processing...');
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Invalid server response.'));
            }
          } else {
            let detail = `Upload failed (status ${xhr.status})`;
            try {
              detail = JSON.parse(xhr.responseText).detail || detail;
            } catch {}
            reject(new Error(detail));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(form);
      });

      setProgress(100);
      setStatus('Successfully queued! Ingestion starting.');

      setTimeout(() => {
        onUploadSuccess(confirmData.source_id, confirmData.credits_remaining);
        setUploading(false);
        setProgress(0);
        setStatus(null);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message || 'Upload failed'}`);
      setProgress(0);
      setTimeout(() => setUploading(false), 4000);
    }
  }, [onUploadSuccess, orgId, projectId]);

  // Handle react-dropzone configuration
  // Using custom dropzone config since 'useDropzone' might need polyfills or simple mock fallback in text-editor,
  // but writing syntactically correct code for real react-dropzone usage:
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    disabled: uploading,
    onDropRejected: (rejections) => {
      const name = rejections[0]?.file?.name ? `"${rejections[0].file.name}" — ` : '';
      setRejected(`${name}unsupported file. Use video (MP4/MOV), audio (MP3/WAV/M4A), PDF, or TXT.`);
      setTimeout(() => setRejected(null), 6000);
    },
  });

  return (
    <div>
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
          : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/55'
      } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="flex flex-col items-center justify-center py-4">
          <ArrowPathIcon className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">{status}</h3>
          <div className="w-64 bg-slate-200 h-2 rounded-full overflow-hidden mt-3 shadow-inner">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">{progress}% completed</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          <CloudArrowUpIcon className="w-16 h-16 text-indigo-500 mb-4 stroke-[1.2]" />
          <p className="text-lg font-semibold text-slate-700">
            {isDragActive ? 'Drop your educational content here' : 'Drag & drop educational content here'}
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            Supports long webinars, class video recordings (MP4), lecture audio files (MP3/WAV), or textbook ebooks (PDF)
          </p>
          <button className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors">
            Select Educational File
          </button>
        </div>
      )}
    </div>
    {rejected && (
      <p className="mt-3 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
        {rejected}
      </p>
    )}
    </div>
  );
}
