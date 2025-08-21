import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

interface SimpleRadioPlayerProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function SimpleRadioPlayer({ isActive, onToggle }: SimpleRadioPlayerProps) {
  // Component disabled - no floating button will be rendered
  return null;
}