import React, { useState } from 'react';

interface PlaceholderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (data: { alias: string; tag: string; placeholder: string; sdtType: string }) => void;
  fields?: { name: string; label: string }[];
}

export function PlaceholderDialog({ isOpen, onClose, onInsert, fields = [] }: PlaceholderDialogProps) {
  const [alias, setAlias] = useState('');
  const [tag, setTag] = useState('');
  const [placeholderText, setPlaceholderText] = useState('');
  const [sdtType, setSdtType] = useState('plainText');

  if (!isOpen) return null;

  const handleInsert = () => {
    if (!alias.trim()) return;
    onInsert({
      alias: alias.trim(),
      tag: tag.trim() || alias.trim().replace(/\s+/g, '_'),
      placeholder: placeholderText.trim() || alias.trim(),
      sdtType,
    });
    setAlias('');
    setTag('');
    setPlaceholderText('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'white', borderRadius: '6px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          minWidth: '420px', maxWidth: '480px', fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
            Insert Placeholder (Content Control)
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            x
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Content Controls are DOCX native fields that can be filled during mail merge.
          </p>

          {/* Quick Select */}
          {fields.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Quick Select
              </label>
              <select
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                onChange={(e) => {
                  const f = fields.find((x) => x.name === e.target.value);
                  if (f) {
                    setAlias(f.name);
                    setTag(f.name.replace(/\s+/g, '_'));
                    setPlaceholderText(f.label || f.name);
                  }
                }}
              >
                <option value="">-- Pilih dari daftar --</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>{f.label || f.name} ({f.name})</option>
                ))}
              </select>
            </div>
          )}

          {/* Field Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Field Name (Alias) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Nama_Pegawai"
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* Tag */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Tag (ID)
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="auto-generated dari nama"
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* Placeholder Text */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Placeholder Text (tampilan saat kosong)
            </label>
            <input
              type="text"
              value={placeholderText}
              onChange={(e) => setPlaceholderText(e.target.value)}
              placeholder="[Klik untuk mengisi]"
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Type
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['plainText', 'richText', 'date', 'dropdown', 'checkbox'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSdtType(type)}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                    border: sdtType === type ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: sdtType === type ? '#dbeafe' : 'white',
                    color: sdtType === type ? '#2563eb' : '#334155',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px',
              background: '#f8fafc', textAlign: 'center',
            }}
          >
            <span
              style={{
                borderBottom: '1px dashed #9ca3af', color: '#6b7280', fontStyle: 'italic',
                fontSize: '13px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '2px',
                fontFamily: 'monospace',
              }}
            >
              {placeholderText || '[Placeholder]'}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>{alias || 'field_name'}</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px', borderTop: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'flex-end', gap: '8px', background: '#f8fafc',
            borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px', borderRadius: '4px', fontSize: '13px',
              border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#334155',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!alias.trim()}
            style={{
              padding: '6px 16px', borderRadius: '4px', fontSize: '13px',
              background: alias.trim() ? '#2563eb' : '#94a3b8',
              color: 'white', border: 'none', cursor: alias.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
