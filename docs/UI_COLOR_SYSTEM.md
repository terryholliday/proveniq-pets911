# PetMayday UI Color System

*Consistent semantic color scheme for admin dashboards*

---

## Section Colors (Dashboard Categories)

| Section | Color | Tailwind Classes | Meaning |
|---------|-------|------------------|---------|
| **Volunteer Management** | Blue | `blue-400`, `blue-800/50`, `blue-900/20` | People & users |
| **Training & Certification** | Purple | `purple-400`, `purple-800/50`, `purple-900/20` | Learning & credentials |
| **Case Management** | Green | `green-400`, `green-800/50`, `green-900/20` | Active operations |
| **Operations** | Cyan | `cyan-400`, `cyan-800/50`, `cyan-900/20` | Real-time dispatch |
| **Analytics & Automation** | Indigo | `indigo-400`, `indigo-800/50`, `indigo-900/20` | Data & insights |
| **Partners & Network** | Amber | `amber-400`, `amber-800/50`, `amber-900/20` | External organizations |
| **Configuration** | Zinc | `zinc-300`, `zinc-700`, `zinc-800/30` | Settings & admin |

---

## Priority Colors (Tickets/Cases)

| Priority | Color | Class | Usage |
|----------|-------|-------|-------|
| **CRITICAL** | Red | `bg-red-600 text-white` | Immediate attention |
| **HIGH** | Orange | `bg-orange-600 text-white` | Urgent response |
| **MEDIUM** | Yellow | `bg-yellow-600 text-black` | Standard priority |
| **LOW** | Blue | `bg-blue-600 text-white` | Non-urgent |

---

## Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| **Available / Online / Success** | Green | `text-green-400`, `bg-green-600` |
| **Selected / On Mission / Warning** | Amber | `text-amber-400`, `bg-amber-600` |
| **Critical / Error / Escalation** | Red | `text-red-400`, `bg-red-600` |
| **Offline / Inactive / Neutral** | Zinc | `text-zinc-400`, `bg-zinc-600` |

---

## Capability Badge Colors

| Capability | Color | Classes |
|------------|-------|---------|
| **Transport** | Blue | `bg-blue-900 text-blue-300` |
| **Foster** | Green | `bg-green-900 text-green-300` |
| **Emergency** | Red | `bg-red-900 text-red-300` |

---

## Alert Colors

| Alert Type | Color | Usage |
|------------|-------|-------|
| **Needs Attention** | Amber badge | `bg-amber-600 text-amber-100` |
| **Danger / Emergency** | Red card | `bg-red-900/20 border-red-800` |
| **Success** | Green | `bg-green-900/30 text-green-300` |
| **Info** | Blue | `bg-blue-900/30 text-blue-300` |

---

## Card Pattern

```tsx
// Section card with color theme
<Link 
  href="/path"
  className="block border border-{color}-800/50 rounded-lg bg-{color}-900/20 
             p-4 hover:border-{color}-600/50 hover:bg-{color}-900/30 transition-all"
>
  <div className="text-sm font-medium text-{color}-400">Title</div>
  <div className="text-xs text-zinc-500 mt-1">Description</div>
</Link>
```

---

## Examples

### Blue Section (Volunteer Management)
```tsx
<h2 className="text-lg font-semibold text-blue-400 mb-3">👥 Volunteer Management</h2>
<Link className="block border border-blue-800/50 rounded-lg bg-blue-900/20 ...">
  <div className="text-sm font-medium text-blue-400">📋 Applications</div>
</Link>
```

### Alert Badge
```tsx
{count > 0 && (
  <span className="bg-amber-600 text-amber-100 text-xs font-medium px-2 py-0.5 rounded-full">
    {count} pending
  </span>
)}
```

---

*Last Updated: January 13, 2026*
