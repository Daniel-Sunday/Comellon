# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Comellon Product Design & Behavior Rules

All development on Comellon must adhere to the following product rules:

## 📓 Core Philosophy: The Quiet Notebook
*   **Not a Glossy Social Media App:** Avoid unnecessary animations, flash, counts (likes, followers, retweets), or gamified indicators. It is "digital notebook therapy."
*   **Unfiltered Sincerity:** Design inputs and views to support raw, immediate drafting without editing pressure.

## 🎨 Visual Identity & Color System
*   **Background:** Solid True Black (`#000000`).
*   **accent Action Color:** A desaturated warm coral-rose tone (`#F0706A`), used **sparingly** (primarily for the primary compose/post action button). No gradients, no saturated hot pinks/oranges.
*   **Typography:** Understated, rounded, clean system-native sans-serif.

## 📰 Feed Layout: Flat Thread Rows
*   **Flat Rows (Not Cards):** Every post renders flat on the solid black background, separated by thin boundaries (`#1c1c1e`) and structured as a strict 2-column grid.
*   **Column 1 (Left, 44px):** User avatar and continuous vertical thread connector line.
*   **Column 2 (Right):** Author name, raw thought text, bottom thinking timestamp, and horizontal action bar.
*   **Layout Spacing:** Asymmetric margins (`paddingLeft: 8`, `paddingRight: 16`), column gaps (`marginRight: 6` on left column), and vertical padding (`paddingVertical: 10`) between posts.

## 💬 Threads & Comment Flows
*   **Collapsed by Default:** Thread replies are collapsed in the feed under a clean count indicator (e.g. `"2 replies"`).
*   **Offset Nesting:** Tapping expands replies inline, rendering them indented/offset to indicate nesting.
*   **Focused Compose Modal:** Tapping a reply action launches a transparent overlay modal showing the parent post locked at the top, connected by a thread line to the active composer, focusing the keyboard with the post button positioned above the keyboard.
*   **Pill Inline Input:** Inline reply boxes inside expanded lists follow a dark pill container layout with an internal expand icon and a right-aligned white circular send button with a black up-arrow.

## 🌟 Product Vision & Guidelines
All feature sets, indexing schemas, user flows, and notifications must align with the core mission and matching architecture. Refer to [VISION.md](file:///c:/Users/User/Comellon/VISION.md) for full philosophical guidelines. Always prioritize thought discovery over passive scrolling and meaningful matching over popularity/vanity metrics.
