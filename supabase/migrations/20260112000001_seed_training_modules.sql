-- Pet911 Training Modules Seed Data
-- Based on ASPCA, Best Friends, FEMA CERT, CDC, and Reddit/Wikipedia governance models

-- ============================================================================
-- ORIENTATION MODULES (Required for ALL volunteers)
-- ============================================================================

INSERT INTO training_modules (slug, title, subtitle, description, category, track, content_type, estimated_minutes, requires_quiz, passing_score, is_mandatory, sort_order, content_json) VALUES

-- Module 1: Platform Orientation
('orientation-platform', 'Platform Orientation', 'Welcome to Pet911', 
'Introduction to the Pet911 platform, mission, and your role as a volunteer. Covers basic navigation, community guidelines, and the volunteer-not-employee relationship.',
'orientation', 'all', 'reading', 20, true, 80, true, 1,
'{
  "sections": [
    {
      "id": "welcome",
      "title": "Welcome to Pet911",
      "content": "Pet911 is a decentralized emergency coordination platform for lost and found pets. Unlike traditional rescue networks, we operate as a high-stakes community similar to Wikipedia''s collaborative model or Reddit''s rapid-response dynamics—but applied to life-or-death scenarios involving animals.\n\nAs a volunteer, you are the backbone of this system. Whether you''re triaging posts as a Moderator, trapping feral cats in the field, or fostering a litter of orphaned kittens, your actions directly save lives."
    },
    {
      "id": "volunteer-status",
      "title": "Your Status: Volunteer, Not Employee",
      "content": "This is critical to understand: You are an independent volunteer, not an employee of Pet911 or any affiliated organization.\n\n**What this means:**\n- You act of your own volition and judgment\n- You are not directed to perform specific physical actions\n- You maintain your own insurance and accept personal risk\n- You can decline any assignment without penalty\n- You are protected under the Volunteer Protection Act of 1997 (with limitations)\n\n**What Pet911 provides:**\n- Training and certification\n- Coordination tools and communication\n- Community support and mentorship\n- Liability guidance (not legal advice)"
    },
    {
      "id": "scope-of-authority",
      "title": "Scope of Authority",
      "content": "Volunteers can moderate on-platform behavior—you are NOT vigilantes and NOT law enforcement.\n\n**You MAY:**\n- Coordinate rescue efforts through the platform\n- Provide resources and information to community members\n- Report suspected animal cruelty to proper authorities\n- Transport animals with proper training\n- Provide temporary foster care\n\n**You MAY NOT:**\n- Trespass on private property\n- Confront suspected abusers\n- Perform veterinary medical procedures\n- Represent yourself as law enforcement\n- Make promises on behalf of any organization"
    },
    {
      "id": "escalation",
      "title": "Structured Escalation",
      "content": "Like Wikipedia''s dispute resolution, Pet911 uses structured escalation:\n\n**Level 1:** Self-resolution with community guidelines\n**Level 2:** Moderator intervention (Junior Mod)\n**Level 3:** Triage Specialist review\n**Level 4:** Community Guardian decision\n**Level 5:** Platform administration (rare)\n\nThis ensures fair, consistent handling of all situations."
    }
  ]
}'::jsonb),

-- Module 2: Safety & Legal Foundations
('orientation-safety', 'Safety & Legal Foundations', 'Protecting Yourself and Others',
'Essential safety protocols, legal protections, and liability awareness. Covers Good Samaritan laws, scope of practice, and personal safety guidelines.',
'orientation', 'all', 'reading', 30, true, 80, true, 2,
'{
  "sections": [
    {
      "id": "personal-safety",
      "title": "Personal Safety First",
      "content": "The golden rule of rescue: **You cannot help animals if you are injured or dead.**\n\nEvery decision you make should pass through this filter:\n1. Is this safe for ME?\n2. Is this safe for BYSTANDERS?\n3. Is this safe for the ANIMAL?\n\nIf the answer to #1 is \"no,\" you stop. Period. Call for backup, call authorities, or document and wait."
    },
    {
      "id": "good-samaritan",
      "title": "Good Samaritan Laws",
      "content": "Most states have Good Samaritan laws that provide liability protection for volunteers. However, these laws have limitations:\n\n**Generally Protected:**\n- Rendering emergency aid in good faith\n- Acting within your training level\n- Not accepting payment for services\n\n**NOT Protected:**\n- Gross negligence or willful misconduct\n- Acting outside your scope of training\n- Vehicle-related incidents (varies by state)\n- Practicing veterinary medicine without a license\n\n**The \"Stabilize and Transport\" Doctrine:**\nYour job is to get the animal to a licensed veterinarian. Any medical intervention beyond stopping active bleeding (pressure) is prohibited unless you have specific veterinary training."
    },
    {
      "id": "zoonotic-diseases",
      "title": "Zoonotic Disease Awareness",
      "content": "Animals can transmit diseases to humans. Key risks:\n\n**Rabies** (fatal without treatment)\n- All mammals can carry rabies\n- ANY bite or scratch from unknown animal = seek medical evaluation\n- Report to local health department\n- Do NOT attempt to capture suspected rabid animals\n\n**Ringworm** (fungal, highly contagious)\n- Common in kittens and shelter animals\n- Treat with antifungals; can spread to humans\n\n**Toxoplasmosis** (parasite in cat feces)\n- Risk for pregnant women and immunocompromised\n- Always use gloves when handling litter\n\n**Standard Precautions:**\n- Wash hands before and after animal contact\n- Use PPE (gloves, gowns) when indicated\n- Never touch eyes, nose, mouth during handling\n- Report any bites or scratches immediately"
    },
    {
      "id": "mandatory-reporting",
      "title": "Mandatory Reporting",
      "content": "You have an ethical obligation to report:\n\n**Animal Cruelty/Neglect:**\n- Contact local Animal Control or law enforcement\n- Document with photos/video if safe to do so\n- Do NOT confront the abuser\n- Preserve evidence; do not alter the scene\n\n**Dangerous Situations:**\n- Animals in immediate life-threatening danger (hot car, flood, fire)\n- Call 911 if human safety is at risk\n- Some states allow vehicle entry to rescue animals (know your state law)\n\n**How to Report:**\n- Local Animal Control (non-emergency)\n- 911 (active emergency or human safety)\n- ASPCA Poison Control: 888-426-4435 (fee applies)\n- Platform escalation for coordination"
    }
  ]
}'::jsonb),

