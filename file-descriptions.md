# File Descriptions for the Frontend Branch

## Root Directory
- **components.json**: Configuration file for managing components in the project.
- **next-env.d.ts**: TypeScript declaration file for Next.js.
- **next.config.mjs**: Configuration file for Next.js settings.
- **package.json**: Contains metadata about the project and its dependencies.
- **pnpm-lock.yaml**: Lock file for dependencies managed by pnpm.
- **postcss.config.mjs**: Configuration file for PostCSS, used for processing CSS.
- **tsconfig.json**: TypeScript configuration file.

## app Directory
- **globals.css**: Global CSS styles for the application.
- **layout.tsx**: Defines the layout structure for the application.

### app/(auth) Directory
- **layout.tsx**: Layout for preference selection.
- **preferences/page.tsx**: Interest selection and onboarding page.

### app/login and app/signup Directories
- Legacy account URLs redirect to the guest-accessible dashboard.

### app/(dashboard) Directory
- **layout.tsx**: Layout for dashboard-related pages.
- **dashboard/page.tsx**: Main dashboard page component.
- **dashboard/food/page.tsx**: Food-related dashboard page.
- **dashboard/itinerary/page.tsx**: Itinerary-related dashboard page.
- **dashboard/map/page.tsx**: Map-related dashboard page.
- **dashboard/places/page.tsx**: Places-related dashboard page.
- **dashboard/saved-routes/page.tsx**: Saved routes dashboard page.
- **dashboard/translator/page.tsx**: Translator-related dashboard page.

### app/(site) Directory
- **layout.tsx**: Layout for site-related pages.
- **page.tsx**: Main landing page component.
- **faqs/page.tsx**: FAQs page component.

## components Directory
- **footer.tsx**: Footer component for the application.
- **listing-card.tsx**: Component for displaying individual listings.
- **navbar.tsx**: Navigation bar component.
- **search-filters.tsx**: Component for search filters.
- **theme-provider.tsx**: Provides theme context for the application.

### components/home Directory
- **events-section.tsx**: Displays the events section on the homepage.
- **faq-section.tsx**: Displays the FAQ section on the homepage.
- **featured-places.tsx**: Displays featured places on the homepage.
- **hero-section.tsx**: Displays the hero section on the homepage, including the "View Routes" button.
- **how-it-works.tsx**: Explains how the application works.

### components/ui Directory
Contains reusable UI components such as buttons, modals, forms, and more. Examples include:
- **button.tsx**: Button component.
- **modal.tsx**: Modal component.
- **form.tsx**: Form component.
- **toast.tsx**: Toast notification component.

## hooks Directory
- **use-mobile.ts**: Custom hook for detecting mobile devices.
- **use-toast.ts**: Custom hook for managing toast notifications.

## lib Directory
- **preferences.ts**: Reads and saves interests in browser local storage.
- **utils.ts**: Utility functions used across the application.

## public Directory
Contains static assets such as images and icons.
- **images/**: Directory containing image assets like hero images, icons, and placeholders.

## styles Directory
- **globals.css**: Global CSS styles for the application.

