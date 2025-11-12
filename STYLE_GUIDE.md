# MotherDuck Landing Page - Complete Style Guide

## Checklist
- Analyze and document the complete color system including primary, secondary, and functional colors
- Detail the typography hierarchy, font families, weights, sizes, and their semantic usage
- Define the spacing system, layout margins, padding patterns, and grid structures
- Document component-level styling patterns including buttons, navigation, and decorative elements
- Catalog shadows, borders, animations, and interactive states
- Provide reference implementation code for key components

---

## Overview

The MotherDuck landing page employs a **modern, minimalist, tech-forward design system** that prioritizes clarity, performance, and visual impact. The aesthetic combines clean geometric shapes, monospace typography, and a sophisticated color palette that evokes both technical precision and approachability.

### Design Philosophy
- **Minimalist**: Focus on essential content without visual clutter
- **Tech-Forward**: Monospace typography and geometric shapes reinforce the technical/data product nature
- **Performance-First**: SVG graphics, optimized assets, and clean markup ensure fast load times
- **Accessible**: High contrast ratios, clear hierarchy, and semantic markup

### Technology Stack
- **React** - Component-based architecture
- **CSS-in-JS (Styled Components)** - Dynamic styling with scoped classes
- **SVG Graphics** - Scalable, inline vector graphics for icons and decorative elements
- **Swiper.js** - Touch-friendly carousels (for testimonial sections)
- **HTML5 Video** - Optimized video backgrounds and demonstrations

### Design System Principles
1. **Geometric Consistency**: All decorative elements use geometric primitives (circles, diamonds, hexagons, cubes)
2. **Typographic Hierarchy**: Uppercase monospace fonts create strong visual hierarchy
3. **Generous Spacing**: Ample whitespace and padding improve readability and focus
4. **Minimal Color Palette**: Limited color set ensures visual cohesion
5. **Border-First Design**: 2px solid borders create definition without heavy shadows

---

## Color Palette

| Color Name | Hex/RGB | Usage | Contrast Notes |
|------------|---------|-------|----------------|
| **Primary Dark** | `#383838` / `rgb(56, 56, 56)` | Primary text, borders, strokes, navigation items, all typographic content | High contrast on light backgrounds (AAA compliant) |
| **Accent Teal** | `#16AA98` | Decorative elements, cube 3D accent, highlights (secondary use) | Used sparingly for visual interest |
| **Neutral Beige** | `#F4EFEA` / `rgb(244, 239, 234)` | Primary background, card fills, neutral spaces | Warm off-white providing softer alternative to pure white |
| **Button Blue** | `#6fc2ff` | CTA button backgrounds, interactive elements | Combined with dark borders for strong visual presence |
| **Banner Yellow** | `#FFD700` | Announcement banner, urgent/promotional messaging | High visibility, use for important announcements only |
| **White** | `#FFFFFF` | Secondary backgrounds, clean sections | Used for maximum contrast areas |
| **Cube Teal Light** | `#3db5b5` | 3D cube highlights and gradients | Part of 3D decorative element |
| **Cube Teal Dark** | `#2d9a9a` | 3D cube shadows and depth | Creates dimensional effect |
| **Cube Teal Mid** | `#5ec9ba` | 3D cube top face | Brightest face for lighting effect |
| **Scrollbar Thumb** | `rgb(136, 136, 136)` | Custom scrollbar styling | Subtle UI element |
| **Scrollbar Track** | `rgb(241, 241, 241)` | Scrollbar background | Barely visible, non-intrusive |

### Color Usage Guidelines