-- Module 3: Privacy & Data Handling
('orientation-privacy', 'Privacy & Data Handling', 'Protecting Sensitive Information',
'Guidelines for handling personal information of pet owners, reporters, and community members. Covers PII protection, confidentiality, and anti-doxxing rules.',
'orientation', 'all', 'reading', 20, true, 80, true, 3,
'{
  "sections": [
    {
      "id": "pii-basics",
      "title": "What is PII?",
      "content": "Personally Identifiable Information (PII) includes any data that could identify a specific individual:\n\n**Direct Identifiers:**\n- Full name\n- Address\n- Phone number\n- Email address\n- Social Security Number\n- Driver''s license number\n- License plate\n\n**Indirect Identifiers (when combined):**\n- Workplace + job title\n- Neighborhood + physical description\n- Photos of home/vehicle\n- Social media handles"
    },
    {
      "id": "handling-rules",
      "title": "PII Handling Rules",
      "content": "**Never share PII publicly.** This includes:\n- Public posts or comments\n- Group chats with non-authorized members\n- Social media (personal or platform)\n- Screenshots shared externally\n\n**Internal sharing is limited to:**\n- Direct coordination (e.g., giving an address to a verified transporter)\n- Escalation to supervisors/guardians\n- Legal reporting to authorities\n\n**Retention:**\n- Delete PII from personal devices after handoff\n- Do not store owner contact info longer than needed\n- Platform retains records per privacy policy"
    },
    {
      "id": "anti-doxxing",
      "title": "Anti-Doxxing Policy (Zero Tolerance)",
      "content": "**Doxxing** is publishing private information about someone, typically with malicious intent.\n\n**Prohibited Actions:**\n- Posting addresses of alleged abusers\n- Sharing phone numbers for \"justice\"\n- Publishing workplace information\n- Coordinating harassment campaigns\n- \"Go get them\" calls to action\n\n**Why This Matters:**\n- Alerts abusers, who may hide/harm animals\n- Creates legal liability for platform and you\n- Enables harassment of potentially innocent people\n- Obstructs actual legal justice\n\n**Enforcement:**\n- First offense: Warning + content removal\n- Second offense: 7-day suspension\n- Third offense: Permanent ban\n- Criminal threats: Immediate ban + report to law enforcement"
    },
    {
      "id": "confidentiality",
      "title": "Confidentiality Expectations",
      "content": "As a volunteer, you may learn sensitive information:\n- Medical conditions of animals\n- Financial situations of owners\n- Family circumstances\n- Mental health disclosures\n\n**Your obligation:**\n- Treat all case information as confidential\n- Share only on need-to-know basis for coordination\n- Never gossip about cases or owners\n- Do not use information for personal purposes\n\n**Breach consequences:**\n- Immediate suspension pending review\n- Potential permanent removal\n- Possible legal liability"
    }
  ]
}'::jsonb),

-- Module 4: Anti-Vigilantism & Conflict De-escalation
('orientation-anti-vigilante', 'Anti-Vigilantism & Conflict De-escalation', 'Justice Through Proper Channels',
'Understanding why vigilante behavior is harmful and how to redirect anger into constructive action. Includes de-escalation techniques for tense situations.',
'orientation', 'all', 'reading', 25, true, 80, true, 4,
'{
  "sections": [
    {
      "id": "why-not-vigilante",
      "title": "Why Vigilantism Fails",
      "content": "When we see animal suffering, anger is natural. The urge to \"do something\" is powerful. But vigilante actions almost always make things worse:\n\n**For the Animal:**\n- Abuser is alerted and may hide, move, or kill the animal\n- Evidence is contaminated or destroyed\n- Legal case becomes harder to prosecute\n\n**For You:**\n- Trespassing charges\n- Assault charges if confrontation escalates\n- Civil liability for damages\n- Loss of platform access\n\n**For the Community:**\n- Innocent people may be wrongly targeted\n- Platform loses credibility with authorities\n- Partners (shelters, vets) distance themselves\n- Mob mentality escalates unpredictably"
    },
    {
      "id": "redirect-energy",
      "title": "Redirecting the Energy",
      "content": "Channel anger into effective action:\n\n**Instead of confronting:** Document and report to Animal Control\n**Instead of posting address:** Share case internally for proper escalation\n**Instead of threatening:** Focus on animal welfare outcomes\n**Instead of harassing:** Support prosecution through proper channels\n\n**The Redirect Script:**\n\"I understand your anger—we all feel it. But posting this information puts the animal at greater risk and could hurt our ability to help. Let''s focus on what actually saves animals: getting this to the right authorities and coordinating a safe response.\""
    },
    {
      "id": "de-escalation",
      "title": "De-escalation Techniques",
      "content": "Whether online or in-person, de-escalation follows the **E.A.R. Method:**\n\n**E - Empathy**\nAcknowledge the other person''s feelings without agreeing with harmful actions.\n\"I can see you''re really upset about this. That''s completely understandable.\"\n\n**A - Ask**\nGet more information and engage their rational mind.\n\"What outcome are you hoping for? What would help the animal most?\"\n\n**R - Resolve**\nOffer a constructive path forward.\n\"Let''s report this to Animal Control together. They have the authority to actually enter the property and remove the animal legally.\"\n\n**Key Principles:**\n- Stay calm (your tone sets the temperature)\n- Validate emotions, not actions\n- Focus on animal welfare outcomes\n- Offer concrete alternatives\n- Know when to disengage (if escalating, step back)"
    },
    {
      "id": "scenario-example",
      "title": "Scenario: The Angry Commenter",
      "content": "**Situation:** A user posts a photo of a dog in distress with a visible address. Comments are flooding in with \"Someone needs to go there NOW\" and \"I have a gun.\"\n\n**Wrong Response:**\n\"Everyone calm down!\" (dismissive, escalates anger)\n\n**Right Response:**\n1. **Immediately hide/remove the address** (moderator action)\n2. **Post safety banner:** \"Do not confront—this alerts the abuser and puts the animal at risk. We''ve forwarded this to authorities.\"\n3. **Remove weapon threats** with warning/ban as appropriate\n4. **DM the original poster:** \"We''re taking this seriously. Can you confirm [details] so we can get the right help there safely?\"\n5. **Document** for Guardian review due to weapon threat\n\nThe goal is to **cool the thread** while **preserving the rescue**."
    }
  ]
}'::jsonb),

