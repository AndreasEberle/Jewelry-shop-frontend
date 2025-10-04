# 🚀 Jewelry Shop Frontend - Complete Startup Guide

## 📋 What We've Built So Far

### 🏗️ **Project Structure**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom color scheme
- **State Management**: Zustand (ready for implementation)
- **Data Fetching**: TanStack Query (React Query) configured
- **Forms**: React Hook Form with Zod validation (ready)
- **HTTP Client**: Axios with interceptors for authentication
- **Icons**: Lucide React for consistent iconography

### 🎨 **UI Components Created**
1. **Layout Components**:
   - `Header.tsx` - Navigation with logo, menu, cart, and user icons
   - `Footer.tsx` - Footer component (structure ready)

2. **Page Sections**:
   - `Hero.tsx` - Landing page banner with call-to-action
   - `FeaturedProducts.tsx` - Product grid with mock data and loading states

3. **Providers**:
   - `Providers.tsx` - TanStack Query client configuration

### 🔧 **Services & API Integration**
1. **API Service** (`api.ts`):
   - Axios instance with base URL configuration
   - Request interceptor for JWT token authentication
   - Response interceptor for error handling and token refresh

2. **Product Service** (`productService.ts`):
   - Complete CRUD operations for products
   - Filtering, searching, and pagination support
   - Featured products endpoint

3. **Auth Service** (`authService.ts`):
   - Login/register with email/password
   - OAuth2 integration (Google)
   - Token management and refresh
   - User profile management

### 🎯 **Type Definitions**
- Complete TypeScript interfaces for all entities
- Product, User, Cart, Order, Category, Tag types
- API response and error handling types
- Form validation schemas ready

### 🎨 **Design System**
- **Color Palette**:
  - Primary: Blue tones (#0284c7)
  - Secondary: Purple tones (#c026d3)
  - Accent: Orange tones (#ea580c)
- **Typography**: Inter (sans-serif) + Playfair Display (serif)
- **Components**: Reusable button, card, and input styles
- **Responsive**: Mobile-first design approach

---

## 🚀 **How to Start the Frontend**

### **Prerequisites**
- Node.js 18+ installed
- Backend API running on `http://localhost:8080`

### **Step 1: Navigate to Frontend Directory**
```bash
cd frontend
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Environment Setup**
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### **Step 4: Start Development Server**
```bash
npm run dev
```

### **Step 5: Access the Application**
🌐 **Frontend URL**: [http://localhost:3000](http://localhost:3000)

---

## 📱 **Available Pages & Features**

### **Current Pages**
1. **Home Page** (`/`)
   - Hero section with call-to-action
   - Featured products grid
   - Responsive navigation

2. **Navigation Links** (ready for implementation):
   - `/products` - Product catalog
   - `/categories` - Category browsing
   - `/about` - About page
   - `/contact` - Contact page

### **Features Implemented**
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states and animations
- ✅ Product card components with ratings
- ✅ Shopping cart icon with counter
- ✅ User authentication icons
- ✅ Search functionality (UI ready)
- ✅ API integration layer
- ✅ TypeScript type safety

### **Features Ready for Implementation**
- 🔄 Shopping cart functionality
- 🔄 User authentication forms
- 🔄 Product filtering and search
- 🔄 Admin dashboard
- 🔄 Order management
- 🔄 Payment integration

---

## 🛠️ **Development Commands**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

---

## 🔗 **Backend Integration**

### **API Endpoints Expected**
- `GET /api/products` - List products with filters
- `GET /api/products/{id}` - Get single product
- `GET /api/products/featured` - Get featured products
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Authentication Flow**
1. User logs in via form or OAuth2
2. JWT token stored in localStorage
3. Token automatically added to API requests
4. Automatic token refresh on 401 errors
5. Redirect to login on authentication failure

---

## 🎨 **Customization Guide**

### **Colors**
Edit `tailwind.config.js` to modify the color scheme:
```javascript
colors: {
  primary: { /* Blue tones */ },
  secondary: { /* Purple tones */ },
  accent: { /* Orange tones */ }
}
```

### **Components**
All components are in `src/components/` with:
- Reusable button styles (`.btn`, `.btn-primary`, `.btn-outline`)
- Card components (`.card`)
- Input styles (`.input`)

### **API Configuration**
Update `src/services/api.ts` to change:
- Base URL
- Request/response interceptors
- Error handling logic

---

## 🚀 **Next Steps for Development**

1. **Implement Product Pages**:
   - Product detail page
   - Product listing with filters
   - Category pages

2. **Add Authentication**:
   - Login/register forms
   - Protected routes
   - User profile management

3. **Shopping Cart**:
   - Add/remove items
   - Persistent cart state
   - Checkout process

4. **Admin Features**:
   - Product management
   - Order management
   - User management

5. **Testing**:
   - Unit tests for components
   - Integration tests for API calls
   - E2E tests for user flows

---

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
2. **API connection failed**: Ensure backend is running on port 8080
3. **Build errors**: Run `npm run type-check` to identify TypeScript issues
4. **Styling issues**: Check Tailwind classes and custom CSS

### **Development Tips**
- Use browser dev tools for responsive testing
- Check Network tab for API call debugging
- Use React DevTools for component state inspection
- Monitor console for authentication errors

---

## 📞 **Support**

For issues or questions:
1. Check the browser console for errors
2. Verify backend API is running
3. Check environment variables
4. Review component props and state

**Happy coding! 🎉**
