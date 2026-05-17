// News stories — keyed by slug.
// Schema is intentionally minimal so a CMS can map to it 1:1:
//   tag      — short category label
//   date     — display date string
//   photo    — single hero image path
//   title    — article headline
//   subtitle — one-paragraph dek
//   body     — plain text; blank lines separate paragraphs
window.NEWS_STORIES = {
  "grand-opening": {
    tag: "The Grand Opening",
    date: "Apr 2026",
    photo: "uploads/Launch Ceremony.png",
    title: "A New Era for Tanzanian Agriculture: Top Crop Officially Launches",
    subtitle: "After two years of construction, planting and recruitment, Top Crop opens the gates of its 6,600-hectare estate in Rufiji — the largest single-site banana operation in East Africa.",
    body: `On a clear morning in April, beneath the canopy of the newly planted Cavendish blocks, more than four hundred guests — government officials, partners, journalists and the people of Rufiji — gathered for a moment two years in the making. Top Crop, a flagship investment of Dubai-based D43, formally opened its 6,600-hectare estate in Tanzania.

The launch marks the culmination of a build that began in early 2024: clearing and grading on a scale rarely attempted in the region, the construction of a permanent administration camp at Nyamwage, the laying of more than 180 kilometers of precision irrigation, and the hiring and training of nearly three thousand staff in the first phase alone.

Speaking at the ceremony, Top Crop CEO Ramil Mingazov framed the project as a long-term commitment, not a single harvest. The company, he said, intends to produce world-class fruit for international markets while building skills, infrastructure and supply chains that remain in Tanzania for generations.

Construction will continue in parallel with first commercial harvests. Phase two adds the palm oil division and a second packing facility; phase three brings on stream a dedicated cold-chain corridor between the estate and the Port of Dar es Salaam, cutting time-to-shipment to under twenty-four hours.

For the surrounding communities, the immediate impact is measured in employment — Top Crop is now the largest private employer in the district — and in the auxiliary services growing around the estate: transport, catering, fuel, education, healthcare. The official launch is a milestone, but for the team on the ground it is also a beginning. The first containers leave for international ports later this quarter.`,
  },

  "10000-jobs": {
    tag: "Social Impact & Employment",
    date: "Mar 2026",
    photo: "uploads/Community meeting.png",
    title: "Empowering Rufiji: Top Crop Commits to 10,000 Local Jobs",
    subtitle: "A formal pledge to the Rufiji District Council sets out the company's hiring trajectory through 2028 — and the training infrastructure that has to be built alongside it.",
    body: `At a community meeting hosted by the District Council, Top Crop signed a memorandum confirming a hiring trajectory of ten thousand permanent and seasonal positions across the estate by the end of 2028. The figure represents a step change in formal employment for a district whose population is overwhelmingly rural and whose dominant occupations remain subsistence farming and small-scale fishing.

Recruitment is structured around a local-first principle: positions are advertised in Rufiji and surrounding wards before they reach a wider pool. The company estimates that more than ninety percent of the workforce will be drawn from communities within a fifty-kilometer radius of the estate.

A scaled hiring plan needs a scaled training plan. Top Crop has committed to building a permanent training centre on-site, offering certified curricula in field operations, packing, cold-chain handling, equipment maintenance, and supervisory leadership. The first cohorts began in February.

Beyond the estate gates, the company is co-funding investment in primary healthcare and school infrastructure with the District Council — recognising that a stable workforce depends on a community that thrives.`,
  },

  "nyamwage-camp": {
    tag: "Infrastructure",
    date: "Feb 2026",
    photo: "uploads/Camp housing.png",
    title: "Home Away From Home: Construction of the Nyamwage Administration Camp Completed",
    subtitle: "Permanent housing, dining and medical facilities for on-site staff — designed for the climate and built to last decades.",
    body: `After eighteen months of construction, the Nyamwage administration camp is complete. The facility houses operations, agronomy, security, finance and management staff who live on-site during their rotation, and serves as the daily nerve centre for the entire estate.

The camp's architecture is shaped by the climate: deep overhangs for shade, cross-ventilated room layouts, water-harvesting roofs feeding service tanks, and a careful orientation that minimises afternoon sun on living spaces. Materials and labour were sourced from Tanzania wherever possible.

Beyond housing, the campus includes a 24-hour medical post, a staff dining hall, a small library, an outdoor recreation area, and dedicated spaces for technical training. A second phase will add capacity for a further 180 staff and a guesthouse for visiting partners.`,
  },

  "palm-oil": {
    tag: "Expansion",
    date: "Feb 2026",
    photo: "uploads/Palm plantation.png",
    title: "Diversifying the Harvest: Strategic Launch of the Palm Oil Division",
    subtitle: "A second crop, a second income stream, and a deliberate hedge against single-product risk — all on the same estate, run by a dedicated agronomy team.",
    body: `Top Crop has formally activated its palm oil division, planting the first commercial blocks of dwarf hybrid oil palm on the estate's eastern wing. The new operation is structured as a separate division with its own agronomy lead, harvest cycle, processing chain and export agreements.

Bananas remain the company's flagship — but a single-crop estate is a fragile estate. Pests, weather, and shifts in international demand can all hit one crop and not another. By introducing a second high-value crop on the same land base, Top Crop reduces concentration risk and smooths annual revenue without compromising the core banana operation.

The division's planting plan was designed in consultation with sustainability auditors. The estate uses dwarf hybrid varieties that yield more per hectare with less land, and the company has committed to a strict zero-deforestation policy: no native forest is cleared for new planting. Wastewater from milling is captured and processed on-site.`,
  },

  "precision-irrigation": {
    tag: "Innovation",
    date: "Jan 2026",
    photo: "uploads/Irrigation system.png",
    title: "Smart Farming: Implementing Precision Irrigation Across 6,600 Hectares",
    subtitle: "Drip lines, soil-moisture sensors, weather telemetry and a unified control room — turning the entire estate into a single, instrumented system.",
    body: `Top Crop has completed the rollout of its precision irrigation network — a single, instrumented system covering all 6,600 hectares. Every block is now equipped with subsurface drip lines, in-soil moisture sensors and node-level pressure telemetry, all reporting back to a central control room at the Nyamwage camp.

Bananas are notoriously thirsty — but they are also extremely sensitive to over-watering, which leads to root disease and lost yield. Traditional flood and sprinkler systems struggle to thread that needle, especially at scale. Precision irrigation puts the right amount of water at the root zone, at the right time, plant by plant.

The control room receives over thirty thousand readings per hour. A small team of agronomists and data engineers translates that stream into block-level irrigation schedules. The system runs largely autonomously; the human operators step in to handle exceptions, equipment failures, and trial new strategies.

The next iteration, planned for Q3, brings predictive scheduling: a weather-aware model that anticipates evapotranspiration and pre-empts irrigation needs before sensor thresholds are crossed.`,
  },

  "first-export": {
    tag: "Global Reach",
    date: "Jan 2026",
    photo: "uploads/Cargo port.png",
    title: "From Rufiji to the World: First Major International Export Agreement Signed",
    subtitle: "A multi-year supply contract with a leading European distributor — and the cold-chain corridor that makes it deliverable, reliably, every week.",
    body: `Top Crop has signed its first major international supply agreement: a multi-year contract with a leading European distributor for weekly reefer-container shipments from the Port of Dar es Salaam. The deal anchors the company's commercial pipeline through the entire ramp-up of Phase 1 production.

Bananas live or die in the cold chain. Top Crop has built a dedicated route from estate to port: refrigerated trucks loaded directly at the on-site packing house, a fast highway corridor, and pre-allocated reefer slots at Dar es Salaam. The company targets a sub-twenty-four-hour transit from cut to container.

A locked-in offtake contract changes the planning horizon. The agronomy team can plant against known weekly volumes, the packing house can size shifts with confidence, and the finance team can underwrite Phase 2 expansion against a real revenue line — not a forecast.`,
  },
};