-- Module 5: Compassion Fatigue & Self-Care
('orientation-compassion-fatigue', 'Compassion Fatigue & Self-Care', 'Protecting Your Wellbeing',
'Understanding secondary traumatic stress, recognizing warning signs, and implementing self-care practices. Covers platform-enforced cooldowns and support resources.',
'orientation', 'all', 'reading', 25, true, 80, true, 5,
'{
  "sections": [
    {
      "id": "what-is-cf",
      "title": "What is Compassion Fatigue?",
      "content": "Compassion Fatigue (also called Secondary Traumatic Stress) is the emotional and physical exhaustion that comes from caring for others in distress.\n\n**It is NOT:**\n- A weakness\n- A sign you''re \"not cut out\" for rescue\n- Something to push through\n\n**It IS:**\n- A natural response to repeated exposure to suffering\n- Comparable to PTSD symptoms in first responders\n- Treatable and preventable with proper support\n\n**The Trajectory:**\n1. **Zealot Phase:** High energy, over-commitment, \"I can save them all\"\n2. **Irritability Phase:** Frustration, cynicism, anger at others\n3. **Withdrawal Phase:** Numbness, avoidance, reduced effectiveness\n4. **Burnout:** Complete exhaustion, departure from rescue"
    },
    {
      "id": "warning-signs",
      "title": "Warning Signs",
      "content": "**Emotional:**\n- Feeling hopeless or helpless\n- Increased irritability or anger\n- Reduced empathy for animals or people\n- Intrusive thoughts about cases\n- Nightmares about rescue scenarios\n\n**Physical:**\n- Sleep disturbances\n- Appetite changes\n- Frequent illness\n- Exhaustion despite rest\n- Headaches or muscle tension\n\n**Behavioral:**\n- Avoiding certain types of cases\n- Checking the platform obsessively\n- Isolating from friends/family\n- Increased alcohol/substance use\n- Neglecting personal responsibilities"
    },
    {
      "id": "platform-safeguards",
      "title": "Platform-Enforced Safeguards",
      "content": "Pet911 automatically protects you from overexposure:\n\n**Content Controls:**\n- Graphic images load blurred/grayscale by default\n- Click-to-reveal with warning\n- Reduces visceral shock response\n\n**Exposure Tracking:**\n- Each Code Red case increments your exposure counter\n- System tracks severity and frequency\n\n**Automatic Cooldowns:**\n- 2 Code Reds in 60 minutes → 15-minute lockout\n- 5 Code Reds in 24 hours → 12-hour restriction to Green/Yellow only\n- These are NOT punishments—they are protection\n\n**Buddy System:**\n- After threshold, a Guardian reviews your next 3 Code Red cases\n- Ensures you''re not handling severe cases alone"
    },
    {
      "id": "self-care",
      "title": "Self-Care Practices",
      "content": "**Micro-Debrief (After Every Code Red):**\nTake 3 minutes to:\n1. Name the emotion you''re feeling\n2. Note any physical sensations\n3. Identify one thing you did well\n4. Release responsibility for the outcome\n\n**Ongoing Practices:**\n- Set boundaries (scheduled platform time, not 24/7)\n- Maintain activities outside rescue\n- Talk to someone (peer support, therapist)\n- Physical exercise (proven stress reducer)\n- Celebrate successes (keep a \"wins\" folder)\n\n**Reframe Your Role:**\n\"You are a dispatcher, not a savior. Hand-off is success.\"\n\n**Resources:**\n- Peer support groups (weekly, optional)\n- Crisis Text Line: Text HOME to 741741\n- SAMHSA Helpline: 1-800-662-4357"
    }
  ]
}'::jsonb);

-- ============================================================================
-- MODERATOR TRACK MODULES
-- ============================================================================

INSERT INTO training_modules (slug, title, subtitle, description, category, track, content_type, estimated_minutes, requires_quiz, passing_score, requires_supervisor_signoff, sort_order, content_json) VALUES

