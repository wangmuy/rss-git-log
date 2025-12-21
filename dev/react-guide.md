# React Static Frontend - Development Guide

**Project-specific patterns, conventions, and guidelines for React static frontend.**

## 📁 Project Structure

### Recommended Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/          # Shared components (Button, Card, etc.)
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Page-level components
├── features/            # Feature modules (with logic)
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── styles/              # Global styles, themes
├── assets/              # Images, fonts, static files
└── App.tsx              # Main application component
```

### Alternative Structures (Choose One)

**Option A: Feature-Based**
```
src/
├── features/
│   ├── auth/            # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── dashboard/       # Dashboard feature
│   └── profile/         # User profile feature
├── shared/              # Shared components
└── App.tsx
```

**Option B: Component-First**
```
src/
├── ui/                  # All UI components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── lib/                 # Utilities
└── App.tsx
```

**Document your chosen structure here:**
```markdown
**Current Structure:** [Choose: Component-First / Feature-Based / Custom]
**Components Location:** src/components/
**Pages Location:** src/pages/
**Custom Paths:** [Add any custom paths]
```

## 🎨 Styling Approach

### MUI v7 Integration
If using MUI v7, follow these patterns:

```tsx
// ✅ Good: Using MUI v7 styled components
import { styled, Box, Button } from '@mui/material';

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

// ✅ Good: Using sx prop for one-off styles
<Button
  sx={{
    mt: 2,
    bgcolor: 'primary.main',
    '&:hover': { bgcolor: 'primary.dark' }
  }}
>
  Click me
</Button>
```

### CSS-in-JS vs CSS Modules
**Current Choice:** [MUI v7 styled / CSS Modules / Tailwind / Other]

**Example:**
```tsx
// CSS Modules
import styles from './Component.module.css';

export const MyComponent = () => (
  <div className={styles.container}>...</div>
);

// MUI styled
import { styled } from '@mui/material';
const StyledDiv = styled('div')({ /* styles */ });
```

## 🔧 State Management

### Current Approach
**State Management:** [Context API / Zustand / Redux Toolkit / Jotai / Recoil / Other]

### Context API Pattern
```tsx
// src/contexts/UserContext.tsx
import { createContext, useContext, useReducer } from 'react';

interface UserState { /* ... */ }
type UserAction = { type: 'SET_USER'; payload: UserState };

const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
} | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
```

### Zustand Pattern (Recommended for Static Apps)
```tsx
// src/store/useUserStore.ts
import { create } from 'zustand';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

## 🎯 Component Patterns

### Functional Components
```tsx
// ✅ Good: Typed props interface
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};
```

### Container/Presenter Pattern
```tsx
// src/features/dashboard/components/Dashboard/DashboardContainer.tsx
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardPresenter } from './DashboardPresenter';

export const DashboardContainer = () => {
  const { data, loading, error } = useDashboardData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return <DashboardPresenter data={data} />;
};

// src/features/dashboard/components/Dashboard/DashboardPresenter.tsx
export const DashboardPresenter = ({ data }: { data: DashboardData }) => {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Render data */}
    </div>
  );
};
```

## 🪝 Custom Hooks

### Naming Convention
- Prefix with `use`
- Describe what they return
- Examples: `useUser`, `useLocalStorage`, `useDebounce`

### Common Hook Patterns

**Data Fetching:**
```tsx
// src/hooks/useData.ts
import { useState, useEffect } from 'react';

export const useData = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [fetcher]);

  return { data, loading, error };
};
```

**LocalStorage:**
```tsx
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};
```

## 📱 Responsive Design

### Mobile-First Approach
```tsx
// ✅ Good: Mobile-first breakpoints
import { useMediaQuery, useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
};
```

### CSS Grid/Flexbox
```css
/* src/styles/layout.css */
.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🚀 Performance Optimization

### Code Splitting
```tsx
// src/App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

export const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
};
```

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoized component
export const ExpensiveList = memo(({ items }: { items: Item[] }) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

// In parent component
const Parent = () => {
  const [items, setItems] = useState<Item[]>([]);

  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);

  // Memoize callbacks
  const handleItemClick = useCallback((id: string) => {
    console.log(id);
  }, []);

  return (
    <ExpensiveList
      items={filteredItems}
      onClick={handleItemClick}
    />
  );
};
```

