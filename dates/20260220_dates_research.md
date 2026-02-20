# Dates/Contacts Application - Framework Migration Research

**Date:** February 20, 2026
**Research Scope:** TypeScript, Rust, and Ruby frameworks for rebuilding the dates/contacts tracking application
**Current Implementation:** Single HTML file (~3,356 lines) with vanilla JavaScript and Firebase integration

---

## Executive Summary

This comprehensive research evaluates modern web frameworks across three programming languages (TypeScript, Rust, and Ruby) for migrating a sophisticated contact/person management application with timeline logging, real-time data synchronization, and premium UI features.

### Quick Comparison Table

| Criteria | TypeScript (SvelteKit) | Rust (Leptos) | Ruby (Rails + Hotwire) |
|----------|------------------------|---------------|------------------------|
| **Bundle Size** | 40-70 KB | 150-250 KB | N/A (server-rendered) |
| **Performance** | Excellent | Excellent | Good |
| **Development Speed** | Very Fast | Medium | Fast |
| **Type Safety** | Strong (TS) | Strongest (Rust) | Weak (Ruby) |
| **Learning Curve** | Low | High | Medium |
| **Ecosystem Maturity** | Growing | Emerging | Mature |
| **Firebase Integration** | Native | Custom REST | Via gem |
| **Real-time Support** | Excellent | Manual | Excellent (ActionCable) |
| **Mobile Performance** | Excellent | Excellent | Good |
| **Community Size** | Large | Small | Largest |
| **Production Readiness** | High | Medium | Highest |

### Top Recommendations by Priority

1. **Performance & Mobile-First:** SvelteKit (TypeScript)
2. **Type Safety & Full-Stack Rust:** Leptos (Rust)
3. **Enterprise & Rapid Development:** Rails 7+ with Hotwire (Ruby)

---

## Current Application Analysis

### Core Features

The existing application is a sophisticated single-page application featuring:

**Contact Management**
- Comprehensive person profiles (name, occupation, location, birthday, height)
- Multi-dimensional rating system (face, body, kissing, conversation/vibe: 1-10 scale)
- Relationship status tracking (Talking, Dating, Friendzoned, Ghosted, etc.)
- Interest level indicators (1-5 scale with danger warnings)
- Date counter and meeting details

**Timeline/Logging System**
- Chronological activity logs per contact
- Timestamped entries with notes
- Full CRUD operations (create, edit, delete)
- Historical tracking of all interactions

**Data Persistence & Sync**
- Firebase Firestore integration
- Offline-first architecture with local caching
- Smart delta sync with dirty state tracking
- Optimistic UI updates
- Conflict resolution mechanisms
- Real-time synchronization across devices

**Visual & UI Features**
- Dual view modes: Grid and List views with smooth transitions
- Premium holographic effects for contacts with average rating >= 9.0
- iOS-style glass morphism design
- Dynamic time-based background gradients (dawn, day, sunset, night)
- Particle effects and sun animations
- Dark mode with grain textures
- Safe area insets for mobile/PWA support
- Segmented controls (iOS-style)

**Advanced Features**
- Statistics dashboard with year-based filtering
- Global analytics (average ratings, top performers)
- Activity tracking
- Google OAuth authentication
- Toast notifications
- Modal dialogs for editing

### Technical Characteristics

**Current Stack:**
- **Size:** ~3,356 lines in single HTML file
- **JavaScript:** Vanilla ES6+ (no framework dependencies)
- **CSS:** ~2,000 lines with extensive custom properties
- **State Management:** Custom AppState object
- **Backend:** Firebase SDK (Firestore + Auth)
- **Architecture:** Event-driven with direct DOM manipulation
- **Build Process:** None (runs directly in browser)

**Complexity Indicators:**
- 30+ global functions
- Complex state management with dirty tracking
- Sophisticated animation system
- Real-time sync engine with delta updates
- Offline persistence with cache strategies

---

## TypeScript Frameworks Analysis

### 1. SvelteKit (Primary Recommendation)

**Overview:**
SvelteKit is the official application framework for Svelte, a compiler-based framework that generates highly optimized vanilla JavaScript. Unlike React/Vue, Svelte compiles components to efficient imperative code at build time.

**Why It's Suitable:**
- Smallest bundle sizes (40-70KB) - critical for mobile performance
- No virtual DOM overhead - direct DOM updates
- Built-in animations match current app's animation style
- Fine-grained reactivity perfect for real-time rating updates
- Less boilerplate than React (no useState, useEffect)
- Scoped CSS prevents style leakage
- Excellent TypeScript support

