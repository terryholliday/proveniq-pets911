-- Pet911 Training Quiz Questions
-- Scenario-based assessments per nonprofit best practices
-- 80% passing score required, critical questions must be correct

-- ============================================================================
-- ORIENTATION: Platform Orientation Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'orientation-platform';

  -- Question 1: Volunteer Status
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'multiple_choice', 
    'As a Pet911 volunteer, which statement best describes your relationship with the platform?',
    'Volunteers are independent actors, not employees. This distinction is critical for legal liability and operational autonomy.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'I am an employee of Pet911 and must follow all directives', false, 1),
  (v_question_id, 'I am an independent volunteer who acts of my own volition and judgment', true, 2),
  (v_question_id, 'I am a contractor paid per rescue completed', false, 3),
  (v_question_id, 'I am a law enforcement agent with special authority', false, 4);

  -- Question 2: Scope of Authority
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'multi_select',
    'Which of the following actions are WITHIN your scope of authority as a Pet911 volunteer? (Select all that apply)',
    'Volunteers coordinate on-platform, report to authorities, and provide direct care. They do NOT have law enforcement powers or authority to trespass.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Coordinate rescue efforts through the platform', true, 1),
  (v_question_id, 'Enter private property to rescue an animal', false, 2),
  (v_question_id, 'Report suspected animal cruelty to proper authorities', true, 3),
  (v_question_id, 'Confront a suspected animal abuser', false, 4),
  (v_question_id, 'Provide temporary foster care', true, 5),
  (v_question_id, 'Make arrests for animal cruelty', false, 6);

  -- Question 3: Escalation Scenario
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty)
  VALUES (v_module_id, 'scenario',
    'What is the appropriate escalation path?',
    'A user posts about a neighbor''s dog that looks thin. Comments start getting heated with users posting the neighbor''s address and suggesting "someone should do something."',
    'Vigilante behavior escalates through moderator tiers, ultimately reaching Guardians for governance decisions.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Let the community handle it - they know the situation best', false, 'Community mob justice creates liability and often harms animals by alerting abusers.', 1),
  (v_question_id, 'Remove the address, apply safety banner, escalate to Guardian for review', true, 'Correct. Remove PII immediately, de-escalate with safety messaging, and escalate the pattern to appropriate tier.', 2),
  (v_question_id, 'Ban everyone who posted an address immediately', false, 'First offense is a warning. Immediate bans should be reserved for repeat offenders or criminal threats.', 3),
  (v_question_id, 'Contact the neighbor yourself to assess the situation', false, 'Direct contact with subjects is outside volunteer scope and creates liability.', 4);

  -- Question 4: Wikipedia Model
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'Pet911''s governance model is inspired by Wikipedia and Reddit. What key principle does this mean for dispute resolution?',
    'Like Wikipedia, Pet911 uses structured escalation with uninvolved reviewers for sensitive cases.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'The loudest voice wins the argument', false, 1),
  (v_question_id, 'Disputes should be resolved through structured escalation with neutral reviewers', true, 2),
  (v_question_id, 'All disputes should go directly to lawyers', false, 3),
  (v_question_id, 'Users should resolve all conflicts through direct confrontation', false, 4);

  -- Question 5: True/False - Employee Status
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'true_false',
    'As a Pet911 volunteer, I can decline any assignment without penalty.',
    'Volunteers are not employees and maintain full autonomy. You can always decline an assignment that you feel uncomfortable with or unable to complete safely.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', true, 1),
  (v_question_id, 'False', false, 2);

END $$;

