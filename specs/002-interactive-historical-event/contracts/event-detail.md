# Event Detail Contract

## `GET /api/v1/events/{slug}`

Returns one published event only.

### Success response (200)

```json
{
  "id": "uuid",
  "slug": "founding-of-baghdad",
  "title_ar": "تأسيس بغداد",
  "title_en": "Founding of Baghdad",
  "date_display_ar": "145 هـ (762 م)",
  "year_start_hijri": 145,
  "year_end_hijri": null,
  "gregorian_reference": "762 CE",
  "event_type": {"code": "city_founded", "name_ar": "تأسيس مدينة", "name_en": "City foundation"},
  "summary_ar": "…",
  "importance": 5,
  "confidence": "high",
  "primary_place": {"slug": "baghdad", "name_ar": "بغداد", "name_en": "Baghdad"},
  "related_people": [],
  "related_states": [],
  "sources": []
}
```

### Not found (404)

```json
{"detail": "Event not found"}
```

No unpublished record is returned by this endpoint.