**Project Structure:**
```
dates-app/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte           # Root layout
│   │   ├── +page.svelte             # Login page
│   │   ├── dashboard/
│   │   │   ├── +page.svelte         # Contacts view
│   │   │   └── +layout.svelte       # Dashboard layout
│   │   └── stats/
│   │       └── +page.svelte         # Statistics
│   ├── lib/
│   │   ├── components/
│   │   │   ├── contacts/
│   │   │   │   ├── ContactCard.svelte
│   │   │   │   ├── ContactList.svelte
│   │   │   │   └── ContactModal.svelte
│   │   │   ├── timeline/
│   │   │   │   ├── TimelineEntry.svelte
│   │   │   │   └── TimelineModal.svelte
│   │   │   └── ui/
│   │   │       ├── SegmentedControl.svelte
│   │   │       ├── Header.svelte
│   │   │       └── HolographicCard.svelte
│   │   ├── stores/
│   │   │   ├── contacts.ts          # Svelte stores
│   │   │   ├── auth.ts
│   │   │   └── sync.ts
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   └── db.ts
│   │   └── utils/
│   │       └── helpers.ts
│   └── app.html                     # HTML template
├── static/
│   └── manifest.json
├── package.json
├── svelte.config.js
└── tsconfig.json
```

**State Management (Built-in Svelte Stores):**
```typescript
// lib/stores/contacts.ts
import { writable, derived } from 'svelte/store';
import type { Contact, ViewMode } from '../types';

function createContactStore() {
  const { subscribe, set, update } = writable<Contact[]>([]);

  return {
    subscribe,
    set,
    add: (contact: Contact) => update(contacts => [...contacts, contact]),
    update: (id: string, data: Partial<Contact>) =>
      update(contacts =>
        contacts.map(c => (c.id === id ? { ...c, ...data } : c))
      ),
    remove: (id: string) =>
      update(contacts => contacts.filter(c => c.id !== id)),
    reset: () => set([])
  };
}

export const contacts = createContactStore();
export const viewMode = writable<ViewMode>('list');
export const dirtyIds = writable<string[]>([]);

// Derived store for premium contacts
export const premiumContacts = derived(contacts, $contacts =>
  $contacts.filter(c => calculateAverage(c.ratings) >= 9.0)
);
```

**Component Example:**
```svelte
<!-- lib/components/contacts/ContactCard.svelte -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { Contact } from '$lib/types';

  export let contact: Contact;

  $: average = calculateAverage(contact.ratings);
  $: isPremium = average >= 9.0;
  $: isTalking = contact.relationshipStatus?.toLowerCase() === 'talking';

  function handleClick() {
    // Open timeline modal
  }
</script>

<div
  class="grid-card"
  class:holographic={isPremium}
  on:click={handleClick}
  transition:scale={{ duration: 200 }}
>
  {#if isPremium}
    <div class="holographic-shimmer" />
  {/if}

  <div class="card-initials" class:pulse={isTalking}>
    {contact.name.charAt(0)}
  </div>

  <div class="card-name">{contact.name}</div>
  <div class="card-detail">{contact.occupation || 'No Job'}</div>
  <div class="card-rating">{average} ★</div>
</div>

<style>
  .grid-card {
    background: linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 14px;
    cursor: pointer;
  }
</style>
```

**Firebase Integration:**
```typescript
// lib/firebase/db.ts
import { db } from './config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { contacts } from '../stores/contacts';

export function subscribeToContacts() {
  const q = query(
    collection(db, 'Dates'),
    orderBy('dateWeMet', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    contacts.set(data);
  });
}
```

**Pros:**
- Smallest bundle sizes (40-70KB for entire app)
- Best performance (compiled output, no runtime overhead)
- Less code than React (reactive declarations eliminate boilerplate)
- Built-in animations perfectly suited for current design
- Scoped CSS by default
- Great mobile performance
- Intuitive syntax - easiest to learn
- Excellent PWA support

**Cons:**
- Smaller ecosystem than React
- Less mature than Next.js (stable since Dec 2022)
- Fewer developers familiar with Svelte
- Fewer pre-built component libraries
- Less enterprise adoption

**Expected Outcomes:**
- 50-60% reduction in code size vs current implementation
- 40-50% reduction in bundle size
- 30-40% improvement in First Contentful Paint
- Significantly improved maintainability

---

### 2. Next.js 14+ with App Router (React)

**Overview:**
Industry-standard React framework with server-side rendering, routing, and optimization features. The App Router provides modern file-based routing with React Server Components.

**Why It's Suitable:**
- Production-ready with battle-tested stability
- Best Firebase integration ecosystem
- Largest community and job market
- Built-in PWA support
- Strong TypeScript integration
- Can add API routes if needed later

**Project Structure:**
```
dates-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with auth provider
│   │   ├── page.tsx                   # Landing/login page
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Main contacts view
│   │   │   └── layout.tsx            # Dashboard layout
│   │   └── stats/
│   │       └── page.tsx              # Statistics page
│   ├── components/
│   │   ├── contacts/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactListRow.tsx
│   │   │   ├── ContactModal.tsx
│   │   │   └── ContactGrid.tsx
│   │   ├── timeline/
│   │   └── ui/
│   ├── lib/
│   │   ├── firebase/
│   │   ├── hooks/
│   │   ├── store/                    # Zustand store
│   │   └── utils/
│   └── types/
└── package.json
```