-- ============================================================================
-- ORIENTATION: Safety & Legal Foundations Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'orientation-safety';

  -- Question 1: Golden Rule (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'sequencing',
    'Put these safety considerations in the correct priority order (most important first):',
    'Personal safety always comes first. You cannot save animals if you are injured or dead.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Is this safe for ME?', true, 1),
  (v_question_id, 'Is this safe for BYSTANDERS?', true, 2),
  (v_question_id, 'Is this safe for the ANIMAL?', true, 3);

  -- Question 2: Good Samaritan Scenario
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'scenario',
    'Which action is most appropriate?',
    'You find an injured dog on the side of the road. The dog has a broken leg but is breathing normally. You have basic first aid training but no veterinary training.',
    'Good Samaritan laws protect stabilization and transport, not medical treatment. The "Stabilize and Transport" doctrine applies.',
    'hard', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Splint the leg using materials from your car, then transport to a vet', false, 'Splinting is practicing veterinary medicine without a license. It can also cause additional injury if done incorrectly.', 1),
  (v_question_id, 'Gently move the dog to your car with minimal manipulation and transport to nearest emergency vet', true, 'Correct. Stabilize and transport is within scope. Avoid manipulating the injury.', 2),
  (v_question_id, 'Administer pain medication from your personal supply to comfort the dog', false, 'Administering medication is practicing veterinary medicine and could be harmful (wrong dosage, drug interactions).', 3),
  (v_question_id, 'Leave the dog and call animal control to handle it', false, 'While calling animal control is appropriate, leaving an injured animal without monitoring could result in further harm or death.', 4);

  -- Question 3: Rabies Protocol
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'multiple_choice',
    'You are scratched by an unknown cat while attempting a rescue. What is your FIRST action?',
    'Rabies is 100% fatal once symptoms appear. Any bite or scratch from an unknown animal requires immediate wound care and medical evaluation.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Continue the rescue - it''s just a scratch', false, 'Cat scratches can transmit rabies and have high infection rates. Never ignore wounds from unknown animals.', 1),
  (v_question_id, 'Wash the wound with soap and water for at least 5 minutes', true, 'Correct. Immediate wound cleaning significantly reduces infection risk. Then seek medical attention within 24 hours.', 2),
  (v_question_id, 'Apply antibiotic ointment and bandage it', false, 'This should come after thorough cleaning, and medical evaluation is still required.', 3),
  (v_question_id, 'Take a photo for documentation', false, 'Documentation is important but wound care takes priority.', 4);

  -- Question 4: Mandatory Reporting
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty)
  VALUES (v_module_id, 'scenario',
    'What is the correct reporting action?',
    'While on a transport, you notice severe matting, open sores, and extreme emaciation on the dog you''re picking up from an owner surrender. The owner seems unaware of the severity.',
    'Suspected neglect should be reported to Animal Control. Do not confront the owner or accuse them directly.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Confront the owner about the neglect before accepting the dog', false, 'Confrontation can escalate the situation and may cause the owner to refuse surrender.', 1),
  (v_question_id, 'Accept the dog, document the condition with photos, and report to Animal Control after leaving', true, 'Correct. Document evidence, complete the rescue, and report through proper channels.', 2),
  (v_question_id, 'Post photos on social media to shame the owner', false, 'This is vigilantism and could constitute doxxing. It also alerts the owner and may harm future investigations.', 3),
  (v_question_id, 'Ignore it - the dog is being surrendered anyway', false, 'Reporting documents a pattern and may protect other animals in the household.', 4);

  -- Question 5: Zoonotic Awareness
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'Which of the following are TRUE about zoonotic disease risks? (Select all that apply)',
    'Standard precautions protect both you and the animals you serve.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Ringworm can spread from animals to humans', true, 1),
  (v_question_id, 'Only dogs can carry rabies', false, 2),
  (v_question_id, 'Pregnant women should avoid handling cat litter due to toxoplasmosis risk', true, 3),
  (v_question_id, 'Cat bites have a lower infection rate than dog bites', false, 4),
  (v_question_id, 'You should wash hands before AND after animal contact', true, 5);

  -- Question 6: True/False - Vehicle Entry
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'true_false',
    'In all US states, volunteers are legally permitted to break a car window to rescue an animal in a hot car.',
    'Laws vary significantly by state. Some states allow vehicle entry under specific circumstances, while others do not. Always know your state law and call 911 first.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', false, 1),
  (v_question_id, 'False', true, 2);

END $$;

