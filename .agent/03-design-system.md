# Cedro Design System - MotherDuck Style Guide

**Last Updated:** November 2025
**Design System Page:** `/design-system`
**Related Docs:** [Project Architecture](./01-project-architecture.md), [SOP](./04-sop.md)

---

## Overview

The Cedro application uses the **MotherDuck Design System** - a modern, minimalist style guide featuring geometric shapes, specific color palette, typography hierarchy, and consistent spacing. This creates a professional, cohesive visual experience across the entire clinic management system.

**Key Characteristics:**
- Clean, minimalist aesthetic
- Geometric decorative elements
- Monospace fonts for headings
- Serif/sans-serif fonts for body text
- Consistent 2px borders
- Spacious, grid-based layout

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **MotherDuck Dark** | #383838 | rgb(56, 56, 56) | Primary text, borders, dark background |
| **MotherDuck Teal** | #16AA98 | rgb(22, 170, 152) | Primary action, highlights, emphasis |
| **MotherDuck Beige** | #F4EFEA | rgb(244, 239, 234) | Light backgrounds, cards |
| **MotherDuck Blue** | #6FC2FF | rgb(111, 194, 255) | Secondary actions, decorative elements |

### Usage Guidelines

- **Dark (#383838)**: Main text, borders, structural elements
- **Teal (#16AA98)**: Primary buttons, CTAs, selected states, key metrics
- **Beige (#F4EFEA)**: Card backgrounds, light sections, page backgrounds
- **Blue (#6FC2FF)**: Secondary buttons, info states, decorative accents

### Tailwind CSS Integration

Colors are integrated into Tailwind via custom classes:

```html
<!-- Text -->
<p class="text-motherduck-dark">Dark text</p>
<p class="text-motherduck-teal">Teal text</p>

<!-- Backgrounds -->
<div class="bg-motherduck-dark">Dark background</div>
<div class="bg-motherduck-beige">Beige background</div>

<!-- Borders -->
<div class="border-motherduck-dark">Dark border</div>
```

---

## Typography System

### Font Stack

- **Headings:** Space Mono (Monospace, Bold)
- **Body:** Inter (Sans-serif, Regular)
- **Small Text:** Inter (Sans-serif, Regular)

### Type Scales

#### Display Sizes

| Name | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| **Display 1** | Space Mono | 96px | Bold | Page hero titles |
| **Display 2** | Space Mono | 72px | Bold | Section headers |

#### Heading Sizes

| Name | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| **Heading 1** | Space Mono | 56px | Bold | Page titles |
| **Heading 2** | Space Mono | 48px | Bold | Major section titles |
| **Heading 3** | Space Mono | 40px | Bold | Subsection titles |
| **Heading 4** | Space Mono | 32px | Bold | Card titles |

#### Body Text

| Name | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| **Body Large** | Inter | 18px | Regular | Long-form content, main text |
| **Body Medium** | Inter | 16px | Regular | Standard paragraph text |
| **Body Small** | Inter | 14px | Regular | Secondary text |
| **Caption** | Inter | 12px | Regular | Labels, meta information |

### Tailwind CSS Classes

```html
<!-- Display -->
<h1 class="font-mono text-display-1 font-bold">Display 1</h1>
<h1 class="font-mono text-display-2 font-bold">Display 2</h1>

<!-- Headings -->
<h2 class="font-mono text-heading-1 font-bold">Heading 1</h2>
<h3 class="font-mono text-heading-3 font-bold">Heading 3</h3>

<!-- Body -->
<p class="text-body-lg">Large body text</p>
<p class="text-body-md">Medium body text</p>
<p class="text-body-sm">Small body text</p>
<p class="text-caption">Caption text</p>

<!-- Styling -->
<p class="font-mono uppercase tracking-wider">Uppercase mono</p>
```

### Typography Best Practices

1. **Headings** use uppercase, monospace fonts for visual impact
2. **Body text** uses Inter for readability
3. **All caps** for labels and metadata
4. **Tracking-wider** for premium feel on headings
5. **Line height** maintained for accessibility

---

## Spacing System

Consistent spacing creates harmony and structure. All spacing values are multiples of 4px.

| Name | Value | Usage |
|------|-------|-------|
| **XXS** | 8px | Minimal spacing, icon padding |
| **XS** | 20px | Tight spacing, component padding |
| **S** | 30px | Standard padding |
| **M** | 32px | Default padding, margins |
| **L** | 40px | Generous spacing, section gaps |
| **XL** | 64px | Large section breaks |

### Tailwind CSS Classes

```html
<!-- Padding -->
<div class="p-spacing-xs">Small padding</div>
<div class="p-spacing-m">Medium padding</div>
<div class="p-spacing-l">Large padding</div>

<!-- Margins -->
<div class="m-spacing-s">Small margin</div>
<div class="mb-spacing-xs">Bottom margin extra small</div>
<div class="mt-spacing-l">Top margin large</div>

<!-- Gaps -->
<div class="gap-spacing-xs flex">Item 1</div>
<div class="space-y-spacing-m">Vertical stack spacing</div>
```

---

## Component Styles

### Buttons

#### Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| **Default** | MotherDuck Dark | White | 2px Dark | Primary action |
| **Teal** | MotherDuck Teal | White | 2px Teal | Primary CTA |
| **Outline** | Transparent | Dark | 2px Dark | Secondary action |
| **Secondary** | Light Gray | Dark | 2px Gray | Tertiary action |
| **Ghost** | Transparent | Dark | None | Minimal action |
| **Link** | Transparent | Teal | None | Text link |

#### Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| **SM** | 8px 16px | 12px | Compact, inline buttons |
| **Default** | 12px 24px | 14px | Standard buttons |
| **LG** | 16px 32px | 16px | Prominent CTAs |

```tsx
// Button examples
<Button variant="default">Default Button</Button>
<Button variant="teal">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button size="sm">Small Button</Button>
<Button size="lg">Large Button</Button>
<Button variant="ghost" size="lg">Ghost Large</Button>
```

### Cards

- **Border:** 2px solid MotherDuck Dark
- **Background:** White or MotherDuck Beige
- **Padding:** Spacing-M (32px)
- **Border Radius:** Minimal (4px)
- **Shadow:** Subtle, lifted on hover

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Badges

- **Background:** Teal or secondary color
- **Text:** White, bold
- **Padding:** XXS horizontal, XS vertical
- **Border Radius:** Minimal

```tsx
<Badge className="uppercase">Active</Badge>
<Badge variant="secondary" className="uppercase">Pending</Badge>
```

### Input Fields

- **Border:** 2px solid MotherDuck Dark
- **Padding:** Spacing-XS
- **Focus:** Teal border, subtle shadow
- **Placeholder:** Uppercase, monospace labels

```tsx
<label className="font-mono text-caption uppercase">Label</label>
<Input placeholder="PLACEHOLDER TEXT..." />
```

---

## Borders & Spacing

### Border Styles

- **Standard:** 2px solid MotherDuck Dark
- **Subtle:** 1px solid Dark (opacity 10%)
- **Minimal:** 2px solid MotherDuck Teal

### Radius Classes

- **Minimal:** 2px-4px (slight rounding)
- **Small:** 6px-8px (standard components)
- **Medium:** 12px (larger elements)

```html
<div class="border-standard border-motherduck-dark rounded-minimal">
  Standard border with minimal radius
</div>
```

---

## Decorative Elements

Three custom SVG components add visual interest:

### Cloud Icon
Soft, rounded cloud shape in blue. Used for:
- Feature highlights
- Empty states
- Decorative accents

```tsx
import { Cloud } from '@/components/decorative'

<Cloud className="text-motherduck-blue" size={120} />
```

### Diamond Icon
Angular geometric diamond in teal. Used for:
- Data visualization accents
- Premium highlights
- Status indicators

```tsx
import { Diamond } from '@/components/decorative'

<Diamond className="text-motherduck-teal" size={80} />
```

### Cube 3D Icon
3D cube representation in blue. Used for:
- Technical features
- Module indicators
- Organizational structure

```tsx
import { Cube3D } from '@/components/decorative'

<Cube3D className="text-motherduck-blue" size={100} />
```

---

## Layout Patterns

### Page Structure

1. **Header Section**
   - Title in Display 2 or Heading 1
   - Monospace font, uppercase
   - Dark text with border-bottom-standard
   - Padding bottom spacing-M

2. **Main Content**
   - Grid-based sections with spacing-L gaps
   - Cards with consistent borders
   - Maximum content width (1280px typical)

3. **Footer Area**
   - Subtle border-top-standard
   - Additional info or actions
   - Reduced font size (Body Small)

### Component Spacing

```tsx
<div className="space-y-spacing-l">
  {/* Sections with large vertical spacing */}
  <Section />
  <Section />
  <Section />
</div>
```

### Responsive Grid

```html
<!-- 1 col mobile, 2 col tablet, 4 col desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-xs">
  <Card />
  <Card />
  <Card />
  <Card />
</div>
```

---

## Current Implementations

### Pages Using MotherDuck Style

1. **Design System Page** (`/design-system`)
   - Comprehensive component showcase
   - Color palette display
   - Typography examples
   - All spacing values
   - Button variants and sizes
   - Form examples

2. **Dashboard** (`/dashboard`)
   - KPI cards with MotherDuck colors
   - Charts and metrics
   - Period selector
   - Revenue, therapist, CRM funnel, payment charts
   - Tables for invoices and leads

3. **CRM** (`/crm`)
   - Kanban board with MotherDuck theming
   - Lead cards with consistent styling
   - Status badges in teal/secondary colors

4. **Other Pages (In Progress)**
   - Agenda/appointments
   - Patient management
   - Medical records
   - Financial management

---

## Customization Guide

### Adding MotherDuck Colors to New Components

1. **In Tailwind Config** (if needed):
```js
colors: {
  motherduck: {
    dark: '#383838',
    teal: '#16AA98',
    beige: '#F4EFEA',
    blue: '#6FC2FF',
  }
}
```

2. **In Components**:
```tsx
<div className="text-motherduck-dark bg-motherduck-beige border-2 border-motherduck-dark">
  Styled with MotherDuck colors
</div>
```

### Creating New Card Variants

```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-motherduck-dark">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-motherduck-dark/70">
    Content
  </CardContent>
</Card>
```

### Maintaining Consistency

- **Always use** the color palette provided
- **Prefer monospace** (Space Mono) for headings and uppercase text
- **Use Inter** for body content
- **Maintain** 2px borders for cards and components
- **Follow** spacing system for padding and margins
- **Test** at different breakpoints (mobile, tablet, desktop)

---

## Accessibility Considerations

1. **Color Contrast**
   - Dark text on light backgrounds meets WCAG AA
   - Ensure color is not sole indicator of status
   - Provide text labels alongside color-coded elements

2. **Typography**
   - Maintain minimum 16px font for body text
   - Use sufficient line height (1.5+ for body)
   - Uppercase text limited to headings and labels

3. **Interactive Elements**
   - Clear focus states (border or outline)
   - Sufficient padding for touch targets (44px minimum)
   - Obvious hover/active states

---

## Related Documentation

- [Project Architecture](./01-project-architecture.md) - Technical implementation
- [Dashboard & Agenda Updates](#dashboard--agenda-updates) - Recent improvements
- [SOP](./04-sop.md) - Adding new components
