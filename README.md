# Jewelry Shop Frontend

A modern, responsive e-commerce frontend built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── sections/       # Page sections (Hero, FeaturedProducts)
│   └── providers/      # Context providers
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── lib/                # Third-party library configurations
```

## 🛠️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Authentication**: OAuth2 integration with backend
- **Product Catalog**: Browse and search jewelry products
- **Shopping Cart**: Add/remove items with persistent state
- **Admin Dashboard**: Product management for administrators
- **SEO Optimized**: Meta tags and structured data

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🌐 API Integration

The frontend connects to the Spring Boot backend API. Make sure the backend is running on `http://localhost:8080` before starting the frontend.

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Key Components

- **Header**: Navigation with cart and user menu
- **Hero**: Landing page banner with call-to-action
- **FeaturedProducts**: Product grid with filtering
- **Footer**: Links and contact information
- **ProductCard**: Individual product display
- **Cart**: Shopping cart functionality

## 🔐 Authentication

- OAuth2 integration with Google
- JWT token management
- Protected routes for admin features
- Automatic token refresh

## 🛒 Shopping Features

- Product browsing and filtering
- Shopping cart with persistent state
- User authentication and profiles
- Order management
- Admin product management

## 📦 Deployment

The app is ready for deployment on Vercel, Netlify, or any other Next.js-compatible platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request



