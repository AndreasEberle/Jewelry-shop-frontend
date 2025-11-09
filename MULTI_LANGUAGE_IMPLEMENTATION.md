# Multi-Language Support Implementation Guide

## Overview

This project uses a **hybrid model** for multi-language support:

- **UI Text**: Stored in Next.js translation JSON files (`/src/locales/`)
- **Product Data**: Stored in database with translations (`product_translations` table)

## Architecture

### 1. UI Translations (JSON Files)

Location: `frontend/src/locales/`

- `en-US.json` - English (US)
- `de-DE.json` - German
- Additional languages can be added as needed

**Structure:**
```json
{
  "common": {
    "search": "Search",
    "filters": "Filters"
  },
  "cart": {
    "bag": "BAG",
    "addItem": "Add item"
  }
}
```

### 2. Product Translations (Database)

**Table:** `product_translations`

Stores translated versions of:
- Product name
- Product description
- Material
- Special offer description

**Schema:**
```sql
CREATE TABLE product_translations (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    language_code VARCHAR(10), -- e.g., 'en-US', 'de-DE'
    name VARCHAR(255),
    description TEXT,
    material VARCHAR(100),
    special_offer_description TEXT,
    UNIQUE(product_id, language_code)
);
```

## Usage

### Frontend: Using UI Translations

```typescript
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <button>{t('common.search')}</button>
      <p>{t('cart.addItem')}</p>
    </div>
  )
}
```

### Frontend: Using Product Translations

The backend should return product data with translations based on the `Accept-Language` header or query parameter.

**Example API Call:**
```typescript
// Backend will return translated product data based on language
const products = await productService.getProducts({ 
  language: 'de-DE' // or from useLanguage hook
})
```

### Backend: Implementing Product Translations

1. **Entity Class** (Java):
```java
@Entity
@Table(name = "product_translations")
public class ProductTranslation {
    @Id
    @GeneratedValue
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    
    @Column(name = "language_code")
    private String languageCode;
    
    private String name;
    private String description;
    // ... other fields
}
```

2. **Service Layer**:
```java
public ProductDTO getProductWithTranslation(UUID productId, String languageCode) {
    Product product = productRepository.findById(productId).orElseThrow();
    ProductTranslation translation = translationRepository
        .findByProductIdAndLanguageCode(productId, languageCode)
        .orElse(null);
    
    // Merge translation with base product
    ProductDTO dto = convertToDTO(product);
    if (translation != null) {
        dto.setName(translation.getName());
        dto.setDescription(translation.getDescription());
    }
    
    return dto;
}
```

## Adding New Languages

### 1. Add UI Translation File

Create `frontend/src/locales/[language-code].json`:
```json
{
  "common": {
    "search": "Recherche",
    "filters": "Filtres"
  }
}
```

### 2. Update useTranslation Hook

Add the new language to the translations object:
```typescript
const translations: Record<string, TranslationObject> = {
  'en-US': enUS,
  'de-DE': deDE,
  'fr-FR': frFR, // Add new language
}
```

### 3. Add Language to LanguageContext

Update `supportedLanguages` in `LanguageContext.tsx`:
```typescript
const [supportedLanguages, setSupportedLanguages] = useState<string[]>([
  'de-DE', 
  'en-US', 
  'fr-FR', // Add new language
  // ...
])
```

### 4. Add Product Translations

Insert translations into `product_translations` table via admin panel or migration.

## Best Practices

1. **Fallback Strategy**: Always fallback to English (en-US) if translation is missing
2. **Language Detection**: Use browser locale or user preference
3. **Caching**: Cache translations on frontend to reduce API calls
4. **SEO**: Use language-specific URLs if needed (e.g., `/de/products`, `/en/products`)
5. **Admin Panel**: Create UI for managing product translations

## Migration Path

1. ✅ Create translation JSON files
2. ✅ Create `useTranslation` hook
3. ✅ Create database migration for `product_translations`
4. ⏳ Create backend entity and repository
5. ⏳ Update ProductService to return translated data
6. ⏳ Update frontend components to use translations
7. ⏳ Create admin UI for managing translations

## Example: Converting Existing Component

**Before:**
```tsx
<button>Add to Cart</button>
```

**After:**
```tsx
const { t } = useTranslation()
<button>{t('cart.addItem')}</button>
```

## Next Steps

1. Create backend `ProductTranslation` entity
2. Create `ProductTranslationRepository`
3. Update `ProductService` to fetch and merge translations
4. Update API endpoints to accept `Accept-Language` header
5. Gradually convert UI components to use `useTranslation` hook
6. Create admin panel for managing product translations