**State Management (Zustand - Recommended):**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ContactStore {
  contacts: Contact[];
  viewMode: 'list' | 'grid';
  dirtyIds: string[];
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  markDirty: (id: string) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
}

export const useContactStore = create<ContactStore>()(
  persist(
    (set) => ({
      contacts: [],
      viewMode: 'list',
      dirtyIds: [],
      // ... actions
    }),
    { name: 'dates-storage' }
  )
);
```

**Pros:**
- Largest ecosystem (most libraries and examples)
- Best job market demand
- SEO capabilities if needed
- Built-in image optimization
- API routes for backend endpoints
- Excellent developer experience
- Battle-tested at massive scale

**Cons:**
- Larger bundle size (180-220KB vs SvelteKit's 40-70KB)
- More complex concepts (Server vs Client Components)
- More boilerplate than SvelteKit
- Longer build times
- May be overkill for this use case

**Best For:** Enterprise applications, team projects, apps with growth potential, SEO requirements

---

### 3. React with Vite

**Overview:**
Lightweight alternative to Next.js using React with Vite build tool. Fast HMR and optimized builds without framework overhead.

**Why It's Suitable:**
- Fastest dev server (instant HMR)
- Simpler than Next.js
- Lighter than Next.js (no SSR overhead)
- Full React ecosystem access

**Pros:**
- Incredibly fast development
- Simpler setup than Next.js
- All React libraries available
- Easy static deployment

**Cons:**
- Manual routing setup required
- No SSR (not needed for this app)
- No automatic code splitting
- Less opinionated

**Best For:** Client-side only apps, developers wanting simplicity, no SSR requirements

---

### 4. Vue 3 with Nuxt 3

**Overview:**
Progressive framework with Composition API. Nuxt 3 is Vue's equivalent to Next.js.

**Why It's Suitable:**
- Middle ground between React and Svelte
- Excellent documentation
- Smaller bundle than React
- Good TypeScript support in Vue 3

**State Management (Pinia):**
```typescript
export const useContactStore = defineStore('contacts', {
  state: () => ({
    contacts: [] as Contact[],
    viewMode: 'list' as 'list' | 'grid',
    dirtyIds: [] as string[]
  }),

  getters: {
    premiumContacts: (state) =>
      state.contacts.filter(c => calculateAverage(c.ratings) >= 9.0)
  },

  actions: {
    addContact(contact: Contact) {
      this.contacts.push(contact);
      this.dirtyIds.push(contact.id);
    }
  }
});
```

**Pros:**
- Best documentation of any framework
- Template syntax easier for designers
- Good performance
- Balanced complexity

**Cons:**
- Smaller ecosystem than React
- Less common in US market
- Learning curve for template directives

**Best For:** Teams familiar with Vue, balanced complexity needs

---

### TypeScript Framework Comparison

| Framework | Bundle Size | Dev Speed | Performance | Ecosystem | Learning Curve |
|-----------|-------------|-----------|-------------|-----------|----------------|
| **SvelteKit** | 40-70 KB | Fastest | Excellent | Growing | Low |
| **Next.js** | 180-220 KB | Fast | Good | Largest | Medium-High |
| **React + Vite** | 120-150 KB | Fastest | Good | Largest | Medium |
| **Vue/Nuxt** | 140-180 KB | Fast | Very Good | Large | Medium |

---

## Rust Frameworks Analysis

### 1. Leptos (Primary Recommendation)

**Overview:**
Full-stack reactive web framework inspired by SolidJS. Fine-grained reactivity with excellent performance, supporting both CSR and SSR.

**Why It's Suitable:**
- Fine-grained reactivity perfect for real-time UI updates (ratings, status)
- Full-stack capabilities (frontend + backend in same codebase)
- Excellent type safety through Rust
- Small bundle sizes despite being WASM
- Growing community with strong momentum

**Project Structure:**
```
dates-app/
├── Cargo.toml
├── src/
│   ├── main.rs              # Entry point
│   ├── app.rs               # Root app component
│   ├── components/
│   │   ├── mod.rs
│   │   ├── contact_card.rs
│   │   ├── contact_form.rs
│   │   ├── timeline.rs
│   │   └── ui/
│   ├── models/
│   │   ├── contact.rs
│   │   └── log_entry.rs
│   ├── state/
│   │   └── app_state.rs
│   ├── api/
│   │   └── backend.rs
│   └── utils/
│       └── calculations.rs
├── style/
│   └── main.css
└── public/
```

**Reactivity System:**
```rust
use leptos::*;

#[derive(Clone, Debug)]
struct Contact {
    id: String,
    name: String,
    ratings: Ratings,
    interest_level: f64,
}