-- Module 6: Triage Fundamentals (Tier 1 Moderator)
('mod-triage-fundamentals', 'Triage Fundamentals', 'The Art of Classification',
'Learn the 3-tier triage system (Code Red/Yellow/Green) and how to classify incoming posts quickly and accurately. Foundation for all moderator work.',
'moderator', 'moderator_t1', 'reading', 45, true, 80, false, 10,
'{
  "sections": [
    {
      "id": "triage-overview",
      "title": "What is Triage?",
      "content": "Triage is the process of determining the priority of patients'' treatments based on the severity of their condition. In Pet911, we adapt this medical concept to classify posts.\n\n**Why Triage Matters:**\n- Prevents \"alarm fatigue\" (everything feels urgent)\n- Ensures critical cases get immediate attention\n- Allocates scarce volunteer resources effectively\n- Creates predictable workflows for responders\n\n**The Core Question:**\nWhen a post arrives, you don''t ask \"Is this sad?\" (emotional response).\nYou ask \"Is this stable?\" (clinical response)."
    },
    {
      "id": "code-red",
      "title": "Code Red: Critical (ECHO/DELTA)",
      "content": "**Definition:** Imminent threat to life or severe suffering. Death is likely without intervention within 1 hour.\n\n**Clinical Indicators:**\n- Hit-by-car with visible trauma/bleeding\n- Active animal cruelty in progress\n- Neonates found without mother in extreme weather (<40°F or >90°F)\n- Animal trapped in hot car\n- Profuse bleeding (arterial)\n- Respiratory distress (open-mouth breathing in cats)\n- Seizing or unconscious\n- Active drowning/flood situation\n\n**Action Protocol:**\n1. **Push notification** to verified responders in radius\n2. **Pin post** globally for geofenced area\n3. **Restrict comments** to verified rescuers only\n4. **Safety banner:** \"Do not confront; do not trespass; call local emergency services if human safety at risk\"\n5. **Request minimal facts** (location, time, condition, hazards)\n6. **Coordinate** with Animal Control/Police if legal authority needed\n7. **Create incident log** for after-action review"
    },
    {
      "id": "code-yellow",
      "title": "Code Yellow: Urgent (BRAVO/CHARLIE)",
      "content": "**Definition:** Serious condition but stable. Requires intervention within 12-24 hours. Animal is uncomfortable but not dying.\n\n**Clinical Indicators:**\n- Severe mange/skin infection\n- Limping stray (still mobile)\n- Cat colony identification\n- Owner surrender threats (\"I will dump this dog tomorrow\")\n- Pregnant stray\n- Minor wounds (abscesses, non-critical injuries)\n- Lost pet >24 hours (mobile, seen recently)\n\n**Action Protocol:**\n1. **Alert** Tier 2 volunteers via in-app notification\n2. **Highlight post** (not pinned)\n3. **Confirm details:** location, timing window, animal count, containment status, contact method\n4. **Assign** role-specific responders (transport/trap/foster)\n5. **Enable** community crowdsourcing for supplies\n6. **Monitor comments** for bad advice\n7. **Close loop:** \"Handoff confirmed\" + \"outcome posted\" within SLA"
    },
    {
      "id": "code-green",
      "title": "Code Green: Routine (ALPHA/OMEGA)",
      "content": "**Definition:** Non-life-threatening. Informational or long-term need. Resource sharing or general sightings.\n\n**Clinical Indicators:**\n- Lost pet sightings (older than 24h, no distress)\n- Blurry photos of \"potential\" strays\n- Behavioral advice requests\n- Resource referrals\n- Generic rehoming requests (non-urgent)\n- General questions about rescue\n\n**Action Protocol:**\n1. **Standard feed visibility** (no push notifications)\n2. **Automated bot response** with local resources (food banks, low-cost spay/neuter clinics)\n3. **Open comments** to general public\n4. **Monitor for escalation** (reclassify if situation changes)"
    },
    {
      "id": "abcs-triage",
      "title": "The ABCs of Digital Triage",
      "content": "Since you cannot physically examine the animal, use visual cues from photos/videos:\n\n**A - Airway/Appearance**\nIs there respiratory distress?\n- Open mouth breathing in cats (near-death sign)\n- Exaggerated abdominal effort in dogs\n- Blue/gray gums (cyanosis) if visible\n→ If YES → Code Red ECHO immediately\n\n**B - Behavior/Body Language**\nIs the animal responsive?\n- Lateral recumbency (lying on side, no response)\n- Seizing\n- \"Star-gazing\" (neurological sign)\n→ Unconscious/Seizing → Code Red ECHO\n→ Aggressive but contained → Code Yellow (needs specialist)\n\n**C - Context/Conditions**\nIs the environment the killer?\n- Floodwaters, highway median, extreme heat\n- Proximity to predators\n→ High-risk environment ELEVATES classification\n→ A healthy dog on a highway = Code Red (environment is lethal)"
    }
  ]
}'::jsonb),

-- Module 7: Moderator Tools & Workflows (Tier 1)
('mod-tools-workflows', 'Moderator Tools & Workflows', 'Platform Mechanics',
'Hands-on training for moderator tools: post classification, comment moderation, safety banners, escalation procedures, and incident logging.',
'moderator', 'moderator_t1', 'interactive', 30, true, 80, false, 11,
'{
  "sections": [
    {
      "id": "classification-interface",
      "title": "Post Classification Interface",
      "content": "When a post enters the triage queue, you''ll see:\n\n**Header Information:**\n- Post timestamp and time in queue\n- Poster history (new user, verified, previous posts)\n- Location (if provided) with county/region\n- AI-suggested classification (confidence score)\n\n**Your Actions:**\n1. Review content (text, images, video)\n2. Apply triage code (Red/Yellow/Green)\n3. Add any required tags (species, injury type, etc.)\n4. Apply safety banner if needed\n5. Route to appropriate queue\n\n**The AI Assist:**\nThe system suggests a classification, but YOU must confirm.\nAI confidence <70% = requires closer review\nNever auto-approve Code Red without human eyes"
    },
    {
      "id": "safety-banners",
      "title": "Safety Banners",
      "content": "Pre-written banners ensure consistent messaging:\n\n**Banner: NO_CONFRONT**\n\"⚠️ SAFETY NOTICE: Do not confront anyone at this location. Do not trespass on private property. If you believe an animal is in immediate danger, contact local Animal Control or 911.\"\n\n**Banner: NO_CHASE**\n\"⚠️ Do not chase this animal. Panicked animals run into traffic. Keep visual contact if safe, but do not pursue. Report sightings in this thread.\"\n\n**Banner: VET_ONLY**\n\"⚠️ This animal needs professional veterinary care. Do not attempt home treatment. Contact the nearest emergency vet.\"\n\n**Banner: RABIES_RISK**\n\"⚠️ RABIES VECTOR SPECIES. Do not handle without proper equipment and training. If bitten or scratched, seek medical attention immediately.\"\n\nApply banners automatically for Code Red and as needed for Code Yellow."
    },
    {
      "id": "comment-moderation",
      "title": "Comment Moderation",
      "content": "**Immediate Removal:**\n- Doxxing (addresses, phone numbers, license plates)\n- Threats of violence or vigilante action\n- Misinformation that could harm animals\n- Spam or scam attempts\n\n**Warning First:**\n- Bad advice (well-intentioned but harmful)\n- Minor rule violations\n- Off-topic discussions\n\n**Leave Visible:**\n- Helpful information\n- Resource sharing\n- Emotional support (within guidelines)\n- Sighting reports\n\n**Tool Actions:**\n- Remove (with reason code)\n- Hide (pending review)\n- Pin (important updates)\n- Lock thread (if escalating)\n- DM user (private correction)"
    },
    {
      "id": "escalation",
      "title": "Escalation Procedures",
      "content": "**When to Escalate to Tier 2 (Triage Specialist):**\n- Conflicting information in reports\n- Multi-county coordination needed\n- Media attention on case\n- Complex logistics (multiple animals, transport chain)\n- Poster is unresponsive but case is active\n\n**When to Escalate to Tier 3 (Guardian):**\n- Suspected fraud or scam\n- Donation requests over threshold\n- Repeated rule violations by user\n- Threats requiring documentation\n- Appeals of moderator decisions\n- Pattern-of-abuse investigations\n\n**How to Escalate:**\n1. Tag the post with escalation level\n2. Add notes summarizing the issue\n3. Notify via moderator channel\n4. Do not close the case—hand off warm"
    },
    {
      "id": "incident-logging",
      "title": "Incident Logging",
      "content": "Every Code Red requires an incident log:\n\n**Required Fields:**\n- Case ID (auto-generated)\n- Classification code and timestamp\n- Location details\n- Animal description\n- Responders dispatched\n- Actions taken\n- Outcome (resolved/ongoing/escalated)\n\n**Optional Fields:**\n- Photo evidence\n- Timeline of events\n- Communication log\n- After-action notes\n\n**Why Log Everything:**\n- Enables after-action review\n- Protects you legally\n- Identifies patterns\n- Supports training improvements\n- Required for audits"
    }
  ]
}'::jsonb),

