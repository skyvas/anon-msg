# UI / UX Design System & Screen Specification
## Anonymous Messaging Platform ("AnonMsg")
**Author**: `cs-ux-researcher` & `cs-frontend-engineer`  
**Design Theme**: "Midnight Glassmorphism & Cyber Violet"

---

## 1. Visual Design Foundations

### 1.1 Color Palette
- **Background Base**: `#090D16` (Deep Obsidian Void)
- **Surface Elevation 1**: `rgba(18, 26, 44, 0.7)` with `backdrop-filter: blur(16px)`
- **Surface Elevation 2 (Cards)**: `rgba(26, 36, 61, 0.8)` with border `rgba(255, 255, 255, 0.08)`
- **Surface Hover**: `rgba(38, 52, 85, 0.9)`
- **Primary Gradient**: Linear gradient `135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%` (Cyber Violet to Electric Indigo)
- **Secondary Accent**: `#06B6D4` (Cyan Glow)
- **Anonymous Badge Accent**: `#A855F7` (Deep Purple Mask theme)
- **Named Badge Accent**: `#10B981` (Emerald Trust theme)
- **Text Primary**: `#F8FAFC` (Pure High Contrast)
- **Text Muted**: `#94A3B8` (Slate secondary)
- **Text Dimmed**: `#64748B` (Subtle placeholders and timestamps)

### 1.2 Typography
- **Headings**: `Outfit`, `Inter`, -apple-system, sans-serif (Weights: 600 SemiBold, 700 Bold)
- **Body & Inputs**: `Inter`, sans-serif (Weights: 400 Regular, 500 Medium)
- **Badges & Tags**: Font size `0.75rem`, uppercase letter spacing `0.05em`, weight `600`

---

## 2. Key Screen Blueprints & User Flows

### 2.1 Screen 1: Discovery & User Tabs Directory (`/`)
- **Hero Section**:
  - Catchy title: *"Speak Your Mind, Anonymously or In Person"*.
  - Subtitle: *"Choose a person, send a private note, honest question, or warm compliment. You decide whether to reveal your name."*
  - Instant Search input with live debounced filtering.
- **Interactive Tabs / Profile Grid**:
  - Horizontal scrollable user avatar tabs on mobile; grid of interactive profile cards on desktop.
  - Profile Card anatomy:
    - User Avatar (styled gradient background or custom photo).
    - Display Name & Handle (`@alex`).
    - Availability Pulse Indicator ( "Available").
    - User Prompt bubble (*"What's one thing I should improve?"*).
    - Quick Action: **"Send Message"** button featuring primary gradient.

### 2.2 Screen 2: Message Compose Modal
Triggered upon selecting any user tab or clicking "Send Message":
- **Header**: Recipient preview (Avatar + "Sending message to @alex").
- **Recipient's Prompt Card**: Highlighted in subtle glass container with quotation marks.
- **Message Input Area**:
  - Multi-line textarea (min 4 lines).
  - Placeholder: *"Type your confidential message here..."*
  - Character indicator: `0 / 500` characters.
- **Identity Toggle Controls (Core Feature)**:
  - Segmented control / Switch:
    - Option 1 (Default): **`[ Anonymous]`**
      - Explanatory note: *"Your identity is 100% hidden. The recipient will only see an Anonymous badge."*
    - Option 2: **`[ Include Name]`**
      - Smoothly expands an input field: *"Your name or nickname"* (e.g. "Maya", "Co-worker", "Alex's friend").
- **Send Action**:
  - Animated button with send icon.
  - On submit: morphs into a success checkmark with confetti/particle effect and a *"Message delivered securely!"* confirmation.

### 2.3 Screen 3: User Authentication Modal (`Sign In / Sign Up`)
- Tabbed interface switching between **Sign In** and **Create Account**.
- Sign Up includes handle selection (live checking availability), display name, and initial prompt customization.
- Demo Quick-Login links (e.g., *"Quick test as Alex (Recipient)"*) to facilitate instant evaluation without typing passwords.

### 2.4 Screen 4: Recipient Inbox Dashboard (`/inbox`)
- Accessible only when logged in as the profile owner.
- **Top Stats Strip**:
  - Metric 1: Total Received
  - Metric 2: Anonymous % (e.g., "75% Anonymous")
  - Metric 3: Named % (e.g., "25% Named")
  - Metric 4: Unread Count
- **Filter Bar**:
  - Filter pills: `All Messages`, ` Anonymous Only`, ` Named Only`, ` Favorites`, ` Unread`.
- **Message Stream Cards**:
  - Badge: Purple ` Anonymous` or Emerald ` Sent by: [Name]`.
  - Content quote typography with high-contrast text.
  - Timestamp (e.g., "12 mins ago").
  - Actions Bar:
    - Read/Unread status dot.
    - Star button (toggle favorite).
    - Delete button (with confirmation).
    - **"Share Story Card"** button.

### 2.5 Screen 5: Story Card Exporter Modal
- Renders an Instagram Story aspect-ratio (9:16) preview card.
- Gradient wallpaper with stylized AnonMsg watermark.
- Recipient handle: *"Ask @alex on AnonMsg"*
- The anonymous/named message prominently showcased in clean modern typography.
- Action: "Copy Text" & "Download Graphic / Copy Card".