-- ============================================================================
-- ORIENTATION: Privacy & Data Handling Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'orientation-privacy';

  -- Question 1: PII Identification
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'Which of the following are considered Personally Identifiable Information (PII) that should NEVER be shared publicly? (Select all that apply)',
    'PII includes both direct identifiers and combinations of indirect identifiers that could identify someone.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Home address', true, 1),
  (v_question_id, 'Phone number', true, 2),
  (v_question_id, 'License plate number', true, 3),
  (v_question_id, 'County where incident occurred', false, 4),
  (v_question_id, 'Description of the animal', false, 5),
  (v_question_id, 'Workplace + job title combination', true, 6);

  -- Question 2: Doxxing Scenario (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'scenario',
    'What is the appropriate response?',
    'A user posts about a suspected puppy mill, including the address, owner''s name, and photos of their house. The post is getting hundreds of angry comments with people saying they''re "on their way."',
    'Doxxing alerts perpetrators, creates legal liability, and often results in harm to animals when abusers dispose of evidence.',
    'hard', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Leave it up - the public has a right to know about animal abuse', false, 'This creates legal liability, alerts the abuser, and can result in mob violence or harm to animals.', 1),
  (v_question_id, 'Immediately quarantine the post, remove PII, preserve evidence internally, and report to authorities', true, 'Correct. Protect the investigation, prevent vigilantism, and use proper legal channels.', 2),
  (v_question_id, 'Just remove the address but leave the name and photos', false, 'Names and photos of property can still identify individuals. Remove all PII.', 3),
  (v_question_id, 'Ban the original poster immediately for posting the information', false, 'First offense is typically a warning unless criminal threats are made. The priority is content removal.', 4);

  -- Question 3: Confidentiality
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'A pet owner shares with you that they''re surrendering their cat because they''re fleeing domestic violence. What should you do with this information?',
    'Case information is confidential. Sharing could endanger the person and create liability.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Share it with other volunteers so they understand the urgency', false, 'This violates confidentiality and could endanger the person if information spreads.', 1),
  (v_question_id, 'Post about it (anonymized) to highlight why surrender isn''t shameful', false, 'Even anonymized stories can sometimes be identified. This information should not be shared.', 2),
  (v_question_id, 'Keep it confidential, share only what''s necessary for coordination', true, 'Correct. Treat all case information as confidential. Share only on need-to-know basis.', 3),
  (v_question_id, 'Report it to law enforcement', false, 'Unless there is an active threat, this is not your information to report.', 4);

  -- Question 4: Anti-Doxxing Enforcement
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'sequencing',
    'Put the anti-doxxing enforcement actions in the correct order for escalating violations:',
    'Enforcement follows a progressive discipline model: warning, suspension, permanent ban.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Warning + content removal', true, 1),
  (v_question_id, '7-day suspension', true, 2),
  (v_question_id, 'Permanent ban', true, 3);

  -- Question 5: Data Retention
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'true_false',
    'It''s okay to keep pet owner contact information in your personal phone indefinitely for future reference.',
    'PII should be deleted from personal devices after handoff. The platform retains records per privacy policy.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', false, 1),
  (v_question_id, 'False', true, 2);

END $$;