-- Module 8: Verification & Fraud Prevention (Tier 2/3)
('mod-verification-fraud', 'Verification & Fraud Prevention', 'Protecting the Community',
'Advanced training on verifying legitimate rescues vs. donation scammers. Covers IRS TEOS checks, reverse image search, and the Trusted Reporter system.',
'moderator', 'moderator_t2', 'reading', 40, true, 85, true, 12,
'{
  "sections": [
    {
      "id": "verification-types",
      "title": "Two Types of Verification",
      "content": "**1. Identity Verification (Person/Org)**\nConfirms that the person or organization is who they claim to be.\n- Photo ID match (individuals)\n- 501(c)(3) status (organizations)\n- Consistent online presence\n\n**2. Donation Authorization Verification**\nConfirms the right to solicit donations on behalf of an organization.\n- Not everyone claiming affiliation can fundraise\n- Must verify with organization directly\n- Personal CashApp/Venmo = red flag"
    },
    {
      "id": "irs-teos",
      "title": "IRS TEOS Verification",
      "content": "The IRS Tax Exempt Organization Search (TEOS) is your primary tool for verifying 501(c)(3) status.\n\n**How to Check:**\n1. Go to IRS TEOS: https://www.irs.gov/charities-non-profits/tax-exempt-organization-search\n2. Search by EIN or organization name\n3. Verify exact name match\n4. Check for revocation status\n5. Note determination date\n\n**Red Flags:**\n- Organization not found\n- Name doesn''t match exactly\n- Revocation listed\n- Very recent determination (may be legitimate, needs extra scrutiny)"
    },
    {
      "id": "scam-signals",
      "title": "Scam Signal Detection",
      "content": "**High-Risk Indicators (Auto-Flag):**\n- Urgency + money request + refusal to provide EIN/receipts\n- Reused images (reverse image search matches)\n- Inconsistent location details\n- New account with immediate donation ask\n- Story changes between posts\n- Refuses to use verified org payment channels\n\n**Reverse Image Search:**\n- Use TinEye or Google Lens\n- Check if image appears elsewhere\n- Note original posting dates\n- Stolen images often from news articles\n\n**The Paper Test:**\nAsk poster to provide a new photo with:\n- Today''s date handwritten\n- Their username on paper\n- Visible in frame with animal\n→ Scammers cannot provide this"
    },
    {
      "id": "donation-rules",
      "title": "Donation Authorization Rules",
      "content": "**Unverified Users (Grey Badge):**\n- Cannot request cash donations\n- Posts with donation links enter moderation queue\n- Can request supplies via Amazon Wishlist only\n\n**Verified Reporter (Blue Badge):**\n- Phone-number verified\n- Can request \"Supplies Only\"\n- No cash without organization verification\n\n**Certified Rescuer (Gold Badge):**\n- 501(c)(3) verified OR background-checked individual\n- Can request cash donations\n- Must use organization''s official payment channel\n- Personal payment (CashApp, Venmo) requires pre-approval with strict caps + receipts\n\n**Enforcement:**\n- Unverified donation requests = removed + education message\n- Repeat attempts = ban + trust & safety log"
    },
    {
      "id": "verification-workflow",
      "title": "Verification Workflow (Guardian-Only)",
      "content": "**Step 1: Initial Request**\n- User submits verification application\n- Uploads required documents\n\n**Step 2: IRS Check**\n- Search TEOS for 501(c)(3) status\n- Document EIN, determination date, status\n\n**Step 3: State Registry Check**\n- Check state charity registry (varies by state)\n- Some states require registration to solicit\n\n**Step 4: Footprint Verification**\n- Consistent domain/email\n- Social media presence\n- Board/officers match public records\n- Physical address exists\n\n**Step 5: Decision**\n- Approve → Grant appropriate badge\n- Deny → Document reason, notify user\n- Pending → Request additional information\n\n**Step 6: Ongoing Monitoring**\n- Annual re-verification\n- Monitor for complaints\n- Audit random donation threads"
    }
  ]
}'::jsonb);

-- ============================================================================
-- FIELD VOLUNTEER MODULES
-- ============================================================================

INSERT INTO training_modules (slug, title, subtitle, description, category, track, content_type, estimated_minutes, requires_quiz, passing_score, requires_background_check, requires_shadowing, shadowing_hours_required, sort_order, content_json) VALUES