#[component]
fn App() -> impl IntoView {
    // Create reactive signals
    let (contacts, set_contacts) = create_signal(Vec::<Contact>::new());
    let (view_mode, set_view_mode) = create_signal(ViewMode::Grid);
    let (selected_year, set_selected_year) = create_signal(2026);

    // Derived signals (memos)
    let filtered_contacts = create_memo(move |_| {
        contacts.get()
            .into_iter()
            .filter(|c| c.year() == selected_year.get())
            .collect::<Vec<_>>()
    });

    // Effects for side effects (API calls, localStorage)
    create_effect(move |_| {
        let contacts_data = contacts.get();
        spawn_local(async move {
            save_to_backend(contacts_data).await;
        });
    });

    view! {
        <div class="app">
            <ContactList
                contacts=filtered_contacts
                view_mode=view_mode
            />
        </div>
    }
}
```

**Contact Model:**
```rust
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Ratings {
    pub face: f64,
    pub body: f64,
    pub kissing: f64,
    pub conversation_vibe: f64,
}

impl Ratings {
    pub fn average(&self) -> f64 {
        (self.face + self.body + self.kissing + self.conversation_vibe) / 4.0
    }

    pub fn is_premium(&self) -> bool {
        self.average() >= 9.0
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub name: String,
    pub occupation: String,
    pub ratings: Ratings,
    pub interest_level: f64,
    pub relationship_status: RelationshipStatus,
    pub date_we_met: String,
    pub how_we_met: String,
    pub number_of_dates: u32,
    pub last_updated: String,
}
```

**Backend Integration (Server Functions):**
```rust
#[server(GetContacts, "/api")]
pub async fn get_contacts() -> Result<Vec<Contact>, ServerFnError> {
    // Use reqwest to call Firebase REST API
    // OR use a Rust backend (PostgreSQL, MongoDB, etc.)
    let response = reqwest::get("https://firestore.googleapis.com/...")
        .await?
        .json::<Vec<Contact>>()
        .await?;
    Ok(response)
}

#[server(SaveContact, "/api")]
pub async fn save_contact(contact: Contact) -> Result<(), ServerFnError> {
    reqwest::Client::new()
        .post("https://firestore.googleapis.com/...")
        .json(&contact)
        .send()
        .await?;
    Ok(())
}
```

**WASM Bundle Size:**
- Expected: 150-250 KB (gzipped)
- Optimization tips: Enable LTO, use `wasm-opt`, code splitting

**Pros:**
- Excellent fine-grained reactivity (no VDOM)
- Full-stack capabilities in single codebase
- Strong type safety (compile-time guarantees)
- Small bundle sizes for a WASM framework
- Great developer experience with macros
- Active development and growing community
- Excellent documentation

**Cons:**
- Steeper learning curve (Rust ownership/borrowing)
- Firebase requires custom REST API wrapper
- Less mature ecosystem than TypeScript
- Smaller community than React/Vue
- CSS-in-Rust options limited

**Recommendation:** ⭐⭐⭐⭐⭐ (5/5) - Highly recommended if willing to invest in Rust learning

---

### 2. Yew

**Overview:**
Mature component-based framework inspired by React/Elm. Uses virtual DOM and has been production-ready longer than other Rust frameworks.

**Why It's Suitable:**
- Most mature Rust web framework
- React-like patterns (familiar to React developers)
- Good documentation and community
- Production-proven

**State Management:**
```rust
use yew::prelude::*;

enum AppAction {
    AddContact(Contact),
    UpdateContact(Contact),
    DeleteContact(String),
    SetViewMode(ViewMode),
}

struct AppState {
    contacts: Vec<Contact>,
    view_mode: ViewMode,
}

impl Reducible for AppState {
    type Action = AppAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        let mut state = (*self).clone();
        match action {
            AppAction::AddContact(contact) => state.contacts.push(contact),
            AppAction::UpdateContact(contact) => {
                if let Some(c) = state.contacts.iter_mut().find(|c| c.id == contact.id) {
                    *c = contact;
                }
            },
            _ => {}
        }
        Rc::new(state)
    }
}
```

**Pros:**
- Most mature and stable
- Largest Rust web framework community
- React-like mental model
- Comprehensive documentation
- Production-proven

**Cons:**
- Virtual DOM less efficient than fine-grained reactivity
- Larger bundle sizes (200-350 KB)
- More verbose than Leptos
- Still requires custom Firebase work

**Recommendation:** ⭐⭐⭐⭐ (4/5) - Solid choice for stability, but Leptos has better reactivity

---

### 3. Dioxus

**Overview:**
Cross-platform GUI framework inspired by React. Supports web (WASM), desktop, mobile, and SSR from single codebase.

**Why It's Suitable:**
- React-like API (RSX macro similar to JSX)
- Cross-platform potential
- Good performance with optimized VDOM
- Could build native Mac/iOS app later

**Reactivity:**
```rust
use dioxus::prelude::*;
use fermi::*;

static CONTACTS: Atom<Vec<Contact>> = Atom(|_| Vec::new());
static VIEW_MODE: Atom<ViewMode> = Atom(|_| ViewMode::Grid);