-- ============================================================================
-- MODERATOR: Triage Fundamentals Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'mod-triage-fundamentals';

  -- Question 1: Code Classification Scenario (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'scenario',
    'What triage code should this receive?',
    'A user posts a blurry photo of a dog lying on the side of a busy highway with the caption "Help! Dead or dying dog on I-95!"',
    'Environment determines classification. A highway is lethal regardless of the dog''s visible condition. However, verify before mobilizing volunteers.',
    'hard', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Code Green - could be false alarm (pile of rags)', false, 'Highway location makes this inherently dangerous even if uncertain. However, you''re right to consider verification.', 1),
  (v_question_id, 'Code Red - highway is life-threatening environment, but request verification of life before deploying civilian volunteers', true, 'Correct. Treat as Code Red due to environment, but request verification (honk test) and consider dispatching police cruiser over civilian volunteers for highway safety.', 2),
  (v_question_id, 'Code Yellow - serious but stable', false, 'Nothing on a highway is stable. This is Code Red.', 3),
  (v_question_id, 'Code Red - immediately dispatch all available volunteers', false, 'Code Red is correct, but sending civilians to a highway without verification risks human life.', 4);

  -- Question 2: ABCs of Triage
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'In the ABCs of Digital Triage, what does a cat with open-mouth breathing indicate?',
    'Open-mouth breathing in cats is a sign of severe respiratory distress and is often near-death.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Code Green - cat is just hot or stressed', false, 'Cats are nose-breathers. Open-mouth breathing is a medical emergency.', 1),
  (v_question_id, 'Code Yellow - needs vet within 24 hours', false, 'This is too slow. Open-mouth breathing in cats requires immediate intervention.', 2),
  (v_question_id, 'Code Red ECHO - immediate life threat', true, 'Correct. Open-mouth breathing in cats indicates severe respiratory compromise and is often near-death.', 3),
  (v_question_id, 'Need more information before classifying', false, 'Open-mouth breathing in cats is always an emergency indicator.', 4);

  -- Question 3: Code Yellow Indicators
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'Which of the following are appropriate Code Yellow (Urgent) classifications? (Select all that apply)',
    'Code Yellow is serious but stable - intervention needed within 12-24 hours.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Stray cat with severe mange', true, 1),
  (v_question_id, 'Dog actively seizing', false, 2),
  (v_question_id, 'Owner threatening to surrender cat tomorrow', true, 3),
  (v_question_id, 'Kitten trapped in hot car', false, 4),
  (v_question_id, 'Limping dog that is still mobile', true, 5),
  (v_question_id, 'Lost pet sighting from 3 days ago', false, 6);

  -- Question 4: Context Elevation
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'scenario',
    'What is the correct triage code?',
    'A healthy-looking dog is spotted loose in a residential neighborhood. The poster says there''s a thunderstorm approaching and the dog seems nervous.',
    'Environmental context can elevate classification. A panicked dog in a storm may run into traffic.',
    'medium', false)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Code Green - healthy dog, non-emergency', false, 'Approaching storm + nervous dog = elevated risk of panicked flight.', 1),
  (v_question_id, 'Code Yellow - urgent due to weather risk', true, 'Correct. The storm elevates a routine sighting to urgent. Coordination needed before storm hits.', 2),
  (v_question_id, 'Code Red - immediate danger', false, 'Not yet Code Red, but could escalate. Monitor and coordinate.', 3),
  (v_question_id, 'Wait until the storm passes to assess', false, 'By then the dog may have fled in panic.', 4);

  -- Question 5: Triage Mindset
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'multiple_choice',
    'When a post arrives in the triage queue, the correct question to ask is:',
    'Triage requires clinical thinking, not emotional response.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, '"Is this sad?"', false, 'Emotional response leads to alarm fatigue and misallocation of resources.', 1),
  (v_question_id, '"Is this stable?"', true, 'Correct. Clinical assessment of stability determines appropriate response level.', 2),
  (v_question_id, '"Who is at fault?"', false, 'Blame assignment is not part of triage.', 3),
  (v_question_id, '"Can I handle this alone?"', false, 'Personal capacity is not the triage criterion.', 4);

  -- Question 6: Action Protocol
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'Which actions are part of the Code Red protocol? (Select all that apply)',
    'Code Red requires immediate mobilization with safety controls.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Push notification to verified responders in radius', true, 1),
  (v_question_id, 'Pin post globally for geofenced area', true, 2),
  (v_question_id, 'Open comments to all users for maximum visibility', false, 3),
  (v_question_id, 'Apply safety banner about not confronting/trespassing', true, 4),
  (v_question_id, 'Request minimal facts (location, time, condition)', true, 5),
  (v_question_id, 'Dispatch volunteers without verification', false, 6);

END $$;

