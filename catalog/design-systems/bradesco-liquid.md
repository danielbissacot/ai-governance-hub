# Summary of Bradesco Liquid Design System (v1.33.6)

The Bradesco Liquid Design System is a comprehensive UI framework designed for the Bradesco Web Ecosystem. It follows a modular approach with clear token definitions and component structures.

## 🎨 Foundations: Tokens & Colors

### Colors
The system uses a naming convention starting with `brad-color-` or `brad-bg-color-`.
- **Core Variants:** `primary`, `secondary`, `extended`, `neutral`.
- **Modifiers:** `-light`, `-dark`, `-xlight` (e.g., `brad-color-primary-light`).
- **Extended Palette Examples:**
    - `extended-green`: `#09ab47`
    - `extended-blue`: `#3b69ff`
- **Utility Classes:** `.brad-bg-color-[variant]`, `.brad-text-color-[variant]`, `.brad-border-color-[variant]`.

### Typography
- **Font Family:** `"Bradesco", sans-serif` (Token: `brad-font-family-primary`).
- **Font Weights:** Regular (400), Medium (500), Semibold (600), Bold (700).
- **Scale Highlights:**
    - **Title Xl:** 22px / Semibold / LH 32px
    - **Title Lg:** 20px / Semibold / LH 32px
    - **Subtitle Sm:** 14px / Semibold / LH 20px
    - **Link Md:** 16px / Semibold / LH 20px
    - **Body text** generally follows the standard `brad-font-family-primary`.

---

## 🧱 Key Components

### 🔘 Buttons
- **Base Class:** `.brad-btn`
- **Hierarchies:**
    - `brad-btn-primary`: Main action button (Solid Blue).
    - `brad-btn-secondary`: Secondary action (Outlined).
    - `brad-btn-tertiary`: Ghost/Transparent button.
- **Sizes:** `default`, `md`.
- **Usage:** `<button class="brad-btn brad-btn-primary">Action</button>`

### 📝 Forms & Inputs (TextField)
- **Structure:** The system often uses a wrapper-based structure for inputs.
- **TextField Wrapper:** `.brad-text-field`
- **Standard Layout:**
  ```html
  <label class="brad-text-field">
    <input type="text" placeholder=" " />
    <small class="placeholder-label-field">Label Text</small>
    <div class="brad-text-field--background"></div>
  </label>
  ```
- **Variants:** Includes specialized inputs for Code, Number, Search, Select, and Text Area.

### 🖼️ Modal
- **Base Class:** `.brad-modal`
- **Structure:**
  - `.brad-modal__content`
    - `.brad-modal__header`
    - `.brad-modal__body`
    - `.brad-modal__footer`
- **JavaScript Interaction:**
  Managed via `LiquidCorp.BradModalService`.
  ```javascript
  const service = LiquidCorp.BradModalService.getInstance({ targetSelector: "#modal-id" });
  service.open();
  service.close();
  ```

### ☑️ Checkbox & Radio
- **Checkbox Class:** `.brad-checkbox`
- **Radio Class:** `.brad-radio`
- **Structure:** Both use a label wrapper with a hidden input and a custom `.checkmark` span for styling.
  ```html
  <label class="brad-checkbox">
    <input type="checkbox" />
    <span class="checkmark"></span>
    <p>Label text</p>
  </label>
  ```

---

## 🛠️ Usage Guidelines
- **Themes:** Supports theme segmentation (e.g., `brad-theme-classic`).
- **Accessibility:** Components include semantic HTML and specific "OnColor" variants (e.g., `brad-radio--on-color`) to ensure WCAG contrast compliance on dark/colored backgrounds.
- **CDN:** Assets are served via Bradesco's internal CDN (e.g., `.../cdn/design-system/dist/...`).