### Image Optimization
```tsx
// ✅ Good: Lazy loading and optimized images
export const OptimizedImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width="100%"
      height="auto"
      style={{ aspectRatio: '16/9', objectFit: 'cover' }}
    />
  );
};
```

## 🧪 Testing Strategy

### Component Testing (with React Testing Library)
```tsx
// src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

### Hook Testing
```tsx
// src/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('stores and retrieves values', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    expect(result.current[0]).toBe('initial');

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'));
  });
});
```

## 🔒 Security Best Practices

### Input Validation
```tsx
// ✅ Good: Sanitize user inputs
import DOMPurify from 'dompurify';

export const SafeHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### Environment Variables
```tsx
// ✅ Good: Use Vite environment variables
const API_URL = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.PROD;

// ❌ Bad: Hardcoded secrets
const API_KEY = "sk_live_123456789"; // Never do this!
```

## 📦 Dependencies

### Recommended for Static React Apps
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@mui/material": "^7.0.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "zustand": "^4.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "@testing-library/react": "^14.0.0",
    "jsdom": "^22.0.0"
  }
}
```

## 🎯 Project-Specific Conventions

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase, prefixed with `use` (`useUserData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase with `Type` suffix (`UserType.ts`)

### File Organization
- **One component per file** (unless tightly coupled)
- **Co-locate tests**: `Component.tsx` + `Component.test.tsx`
- **Co-locate styles**: `Component.tsx` + `Component.module.css`
- **Index files**: Use `index.ts` for clean imports

### Import Order
```tsx
// ✅ Good: Organized imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useUserStore } from '@/store/useUserStore';
import { formatDate } from '@/utils/formatDate';
import { UserProfileType } from '@/types/user';
import styles from './UserProfile.module.css';
import { LoadingSpinner } from '../common/LoadingSpinner';
```

### Code Style
- **Use TypeScript** strictly (no `any` without justification)
- **Arrow functions** for components
- **Destructure props**
- **Early returns** for conditional rendering
- **Template literals** for strings

## 🚀 Deployment

### Build Process
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
```bash
# .env.production
VITE_API_URL=https://api.yourapp.com
VITE_APP_NAME=My React App
```

### Static Hosting
**Recommended platforms:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Deployment checklist:**
- [ ] Build passes without errors
- [ ] All environment variables set
- [ ] Routing configured for SPA
- [ ] Assets optimized and compressed
- [ ] Analytics configured (if needed)

## 📝 Project Notes

### Current Decisions
```markdown
**Date:** [Current Date]
**State Management:** [Chosen solution]
**Styling:** [MUI v7 / CSS Modules / Tailwind / Other]
**Router:** [React Router / Other]
**Build Tool:** [Vite / Create React App / Other]
**Testing:** [Jest + RTL / Vitest / Other]
```

### Future Considerations
- [ ] Add error boundary handling
- [ ] Implement proper loading states
- [ ] Add accessibility testing
- [ ] Set up CI/CD pipeline
- [ ] Add performance monitoring
- [ ] Implement PWA features

### Known Issues
- [ ] List any current issues or technical debt
- [ ] Performance bottlenecks
- [ ] Missing features

## 🔍 Troubleshooting

### Common Issues

**Issue: "Module not found"**
```bash
# Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Issue: "React hook rules violated"**
- Ensure hooks are called at top level
- Never conditionally call hooks
- Use ESLint plugin: `eslint-plugin-react-hooks`

**Issue: "Styles not applying"**
- Check CSS import order
- Verify class names match
- Inspect browser dev tools

## 📚 Resources

### Documentation
- [React Docs](https://react.dev/)
- [MUI v7 Docs](https://mui.com/material-ui/)
- [React Router Docs](https://reactrouter.com/)
- [TypeScript Docs](https://www.typescriptlang.org/)

### Tools
- [Vite](https://vitejs.dev/)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

### Learning
- [React Patterns](https://reactpatterns.com/)
- [Modern React Best Practices](https://www.epicreact.dev/)
- [Testing Library Recipes](https://testing-library.com/docs/react-testing-library/example-intro)

---

**Last Updated:** [Date]
**Maintainer:** [Your Name/Team]
**Version:** 1.0.0