-- ============================================================================
-- FIELD: Trapper Certification Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'field-trapper';

  -- Question 1: No-Touch Doctrine (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'true_false',
    'If a feral cat escapes from a trap and seems calm, it''s acceptable to gently pick it up and place it back in the trap.',
    'NEVER handle feral cats with bare hands. Let them go rather than risk a bite or scratch. Feral cats will bite when terrified.',
    'easy', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', false, 1),
  (v_question_id, 'False', true, 2);

  -- Question 2: Rabies Exposure (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'sequencing',
    'Put these actions in the correct order:',
    'While transferring a cat between traps, you are bitten on the hand. The cat is an unknown community cat.',
    'Rabies exposure protocol must be followed exactly. Failure is grounds for decertification.',
    'hard', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Stop trapping operations immediately', true, 1),
  (v_question_id, 'Wash wound with soap and water for at least 5 minutes', true, 2),
  (v_question_id, 'Secure the cat for quarantine/observation if possible', true, 3),
  (v_question_id, 'Seek medical attention within 24 hours', true, 4),
  (v_question_id, 'Report to platform and health department', true, 5);

  -- Question 3: Colony Assessment
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'When assessing a cat colony, which information should you gather? (Select all that apply)',
    'Thorough assessment ensures effective trapping and proper veterinary preparation.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Number of individual cats (not guesses)', true, 1),
  (v_question_id, 'Physical descriptions (color, markings, ear tips)', true, 2),
  (v_question_id, 'Names the feeder has given each cat', false, 3),
  (v_question_id, 'Feeding schedule and patterns', true, 4),
  (v_question_id, 'Social media following of the feeder', false, 5),
  (v_question_id, 'Health status (injuries, illness signs)', true, 6);

  -- Question 4: Feral vs Stray
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'How do you distinguish a feral (unsocialized) cat from a stray (lost pet)?',
    'This determines outcome: TNR for ferals, socialization/adoption for strays.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Feral cats are always aggressive; strays are always friendly', false, 'Both can display fear behaviors. Look for socialization indicators.', 1),
  (v_question_id, 'Ferals are silent, crouched, avoid eye contact; strays may vocalize, make eye contact, approach cautiously', true, 'Correct. Socialized cats interact differently with humans than ferals.', 2),
  (v_question_id, 'You can''t tell until they''ve been in foster care for weeks', false, 'Initial behavior provides important clues, though socialization takes time to fully assess.', 3),
  (v_question_id, 'Coat condition determines feral vs stray', false, 'Both can have good or poor coat condition depending on circumstances.', 4);

  -- Question 5: Post-Surgery Release (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'multi_select',
    'Which criteria must ALL be met before releasing a cat post-TNR surgery? (Select all that apply)',
    'Releasing a cat before full recovery is a Critical Fail and grounds for decertification.',
    'hard', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Cat is fully alert and responsive', true, 1),
  (v_question_id, 'Cat can stand/sit upright', true, 2),
  (v_question_id, 'Cat has eaten food', false, 3),
  (v_question_id, 'No active bleeding', true, 4),
  (v_question_id, 'Minimum 24 hours post-surgery (48 for females)', true, 5),
  (v_question_id, 'Return to original capture location', true, 6);

  -- Question 6: Wildlife Scenario
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty)
  VALUES (v_module_id, 'scenario',
    'What is the correct response?',
    'You set a trap for a target cat and return to find you''ve accidentally trapped a skunk. The skunk is agitated.',
    'Wildlife capture requires calm handling to avoid spraying, biting, and rabies exposure.',
    'hard')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Quickly open the trap door to release it', false, 'Sudden movement will cause the skunk to spray and possibly bite.', 1),
  (v_question_id, 'Cover the trap with a blanket, then carefully open the rear door from behind using a long tool', true, 'Correct. Darkness calms the animal. Standing behind and using a tool maintains safe distance.', 2),
  (v_question_id, 'Call animal control and wait with the trap', false, 'This could work but may take hours and stress the animal further.', 3),
  (v_question_id, 'Attempt to transfer the skunk to a different container', false, 'Never handle non-target wildlife. Release is the goal.', 4);

END $$;