fn App(cx: Scope) -> Element {
    let contacts = use_read(&cx, &CONTACTS);
    let view_mode = use_read(&cx, &VIEW_MODE);

    cx.render(rsx! {
        div { class: "app",
            ContactList {
                contacts: contacts.clone(),
                view_mode: *view_mode,
            }
        }
    })
}
```

**Pros:**
- Cross-platform from single codebase
- React-like API (familiar)
- Excellent documentation
- Active development
- RSX macro very ergonomic
- Native desktop/mobile potential

**Cons:**
- Still maturing
- Some APIs still changing
- Cross-platform might be overkill for web-only
- VDOM overhead vs fine-grained reactivity

**Recommendation:** ⭐⭐⭐⭐ (4/5) - Excellent if you want cross-platform potential

---

### 4. Sycamore

**Overview:**
Fine-grained reactive framework similar to Leptos, inspired by SolidJS. No virtual DOM.

**Pros:**
- Fine-grained reactivity
- Small bundle sizes (140-230 KB)
- Clean, minimal API
- No VDOM overhead

**Cons:**
- Smaller community than Yew/Leptos
- Less documentation
- Less active development than Leptos

**Recommendation:** ⭐⭐⭐⭐ (4/5) - Good choice, but Leptos has better momentum

---

### Backend Integration Strategy for Rust

Since Firebase has **no official Rust SDK**, three approaches:

**Option 1: Firebase REST API**
```rust
pub struct FirebaseClient {
    project_id: String,
    api_key: String,
}

impl FirebaseClient {
    pub async fn get_contacts(&self) -> Result<Vec<Contact>, String> {
        let url = format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/(default)/documents/contacts",
            self.project_id
        );

        reqwest::get(&url)
            .await?
            .json::<Vec<Contact>>()
            .await
    }
}
```

**Option 2: Custom Rust Backend (Recommended)**
```rust
// Axum + PostgreSQL
use axum::{routing::{get, post}, Router, Json};
use sqlx::PgPool;

async fn get_contacts(State(pool): State<PgPool>) -> Result<Json<Vec<Contact>>, StatusCode> {
    let contacts = sqlx::query_as!(Contact, "SELECT * FROM contacts ORDER BY last_updated DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(contacts))
}
```

**Option 3: Supabase (Firebase Alternative)**
Better Rust support via postgrest-rs

### Rust Framework Comparison

| Framework | WASM Size | Reactivity | Maturity | Cross-Platform | Community |
|-----------|-----------|------------|----------|----------------|-----------|
| **Leptos** | 150-250 KB | Fine-grained | Growing | Web-focused | Growing |
| **Yew** | 200-350 KB | Virtual DOM | Mature | Web-focused | Largest |
| **Dioxus** | 180-300 KB | Virtual DOM | Medium | Yes | Medium |
| **Sycamore** | 140-230 KB | Fine-grained | Medium | Web-focused | Small |

**Migration Timeline (Leptos):** 5-6 weeks for experienced Rust developer

---

## Ruby Frameworks Analysis

### 1. Ruby on Rails 7+ with Hotwire (Primary Recommendation)

**Overview:**
Rails 7+ with Hotwire (Turbo + Stimulus) provides a complete solution for building modern, reactive web applications. Hotwire enables SPA-like experiences without heavy JavaScript frameworks.

**Why It's Suitable:**
- Comprehensive solution with everything included
- Hotwire provides real-time updates with minimal JavaScript
- Built-in conventions reduce decision fatigue
- Largest Ruby community and ecosystem
- Excellent PWA support
- ViewComponent for clean UI architecture
- Battle-tested at massive scale

**Project Structure:**
```
dates_app/
├── app/
│   ├── controllers/
│   │   ├── contacts_controller.rb
│   │   ├── timeline_entries_controller.rb
│   │   └── sync_controller.rb
│   ├── models/
│   │   ├── contact.rb
│   │   ├── timeline_entry.rb
│   │   └── concerns/
│   │       ├── ratable.rb
│   │       └── syncable.rb
│   ├── views/
│   │   ├── contacts/
│   │   │   ├── index.html.erb
│   │   │   ├── _contact.html.erb (Turbo Frame)
│   │   │   ├── _list_view.html.erb
│   │   │   └── _grid_view.html.erb
│   │   └── timeline_entries/
│   ├── components/ (ViewComponent)
│   │   ├── contact_card_component.rb
│   │   ├── timeline_component.rb
│   │   ├── rating_badge_component.rb
│   │   └── holographic_wrapper_component.rb
│   ├── javascript/
│   │   ├── controllers/ (Stimulus)
│   │   │   ├── contact_controller.js
│   │   │   ├── view_mode_controller.js
│   │   │   ├── rating_controller.js
│   │   │   └── sync_controller.js
│   │   └── channels/ (ActionCable)
│   │       └── sync_channel.js
│   └── assets/stylesheets/
├── config/
│   ├── routes.rb
│   └── database.yml
├── db/
│   └── migrate/
└── spec/
```

**Real-time with Hotwire Turbo:**
```erb
<!-- Turbo Frames for isolated updates -->
<turbo-frame id="contacts-list" data-turbo-action="advance">
  <%= render @contacts %>
</turbo-frame>

<!-- Turbo Streams for live updates -->
<%= turbo_stream.replace "contact_#{@contact.id}" do %>
  <%= render @contact %>
<% end %>
```

**ActionCable for Real-time Sync:**
```ruby
class SyncChannel < ApplicationCable::Channel
  def subscribed
    stream_from "sync_#{current_user.id}"
  end

  def receive(data)
    contact = Contact.find_or_initialize_by(id: data['id'])
    contact.assign_attributes(data['attributes'])

    if contact.save
      broadcast_update(contact)
    end
  end

  private

  def broadcast_update(contact)
    ActionCable.server.broadcast(
      "sync_#{current_user.id}",
      { action: 'update', contact: contact.as_json }
    )
  end
end
```

**Stimulus for Client-side Behavior:**
```javascript
// app/javascript/controllers/rating_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "box"]

  updateColor() {
    const val = parseFloat(this.inputTarget.value) || 0
    const clamped = Math.min(Math.max(val, 1), 10)
    const hue = (clamped - 1) * 11.1

    this.boxTarget.style.background = `hsla(${hue}, 60%, 20%, 0.5)`
  }
}
```

**Database Model (PostgreSQL):**
```ruby
class Contact < ApplicationRecord
  belongs_to :user
  has_many :timeline_entries, dependent: :destroy

  store_accessor :ratings, :face, :body, :kissing, :conversation_vibe

  validates :name, presence: true

  def average_rating
    ratings_array = [
      ratings['face'],
      ratings['body'],
      ratings['kissing'],
      ratings['conversation_vibe']
    ].compact.map(&:to_f)

    return '-' if ratings_array.empty?
    (ratings_array.sum / ratings_array.size).round(1)
  end

  def premium?
    average_rating.is_a?(Float) && average_rating >= 9.0
  end
