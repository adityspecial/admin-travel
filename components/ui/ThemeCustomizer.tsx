"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Palette, X, RotateCcw, Check, Sparkles, Type, Sliders, Minus, Plus } from 'lucide-react';
import './ThemeCustomizer.css';

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

interface HeaderOption {
  name: string;
  bg: string;
  text: string;
}

// Default body font size and the app's fixed type scale (see globals.css
// `--text-xs` … `--text-3xl`). Every +/- click shifts ALL of these — body and
// headings alike — by the same 1px delta, so the whole app scales together.
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 30;
const BASE_TEXT_SCALE: Record<string, number> = {
  xs: 11, sm: 12, base: 13, md: 15, lg: 18, xl: 22, '2xl': 28, '3xl': 36,
};

// Semantic role sizes (--fs-*, see globals.css). Same delta as BASE_TEXT_SCALE.
const BASE_SEMANTIC_SCALE: Record<string, number> = {
  caption: 12, placeholder: 14, label: 14, body: 16, button: 16, nav: 16,
  'card-title': 18, 'section-heading': 24, 'page-heading': 36, 'hero-heading': 48,
};

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '';
  const isBiz = pathname.startsWith('/biz');

  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Typography & Color Picker states
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [fontFamily, setFontFamily] = useState<string>("Poppins");
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [fontColor, setFontColor] = useState<string>("#222222");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");

  // Accent, Presets & Glass states
  const [primaryColor, setPrimaryColor] = useState<string>('#E31E24');
  const [bgPreset, setBgPreset] = useState<string>('aero');
  const [sidebarBg, setSidebarBg] = useState<string>('#0f172a');
  const [headerBg, setHeaderBg] = useState<string>('rgba(255, 255, 255, 0.88)');
  const [headerText, setHeaderText] = useState<string>('#111827');
  const [glassBlur, setGlassBlur] = useState<number>(24);
  const [glassOpacity, setGlassOpacity] = useState<number>(0.75);

  // Color Swatches
  const primarySwatches: PrimarySwatch[] = [
    { name: 'Corporate Red', hex: '#E31E24', grad: 'linear-gradient(135deg, #ef4444 0%, #E31E24 50%, #b91c1c 100%)' },
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

  const headerOptions: HeaderOption[] = [
    { name: 'Pure White Glass', bg: 'rgba(255, 255, 255, 0.88)', text: '#111827' },
    { name: 'Light Aero Blue', bg: 'rgba(240, 249, 255, 0.95)', text: '#0369a1' },
    { name: 'Dark Midnight', bg: '#0f172a', text: '#ffffff' },
    { name: 'Deep Charcoal', bg: '#18181b', text: '#ffffff' },
    { name: 'Royal Sapphire', bg: '#1e1b4b', text: '#ffffff' },
    { name: 'Warm Cream Sunset', bg: 'rgba(255, 247, 237, 0.95)', text: '#9a3412' }
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
        if (parsed.headerBg) setHeaderBg(parsed.headerBg);
        if (parsed.headerText) setHeaderText(parsed.headerText);
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

    // Shift every heading/label size in the app's type scale by the same
    // delta as the body font, so +/- affects headings and body together.
    const offset = fontSize - DEFAULT_FONT_SIZE;
    for (const key in BASE_TEXT_SCALE) {
      root.style.setProperty(`--text-${key}`, `${BASE_TEXT_SCALE[key] + offset}px`);
    }
    for (const key in BASE_SEMANTIC_SCALE) {
      root.style.setProperty(`--fs-${key}`, `${BASE_SEMANTIC_SCALE[key] + offset}px`);
    }

    // Apply primary color & gradient
    const selectedPrimary = primarySwatches.find((s) => s.hex === primaryColor) || primarySwatches[0];
    root.style.setProperty('--primary-color', selectedPrimary.hex);
    root.style.setProperty('--primary-red', selectedPrimary.hex);
    root.style.setProperty('--primary-blue', selectedPrimary.hex);
    root.style.setProperty('--primary-gradient', selectedPrimary.grad);
    root.style.setProperty('--accent', selectedPrimary.hex);
    root.style.setProperty('--nav-brand', selectedPrimary.hex);

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

    // Apply header background & text color
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--header-text', headerText);

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
        headerBg,
        headerText,
        glassBlur,
        glassOpacity
      })
    );
  }, [fontSize, fontFamily, fontWeight, fontColor, backgroundColor, primaryColor, bgPreset, sidebarBg, headerBg, headerText, glassBlur, glassOpacity]);

  const increaseFontSize = () => setFontSize((f) => Math.min(f + 1, MAX_FONT_SIZE));
  const decreaseFontSize = () => setFontSize((f) => Math.max(f - 1, MIN_FONT_SIZE));
  const resetFontSize = () => setFontSize(DEFAULT_FONT_SIZE);

  const handleReset = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    setFontFamily("Poppins");
    setFontWeight("400");
    setFontColor("#222222");
    setBackgroundColor("#ffffff");
    setPrimaryColor('#E31E24');
    setBgPreset('aero');
    setSidebarBg('#0f172a');
    setHeaderBg('rgba(255, 255, 255, 0.88)');
    setHeaderText('#111827');
    setGlassBlur(24);
    setGlassOpacity(0.75);
    localStorage.removeItem('app-theme-settings');
  };

  // Drives every var(--accent-color) reference in ThemeCustomizer.css so the
  // drawer's own accents (selected borders, stepper icons, slider thumbs)
  // follow whichever primary color is currently picked.
  const rootVars = { '--accent-color': primaryColor } as React.CSSProperties;

  return (
    <div style={rootVars}>
      {/* Floating Design Scroller Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-btn"
        title="Customize Design & Colors"
      >
        <Palette size={24} />
      </button>

      {/* Theme Customizer Drawer Scroller */}
      <div
        ref={drawerRef}
        className={`theme-customizer-drawer ${isOpen ? 'open' : ''}`}
      >
        <div>
          {/* Header */}
          <div className="theme-drawer-header">
            <div className="theme-drawer-header-left">
              <Sparkles size={20} color={primaryColor} />
              <h3 className="theme-drawer-title">Theme & Typography</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="theme-drawer-close-btn">
              <X size={20} />
            </button>
          </div>

          {/* SECTION 1: Typography Controls */}
          <div className="theme-section">
            <div className="theme-section-header">
              <Type size={16} color={primaryColor} />
              <span className="theme-section-label">Typography & Text</span>
            </div>

            {/* Font Family */}
            <div className="theme-field">
              <label className="theme-field-label">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="theme-select"
              >
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>

            {/* Font Size Stepper */}
            <div className="theme-field">
              <div className="theme-fontsize-row">
                <span>Font Size</span>
                <span className="theme-fontsize-badge">{fontSize}px</span>
              </div>
              <div className="theme-fontsize-stepper">
                <button
                  type="button"
                  className="theme-stepper-btn"
                  onClick={decreaseFontSize}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  title="Decrease font size by 1px"
                >
                  <Minus size={14} />
                </button>
                <span className="theme-stepper-value">{fontSize}px</span>
                <button
                  type="button"
                  className="theme-stepper-btn"
                  onClick={increaseFontSize}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  title="Increase font size by 1px"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="theme-stepper-default-btn"
                  onClick={resetFontSize}
                  title="Reset to default font size"
                >
                  Default
                </button>
              </div>
            </div>

            {/* Font Weight */}
            <div className="theme-field">
              <label className="theme-field-label">Font Weight</label>
              <div className="theme-weight-grid">
                {fontWeights.map((w) => {
                  const isSelected = fontWeight === w.value;
                  return (
                    <button
                      key={w.value}
                      onClick={() => setFontWeight(w.value)}
                      className={`theme-weight-btn ${isSelected ? 'selected' : ''}`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Custom Color Pickers */}
          <div className="theme-section">
            <div className="theme-section-header">
              <Sliders size={16} color={primaryColor} />
              <span className="theme-section-label">Color Pickers</span>
            </div>

            {/* Font Color Picker */}
            <div className="theme-color-row">
              <label className="theme-color-row-label">Font Color</label>
              <div className="theme-color-row-right">
                <span className="theme-color-hex">{fontColor}</span>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="theme-color-input"
                />
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="theme-color-row">
              <label className="theme-color-row-label">Background Color</label>
              <div className="theme-color-row-right">
                <span className="theme-color-hex">{backgroundColor}</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    setBgPreset('custom');
                  }}
                  className="theme-color-input"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Primary Accent Color Swatches */}
          <div className="theme-block">
            <label className="theme-block-label">Primary Accent Swatches</label>
            <div className="theme-swatch-grid">
              {primarySwatches.map((swatch, idx) => {
                const isSelected = primaryColor === swatch.hex;
                return (
                  <button
                    key={idx}
                    onClick={() => setPrimaryColor(swatch.hex)}
                    className={`theme-swatch-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="theme-swatch-dot" style={{ background: swatch.grad }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span>{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Page Background Gradient Presets */}
          <div className="theme-block">
            <label className="theme-block-label">Page Background Presets</label>
            <div className="theme-preset-list">
              {bgPresets.map((preset) => {
                const isSelected = bgPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setBgPreset(preset.id);
                      setBackgroundColor(preset.start);
                    }}
                    className={`theme-preset-btn ${isSelected ? 'selected' : ''} ${preset.id === 'dark' ? 'dark' : ''}`}
                    style={{ background: `linear-gradient(90deg, ${preset.start} 0%, ${preset.mid} 50%, ${preset.end} 100%)` }}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check size={16} color={preset.id === 'dark' ? '#ffffff' : primaryColor} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: Header or Sidebar Panel Theme Options */}
          <div className="theme-block">
            <label className="theme-block-label">
              {isBiz ? 'Header Background' : 'Sidebar Panel Background'}
            </label>
            <div className="theme-preset-list">
              {isBiz
                ? headerOptions.map((opt, idx) => {
                  const isSelected = headerBg === opt.bg;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setHeaderBg(opt.bg);
                        setHeaderText(opt.text);
                      }}
                      className={`theme-preset-btn ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: opt.bg, color: opt.text }}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check size={16} color={opt.text} />}
                    </button>
                  );
                })
                : sidebarOptions.map((opt, idx) => {
                  const isSelected = sidebarBg === opt.bg;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSidebarBg(opt.bg)}
                      className={`theme-preset-btn ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: opt.bg, color: opt.text }}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check size={16} color={opt.text} />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* SECTION 6: Glass Blur & Opacity Sliders */}
          <div className="theme-slider-block">
            <label className="theme-slider-label">Glass Blur Radius ({glassBlur}px)</label>
            <input
              type="range"
              min="0"
              max="40"
              value={glassBlur}
              onChange={(e) => setGlassBlur(Number(e.target.value))}
              className="theme-slider spaced"
            />

            <label className="theme-slider-label">Card Transparency ({Math.round(glassOpacity * 100)}%)</label>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={glassOpacity}
              onChange={(e) => setGlassOpacity(Number(e.target.value))}
              className="theme-slider"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button onClick={handleReset} className="theme-reset-btn">
          <RotateCcw size={16} />
          <span>Reset to Default Design</span>
        </button>
      </div>
    </div>
  );
}

export default ThemeCustomizer;