-- ============================================================================
-- FIELD: Transport Certification Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'field-transport';

  -- Question 1: Two-Door Rule (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'multiple_choice',
    'The Two-Door Rule states that:',
    'This is the Golden Standard of transport safety. Violations result in decertification.',
    'easy', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Animals should be transported in crates with two doors for easy access', false, 'The rule is about barriers, not crate design.', 1),
  (v_question_id, 'There must always be TWO barriers between the animal and the open environment', true, 'Correct. Crate door AND vehicle door = two barriers. Never both open at once.', 2),
  (v_question_id, 'You should enter the vehicle through two different doors when loading animals', false, 'The rule refers to containment barriers, not entry points.', 3),
  (v_question_id, 'Animals should have access to two doors in case of emergency', false, 'The rule prevents escape, not provides options.', 4);

  -- Question 2: NPOG Scenario (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'scenario',
    'What is the correct action?',
    'You''re on a 4-hour transport. At a rest stop, the dog is whining and you feel bad that it''s been in the crate so long. You want to let it stretch its legs.',
    'No Paws on the Ground means exactly that. Rest stops are high escape risk areas.',
    'hard', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Let the dog out on a double leash in a grassy area away from traffic', false, 'This violates NPOG. Rest stops are unfamiliar, high-stimulus environments. Even double-leashed dogs can escape.', 1),
  (v_question_id, 'Keep the dog in the crate, offer water through the crate door, use puppy pads for elimination needs', true, 'Correct. NPOG applies at all rest stops. The dog''s discomfort is temporary; escape or injury is permanent.', 2),
  (v_question_id, 'Find an enclosed dog park area if available', false, 'Dog parks have escape risks (gates, fences). The dog is also unknown and could be dog-aggressive.', 3),
  (v_question_id, 'Let the dog out in the closed vehicle while you take a break', false, 'This violates containment principles and creates heat risk even with windows down.', 4);

  -- Question 3: Chain of Custody
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'multi_select',
    'Which fields are REQUIRED for chain of custody documentation? (Select all that apply)',
    'Missing chain of custody documentation is a Critical Fail.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Date and time of pickup', true, 1),
  (v_question_id, 'Name of the dog''s previous owner', false, 2),
  (v_question_id, 'Animal ID/description', true, 3),
  (v_question_id, 'Condition at pickup', true, 4),
  (v_question_id, 'Sending party name and contact', true, 5),
  (v_question_id, 'Receiving party name and contact', true, 6),
  (v_question_id, 'Handoff confirmation (signature/photo)', true, 7);

  -- Question 4: Disease Risk Scenario
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'scenario',
    'What is the correct course of action?',
    'You pick up a puppy described as "healthy" but notice bloody diarrhea in the crate at pickup. The sending party says "It''s just stress from the ride over." Your destination is an emergency foster who has two other dogs.',
    'Bloody diarrhea in a puppy is a parvo red flag. Delivering to a home with other dogs could cause an outbreak.',
    'hard', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Trust the sending party - they know the animal better than you', false, 'Bloody diarrhea is a major red flag regardless of what you''re told. You have a duty to the entire network.', 1),
  (v_question_id, 'Deliver as planned but warn the foster about the symptoms', false, 'This puts the foster''s other dogs at potentially fatal risk.', 2),
  (v_question_id, 'Stop, document symptoms, notify dispatch, reroute to isolation foster or vet intake', true, 'Correct. Treat as potential parvo. Do not deliver to a home with other dogs.', 3),
  (v_question_id, 'Cancel the transport entirely and return the puppy', false, 'The puppy still needs care. Rerouting to appropriate destination is better than abandoning.', 4);

  -- Question 5: Vehicle Safety
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'true_false',
    'It''s acceptable to leave animals unattended in a vehicle for 10 minutes while you use the restroom, as long as the windows are cracked.',
    'NEVER leave animals unattended. Vehicle temperatures can become dangerous in minutes. This is a Critical Fail.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', false, 1),
  (v_question_id, 'False', true, 2);

  -- Question 6: Collar Safety
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'Why are Martingale collars or slip leads required for transport instead of flat collars?',
    'Scared dogs often back out of flat collars. Martingales and slip leads tighten when pulled, preventing escape.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Flat collars are too expensive', false, 'This is a safety issue, not cost.', 1),
  (v_question_id, 'Scared dogs can easily back out of flat collars', true, 'Correct. The "collar slip" is a common escape method for frightened dogs.', 2),
  (v_question_id, 'Martingales look more professional', false, 'Function over form. This is about preventing escape.', 3),
  (v_question_id, 'Flat collars are more likely to break', false, 'Breaking is less common than slipping.', 4);

END $$;

-- ============================================================================
-- FIELD: Emergency Foster Certification Questions
-- ============================================================================

