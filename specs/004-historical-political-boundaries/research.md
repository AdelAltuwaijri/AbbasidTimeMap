# Research: M-02 Historical Political Boundaries

## Decision 1 — Reconstruct control envelopes, not frontier lines

**Decision:** Represent each record as a deliberately simplified WGS84 MultiPolygon for a sourced zone of Abbasid administration/control. Use governors, garrisons, taxation, and durable provincial administration as inclusion evidence; exclude areas supported only by raids, tribute, embassies, or nominal claims.

**Rationale:** Eighth-century sovereignty was layered and annalistic sources describe towns, armies, governors, and routes more often than surveyed rural frontiers. A precise line would invent evidence.

**Alternatives considered:** Tracing modern borders was rejected by DEC-014. Digitizing one atlas outline was rejected because atlas maps generalize multiple dates. Annual interpolation was rejected because no annual evidence supports it.

## Decision 2 — Use three evidence-triggered validity periods

**Decision:** Use 132–143, 144–154, and 155–170 AH. The second adds only the Ṭabaristān lowlands after the conquest of 144/761; the third adds the defensible Tripoli–Qayrawān/Ifrīqiya corridor after the campaign of 155/772. A change of caliph alone does not create a new geometry.

**Rationale:** These are concrete territorial/administrative changes within the M-01 window. They avoid artificial state changes at 158 or 170 and meet the need for visibly different dated records.

**Alternatives considered:** A separate 166–168 contested Ṭabaristān outline was rejected because revolt does not prove the entire province left Abbasid control. A Rustamid cutout was rejected because its exact rural extent is too uncertain for this first reconstruction.

## Decision 3 — Separate evidence confidence from map precision

**Decision:** Store `confidence_level=medium` and `spatial_precision=approximate`. Public text states: «هذا المضلع إعادة بناء تقريبية لمجال الإدارة والسيطرة العباسية المدعومة بالمصادر، وليس حدًا دوليًا دقيقًا.»

**Rationale:** The chronology and broad provincial changes have good scholarly support, while the polygon edges are editorial interpolation between historical anchors.

**Alternatives considered:** Using only `approximate` as confidence was rejected because it conflates strength of evidence with spatial precision. `high` was rejected because no surveyed boundary exists.

## Decision 4 — Add direct boundary provenance and publication state

**Decision:** Add `boundary_sources` and boundary publication status through Alembic. Public queries return only published records; structured citation metadata stays auditable while GeoJSON carries only a compact primary-source indicator.

**Rationale:** The current schema cannot satisfy the domain model or acceptance criterion requiring boundary provenance and currently exposes every stored boundary.

**Alternatives considered:** A source title embedded in notes was rejected as non-relational and hard to audit. Reusing `event_sources` was rejected because a boundary is not an event.

## Decision 5 — Validate offline and in PostGIS

**Decision:** Use Shapely 2 for deterministic package validation and PostGIS checks/typmod as storage defense. Reject invalid, empty, wrong-type, out-of-range, or overlapping geometry; never call an automatic repair operation.

**Rationale:** Silent repair may materially change a historical reconstruction. Validation must explain the exact record and error before publication.

**Alternatives considered:** Hand-written ring intersection logic was rejected as error-prone. Database-only validation was rejected because review and `--validate-only` should work before mutation.

## Historical source strategy

- Wilferd Madelung, [“DABUYIDS,” Encyclopaedia Iranica](https://www.iranicaonline.org/articles/dabuyids-the-dynasty-of-espahbads-ruling-tabarestan-until-its-conquest-by-the-muslims-in-144-761/), VI/5, pp. 541–544: conquest of Ṭabaristān in 144/761 and the lowland/highland distinction.
- [“ĀL-E BĀVAND,” Encyclopaedia Iranica](https://www.iranicaonline.org/articles/al-e-bavand/): continuing local highland rule and the later 166–169 revolt.
- al-Ṭabarī, *History*, vol. 29, trans. Hugh Kennedy, p. 69: the events of 155 and recovery of Ifrīqiya/Qayrawān.
- Samuel Ottewill-Soulsby, [“The circle of the world: the global diplomacy of caliph al-Manṣūr,” BSOAS 88/3](https://www.cambridge.org/core/journals/bulletin-of-the-school-of-oriental-and-african-studies/article/circle-of-the-world-the-global-diplomacy-of-caliph-almansur/3D2FEE751FC2BECD1FE4642750B991EC), pp. 523–538: al-Andalus, North Africa, frontier stability, and why tribute/diplomacy is not annexation.
- [“Central Asia iv,” Encyclopaedia Iranica](https://www.iranicaonline.org/articles/central-asia-iv/) and [“Sīstān ii,” Encyclopaedia Iranica](https://www.iranicaonline.org/articles/sistan-ii-islamic-period/): inclusion of Transoxiana/Sīstān while excluding more distant raid/tribute zones.
- Hugh Kennedy, [*The Early Abbasid Caliphate*](https://www.routledge.com/The-Early-Abbasid-Caliphate-A-Political-History/Kennedy/p/book/9781138953215), pp. 18–34, 57–114, and Tayeb El-Hibri, *The Abbasid Caliphate*, chapter 2/maps: political synthesis and macro cross-check.
- Sluglett and Currie, [*Atlas of Islamic History*](https://www.routledge.com/Atlas-of-Islamic-History-1st-Edition/Sluglett-Currie/p/book/9781138821309), maps 5–6: macro cross-check only, not a digitization source.

## Explicit exclusions and limitations

- Exclude al-Andalus, Byzantium, the Khazar steppe, Makuria, Zābul/Kabul, remote Farghāna claims, Daylam/Gilan, unadministered Caspian highlands, Rustamid Tāhart, and the central/far Maghrib.
- A conquest dated to one Hijri year does not prove homogeneous control for every day; inclusive annual validity is a declared MVP simplification.
- Revolt does not automatically remove an entire province, and payment or diplomatic contact does not automatically add one.
- Physical coast/river reference may reflect later natural change; no Admin-0/Admin-1 data is used.
- Historical gazetteers and atlases help locate anchors but do not constitute proof of political lines.
