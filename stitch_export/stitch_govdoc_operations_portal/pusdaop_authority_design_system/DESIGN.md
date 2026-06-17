---
name: PUSDAOP Authority Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#270c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#471c00'
  on-tertiary-container: '#de722c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered for the Government Document Operations Portal (PUSDAOP). It embodies the core values of the state: **Authority, Transparency, and Efficiency**. The visual language is rooted in **Corporate Modernism**, prioritizing legibility and a sense of permanence over passing trends.

The target audience includes government officials, administrative staff, and citizens. The UI must evoke an emotional response of security and trust. This is achieved through a structured grid, a restrained color palette, and clear information density that reduces cognitive load during complex document processing tasks. The style is professional and balanced, utilizing subtle depth and high-contrast typography to guide the user through official workflows.

## Colors
The palette is dominated by **Deep Navy Blue (#1E293B)**, representing the stability and authority of the institution. **Professional Blue (#0284C7)** is reserved for primary actions and interactive states to ensure clear task completion paths. 

**Subtle Gold/Brass accents (#B45309)** are used sparingly for official seals, high-level headers, or "KOP Surat" (official letterhead) elements to align with national branding standards. The background uses a soft **Slate-50** to reduce eye strain, while text remains a high-contrast **Slate-900** for maximum accessibility. Status colors are saturated and distinct to ensure immediate recognition of document states (Approved, Pending, Rejected, or Revision).

## Typography
This design system utilizes **Inter** across all levels. Inter was chosen for its exceptional legibility in data-heavy environments and its neutral, institutional character. 

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to maintain a compact, authoritative look.
- **Body Text:** Standardized at 16px for desktop readability, utilizing a generous 1.5x line height to facilitate long-form document reading.
- **Labels:** Small labels for status badges or table headers use a semi-bold weight and uppercase styling to distinguish metadata from content.
- **Official Documents:** For the "KOP Surat" section, the typeface should be centered, utilizing `headline-lg` for the Ministry/Department name and `body-sm` for the address and contact details.

## Layout & Spacing
The system employs a **Fixed Grid** approach for desktop dashboards to ensure data density remains manageable, switching to a fluid layout for mobile forms. 

- **Grid System:** A 12-column grid with a 24px gutter. On desktop, the main content area is capped at 1280px.
- **Dashboard Layout:** Utilizes a persistent left-hand sidebar (280px) for navigation, with a top bar for global search and profile actions.
- **Spacing Rhythm:** Based on a 4px baseline. Components primarily use 8px (sm) and 16px (md) for internal padding to maintain a clean, organized appearance.
- **Document View:** Official documents should be presented in a centered container with a max-width of 800px to mimic the proportions of physical paper (A4).

## Elevation & Depth
To maintain a professional and "flat" institutional feel, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Slate-50.
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px border in Slate-200. No shadow.
- **Level 2 (Dropdowns/Modals):** Pure White with a 1px border in Slate-200 and a soft, diffused shadow (0px 4px 12px, 5% opacity black) to suggest interaction priority.
- **Interactive Elements:** Buttons utilize a slight tonal shift on hover rather than an elevation change, maintaining the structural integrity of the page.

## Shapes
The shape language is defined as **Rounded (Level 2)**. 
- All standard containers, input fields, and buttons use a **0.5rem (8px)** corner radius. 
- This radius provides a modern, approachable feel while remaining sufficiently sharp to convey seriousness and structural order.
- Status badges (chips) and smaller UI elements use the same 8px radius to ensure a consistent geometric rhythm across the portal.

## Components
Consistent component behavior ensures the portal feels like a singular, integrated government tool.

- **Buttons:** Primary buttons use Professional Blue (#0284C7) with white text. Secondary buttons use a white background with a Slate-200 border. Ghost buttons are reserved for tertiary actions like "Cancel."
- **Status Badges:** Use a "Soft-Fill" style—a very light background tint of the status color with high-saturation text (e.g., Green text on light green background for "Approved").
- **Input Fields:** Use 1px Slate-300 borders. Focus states must use a 2px Professional Blue ring. Labels are always positioned above the input field for clarity.
- **Data Tables:** High-density layouts with 1px horizontal dividers only. Header rows use a Slate-100 background and semi-bold Slate-900 text.
- **Official Letterhead (KOP):** A specialized component that spans the top of document views. It features the National Emblem on the left, centered official text in Deep Navy, and a double-line separator (3pt top, 1pt bottom) to denote the start of the official content.
- **Document Cards:** Used in grid views to show file previews, including a prominent status ribbon in the top right corner.