end
```

**ViewComponent for Reusable UI:**
```ruby
class ContactCardComponent < ViewComponent::Base
  attr_reader :contact, :view_mode

  def initialize(contact:, view_mode: :list)
    @contact = contact
    @view_mode = view_mode
  end

  def wrapper_classes
    classes = [view_mode == :list ? 'list-row' : 'grid-card']
    classes << 'holographic-premium' if contact.premium?
    classes << 'interest-danger' if contact.interest_level == 1
    classes.join(' ')
  end
end
```

**Pros:**
- Complete solution with everything built-in
- Excellent developer experience (conventions, generators)
- Hotwire = SPA feel with less JavaScript
- Strong ecosystem (Devise for auth, Pundit for authorization, Sidekiq for jobs)
- ViewComponent architecture for clean UI
- Active development with regular updates
- PWA support built-in
- Excellent testing infrastructure (RSpec, Capybara)

**Cons:**
- Larger footprint than micro-frameworks
- Learning curve for Rails conventions
- Firebase integration not as native (requires gems)
- Requires Ruby environment, database, background workers
- Slower startup than lighter frameworks

**Best For:** Applications that will grow, teams familiar with Rails, long-term maintenance

---

### 2. Sinatra with Turbo/Stimulus

**Overview:**
Lightweight DSL for web applications. Minimal overhead with explicit control.

**Why It's Suitable:**
- Minimal overhead for small apps
- Explicit routing and control
- Easy to understand and debug
- Can add Hotwire features gradually

**Basic Setup:**
```ruby
require 'sinatra/base'
require 'turbo-rails'

class DatesApp < Sinatra::Base
  get '/contacts' do
    @contacts = Contact.all
    erb :'contacts/index'
  end

  patch '/contacts/:id' do
    @contact = Contact[params[:id]]
    @contact.update(params[:contact])

    if request.xhr? && turbo_frame_request?
      erb :'contacts/_contact', layout: false
    else
      redirect '/contacts'
    end
  end
