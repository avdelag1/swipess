

# Expand Workers/Jobs Service Categories — Full Implementation Plan

## What Changes

### 1. Replace `SERVICE_CATEGORIES` with grouped, comprehensive list (WorkerListingForm.tsx)

Remove `broker` and `tour_guide`. Add all new categories organized by group. Each entry gets a `group` field for UI grouping in filters and dropdowns.

**New master list (40+ categories):**

| Group | Services |
|-------|----------|
| Home & Property | House Cleaner, Handyman, Maintenance Technician, House Painter, Plumber, Electrician, Gardener/Landscaper, Pool Cleaner |
| Personal Care & Wellness | Massage Therapist, Yoga Instructor, Meditation/Mindfulness Coach, Holistic Therapist, Personal Trainer, Makeup Artist/Hair Stylist, Nutritionist/Meal Prep Chef |
| Child & Pet Care | Babysitter/Nanny, Dog Sitter/Pet Sitter, Pet Groomer |
| Transportation | Chauffeur/Private Driver, Mechanic (Car/Moto/Bicycle) |
| Culinary & Events | Private Chef, Bartender/Mixologist, Event Planner/Party Coordinator |
| Education & Languages | Language Teacher/Tutor, Music Teacher, Dance Instructor |
| Creative & Tech | Photographer, Videographer/Drone Operator, Graphic Designer, IT Support/Computer Repair |
| Professional | Translator/Interpreter, Accountant/Bookkeeper, Security Guard |
| Other | Other Service |

Each category also gets a `subspecialties` array where relevant (e.g., Massage Therapist → Swedish, Deep Tissue, Thai, Sports, Hot Stone, Aromatherapy, Reflexology, Couples; Language Teacher → English, Spanish, French, German, Italian, Chinese, Portuguese, Mayan).

### 2. Add `SERVICE_SUBSPECIALTIES` map (WorkerListingForm.tsx)

A record mapping category values to their sub-options. This powers:
- The listing form: when a worker picks "Massage Therapist," they see checkboxes for sub-specialties
- The filter UI: when filtering by "Massage Therapist," sub-specialty chips appear

### 3. Update WorkerListingForm to show sub-specialties

When `service_category` is selected and has subspecialties, show a multi-select checkbox section for the worker to pick their specialties (stored in the existing `skills` JSON array on the listings table).

### 4. Update WorkerClientFilters.tsx — grouped collapsible sections

Instead of a flat list of 40+ checkboxes, render the Service Type collapsible with **nested group headers**. Each group (Home & Property, Personal Care, etc.) is a sub-collapsible with its categories inside. This keeps the UI scannable.

### 5. Update ClientWorkerDiscovery.tsx — filter dropdown

The `Select` dropdown for service type will use `SelectGroup` with `SelectLabel` headers for each group, making it easy to find specific services.

### 6. Update AI orchestrator prompt (edge function)

Update the `service_category` enum in `ai-orchestrator/index.ts` to include the new values so AI-generated listings use valid categories.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/WorkerListingForm.tsx` | Replace SERVICE_CATEGORIES with grouped list + add SERVICE_SUBSPECIALTIES + show sub-specialty picker in form |
| `src/components/filters/WorkerClientFilters.tsx` | Render grouped service categories with nested collapsibles |
| `src/pages/ClientWorkerDiscovery.tsx` | Update filter dropdown to use grouped SelectGroup |
| `supabase/functions/ai-orchestrator/index.ts` | Update service_category enum in AI prompt |

## No DB Changes Needed

The `service_category` column is a plain `text` field — any string value works. Sub-specialties go into the existing `skills` JSONB array.