-- Module 9: Trapper Certification
('field-trapper', 'Trapper Certification', 'TNR & Recovery Specialist',
'Complete training for humane trapping operations. Covers trap types, colony assessment, rabies-vector safety, and the No-Touch doctrine.',
'field_trapper', 'trapper', 'reading', 60, true, 85, true, true, 8, 20,
'{
  "sections": [
    {
      "id": "colony-assessment",
      "title": "Colony Assessment",
      "content": "Before trapping, you must assess the colony:\n\n**Count and Catalog:**\n- Number of cats (individuals, not guesses)\n- Physical descriptions (color, markings, ear tips)\n- Health status (injuries, illness signs)\n- Feeding schedule and patterns\n- Safe staging locations\n\n**Feral vs. Stray:**\n- **Feral (unsocialized):** Silent, crouched, no eye contact, will not approach\n- **Stray (lost pet):** May vocalize, make eye contact, approach cautiously\n→ This determines outcome: TNR vs. socialization for adoption\n\n**Environmental Assessment:**\n- Traffic patterns\n- Predators in area\n- Weather exposure\n- Escape routes for cats\n- Safe parking for your vehicle"
    },
    {
      "id": "trap-types",
      "title": "Trap Types & Mechanics",
      "content": "**Box Traps (Tru-Catch/Tomahawk)**\n- Standard humane trap\n- Trip plate mechanism\n- Adjustable sensitivity (lighter for kittens)\n- Must check every 30 minutes minimum\n\n**Drop Traps**\n- Manual deployment via string/remote\n- For trap-shy cats\n- Requires patience and timing\n- Pull when cat is FULLY under, not partially\n\n**Remote Triggers**\n- RC fob or string-release\n- Selective trapping (target specific injured animal)\n- Avoid trapping non-targets (nursing mothers, wildlife)\n\n**Transfer Cages**\n- For moving cats from trap to carrier\n- Uses trap fork/isolator\n- Never open trap door directly"
    },
    {
      "id": "withholding-protocol",
      "title": "The Withholding Protocol",
      "content": "**Purpose:** Hungry cats trap better.\n\n**Protocol:**\n1. Feed colony on regular schedule for 1-2 weeks\n2. Establish trust and patterns\n3. 24 hours before trapping: withhold food\n4. Inform any colony feeders (diplomacy required!)\n5. Trap day: baited traps are only food source\n\n**Bait Selection:**\n- Smelly is better (sardines, mackerel, KFC)\n- Fresh over dry food\n- Place at BACK of trap (forces full entry)\n\n**Caution:**\nSome feeders will resist withholding. Explain:\n\"I know it feels cruel, but a hungry cat traps in hours. A fed cat might never trap, and then we can''t help them.\""
    },
    {
      "id": "no-touch-doctrine",
      "title": "The No-Touch Doctrine",
      "content": "**CRITICAL SAFETY RULE:**\nNever handle feral cats with bare hands. Ever.\n\n**Why:**\n- Feral cats will bite and scratch when terrified\n- Cat bites have 80% infection rate\n- Rabies risk from unknown animals\n- One bite can end your trapping career (infection, disability)\n\n**The Doctrine:**\n- Trap to trap transfers only\n- Use trap forks, isolators, and thick gloves\n- If cat escapes trap, do NOT grab\n- Let them go rather than risk handling\n\n**PPE Requirements:**\n- Thick leather gloves (bite-resistant)\n- Long sleeves\n- Eye protection (cats spray)\n- Closed-toe shoes"
    },
    {
      "id": "rabies-protocol",
      "title": "Rabies Exposure Protocol",
      "content": "**If Bitten or Scratched:**\n1. STOP. Do not continue trapping.\n2. Wash wound immediately with soap and water (5 minutes)\n3. Apply antiseptic\n4. Photograph the wound and the animal (if safe)\n5. Seek medical attention within 24 hours\n6. Report to local health department\n7. Report to platform for documentation\n\n**The Animal:**\n- Do NOT release if possible\n- Quarantine for observation OR\n- Euthanasia for rabies testing (health department decision)\n\n**Failure to follow this protocol is a CRITICAL FAIL and grounds for immediate decertification.**\n\nRabies is 100% fatal once symptoms appear. Post-exposure prophylaxis (PEP) is 100% effective if administered in time. Do not gamble with your life."
    },
    {
      "id": "post-surgery-care",
      "title": "Post-Surgery Recovery Monitoring",
      "content": "After TNR surgery, cats recover in the trap:\n\n**Setup:**\n- Covered trap (reduces stress)\n- Temperature controlled (no extreme heat/cold)\n- Quiet location\n- Clean newspaper bedding\n\n**Monitoring Schedule:**\n- Check every 2 hours\n- Look for: alertness, movement, bleeding, vomiting\n\n**Release Criteria (ALL must be met):**\n- Fully alert and responsive\n- Standing/sitting upright\n- No active bleeding\n- Minimum 24 hours post-surgery (48 for females)\n- Clear weather forecast\n- Return to original capture location\n\n**CRITICAL FAIL: Releasing a cat that is still sedated, not alert, or before recovery period = decertification.**"
    }
  ]
}'::jsonb),

