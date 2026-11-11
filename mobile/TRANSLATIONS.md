# Translation Status

## English (en)
- Status: **Complete** ✓
- All 220+ keys fully translated
- Covers all UI screens, errors, and system messages

## Kiswahili (sw)
- Status: **Provisional** (requires clinical review)
- All 220+ keys translated
- Translations marked with `// review_needed` comments
- **IMPORTANT:** These translations must be reviewed and approved by a qualified Kiswahili translator with healthcare domain expertise before production deployment

### Clinical Review Checklist
- [ ] Medical terminology accuracy (epilepsy-specific terms)
- [ ] Cultural appropriateness of phrasing
- [ ] Consistency with healthcare terminology standards
- [ ] Clarity for users with varying literacy levels
- [ ] Appropriateness for emergency/crisis contexts (SOS, seizure terminology)

### Translated Sections
1. **Common UI** (done/cancel/save/back/loading)
2. **Home/Dashboard** (greeting, streak, circle, weather, events)
3. **Medications** (adherence, dosing, reminders, missed doses)
4. **Mood Tracking** (mood scores, privacy, crisis resources)
5. **SOS/Emergency** (countdown, sending, escalation, statuses)
6. **Appointments** (request, confirm, pending, cancelled)
7. **Care Circle** (invite, roles, permissions, observations)
8. **Insights** (AI summaries, patterns, visit briefs)

### Translation Notes
- All date/time translations use Kiswahili locale conventions
- Currency/measurements use local Kenya standards
- Phone numbers use actual Kenya emergency services (999, 112)
- Organization names (Befrienders Kenya) kept in English per standard practice
- Medical terminology follows WHO Kiswahili medical dictionary where available

### Translation Maintenance
- When adding new English strings, immediately add provisional Kiswahili translation
- Use `// review_needed` marker for all non-reviewed translations
- Remove marker only after clinical review approval
- Document any terminology discussions in commit messages
- Consider creating a dedicated glossary for medical terms

## Language Toggle
- User can toggle between English and Kiswahili in settings (Phase 5 WS5)
- Selection persists in AsyncStorage
- Defaults to English on first app launch
- System language detection can be added in future

## Future Languages
- Framework supports any additional locale in format `const [locale] = { ... }`
- Add to `catalogs` object and update `Locale` type
- Add language selector in settings screen