end
```

**Pros:**
- Minimalist (only what you need)
- Explicit control
- Fast startup
- Easy learning curve
- Small memory footprint

**Cons:**
- Manual configuration
- Limited ecosystem vs Rails
- Hotwire requires manual setup
- No built-in component system
- Must build patterns yourself

**Best For:** MVPs, prototypes, small apps, microservices

---

### 3. Hanami 2.x

**Overview:**
Modern Ruby framework emphasizing clean architecture, testability, and performance.

**Why It's Suitable:**
- Clean separation of concerns
- Built-in dependency injection
- ROM (Ruby Object Mapper) for flexible data
- Modern Ruby practices (dry-rb ecosystem)

**Pros:**
- Clean architecture principles
- Dependency injection built-in
- ROM flexibility
- Performance
- Designed for testing
- Type safety with dry-types

**Cons:**
- Smaller community than Rails
- Hotwire not first-class
- Different patterns from Rails
- Fewer resources
- Real-time requires third-party solutions

**Best For:** Teams valuing clean architecture, complex business logic, DDD patterns

---

### 4. Lucky Framework (Crystal)

**Overview:**
Full-stack framework in Crystal (Ruby-inspired) with compile-time type safety.

**Pros:**
- Type-safe database queries
- Fast compilation and runtime
- Built-in components
- Familiar Ruby-like syntax

**Cons:**
- Not Ruby (different language)
- Smaller ecosystem
- Learning curve
- No Firebase support

**Best For:** Performance-critical apps, teams willing to learn Crystal

---

### Ruby Framework Comparison

| Feature | Rails + Hotwire | Sinatra | Hanami | Lucky |
|---------|----------------|---------|--------|-------|
| **Learning Curve** | Medium | Low | Medium-High | High |
| **Real-time Support** | Excellent | Manual | Manual | Built-in |
| **Hotwire Integration** | Native | Manual | Manual | N/A |
| **Component System** | ViewComponent | None | Views | Built-in |
| **Type Safety** | No | No | Partial | Yes |
| **Performance** | Good | Good | Very Good | Excellent |
| **Community** | Huge | Medium | Small | Small |
| **Testing Tools** | Excellent | Good | Excellent | Excellent |

---

## Comparative Analysis Across All Languages

### Bundle Size Comparison

| Framework | Initial Load | Full App | Notes |
|-----------|-------------|----------|-------|
| **SvelteKit** | 40-70 KB | 40-70 KB | Smallest, compiled |
| **Next.js** | 180-220 KB | 180-220 KB | Framework overhead |
| **React + Vite** | 120-150 KB | 120-150 KB | Lighter than Next |
| **Leptos (Rust)** | 150-250 KB | 150-250 KB | WASM but optimized |
| **Yew (Rust)** | 200-350 KB | 200-350 KB | VDOM overhead |
| **Rails + Hotwire** | N/A | N/A | Server-rendered |

### Development Speed

| Language/Framework | Setup | Learning | Productivity | Time to Market |
|-------------------|-------|----------|--------------|----------------|
| **TypeScript/SvelteKit** | Fast | Easy | Very High | 3-4 weeks |
| **TypeScript/Next.js** | Medium | Medium | High | 4-5 weeks |
| **Rust/Leptos** | Medium | Hard | Medium | 5-6 weeks |
| **Ruby/Rails** | Fast | Medium | High | 4-5 weeks |

### Performance Metrics

| Framework | First Paint | Runtime Speed | Mobile Perf | Memory Usage |
|-----------|-------------|---------------|-------------|--------------|
| **SvelteKit** | Excellent | Excellent | Excellent | Low |
| **Next.js** | Good | Good | Good | Medium |
| **Leptos** | Excellent | Excellent | Excellent | Low |
| **Rails + Hotwire** | Good | Good | Good | Medium-High |

### Type Safety

| Language | Compile-time | Runtime | Error Catching | Refactoring Safety |
|----------|--------------|---------|----------------|-------------------|
| **TypeScript** | Strong | Weak | Good | Good |
| **Rust** | Strongest | Strong | Excellent | Excellent |
| **Ruby** | None | None | Poor | Poor |

### Ecosystem & Support

| Framework | Community | Libraries | Documentation | Jobs |
|-----------|-----------|-----------|---------------|------|
| **Next.js/React** | Huge | Excellent | Excellent | Excellent |
| **SvelteKit** | Growing | Good | Excellent | Fair |
| **Leptos** | Small | Limited | Good | Rare |
| **Rails** | Large | Excellent | Excellent | Good |

### Firebase Integration

1. **TypeScript frameworks:** Native SDK, best support
2. **Ruby/Rails:** Via gems, good support
3. **Rust frameworks:** Custom REST API, requires work

### Offline-First & PWA

1. **SvelteKit:** Excellent with service workers
2. **Next.js:** Very good with next-pwa
3. **Rails:** Good with PWA gems
4. **Leptos:** Manual setup required

---

## Final Recommendations with Decision Criteria

### Scenario 1: Mobile Performance is Critical
**Recommendation: SvelteKit (TypeScript)**

**Why:**
- Smallest bundle size (40-70KB) means fastest load times
- No virtual DOM = best runtime performance
- Built-in animations match current app's style
- Native Firebase integration
- Excellent PWA support

**When to choose:**
- iOS/mobile is primary platform
- Performance metrics are KPIs
- Solo developer or small team
- Fast iteration is priority

**Expected timeline:** 3-4 weeks
**Code reduction:** 50-60% vs current implementation

---

### Scenario 2: Type Safety & Long-term Correctness
**Recommendation: Leptos (Rust)**

**Why:**
- Compile-time guarantees prevent entire classes of bugs
- Full-stack type safety (frontend + backend)
- Excellent performance (compiled to WASM + native backend)
- Memory safety eliminates common errors
- Growing ecosystem with momentum

**When to choose:**
- Team has Rust experience or willingness to learn
- Long-term project (5+ years)
- Correctness more important than speed-to-market
- Planning custom backend anyway
- Performance and reliability critical

**Expected timeline:** 5-6 weeks
**Learning investment:** High initially, pays off long-term

---

### Scenario 3: Enterprise, Team, & Rapid Development
**Recommendation: Rails 7+ with Hotwire (Ruby)**

**Why:**
- Complete solution with everything included
- Fastest time-to-market with generators and conventions
- Largest community = easy hiring
- Excellent for growing teams
- Real-time with ActionCable
- Battle-tested at scale

**When to choose:**
- Building with a team
- Will need backend features (admin panels, reporting, background jobs)
- Want strong conventions
- May need to hire developers later
- Long-term maintenance by team

**Expected timeline:** 4-5 weeks
**Team scalability:** Excellent

---

### Scenario 4: Modern Stack, React Ecosystem
**Recommendation: Next.js 14+ (TypeScript)**

**Why:**
- Largest ecosystem (most libraries)
- Best job market demand
- SEO capabilities if needed
- Can add API routes
- Industry standard

**When to choose:**
- Want maximum library availability
- SEO might be needed
- Team knows React
- Want proven, battle-tested solution
- Future growth uncertain

**Expected timeline:** 4-5 weeks
**Future-proofing:** Excellent

---

## Implementation Timelines

### SvelteKit (3-4 weeks)
- **Week 1:** Setup, types, Firebase config, authentication
- **Week 2:** Data layer, sync engine, core components
- **Week 3:** Timeline, forms, UI components
- **Week 4:** Animations, polish, PWA, deployment

### Leptos (5-6 weeks)
- **Week 1:** Leptos setup, data models, basic app shell
- **Week 2-3:** Core components, state management, UI
- **Week 3-4:** Backend (Axum + PostgreSQL or Firebase REST)
- **Week 4-5:** Advanced UI, animations, effects
- **Week 5-6:** Testing, optimization, deployment

### Rails + Hotwire (4-5 weeks)
- **Week 1:** Rails setup, auth, Contact CRUD, CSS import
- **Week 2:** Timeline, ratings, views, ViewComponents
- **Week 3:** ActionCable, real-time sync, offline support
- **Week 4:** Polish, animations, PWA, optimization

### Next.js (4-5 weeks)
- **Week 1:** Setup, types, Firebase, auth
- **Week 2:** State (Zustand), data layer, sync
- **Week 3:** Components, timeline, forms
- **Week 4:** Animations, advanced UI
- **Week 5:** Testing, optimization, PWA

---

## Migration Strategy

### Approach 1: Full Rewrite (Recommended)

1. **Define types/models first** (ensure data compatibility)
2. **Set up new framework** with authentication
3. **Build data layer** with Firebase/backend
4. **Implement core features** one by one
5. **Match current design** with CSS migration
6. **Test thoroughly** on iOS devices
7. **Deploy alongside current app** (different subdomain)
8. **Gradual user migration** or hard cutover
9. **Keep both running** until confident
10. **Archive old implementation**

### Approach 2: Gradual Migration

1. **Keep login as static page**
2. **Migrate dashboard to framework**
3. **Add new features in framework**
4. **Share Firebase backend**
5. **Eventually migrate remaining pages**

This works best with Next.js or Rails (can serve static + dynamic)

---

## Decision Matrix

Use this table to score your priorities (1-10) and multiply by framework scores:

| Priority | Weight | SvelteKit | Leptos | Rails | Next.js |
|----------|--------|-----------|--------|-------|---------|
| **Bundle Size** | ___ | 10 | 7 | N/A | 5 |
| **Type Safety** | ___ | 7 | 10 | 3 | 7 |
| **Dev Speed** | ___ | 9 | 5 | 8 | 7 |
| **Team Hiring** | ___ | 5 | 2 | 8 | 10 |
| **Ecosystem** | ___ | 6 | 3 | 9 | 10 |
| **Learning Curve** | ___ | 9 | 3 | 6 | 6 |
| **Performance** | ___ | 10 | 10 | 6 | 7 |
| **Mobile First** | ___ | 10 | 10 | 6 | 7 |
| **Real-time** | ___ | 8 | 6 | 10 | 8 |
| **Long-term** | ___ | 7 | 10 | 9 | 9 |

**Calculate:** Multiply each weight by score, sum per framework, choose highest total.

---

## Conclusion

Each framework excels in different scenarios:

- **Choose SvelteKit** if mobile performance, bundle size, and developer experience are priorities
- **Choose Leptos** if type safety, long-term correctness, and full-stack Rust are desired
- **Choose Rails + Hotwire** if team scalability, rapid development, and comprehensive features are needed
- **Choose Next.js** if React ecosystem, maximum hiring pool, and industry standard are important

All four recommendations can successfully implement the dates/contacts application. The best choice depends on your specific priorities, team skills, and long-term vision for the project.

---

**Document Version:** 1.0
**Last Updated:** February 20, 2026
**Consolidated from:** TypeScript, Rust, and Ruby research tracks