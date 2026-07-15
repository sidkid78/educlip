"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

export default function Dropzone() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // In a real app, this would trigger the S3 presigned URL flow
    console.log("Files dropped:", acceptedFiles);
    alert(`Started processing ${acceptedFiles.length} file(s)`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center transition-all">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-4 gap-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <VideoCameraIcon className="w-8 h-8" />
          </div>
          <div className="p-3 bg-fuchsia-100 rounded-full text-fuchsia-600">
            <DocumentArrowUpIcon className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Drop Source Content Here</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Upload Video (MP4), paste a YouTube link, or drop a PDF Ebook to start extracting micro-learning assets.
        </p>
        <div className="mt-6">
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">
            Browse Files
          </button>
        </div>
      </div>
    </div>
  );
}
