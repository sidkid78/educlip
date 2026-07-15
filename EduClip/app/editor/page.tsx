import React from 'react';
import SourcePanel from './components/SourcePanel';
import AssetCanvas from './components/AssetCanvas';
import ControlPanel from './components/ControlPanel';

export default function EditorPage() {
  return (
    // Overriding the default padding from layout.tsx for the editor to take full height/width
    <div className="absolute inset-0 z-10 bg-white flex overflow-hidden">
      <SourcePanel />
      <AssetCanvas />
      <ControlPanel />
    </div>
  );
}
