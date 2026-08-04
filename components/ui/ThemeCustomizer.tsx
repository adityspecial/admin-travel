"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Palette, X, RotateCcw, Check, Sparkles, Type, Sliders } from 'lucide-react';

interface PrimarySwatch {
  name: string;
  hex: string;
  grad: string;
}

interface BgPreset {
  id: string;
  label: string;
  start: string;
  mid: string;
  end: string;
}

interface SidebarOption {
  name: string;
  bg: string;
  text: string;
}

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Typography & Color Picker states
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>("Poppins");
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [fontColor, setFontColor] = useState<string>("#222222");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");

  // Accent, Presets & Glass states
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [bgPreset, setBgPreset] = useState<string>('aero');
  const [sidebarBg, setSidebarBg] = useState<string>('#0f172a');
  const [glassBlur, setGlassBlur] = useState<number>(24);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.75);

  // Color Swatches
  const primarySwatches: PrimarySwatch[] = [
    { name: 'Aero Blue', hex: '#3b82f6', grad: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)' },
    { name: 'Emerald', hex: '#10b981', grad: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)' },
    { name: 'Purple Neon', hex: '#8b5cf6', grad: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)' },
    { name: 'Sunset Gold', hex: '#f59e0b', grad: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' },
    { name: 'Rose Crimson', hex: '#f43f5e', grad: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #e11d48 100%)' },
    { name: 'Electric Cyan', hex: '#06b6d4', grad: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)' }
  ];

  const bgPresets: BgPreset[] = [
    { id: 'aero', label: 'Aero Light', start: '#ebf2fa', mid: '#dce6f2', end: '#d4e0ee' },
    { id: 'dark', label: 'Dark Midnight', start: '#090d16', mid: '#0f172a', end: '#1e293b' },
    { id: 'slate', label: 'Clean Slate', start: '#f1f5f9', mid: '#e2e8f0', end: '#cbd5e1' },
    { id: 'emerald', label: 'Soft Mint', start: '#ecfdf5', mid: '#d1fae5', end: '#a7f3d0' },
    { id: 'sunset', label: 'Warm Cream', start: '#fff7ed', mid: '#ffedd5', end: '#fed7aa' }
  ];

  const sidebarOptions: SidebarOption[] = [
    { name: 'Dark Navy', bg: '#0f172a', text: '#ffffff' },
    { name: 'Deep Charcoal', bg: '#18181b', text: '#ffffff' },
    { name: 'Royal Sapphire', bg: '#1e1b4b', text: '#ffffff' },
    { name: 'Forest Emerald', bg: '#064e3b', text: '#ffffff' },
    { name: 'Pure Glass White', bg: 'rgba(255, 255, 255, 0.85)', text: '#1e293b' }
  ];

  const fontWeights = [
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'SemiBold', value: '600' },
    { label: 'Bold', value: '700' }
  ];

  // Handle Outside Click & Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Load saved theme on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('app-theme-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.fontWeight) setFontWeight(parsed.fontWeight);
        if (parsed.fontColor) setFontColor(parsed.fontColor);
        if (parsed.backgroundColor) setBackgroundColor(parsed.backgroundColor);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.bgPreset) setBgPreset(parsed.bgPreset);
        if (parsed.sidebarBg) setSidebarBg(parsed.sidebarBg);
        if (parsed.glassBlur !== undefined) setGlassBlur(parsed.glassBlur);
        if (parsed.glassOpacity !== undefined) setGlassOpacity(parsed.glassOpacity);
      } catch (e) {
        console.error('Failed to parse saved theme settings', e);
      }
    }
  }, []);

  // Apply CSS custom properties dynamically to document root
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Google Font dynamically if needed
    const standardFonts = ["Arial", "Verdana", "Times New Roman"];
    if (!standardFonts.includes(fontFamily)) {
      const fontId = `google-font-${fontFamily.toLowerCase().replace(/\s+/g, "-")}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }

    const root = document.documentElement;

    // Typography variables
    root.style.setProperty('--app-font-size', `${fontSize}px`);
    root.style.setProperty('--app-font-family', `'${fontFamily}', sans-serif`);
    root.style.setProperty('--app-font-weight', fontWeight);
    root.style.setProperty('--app-font-color', fontColor);
    root.style.setProperty('--app-bg-color', backgroundColor);
    root.style.setProperty('--font', `'${fontFamily}', sans-serif`);
    root.style.setProperty('--ink', fontColor);

    document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
    document.body.style.fontSize = `${fontSize}px`;
    document.body.style.fontWeight = fontWeight;
    document.body.style.color = fontColor;

    // Apply primary color & gradient
    const selectedPrimary = primarySwatches.find((s) => s.hex === primaryColor) || primarySwatches[0];
    root.style.setProperty('--primary-blue', selectedPrimary.hex);
    root.style.setProperty('--primary-gradient', selectedPrimary.grad);
    root.style.setProperty('--accent', selectedPrimary.hex);

    // Background styling
    if (bgPreset === 'custom') {
      root.style.setProperty('--bg', backgroundColor);
      document.body.style.background = backgroundColor;
    } else {
      const selectedBg = bgPresets.find((b) => b.id === bgPreset) || bgPresets[0];
      root.style.setProperty('--bg-gradient-start', selectedBg.start);
      root.style.setProperty('--bg-gradient-mid', selectedBg.mid);
      root.style.setProperty('--bg-gradient-end', selectedBg.end);
      root.style.setProperty('--bg', selectedBg.start);
      document.body.style.background = `linear-gradient(135deg, ${selectedBg.start} 0%, ${selectedBg.mid} 50%, ${selectedBg.end} 100%)`;
    }

    // Apply sidebar background
    const selectedSidebar = sidebarOptions.find((s) => s.bg === sidebarBg) || sidebarOptions[0];
    root.style.setProperty('--sidebar-bg', selectedSidebar.bg);
    root.style.setProperty('--sidebar-text', selectedSidebar.text);

    // Apply glass opacity and blur
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    root.style.setProperty('--glass-bg-opacity', `${glassOpacity}`);

    // Persist to local storage
    localStorage.setItem(
      'app-theme-settings',
      JSON.stringify({
        fontSize,
        fontFamily,
        fontWeight,
        fontColor,
        backgroundColor,
        primaryColor,
        bgPreset,
        sidebarBg,
        glassBlur,
        glassOpacity
      })
    );
  }, [fontSize, fontFamily, fontWeight, fontColor, backgroundColor, primaryColor, bgPreset, sidebarBg, glassBlur, glassOpacity]);

  const handleReset = () => {
    setFontSize(16);
    setFontFamily("Poppins");
    setFontWeight("400");
    setFontColor("#222222");
    setBackgroundColor("#ffffff");
    setPrimaryColor('#3b82f6');
    setBgPreset('aero');
    setSidebarBg('#0f172a');
    setGlassBlur(24);
    setGlassOpacity(0.75);
    localStorage.removeItem('app-theme-settings');
  };

  return (
    <>
      {/* Floating Design Scroller Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '28px',
          zIndex: 100,
          backgroundColor: primaryColor,
          color: '#ffffff',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          width: '52px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25), 0 0 15px ' + primaryColor,
          cursor: 'pointer',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        title="Customize Design & Colors"
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) rotate(0deg)')}
      >
        <Palette size={24} />
      </button>

      {/* Theme Customizer Drawer Scroller */}
      <div
        ref={drawerRef}
        className="theme-customizer-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          maxWidth: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(24px)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.18)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 20px',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, visibility 0.35s ease'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color={primaryColor} />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Theme & Typography</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* SECTION 1: Typography Controls */}
          <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Type size={16} color={primaryColor} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Typography & Text</span>
            </div>

            {/* Font Family */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 500
                }}
              >
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>

            {/* Font Size Slider */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                <span>Font Size</span>
                <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="30"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: primaryColor }}
              />
            </div>

            {/* Font Weight */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Font Weight
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {fontWeights.map((w) => {
                  const isSelected = fontWeight === w.value;
                  return (
                    <button
                      key={w.value}
                      onClick={() => setFontWeight(w.value)}
                      style={{
                        padding: '6px 4px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: isSelected ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#ffffff' : '#f1f5f9',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? primaryColor : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Custom Color Pickers */}
          <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Sliders size={16} color={primaryColor} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Color Pickers</span>
            </div>

            {/* Font Color Picker */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Font Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{fontColor}</span>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={{ width: '36px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '1px', backgroundColor: '#ffffff' }}
                />
              </div>
            </div>

            {/* Background Color Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{backgroundColor}</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    setBgPreset('custom');
                  }}
                  style={{ width: '36px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '1px', backgroundColor: '#ffffff' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Primary Accent Color Swatches */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              Primary Accent Swatches
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {primarySwatches.map((swatch, idx) => {
                const isSelected = primaryColor === swatch.hex;
                return (
                  <button
                    key={idx}
                    onClick={() => setPrimaryColor(swatch.hex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${swatch.hex}` : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? 'rgba(241, 245, 249, 0.9)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 400,
                      color: '#1e293b'
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: swatch.grad,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span>{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Page Background Gradient Presets */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              Page Background Presets
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bgPresets.map((preset) => {
                const isSelected = bgPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setBgPreset(preset.id);
                      setBackgroundColor(preset.start);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                      background: `linear-gradient(90deg, ${preset.start} 0%, ${preset.mid} 50%, ${preset.end} 100%)`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: preset.id === 'dark' ? '#ffffff' : '#1e293b'
                    }}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check size={16} color={preset.id === 'dark' ? '#ffffff' : primaryColor} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: Sidebar Panel Theme Options */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              Sidebar Panel Background
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sidebarOptions.map((opt, idx) => {
                const isSelected = sidebarBg === opt.bg;
                return (
                  <button
                    key={idx}
                    onClick={() => setSidebarBg(opt.bg)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: opt.bg,
                      border: isSelected ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                      color: opt.text,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <span>{opt.name}</span>
                    {isSelected && <Check size={16} color={opt.text} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Glass Blur & Opacity Sliders */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Glass Blur Radius ({glassBlur}px)
            </label>
            <input
              type="range"
              min="0"
              max="40"
              value={glassBlur}
              onChange={(e) => setGlassBlur(Number(e.target.value))}
              style={{ width: '100%', accentColor: primaryColor, marginBottom: '16px' }}
            />

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Card Transparency ({Math.round(glassOpacity * 100)}%)
            </label>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={glassOpacity}
              onChange={(e) => setGlassOpacity(Number(e.target.value))}
              style={{ width: '100%', accentColor: primaryColor }}
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <RotateCcw size={16} />
          <span>Reset to Default Design</span>
        </button>
      </div>
    </>
  );
}

export default ThemeCustomizer;