**Primary Dark (#383838)** is the foundation color appearing in:
- All body text and headings
- Navigation menu items
- Button borders (2px solid)
- SVG strokes for decorative elements
- Icon outlines

**Accent Teal (#16AA98)** provides visual interest:
- Limited to decorative SVG elements
- Part of 3D cube color scheme
- Never used for primary text or critical UI

**Neutral Beige (#F4EFEA)** creates warmth:
- Main page background
- SVG fill for geometric shapes (diamonds, clouds)
- Provides softer aesthetic than stark white

**Button Blue (#6fc2ff)** drives action:
- Primary CTA buttons ("TRY 21 DAYS FREE", "START FREE")
- Always paired with #383838 border
- High visibility without being aggressive

**Banner Yellow (#FFD700)** demands attention:
- Sticky announcement banners
- Limited to promotional/urgent messaging
- Use sparingly to maintain impact

---

## Typography

### Font Families

The design uses a **monospace-first typography system** that reinforces the technical, data-focused product identity.

| Font Family | Fallbacks | Primary Use |
|-------------|-----------|-------------|
| **Aeonik Mono** | `'Space Mono', monospace, sans-serif` | Primary display font, headings, buttons, navigation |
| **Inter** | `Arial, sans-serif` | Body text, paragraphs (limited use) |

**Note**: Aeonik Mono is a custom/premium font. In web implementations, Space Mono (Google Fonts) serves as an excellent fallback with similar characteristics.

### Typography Scale & Hierarchy

| Element | Font Family | Size | Line Height | Letter Spacing | Weight | Transform | Usage |
|---------|-------------|------|-------------|----------------|--------|-----------|-------|
| **Hero Title** | Aeonik Mono | `72px` | `86.4px` (120%) | `1.44px` | 400 | UPPERCASE | Main hero headline ("MAKING BIG DATA FEEL SMALL") |
| **Subtitle** | Aeonik Mono | `16px` | `19.2px` (120%) | `0.32px` | 400 | UPPERCASE | Hero subtitle, descriptive text |
| **Button Text** | Aeonik Mono | `14px` | `16px` (114%) | `0.5px` | 400 | UPPERCASE | CTA buttons, primary actions |
| **Navigation** | Aeonik Mono | `14px` | `16px` | `0.5px` | 400 | UPPERCASE | Header navigation items |
| **Body Text** | Inter | `16px` | `140%` | `0.02em` | 300 | Normal | Paragraph content, descriptions |
| **Small Text** | Aeonik Mono | `14px` | `16px` | Normal | 400 | UPPERCASE | Links, secondary actions |
| **Banner Text** | Aeonik Mono | `14px` | `16px` | `0.5px` | 400 | UPPERCASE | Announcement banners |

### Typography Patterns

**Display Typography** (Hero Titles):
- Font size: `72px`
- Line height: `86.4px` (1.2 ratio)
- Letter spacing: `1.44px` (2% of font size)
- **Multi-line requirement**: Hero title MUST break into 2 lines:
  ```
  MAKING BIG DATA
  FEEL SMALL
  ```
- All caps for maximum impact
- Color: `#383838`

**Button Typography**:
- Font: Aeonik Mono, monospace fallback
- Size: `14px`
- Padding: `16.5px 22px` (creates proper visual weight)
- Border: `2px solid #383838`
- Transform: `uppercase`
- Color: `#383838` on `#6fc2ff` background

**Navigation Typography**:
- Consistent `14px` size across all nav items
- Uppercase transformation
- Letter spacing: `0.5px` for improved readability
- Dropdown indicators: `▾` character

**Link Typography**:
- Underlined for clarity
- `14px` size
- Uppercase
- Monospace font
- Examples: "LEARN MORE", "BOOK A DEMO"

### Font Weight Usage

The design primarily uses **normal weight (400)** throughout, with strategic use of **bold (700)** for:
- Logo text
- Emphasis in specific UI components

**Light weight (300)** is reserved for:
- Body paragraphs using Inter font
- Extended reading content

---

## Spacing System

### Grid & Layout Structure

**Container Margins** (Hero Section):
```css
margin: 0px 306.5px;  /* Horizontal centering with generous side margins */
padding: 110px 30px 180px;  /* Top, horizontal, bottom */
```

**Rationale**: The large horizontal margins (306.5px) create a centered content column, ensuring the hero content doesn't span the full viewport width even on large screens.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| **XXL** | `180px` | Hero bottom padding, major section separation |
| **XL** | `110px` | Hero top padding, section headers |
| **L** | `40px` | Button group spacing, element separation |
| **M** | `32px` | Flex gap in hero content, component spacing |
| **S** | `30px` | Navigation item gap, horizontal padding |
| **XS** | `20px` | Header vertical padding, tight element spacing |
| **XXS** | `8px` | Banner padding, inline element gaps |

### Component-Specific Spacing

**Header/Navigation**:
```css
padding: 20px 40px;           /* Vertical | Horizontal */
gap: 30px;                    /* Between nav items */
gap: 20px;                    /* Between header actions */
```

**Hero Section**:
```css
display: flex;
flex-direction: column;
gap: 32px;                    /* Between hero elements (title, subtitle, CTA) */
margin: 0px 306.5px;          /* Centered column */
padding: 110px 30px 180px;    /* Top | Sides | Bottom */
```

**Button Padding**:
```css
padding: 16.5px 22px;         /* Vertical | Horizontal */
```

**Banner**:
```css
padding: 12px 8px;            /* Compact for attention */
```

### Responsive Spacing

```css
/* Desktop: Large margins */
@media (max-width: 1400px) {
  margin: 0px 100px;          /* Reduced side margins */
}

@media (max-width: 1024px) {
  margin: 0px 50px;           /* Further reduced */
}
```

---

## Component Styles

### Button Component

**Primary CTA Button**:
```css
background-color: #6fc2ff;
border: 2px solid #383838;
border-radius: 2px;
color: #383838;
font-family: 'Aeonik Mono', monospace;
padding: 16.5px 22px;
text-transform: uppercase;
font-size: 14px;
line-height: 16px;
font-weight: 400;
cursor: pointer;
```

**Variants**:
- **Primary**: Blue background (`#6fc2ff`) - "TRY 21 DAYS FREE", "START FREE"
- **Link Button**: Transparent background, no border - "LOG IN"

**States**:
- Default: Blue background with dark border
- Hover: Information not provided (suggest: slight darkening or scale transform)
- Active: Information not provided
- Disabled: Information not provided

### Navigation Component

**Header Navigation**:
```css
display: flex;
gap: 30px;
align-items: center;
```

**Navigation Items**:
```css
color: #383838;
text-decoration: none;
font-size: 14px;
text-transform: uppercase;
font-weight: 400;
letter-spacing: 0.5px;
```

**Dropdown Indicators**: Use `▾` character after menu items with submenus

### Decorative SVG Elements

**Cloud (Small)**:
- Position: `absolute; top: 20%; left: 5%;`
- Dimensions: `80px × 60px`
- Stroke: `#383838`, Width: `2px`
- Fill: `none` (outline only)

**Diamond**:
- Position: `absolute; top: 20%; right: 8%;`
- Dimensions: `60px × 60px`
- Stroke: `#383838`, Width: `2px`
- Fill: `#f4efea`

**3D Cube**:
- Position: `absolute; top: 40%; right: 5%;`
- Dimensions: `100px × 100px`
- Multi-face coloring:
  - Top face: `#5ec9ba` (lightest)
  - Right face: `#2d9a9a` (darkest, shadow)
  - Left face: `#16AA98`
  - Front: `#3db5b5`

**Cloud (Large)**:
- Position: `absolute; top: 60%; left: 3%;`
- Dimensions: `150px × 110px`
- Stroke: `#383838`, Width: `2px`
- Fill: `none`

### Logo Component

**Structure**:
- SVG icon (hexagon/geometric shape) + Text
- Colors: `#FF8C42` (icon fill), `#383838` (text)
- Font weight: `700`
- Font size: `20px`
- Gap: `8px`

### Banner Component

```css
background-color: #FFD700;
text-align: center;
padding: 12px 8px;
font-size: 14px;
text-transform: uppercase;
font-weight: 400;
letter-spacing: 0.5px;
```

**Content Pattern**: `[Message] | [Event Details] →`

### DuckDB Preview Interface

```css
width: 650px;
position: absolute;
right: 100px;
top: 50%;
transform: translateY(-50%);
box-shadow: 0 4px 12px rgba(0,0,0,0.1);
border: 2px solid #383838;
background: #2d2d2d;
padding: 20px;
border-radius: 4px;
```

**Terminal-style UI** with:
- Dark background (`#2d2d2d`, `#1a1a1a`)
- Monospace font
- Syntax highlighting colors:
  - Yellow: `#FFD700`
  - Blue: `#6fc2ff`
  - Orange: `#ff9f43`

---

## Shadows & Elevation

The design employs a **minimal shadow strategy**, preferring borders over shadows.

| Level | Shadow Value | Usage |
|-------|--------------|-------|
| **None** | `none` | Default for most components |
| **Subtle** | `0 4px 12px rgba(0,0,0,0.1)` | DuckDB preview interface, elevated cards |
| **Custom Scrollbar** | N/A | Uses background colors, not shadows |

### Shadow Philosophy

Instead of heavy drop shadows, the design uses:
1. **2px solid borders** (`#383838`) for definition
2. **Layering via z-index** for depth
3. **Color variations** (3D cube faces) for dimensional effects
4. **Minimal blur shadows** only on hero elements

This approach maintains the clean, technical aesthetic while ensuring performance.

---

## Animations & Transitions

### Carousel Animations (Swiper.js)

**Testimonial Carousel**:
- Direction: Vertical scroll
- Auto-scroll: Enabled
- Loop: Enabled
- Transition: Smooth slide

### Video Animations

**Hero Video**:
- Autoplay: `true`
- Loop: `true`
- Muted: `true`
- Poster: Thumbnail image for initial frame

### Link Hover States

Information not provided for specific transition timings. Recommended implementation:

```css
transition: all 0.2s ease-in-out;
```

### Scroll Animations

Information not provided. Typical implementation might include:
- Fade-in on scroll
- Parallax effects on decorative elements
- Sticky header behavior

---

## Border Radius

The design uses **minimal border radius**, maintaining geometric precision.

| Component | Border Radius | Rationale |
|-----------|---------------|-----------|
| **Buttons** | `2px` | Subtle softening without losing geometric feel |
| **DuckDB Preview** | `4px` | Slightly more rounded for card-like element |
| **SVG Elements** | `0px` | Pure geometric shapes (diamonds, cubes) |
| **Input Fields** | Information not provided | Likely `2px` to match button style |
| **Cards** | Information not provided | Likely `2px-4px` range |

### Border Radius Philosophy

- **Almost-geometric**: `2px` provides barely-perceptible softening
- **Consistency**: All interactive elements share `2px` radius
- **Exceptions**: Cards/modules may use `4px` for differentiation

---

## Opacity & Transparency

### Transparency Usage

| Element | Opacity | Context |
|---------|---------|---------|
| **SVG Clouds** | `1` (opaque) | Outline strokes only, no fill transparency |
| **Shadow** | `0.1` | `rgba(0,0,0,0.1)` in box-shadow |
| **Decorative fills** | `1` (opaque) | Solid colors for SVG fills |

### General Approach

The design **avoids heavy use of transparency**, preferring:
- Solid colors for clarity
- High contrast for accessibility
- Transparency only in shadows and overlays

**Video Overlays**: Information not provided, but likely use semi-transparent dark overlays for text readability.

---

## Common Tailwind CSS Usage in Project

**Note**: This project uses **CSS-in-JS (Styled Components)**, not Tailwind CSS. However, the styling patterns can be mapped to Tailwind utilities:

### Equivalent Tailwind Patterns

**Layout**:
```jsx
// Styled Components: display: flex; flex-direction: column; gap: 32px;
// Tailwind equivalent: className="flex flex-col gap-8"
```

**Typography**:
```jsx
// Styled Components: text-transform: uppercase; font-size: 14px;
// Tailwind equivalent: className="uppercase text-sm"
```

**Colors**:
```jsx
// Custom color system requires tailwind.config.js extension:
colors: {
  'primary-dark': '#383838',
  'accent-teal': '#16AA98',
  'neutral-beige': '#F4EFEA',
  'button-blue': '#6fc2ff',
  'banner-yellow': '#FFD700',
}
```

**Spacing**:
```jsx
// Styled Components: padding: 16.5px 22px;
// Tailwind equivalent: className="px-[22px] py-[16.5px]"
```

### CSS-in-JS Patterns

**Dynamic Classes**:
```jsx
// Classes follow pattern: sc-[hash]
// Example: .fOSQdG, .kRwPqL
```

**Component Styling**:
```javascript
const Button = styled.button`
  background-color: #6fc2ff;
  border: 2px solid #383838;
  border-radius: 2px;
  /* ... */
`;
```

---

## Example Component Reference Design Code

### Primary Button Component

```jsx
import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  background-color: #6fc2ff;
  border: 2px solid #383838;
  border-radius: 2px;
  color: #383838;
  font-family: 'Aeonik Mono', 'Space Mono', monospace;
  padding: 16.5px 22px;
  text-transform: uppercase;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const Button = ({ children, href, ...props }) => {
  if (href) {
    return (
      <StyledButton as="a" href={href} {...props}>
        {children}
      </StyledButton>
    );
  }

  return <StyledButton {...props}>{children}</StyledButton>;
};

// Usage:
// <Button>TRY 21 DAYS FREE</Button>
// <Button href="/signup">START FREE</Button>
```

### Header Navigation Component

```jsx
import React from 'react';
import styled from 'styled-components';

const HeaderWrapper = styled.header`
  align-items: center;
  background-color: #f4efea;
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #383838;
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  gap: 30px;
  align-items: center;
`;

const NavItem = styled.a`
  color: #383838;
  text-decoration: none;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: 0.5px;
  font-family: 'Aeonik Mono', monospace;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const Header = () => {
  return (
    <HeaderWrapper>
      <Logo href="/">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M15 2L25 8V22L15 28L5 22V8L15 2Z" fill="#FF8C42"/>
          <path d="M15 10C17.7614 10 20 12.2386 20 15C20 17.7614 17.7614 20 15 20C12.2386 20 10 17.7614 10 15C10 12.2386 12.2386 10 15 10Z" fill="#383838"/>
        </svg>
        MotherDuck
      </Logo>

      <Nav>
        <NavItem href="/product">PRODUCT ▾</NavItem>
        <NavItem href="/community">COMMUNITY ▾</NavItem>
        <NavItem href="/company">COMPANY ▾</NavItem>
        <NavItem href="/docs">DOCS</NavItem>
        <NavItem href="/pricing">PRICING</NavItem>
        <NavItem href="/contact">CONTACT US</NavItem>
      </Nav>

      <HeaderActions>
        <NavItem href="/login">LOG IN</NavItem>
        <Button>START FREE</Button>
      </HeaderActions>
    </HeaderWrapper>
  );
};
```

### Hero Section Component

```jsx
import React from 'react';
import styled from 'styled-components';

const HeroSection = styled.section`
  display: flex;
  gap: 32px;
  flex-direction: column;
  line-height: 16px;
  margin: 0px 306.5px;
  padding: 110px 30px 180px;
  position: relative;

  @media (max-width: 1400px) {
    margin: 0px 100px;
  }

  @media (max-width: 1024px) {
    margin: 0px 50px;
  }
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
  position: relative;
  z-index: 10;
`;

const HeroTitle = styled.h1`
  font-family: 'Aeonik Mono', 'Space Mono', monospace;
  font-size: 72px;
  letter-spacing: 1.44px;
  line-height: 86.4px;
  text-transform: uppercase;
  color: #383838;
  font-weight: 400;
`;

const HeroSubtitle = styled.p`
  font-family: 'Aeonik Mono', 'Space Mono', sans-serif;
  text-transform: uppercase;
  font-size: 16px;
  line-height: 19.2px;
  letter-spacing: 0.32px;
  color: #383838;
  font-weight: 400;
  max-width: 600px;
`;

const HeroCTA = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
`;

const HeroLinks = styled.div`
  display: flex;
  gap: 30px;
`;

const LinkUnderlined = styled.a`
  font-family: 'Aeonik Mono', 'Space Mono', monospace;
  text-transform: uppercase;
  font-size: 14px;
  text-decoration: underline;
  color: #383838;
`;

export const Hero = () => {
  return (
    <HeroSection>
      <HeroContent>
        <HeroTitle>
          MAKING BIG DATA<br />
          FEEL SMALL
        </HeroTitle>

        <HeroSubtitle>
          DUCKDB CLOUD DATA WAREHOUSE SCALING TO TERABYTES<br />
          FOR CUSTOMER-FACING ANALYTICS AND BI
        </HeroSubtitle>

        <HeroCTA>
          <Button>TRY 21 DAYS FREE</Button>

          <HeroLinks>
            <LinkUnderlined href="/learn">LEARN MORE</LinkUnderlined>
            <LinkUnderlined href="/demo">BOOK A DEMO</LinkUnderlined>
          </HeroLinks>
        </HeroCTA>
      </HeroContent>
    </HeroSection>
  );
};
```

### Decorative Cloud SVG Component

```jsx
import React from 'react';
import styled from 'styled-components';

const CloudSVG = styled.svg`
  position: absolute;

  &.cloud-small {
    top: 20%;
    left: 5%;
    width: 80px;
    height: 60px;
  }

  &.cloud-large {
    top: 60%;
    left: 3%;
    width: 150px;
    height: 110px;
  }
`;

export const CloudSmall = () => (
  <CloudSVG
    className="cloud-small"
    viewBox="0 0 80 60"
    fill="none"
  >
    <path
      d="M20 30C20 25 23 20 28 20C30 15 35 12 40 12C46 12 51 16 52 21C57 21 61 25 61 30C61 35 57 39 52 39H28C23 39 20 35 20 30Z"
      stroke="#383838"
      strokeWidth="2"
      fill="none"
    />
  </CloudSVG>
);

export const CloudLarge = () => (
  <CloudSVG
    className="cloud-large"
    viewBox="0 0 150 110"
    fill="none"
  >
    <path
      d="M30 60C30 50 38 42 48 42C52 32 62 25 74 25C88 25 100 35 102 48C112 48 120 56 120 66C120 76 112 84 102 84H48C38 84 30 76 30 66V60Z"
      stroke="#383838"
      strokeWidth="2"
      fill="none"
    />
  </CloudSVG>
);
```

### 3D Cube Decorative Component

```jsx
import React from 'react';
import styled from 'styled-components';

const CubeSVG = styled.svg`
  position: absolute;
  top: 40%;
  right: 5%;
  width: 100px;
  height: 100px;
`;

export const Cube3D = () => (
  <CubeSVG viewBox="0 0 100 100" fill="none">
    {/* Hexagonal isometric cube */}
    <path
      d="M50 10L90 35V65L50 90L10 65V35L50 10Z"
      fill="#3db5b5"
    />
    <path
      d="M50 10V50L90 65V35L50 10Z"
      fill="#2d9a9a"
    />
    <path
      d="M50 50L10 65L50 90V50Z"
      fill="#16AA98"
    />
    <path
      d="M50 10L90 35L50 50L10 35L50 10Z"
      fill="#5ec9ba"
    />
  </CubeSVG>
);
```

### Banner Component

```jsx
import React from 'react';
import styled from 'styled-components';

const BannerWrapper = styled.div`
  background-color: #FFD700;
  text-align: center;
  padding: 12px 8px;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: 0.5px;
  font-family: 'Aeonik Mono', monospace;
`;

const BannerLink = styled.a`
  color: #383838;
  text-decoration: none;
`;

const Arrow = styled.span`
  margin-left: 8px;
`;

export const Banner = ({ message, link }) => (
  <BannerWrapper>
    <BannerLink href={link}>
      {message} <Arrow>→</Arrow>
    </BannerLink>
  </BannerWrapper>
);

// Usage:
// <Banner
//   message="EMPOWERING DATA TEAMS. SMARTER AI WORKFLOWS | LIVE DEMO ON NOV 19 WITH HEX + MOTHERDUCK"
//   link="/event"
// />
```

---

## Additional Sections

### Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| **Desktop Large** | `> 1400px` | Full margins (306.5px), all decorative elements visible |
| **Desktop** | `1024px - 1400px` | Reduced margins (100px), DuckDB preview scales down |
| **Tablet** | `768px - 1024px` | Margins 50px, DuckDB preview becomes static positioned |
| **Mobile** | `< 768px` | Information not provided (recommend: stacked layout, hidden decorative elements) |

### Accessibility Considerations

**Color Contrast**:
- Primary text (#383838) on beige (#F4EFEA): **AAA compliant**
- Button text (#383838) on blue (#6fc2ff): **AA compliant**
- Banner text (#383838) on yellow (#FFD700): **AAA compliant**

**Typography**:
- Minimum font size: 14px (meets WCAG guidelines)
- Clear hierarchy with size variation
- Monospace fonts improve readability for technical content

**Interactive Elements**:
- All links have underlines or clear button styling
- 2px borders provide strong visual definition
- Adequate touch target sizes (44px+ recommended)

**Semantic HTML**:
- Proper heading hierarchy (h1, h2, etc.)
- Semantic sectioning elements
- ARIA labels recommended for decorative SVGs

### CSS Custom Properties (CSS Variables)

```css
:root {
  /* Header Heights */
  --header-mobile: 70px;
  --header-desktop: 90px;
  --eyebrow-mobile: 70px;
  --eyebrow-desktop: 55px;

  /* Swiper Theme */
  --swiper-theme-color: #007aff;

  /* Toastify */
  --toastify-toast-min-height: fit-content;
  --toastify-toast-width: fit-content;
}
```

### Scrollbar Customization

```css
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-thumb {
  background: rgb(136, 136, 136);
}

::-webkit-scrollbar-track {
  background: rgb(241, 241, 241);
}
```

**Philosophy**: Minimal, unobtrusive scrollbars that don't compete with content.

### Performance Optimizations

1. **SVG Inline**: All decorative graphics inline to reduce HTTP requests
2. **Video Optimization**: `.webm` format for better compression
3. **Font Loading**: Preconnect to font CDNs, display swap strategy
4. **CSS-in-JS**: Scoped styles reduce CSS payload
5. **Lazy Loading**: Video poster images for initial render

### Data Attributes

The codebase uses `data-frz-id` attributes, likely for:
- Analytics tracking
- A/B testing frameworks
- User interaction monitoring

Example: `data-frz-id="component-4"` on hero section

---

## Implementation Checklist

When implementing this design system:

- [ ] Install Aeonik Mono font or use Space Mono fallback
- [ ] Configure CSS-in-JS library (Styled Components recommended)
- [ ] Set up color variables matching exact hex values
- [ ] Implement 2px border standard across all components
- [ ] Ensure hero title breaks into 2 lines
- [ ] Position decorative SVG elements with absolute positioning
- [ ] Configure Swiper.js for testimonial carousels
- [ ] Set up responsive breakpoints at 1400px, 1024px
- [ ] Apply custom scrollbar styling
- [ ] Implement sticky header behavior
- [ ] Test color contrast ratios for accessibility
- [ ] Optimize video assets to .webm format
- [ ] Add analytics data attributes as needed

---

**Document Version**: 1.0
**Last Updated**: 2025-11-02
**Maintained By**: Development Team
