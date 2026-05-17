// Open positions — keyed by slug.
// Schema (every field is plain text or a simple list — easy to wire to a CMS):
//   code            — internal reference shown to candidates
//   title           — role title
//   department      — short label
//   location        — short label, e.g. "Rufiji · On-site"
//   type            — Full-time / Part-time / Contract / Seasonal
//   summary         — one-paragraph dek shown above the body
//   about           — single paragraph: what the role is for
//   responsibilities — array of short lines
//   requirements    — array of short lines
//   offer           — array of short lines
window.JOBS = {
  "senior-agronomist": {
    code: "AGR-014",
    title: "Senior Agronomist, Cavendish Bananas",
    department: "Agronomy",
    location: "Rufiji · On-site",
    type: "Full-time",
    summary: "Lead crop science across 6,600 hectares — soil health programmes, integrated pest management, and yield optimisation for our flagship banana variety.",
    about: "You will own the agronomy strategy for Top Crop's flagship Cavendish operation in Rufiji. Working alongside operations and irrigation teams, you set the agenda for soil health, plant nutrition, pest and disease management, and yield optimisation across the entire estate. The role reports to the Director of Banana Operations and works closely with our international advisory partners.",
    responsibilities: [
      "Define and execute the annual agronomy plan across all production blocks",
      "Lead soil health and fertility programmes; commission and act on lab analyses",
      "Run integrated pest management — monitoring, thresholds, intervention protocols",
      "Partner with the irrigation team to translate plant-water needs into block-level schedules",
      "Train and mentor a team of field agronomists and block supervisors",
      "Report yield, quality and risk metrics to executive leadership weekly",
    ],
    requirements: [
      "MSc or higher in Agronomy, Plant Science or related field",
      "8+ years of experience with commercial banana production at scale",
      "Hands-on familiarity with Cavendish-specific challenges (TR4, Sigatoka, nematodes)",
      "Strong leadership of multi-cultural field teams",
      "Comfort working across English and Swahili (Swahili a plus, training provided)",
    ],
    offer: [
      "Senior position with clear influence over a flagship East African operation",
      "Competitive package benchmarked to international standards",
      "On-site housing at the Nyamwage Administration Camp",
      "Comprehensive medical insurance, family coverage included",
      "Annual home-leave allowance and structured rotation",
    ],
  },

  "operations-manager": {
    code: "OPS-021",
    title: "Plantation Operations Manager",
    department: "Operations",
    location: "Nyamwage · On-site",
    type: "Full-time",
    summary: "Run day-to-day operations of harvest, packing house and cold chain logistics. Oversee 800+ field staff and orchestrate weekly export shipments.",
    about: "You will own the operational tempo of the entire estate. From field harvest through packing, cold storage and dispatch, your job is to make sure the right fruit is in the right container, on the right truck, every single week.",
    responsibilities: [
      "Plan and run weekly harvest cycles across all production blocks",
      "Manage the packing house — line scheduling, quality controls, labour planning",
      "Coordinate with logistics for cold-chain handover to Dar es Salaam",
      "Supervise 800+ field, packing and warehouse staff",
      "Own operational KPIs: yield-to-pack ratio, reject rate, on-time loading",
    ],
    requirements: [
      "10+ years in large-scale agricultural operations, ideally fresh produce",
      "Proven track record running multi-shift packing and cold-chain operations",
      "Strong people leadership at scale (500+ direct/indirect reports)",
      "Comfort with KPI dashboards and data-driven decision-making",
    ],
    offer: [
      "End-to-end ownership of operations on a flagship estate",
      "Competitive salary plus performance bonus",
      "On-site housing, medical and dining benefits",
      "Direct reporting line to the Director of Banana Operations",
    ],
  },

  "irrigation-engineer": {
    code: "TECH-007",
    title: "Precision Irrigation Engineer",
    department: "Technology",
    location: "Rufiji · On-site",
    type: "Full-time",
    summary: "Design and maintain our smart irrigation network. Tune drip-line pressure, sensor telemetry, and water use across the entire estate.",
    about: "Top Crop runs one of the most ambitious precision irrigation systems in East Africa: subsurface drip lines across 6,600 hectares, in-soil moisture sensors, weather telemetry, and a unified control room. You will keep that system running and make it better.",
    responsibilities: [
      "Maintain the precision irrigation network: pumps, lines, sensors, telemetry",
      "Tune block-level schedules in partnership with the agronomy team",
      "Diagnose and resolve hardware faults across the field",
      "Build the Q3 predictive-scheduling model with our data team",
      "Train and supervise a small field engineering crew",
    ],
    requirements: [
      "Engineering degree (Agricultural / Hydraulic / Mechatronics)",
      "5+ years working on precision irrigation at scale",
      "Comfort with telemetry stacks, control systems, and basic data analysis",
      "Field-first mindset — you will spend time outdoors, not just at a desk",
    ],
    offer: [
      "A first-class system to build on, not bootstrap from scratch",
      "Competitive package and on-site housing",
      "Clear career path into a Head-of-Engineering role as the estate grows",
    ],
  },

  "export-lead": {
    code: "EXP-003",
    title: "International Trade & Export Lead",
    department: "Commercial",
    location: "Dar es Salaam · Hybrid",
    type: "Full-time",
    summary: "Build commercial relationships with global distributors across the Gulf, Europe and Asia. Own contracts, pricing and customs strategy.",
    about: "You will be the company's commercial face in international markets — building the distributor relationships that turn weekly containers into long-term contracts.",
    responsibilities: [
      "Develop and manage relationships with international distributors and importers",
      "Negotiate multi-year supply agreements and yearly pricing",
      "Own customs, certification and trade-compliance strategy across target markets",
      "Coordinate with operations on weekly shipment plans and forecast accuracy",
    ],
    requirements: [
      "8+ years in international trade — fresh produce or comparable category",
      "Strong existing network across at least one of: Gulf, EU, Asia",
      "Comfort negotiating complex multi-year supply contracts",
      "Fluent English; second language a strong plus",
    ],
    offer: [
      "A foundational commercial role at a fast-scaling exporter",
      "Hybrid setup between Dar es Salaam and the estate",
      "Competitive base plus performance-linked compensation",
    ],
  },

  "community-officer": {
    code: "PEO-009",
    title: "Community & Social Impact Officer",
    department: "People & Community",
    location: "Rufiji · On-site",
    type: "Full-time",
    summary: "Strengthen our partnership with local communities — recruitment pipelines, education programmes, and the 10,000 jobs commitment.",
    about: "Top Crop's social licence to operate is built one conversation at a time. You will be the bridge between the estate and the surrounding wards — making sure recruitment is fair, training is effective, and our investments in healthcare and education actually land.",
    responsibilities: [
      "Coordinate local-first recruitment across surrounding wards",
      "Run training programmes and certified curricula in partnership with HR",
      "Manage co-funded community projects with the District Council",
      "Engage with local stakeholders, leaders and elders on a continuous basis",
    ],
    requirements: [
      "5+ years in community development, CSR or social impact roles",
      "Deep familiarity with the Rufiji district or comparable rural Tanzania context",
      "Excellent communication skills in Swahili and English",
      "Empathy, patience, and the ability to translate company priorities into community language",
    ],
    offer: [
      "Real, measurable social impact — not a marketing function",
      "Competitive salary and full medical coverage",
      "Direct reporting line to the Director of Human Resources",
    ],
  },
};