DO $$
DECLARE
  v_module_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM training_modules WHERE slug = 'field-foster';

  -- Question 1: Biosecurity Zones
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'In the Hot Zone/Cold Zone biosecurity model, which area is the "Hot Zone"?',
    'Proper zoning prevents disease transmission to your personal pets.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'The living room where you spend the most time', false, 'Hot Zone should be isolated, not high-traffic.', 1),
  (v_question_id, 'A dedicated quarantine room (bathroom/spare bedroom) for foster animals only', true, 'Correct. Hot Zone is isolated with dedicated supplies that never leave the room.', 2),
  (v_question_id, 'The outdoor area where animals can exercise', false, 'Outdoor areas are shared space. Hot Zone must be contained.', 3),
  (v_question_id, 'Any room where the foster animal happens to be', false, 'Hot Zone is a fixed location, not wherever the animal roams.', 4);

  -- Question 2: Entry Protocol (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'sequencing',
    'Put the Hot Zone entry/exit procedure in the correct order:',
    'Proper procedure prevents cross-contamination to your personal pets.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Enter Transition Zone', true, 1),
  (v_question_id, 'Put on Hot Zone shoes and gown', true, 2),
  (v_question_id, 'Enter Hot Zone', true, 3),
  (v_question_id, 'Care for animals', true, 4),
  (v_question_id, 'Disinfect hands/surfaces before exit', true, 5),
  (v_question_id, 'Remove gown/shoes in Transition Zone', true, 6),
  (v_question_id, 'Wash hands immediately', true, 7);

  -- Question 3: Fading Kitten Syndrome (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical, points)
  VALUES (v_module_id, 'sequencing',
    'A bottle baby kitten is cold, lethargic, and refusing the bottle. Put the interventions in the correct order:',
    'Feeding a cold kitten causes aspiration and death. Heat, then sugar, then food.',
    'hard', true, 2)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Warm the kitten slowly to 98°F using body heat or heating pad', true, 1),
  (v_question_id, 'Rub Karo syrup or honey on gums for blood sugar', true, 2),
  (v_question_id, 'Feed formula only when warm and showing suckle reflex', true, 3);

  -- Question 4: Red Flag Symptoms
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multi_select',
    'Which symptoms require IMMEDIATE veterinary attention? (Select all that apply)',
    'Recognizing emergencies quickly saves lives.',
    'medium')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'Not eating for more than 24 hours', true, 1),
  (v_question_id, 'Occasional sneezing', false, 2),
  (v_question_id, 'Bloody diarrhea or vomiting', true, 3),
  (v_question_id, 'Difficulty breathing', true, 4),
  (v_question_id, 'Mild eye discharge', false, 5),
  (v_question_id, 'Seizures or collapse', true, 6);

  -- Question 5: Anti-Hoarding (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, scenario_context, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'scenario',
    'What is the healthy response?',
    'You''ve fostered a litter of kittens for 8 weeks. They''re now ready for adoption, but you''ve bonded with them and feel like "no one else will care for them the way I do."',
    'The "no one else can care for them" mindset is a warning sign for hoarding behavior. Fosters are bridges, not destinations.',
    'medium', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Keep them all - you''ve earned it after all that work', false, 'This fills your capacity and prevents you from helping future emergencies.', 1),
  (v_question_id, 'Write detailed notes for adopters, facilitate adoptions, and celebrate the successful placements', true, 'Correct. "Placement is success." Your empty spot saves the next animal.', 2),
  (v_question_id, 'Delay the adoptions until you feel emotionally ready', false, 'Kittens have adoption windows. Delays reduce their chances.', 3),
  (v_question_id, 'Keep at least two or three since you have room', false, 'Each "just one more" reduces your capacity and starts a pattern.', 4);

  -- Question 6: Quarantine Breach (Critical)
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty, is_critical)
  VALUES (v_module_id, 'true_false',
    'If a new foster animal seems healthy after 3-4 days, it''s safe to let them interact with your resident pets.',
    'Minimum quarantine is 14 days. Some diseases have incubation periods longer than 3-4 days.',
    'easy', true)
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, sort_order) VALUES
  (v_question_id, 'True', false, 1),
  (v_question_id, 'False', true, 2);

  -- Question 7: Care Order
  INSERT INTO training_questions (module_id, question_type, question_text, explanation, difficulty)
  VALUES (v_module_id, 'multiple_choice',
    'When caring for multiple foster animals, in what order should you provide care?',
    'Prevent disease transmission by caring for healthy animals first.',
    'easy')
  RETURNING id INTO v_question_id;
  
  INSERT INTO training_question_options (question_id, option_text, is_correct, feedback, sort_order) VALUES
  (v_question_id, 'Sick animals first (they need the most attention)', false, 'This risks transmitting disease to healthy animals.', 1),
  (v_question_id, 'Healthy animals first, then sick animals', true, 'Correct. Always move from healthy to sick, never backwards.', 2),
  (v_question_id, 'Order doesn''t matter if you wash hands between', false, 'Even with handwashing, handling order matters for contamination control.', 3),
  (v_question_id, 'Newest arrivals first to assess their status', false, 'Newest arrivals are unknown status and should be treated as potentially sick.', 4);

END $$;