-- Module 10: Transport Certification
('field-transport', 'Transport Certification', 'Emergency Transport Logistics',
'Complete training for safe animal transport. Covers the Two-Door Rule, No Paws on Ground, chain of custody, and vehicle sanitation.',
'field_transport', 'transporter', 'reading', 45, true, 85, true, true, 4, 21,
'{
  "sections": [
    {
      "id": "two-door-rule",
      "title": "The Two-Door Rule (Golden Standard)",
      "content": "**THE RULE:**\nAn animal is NEVER allowed to have a direct path to the open sky. There must always be TWO barriers between the animal and the environment.\n\n**Implementation:**\n- Barrier 1: The crate/carrier door\n- Barrier 2: The vehicle door (or building door)\n\n**Protocol:**\n- Vehicle door must be CLOSED AND LATCHED before crate door is opened\n- Crate door must be SECURED before vehicle door is opened\n- No exceptions. No \"just for a second.\"\n\n**Why This Matters:**\nA scared animal will bolt. In parking lots, on highways, in unfamiliar areas—they will run. One moment of inattention = dead animal.\n\n**Mental Model:**\nThink of it like an airlock on a spaceship. Both doors are never open at the same time."
    },
    {
      "id": "npog",
      "title": "No Paws on the Ground (NPOG)",
      "content": "**THE RULE:**\nAnimals remain secured at all times. They do not touch the ground at rest stops, gas stations, or transfer points.\n\n**Why:**\n- Escape risk (unfamiliar territory)\n- Disease exposure (parvo survives in soil for years)\n- Contamination of transport vehicle\n- Liability if animal bites someone\n\n**Rest Stop Protocol:**\n1. Stay in vehicle unless emergency\n2. If must exit: one person stays with animals\n3. Do NOT let dogs \"stretch their legs\"\n4. Use puppy pads in crate for elimination\n5. Fresh water through crate door\n\n**Emergency Unload Only If:**\n- Vehicle fire/accident\n- Animal medical emergency requiring immediate vet\n→ Use secondary containment (double leash, controlled area)\n→ Disinfect after"
    },
    {
      "id": "chain-of-custody",
      "title": "Chain of Custody",
      "content": "**Every handoff must be documented:**\n\n**Required Fields:**\n- Date and time of pickup\n- Location (address or coordinates)\n- Animal ID (description, microchip if known)\n- Condition at pickup (photo recommended)\n- Sending party name and contact\n- Receiving party name and contact\n- Handoff signature or photo confirmation\n\n**The Form:**\nDigital form in app, generates unique transport ID.\nBoth parties confirm = chain complete.\n\n**Why Chain of Custody Matters:**\n- Proves you did your job correctly\n- Tracks animal through transport legs\n- Required for shelter intake\n- Protects you if something goes wrong\n\n**CRITICAL FAIL: Missing chain of custody documentation = disqualification from transport.**"
    },
    {
      "id": "vehicle-sanitation",
      "title": "Vehicle Sanitation (Parvo-Aware)",
      "content": "**The Threat:**\nCanine Parvovirus survives in the environment for 1+ years. It kills puppies within days. You can carry it on your shoes, clothes, and vehicle.\n\n**Crate Requirements:**\n- Non-porous surfaces (wire or plastic, not fabric)\n- Must be cleanable with disinfectant\n- Dedicated transport crates (not personal pet crates)\n\n**Disinfection Protocol (Between EVERY Transport):**\n1. Remove all bedding and waste\n2. Rinse with water to remove organic matter\n3. Apply parvocidal disinfectant (Rescue/Accelerated Hydrogen Peroxide)\n4. Contact time: minimum 10 minutes\n5. Rinse and dry\n6. Fresh bedding\n\n**Vehicle:**\n- Floor mats: washable or disposable\n- Wipe down surfaces animals contacted\n- Change clothes/shoes between high-risk transports"
    },
    {
      "id": "heat-cold-safety",
      "title": "Heat & Cold Safety",
      "content": "**NEVER leave animals unattended in vehicle.**\n\nEven with windows cracked, car interiors can reach deadly temperatures in minutes.\n\n**Heat Protocol:**\n- Check temp before loading (>85°F interior = wait with A/C running)\n- A/C must reach rear crate area\n- Thermometer visible in crate zone\n- Frozen water bottles for passive cooling\n- Stop every 2 hours to check animals\n\n**Cold Protocol:**\n- Heat must reach rear crate area\n- Blankets over crates (not blocking airflow)\n- Check for shivering or lethargy\n\n**If Vehicle Breaks Down:**\n1. Call for immediate backup transport\n2. Move animals to safe location if A/C fails\n3. Report to dispatch immediately\n\n**CRITICAL FAIL: Leaving animals unattended in vehicle = decertification.**"
    },
    {
      "id": "handoff-scenario",
      "title": "Scenario: Handoff with Disease Risk",
      "content": "**Situation:** You pick up a \"healthy\" puppy, but notice diarrhea in the crate at pickup. Sending party says, \"It''s just stress.\" Destination is an emergency foster with other dogs.\n\n**WRONG Response:** \"Probably fine\" → Deliver to foster → Parvo outbreak → Multiple dead puppies.\n\n**CORRECT Response:**\n1. **STOP.** Treat as potential infectious risk.\n2. **Containment:** Keep puppy crated; use PPE if handling.\n3. **Document:** Note symptoms, time, photos.\n4. **Notify:** Contact dispatch AND destination foster immediately.\n5. **Reroute Decision:**\n   - Option A: Isolate-trained foster only (no other dogs)\n   - Option B: Direct to veterinary intake\n6. **Decon:** Full sanitation before any further transport.\n\n**The Lesson:** Your job is not just moving animals—it''s protecting the whole network."
    }
  ]
}'::jsonb),

