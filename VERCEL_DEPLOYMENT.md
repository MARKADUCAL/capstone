# Vercel Deployment Guide for AutoWash Hub

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Git repository set up

## Build Configuration

The project is configured for Vercel deployment with the following optimizations:

### 1. Budget Configuration

- Initial bundle size: 3MB (increased from 1MB)
- Component styles: 15kB (increased from 8kB)

### 2. SSR (Server-Side Rendering) Configuration

- Angular Universal configured for SSR
- Chart.js components protected from SSR errors
- Number formatting functions made SSR-safe

### 3. Environment Configuration

- Production environment file created
- API URL configuration for production

## Deployment Steps

### Step 1: Update API URL

Before deploying, update the production API URL in:

```
src/environments/environment.prod.ts
```

Replace `https://your-backend-domain.com/api` with your actual backend URL.

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy from the frontend directory:

   ```bash
   cd frontend
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No
   - Project name: autowash-hub-frontend (or your preferred name)
   - Directory: ./ (current directory)
   - Override settings: No

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/autowash-hub`
   - Install Command: `npm install`

### Step 3: Environment Variables

Set the following environment variables in Vercel:

- `NODE_ENV`: `production`
- `API_URL`: Your backend API URL

### Step 4: Domain Configuration

1. In Vercel dashboard, go to your project settings
2. Add your custom domain if needed
3. Configure DNS settings as instructed

## Build Commands

- **Development**: `npm start`
- **Production Build**: `npm run build`
- **SSR Build**: `npm run build:ssr`
- **Vercel Build**: `npm run vercel-build`

## File Structure for Deployment

```
frontend/
├── dist/autowash-hub/          # Build output
│   ├── browser/                # Client-side files
│   └── server/                 # Server-side files
├── vercel.json                 # Vercel configuration
├── package.json                # Dependencies and scripts
└── angular.json               # Angular configuration
```

## Troubleshooting

### Common Issues

1. **Build Size Too Large**

   - The budget limits have been increased in `angular.json`
   - Consider code splitting for large components

2. **SSR Errors**

   - Chart.js components are now protected with `isPlatformBrowser` checks
   - Number formatting functions include null checks

3. **API Connection Issues**

   - Ensure your backend is deployed and accessible
   - Check CORS configuration on your backend
   - Verify the API URL in environment files

4. **404 Errors on Refresh**
   - Vercel configuration includes proper routing
   - All routes fallback to the main application

### Performance Optimization

1. **Bundle Size**: The initial bundle is ~1.5MB, which is acceptable for a feature-rich application
2. **Lazy Loading**: Consider implementing lazy loading for admin/employee modules
3. **Image Optimization**: Use WebP format for images and implement lazy loading
4. **Caching**: Vercel automatically handles caching for static assets

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Ensure your backend API is accessible
4. Test the build locally with `npm run build` before deploying
