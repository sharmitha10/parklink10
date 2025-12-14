# Pages Integration Checklist & Examples

## Pages to Update (Priority Order)

### 1. FindParking.js
Location: `frontend/src/pages/FindParking.js`

**Add at top:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**In component, after other hooks:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  title: 'Find Parking',
  searchPlaceholder: 'Search by location',
  filterLabel: 'Maximum Price',
  bookButton: 'Book Parking',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

**Replace text in JSX:**
- `'Find Parking'` → `{translated.title}`
- `'Search by location'` → `{translated.searchPlaceholder}`
- `'Book Parking'` → `{translated.bookButton}`

---

### 2. MyBookings.js
Location: `frontend/src/pages/MyBookings.js`

**Add import:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**Add to component:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  myBookings: 'My Bookings',
  location: 'Location',
  status: 'Status',
  cancelButton: 'Cancel Booking',
  noBookings: 'No bookings found',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

---

### 3. UserDashboard.js
Location: `frontend/src/pages/UserDashboard.js`

**Add import:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**Add to component:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  welcome: 'Welcome back',
  recentBookings: 'Recent Bookings',
  activeBookings: 'Active Bookings',
  findParking: 'Find Parking',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

---

### 4. AdminDashboard.js
Location: `frontend/src/pages/AdminDashboard.js`

**Add import:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**Add to component:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  adminDashboard: 'Admin Dashboard',
  totalSlots: 'Total Slots',
  occupiedSlots: 'Occupied Slots',
  revenue: 'Revenue',
  manageSlots: 'Manage Slots',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

---

### 5. ManageSlots.js
Location: `frontend/src/pages/ManageSlots.js`

**Add import:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**Add to component:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  manageSlots: 'Manage Parking Slots',
  addSlot: 'Add New Slot',
  slotNumber: 'Slot Number',
  price: 'Price per hour',
  available: 'Available',
  edit: 'Edit',
  delete: 'Delete',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

---

### 6. Login.js & Register.js
Location: `frontend/src/pages/Login.js` and `Register.js`

**Add import:**
```javascript
import { useGoogleTranslate } from '../components/LanguageSwitcher';
```

**For Login.js:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  signIn: 'Sign In',
  email: 'Email',
  password: 'Password',
  loginButton: 'Login',
  register: 'Create Account',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);
```

---

## How to Apply (Step-by-Step Example)

### Example: Update FindParking.js

**Before:**
```javascript
return (
  <div className="find-parking">
    <h1>Find Parking</h1>
    <input placeholder="Search by location" />
    <button>Book Parking</button>
  </div>
);
```

**After:**
```javascript
const { translateText, currentLanguage } = useGoogleTranslate();
const [translated, setTranslated] = useState({
  title: 'Find Parking',
  search: 'Search by location',
  button: 'Book Parking',
});

useEffect(() => {
  const translate = async () => {
    const trans = {};
    for (const [key, val] of Object.entries(translated)) {
      trans[key] = currentLanguage === 'en' ? val : await translateText(val);
    }
    setTranslated(trans);
  };
  translate();
}, [currentLanguage, translateText]);

return (
  <div className="find-parking">
    <h1>{translated.title}</h1>
    <input placeholder={translated.search} />
    <button>{translated.button}</button>
  </div>
);
```

---

## Testing Each Page

After updating a page:

1. Start frontend: `npm start`
2. Go to page URL (e.g., http://localhost:3000/find-parking)
3. Click Globe icon 🌐 in navbar
4. Select "हिंदी" (Hindi)
5. Page text should translate
6. Switch back to English to verify it works both ways

---

## Batch Update (All at Once)

If you want to update all pages together:

1. Copy the import line: `import { useGoogleTranslate } from '../components/LanguageSwitcher';`
2. Copy the hook usage from each section above
3. Paste into each page file
4. Replace text strings with translated state variables
5. Test each page

---

## Copy-Paste Template (Use for any page)

```javascript
// ===== ADD AT TOP =====
import { useGoogleTranslate } from '../components/LanguageSwitcher';

// ===== ADD IN COMPONENT =====
const PageName = () => {
  const { translateText, currentLanguage } = useGoogleTranslate();
  const [translated, setTranslated] = useState({
    // Add all text strings here
    key1: 'English Text 1',
    key2: 'English Text 2',
    key3: 'English Text 3',
  });

  useEffect(() => {
    const translate = async () => {
      const trans = {};
      for (const [key, val] of Object.entries(translated)) {
        trans[key] = currentLanguage === 'en' ? val : await translateText(val);
      }
      setTranslated(trans);
    };
    translate();
  }, [currentLanguage, translateText]);

  return (
    <div>
      {/* Replace strings with {translated.key1}, {translated.key2}, etc */}
    </div>
  );
};

export default PageName;
```

That's it! Use this template for all pages.