-- Module 11: Emergency Foster Certification
('field-foster', 'Emergency Foster Certification', 'Triage Care Provider',
'Complete training for emergency fostering. Covers quarantine setup, biosecurity zoning, neonatal care, and the anti-hoarding doctrine.',
'field_foster', 'foster', 'reading', 50, true, 85, true, true, 6, 22,
'{
  "sections": [
    {
      "id": "hot-cold-zones",
      "title": "Biosecurity Zoning",
      "content": "**Your home must be zoned to prevent disease transmission:**\n\n**Hot Zone (Quarantine)**\n- Dedicated room (bathroom or spare bedroom ideal)\n- Non-porous flooring if possible (tile, vinyl)\n- Door that closes completely\n- Dedicated supplies that NEVER leave the room:\n  - Litter box and scoop\n  - Food/water bowls\n  - Bedding\n  - Cleaning supplies\n\n**Transition Zone**\n- Just outside Hot Zone door\n- Contains:\n  - Bleach footbath or disinfectant mat\n  - Dedicated \"hot zone\" shoes (Crocs work well)\n  - Gown or cover-up\n  - Hand sanitizer\n\n**Cold Zone**\n- Rest of house\n- Your personal pets live here\n- Foster animals NEVER allowed in Cold Zone\n- Cross-contamination prevention is priority"
    },
    {
      "id": "quarantine-protocol",
      "title": "Quarantine Protocol",
      "content": "**Entry Procedure:**\n1. Enter Transition Zone\n2. Put on Hot Zone shoes\n3. Put on cover gown\n4. Enter Hot Zone\n5. Care for animals\n6. Disinfect hands/surfaces before exit\n7. Remove gown in Transition Zone\n8. Step out of Hot Zone shoes\n9. Wash hands immediately\n10. Exit to Cold Zone\n\n**Order of Care:**\nIf multiple foster animals:\n- Healthy → Sick (always)\n- Known status → Unknown status\n- Never go backwards\n\n**Duration:**\n- Minimum 14 days quarantine for new intakes\n- Longer if illness suspected\n- Vet clears before mingling with resident pets"
    },
    {
      "id": "common-diseases",
      "title": "Common Foster Diseases",
      "content": "**Upper Respiratory Infection (URI)**\n- Symptoms: Sneezing, runny nose/eyes, lethargy\n- Contagious to other cats\n- Usually treatable with supportive care\n- Vet if: not eating, fever, difficulty breathing\n\n**Feline Panleukopenia (FPV/Parvo)**\n- Symptoms: Vomiting, bloody diarrhea, lethargy, fever\n- EXTREMELY contagious, high mortality\n- Immediate vet care required\n- Quarantine is CRITICAL\n\n**Ringworm**\n- Symptoms: Circular hair loss, scaly skin\n- Fungal, not a worm\n- Contagious to humans and other pets\n- Long treatment (weeks to months)\n\n**Parasites**\n- Fleas, ear mites, intestinal worms\n- Common in strays\n- Treatable but require isolation during treatment\n\n**Red Flag Symptoms (IMMEDIATE VET):**\n- Not eating >24 hours\n- Bloody diarrhea or vomiting\n- Difficulty breathing\n- Seizures or collapse\n- Extreme lethargy"
    },
    {
      "id": "neonatal-care",
      "title": "Neonatal Care (Bottle Babies)",
      "content": "**Fading Kitten Syndrome kills fast. Know the signs:**\n\n**Warning Signs:**\n- Lethargy, limpness\n- Rejection of bottle\n- Temperature drop (cold to touch)\n- Constant crying\n- Failure to gain weight\n\n**THE RULE: Heat First, Sugar Second, Food Last**\n\n**Heat First:**\n- NEVER feed a cold kitten (causes aspiration, gut stasis)\n- Warm slowly to 98°F using:\n  - Heating pad on LOW (covered)\n  - Body heat (under shirt, on chest)\n  - Warm water bottles wrapped in towel\n- Check temperature: gums should be pink, not white/blue\n\n**Sugar Second:**\n- Rub Karo syrup or honey on gums\n- Hypoglycemia (low blood sugar) is primary killer\n- Do this while warming\n\n**Food Last:**\n- Only feed when kitten is:\n  - Warm\n  - Has suckle reflex (will root for bottle)\n  - Alert enough to swallow\n- Use kitten formula (KMR), never cow''s milk\n- Feed slowly to prevent aspiration"
    },
    {
      "id": "anti-hoarding",
      "title": "The \"Foster Goodbye\" & Anti-Hoarding Doctrine",
      "content": "**The Hard Truth:**\nYour job is to prepare animals for their forever home—not to become it.\n\n**\"Foster Failure\" in Moderation:**\n- Adopting one foster occasionally = normal\n- Keeping multiple fosters = capacity crisis\n- \"No one can care for them like I can\" = warning sign\n\n**Why Hoarding Hurts:**\n- Your capacity is full → can''t take new emergencies\n- Quality of care decreases with numbers\n- Animals miss adoption opportunities\n- You burn out, leave rescue entirely\n\n**Healthy Mindset:**\n- \"I am a bridge, not a destination\"\n- \"Placement is success, not failure\"\n- \"My empty spot saves the next animal\"\n\n**The Report Card:**\nWrite notes for adopters:\n- Personality traits\n- Favorite foods/toys\n- Training progress\n- Medical notes\n\nThis provides closure AND ensures continuity of care.\n\n**CRITICAL FAIL: Refusing to transfer animals per protocol / collecting behavior = suspension and review.**"
    }
  ]
}'::jsonb);

-- ============================================================================
-- PREREQUISITES
-- ============================================================================

-- Get module IDs for prerequisites
DO $$
DECLARE
  v_orientation_platform UUID;
  v_orientation_safety UUID;
  v_orientation_privacy UUID;
  v_orientation_vigilante UUID;
  v_orientation_fatigue UUID;
  v_mod_triage UUID;
  v_mod_tools UUID;
  v_mod_verification UUID;
  v_field_trapper UUID;
  v_field_transport UUID;
  v_field_foster UUID;
BEGIN
  SELECT id INTO v_orientation_platform FROM training_modules WHERE slug = 'orientation-platform';
  SELECT id INTO v_orientation_safety FROM training_modules WHERE slug = 'orientation-safety';
  SELECT id INTO v_orientation_privacy FROM training_modules WHERE slug = 'orientation-privacy';
  SELECT id INTO v_orientation_vigilante FROM training_modules WHERE slug = 'orientation-anti-vigilante';
  SELECT id INTO v_orientation_fatigue FROM training_modules WHERE slug = 'orientation-compassion-fatigue';
  SELECT id INTO v_mod_triage FROM training_modules WHERE slug = 'mod-triage-fundamentals';
  SELECT id INTO v_mod_tools FROM training_modules WHERE slug = 'mod-tools-workflows';
  SELECT id INTO v_mod_verification FROM training_modules WHERE slug = 'mod-verification-fraud';
  SELECT id INTO v_field_trapper FROM training_modules WHERE slug = 'field-trapper';
  SELECT id INTO v_field_transport FROM training_modules WHERE slug = 'field-transport';
  SELECT id INTO v_field_foster FROM training_modules WHERE slug = 'field-foster';

  -- Safety requires Platform
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_orientation_safety, v_orientation_platform);
  
  -- Privacy requires Platform
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_orientation_privacy, v_orientation_platform);
  
  -- Anti-vigilante requires Safety + Privacy
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_orientation_vigilante, v_orientation_safety);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_orientation_vigilante, v_orientation_privacy);
  
  -- Compassion Fatigue requires Platform
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_orientation_fatigue, v_orientation_platform);
  
  -- Moderator modules require all orientation
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_triage, v_orientation_platform);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_triage, v_orientation_safety);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_triage, v_orientation_privacy);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_triage, v_orientation_vigilante);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_triage, v_orientation_fatigue);
  
  -- Tools requires Triage
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_tools, v_mod_triage);
  
  -- Verification requires Tools
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_mod_verification, v_mod_tools);
  
  -- Field modules require all orientation
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_trapper, v_orientation_platform);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_trapper, v_orientation_safety);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_trapper, v_orientation_privacy);
  
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_transport, v_orientation_platform);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_transport, v_orientation_safety);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_transport, v_orientation_privacy);
  
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_foster, v_orientation_platform);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_foster, v_orientation_safety);
  INSERT INTO training_prerequisites (module_id, prerequisite_module_id) VALUES (v_field_foster, v_orientation_privacy);
END $$;
