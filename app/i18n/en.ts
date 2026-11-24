// English pack. Keys are the source of truth: id.ts must define every key.
// Terms follow the EN-ID glossary (Requirement Analysis Report, chapter 13).
export const en = {
  "lang.label": "Language",
  "lang.en": "English",
  "lang.id": "Bahasa Indonesia",

  "nav.home": "Home",
  "nav.jobs": "Jobs",
  "nav.companies": "Companies",
  "nav.messages": "Messages",
  "nav.classes": "Career classes",
  "nav.profile": "My Profile",
  "nav.applications": "My applications",
  "nav.savedJobs": "Saved jobs",
  "nav.recommendations": "Recommended jobs",
  "nav.growthRecord": "Growth record",

  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.confirm": "Confirm",
  "action.submit": "Submit",
  "action.edit": "Edit",
  "action.delete": "Delete",
  "action.add": "Add",
  "action.back": "Back",
  "action.retry": "Retry",
  "action.loadMore": "Load more",
  "action.logIn": "Log in",
  "action.logOut": "Log out",

  "status.saved": "Saved",
  "status.loading": "Loading",
  "status.required": "Required",
  "status.optional": "Optional",

  "error.title": "Error",
  "error.notFound": "Page not found",
  "error.notFoundDetail": "The requested page could not be found.",
  "error.generic": "Something went wrong",
  "error.network": "Network error",
} as const;

export type MessageKey = keyof typeof en;
