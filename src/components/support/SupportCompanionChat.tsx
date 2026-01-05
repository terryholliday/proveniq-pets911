'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ArrowLeft,
  Heart,
  AlertTriangle,
  Search,
  HelpCircle
} from 'lucide-react';
import SupportCompanionAvatar from './SupportCompanionAvatar';
import { 
  SUPPORT_COMPANION_OPENINGS, 
  SUPPORT_COMPANION_CONFIG,
  CRISIS_QUICK_ACTIONS 
} from '@/lib/ai/SupportCompanionPersona';

interface Message {
  id: string;
  role: 'companion' | 'user';
  content: string;
  timestamp: Date;
}

interface SupportCompanionChatProps {
  onClose?: () => void;
  initialCrisisType?: 'lost_pet' | 'found_pet' | 'emergency' | 'general';
}

/**
 * CLINICAL RESPONSE GENERATION ENGINE
 * 
 * Based on:
 * - Kenneth Doka's Disenfranchised Grief theory
 * - Pauline Boss's Ambiguous Loss framework
 * - CBT protocols for guilt restructuring
 * - Trauma-Informed Care principles
 * 
 * PRIORITY ORDER (CRITICAL - DO NOT REORDER):
 * 0. SUICIDE RISK TRIAGE - ALWAYS CHECK FIRST
 * 1. DEATH/GRIEF - Pet has died
 * 2. ANTICIPATORY GRIEF - Pet is dying/terminal
 * 3. GUILT ("IF ONLY") - CBT intervention needed
 * 4. DISENFRANCHISED GRIEF - Society minimizing their loss
 * 5. EMERGENCY - Injury, immediate danger
 * 6. SCAM WARNING - Suspicious contact
 * 7. AMBIGUOUS LOSS - Missing pet (frozen grief)
 * 8. FOUND PET - Living pet needs reunification
 * 9. PEDIATRIC GRIEF - Parent helping child
 * 10. EMOTIONAL SUPPORT - General distress
 * 11. PRACTICAL GUIDANCE - Search tips, resources
 */
function generateCompanionResponse(userInput: string, history: Message[], crisisType?: string): string {
  const lowerInput = userInput.toLowerCase();
  const messageCount = history.filter(m => m.role === 'user').length;
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 0: SUICIDE RISK TRIAGE (MUST CHECK BEFORE EVERYTHING)
  // Pet loss IS a suicide risk factor - this is non-negotiable
  // ═══════════════════════════════════════════════════════════════════
  
  const passiveIdeationMarkers = [
    'wish i hadn\'t woken up', 'don\'t want to be here',
    'what\'s the point', 'no point anymore', 'can\'t do this anymore',
    'don\'t want to go on', 'nothing matters', 'empty without',
    'can\'t live without', 'life is meaningless'
  ];
  
  const activeIdeationMarkers = [
    'want to join', 'join them', 'be with them', 'want to die',
    'want to end', 'don\'t want to live', 'rather be dead',
    'kill myself', 'end it all', 'end my life'
  ];
  
  const activeIntentMarkers = [
    'have pills', 'have a plan', 'tonight', 'going to do it',
    'goodbye', 'this is it', 'final', 'last message'
  ];
  
  const hasActiveIntent = activeIntentMarkers.some(m => lowerInput.includes(m));
  const hasActiveIdeation = activeIdeationMarkers.some(m => lowerInput.includes(m));
  const hasPassiveIdeation = passiveIdeationMarkers.some(m => lowerInput.includes(m));
  
  // CRITICAL: Active Intent = Immediate Crisis Protocol
  if (hasActiveIntent) {
    return "I'm hearing something that concerns me deeply, and I need to pause our conversation about your pet.\n\n**Your life matters. You matter.**\n\nPlease reach out right now:\n\n📞 **988** - Suicide & Crisis Lifeline (call or text)\n📞 **865-755-8839** - Veterinary Social Work Helpline\n\nIf you're in immediate danger, please call 911.\n\nI know the pain of losing a pet can feel unbearable. But this crisis line has people trained specifically to help with grief that feels overwhelming. Will you call them?";
  }
  
  // Active Ideation = Concerned response with resources
  if (hasActiveIdeation) {
    return "I'm concerned about what you just shared. The pain of losing a pet can be overwhelming—your brain is processing real trauma, and that pain is valid.\n\nBut I want you to know: **your life has value beyond this moment of grief.**\n\nPlease consider reaching out:\n📞 **988** - Suicide & Crisis Lifeline\n📞 **865-755-8839** - Veterinary Social Work Helpline (they specialize in pet loss grief)\n\nThese lines have people who understand that pet loss is real loss. You don't have to carry this alone.\n\nI'm still here. Would you like to tell me about your pet?";
  }
  
  // Passive Ideation = Validate + gentle resource mention
  if (hasPassiveIdeation) {
    return "I hear the heaviness in your words. When we lose a pet, we lose a source of daily comfort, routine, and unconditional love. It makes sense that the world feels emptier.\n\nThese feelings are a testament to how much they meant to you. But if these feelings become too heavy to carry, please know there are people trained to help:\n\n📞 **ASPCA Pet Loss Hotline: 1-877-474-3310**\n📞 **988** - If you ever feel unsafe\n\nYou're not silly for grieving this deeply. You're human.\n\nWould you like to tell me about them?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // MDD vs COMPLICATED GRIEF DETECTION
  // MDD markers: worthlessness, self-hatred, globalized guilt
  // Grief markers: loss-focused sadness ("I miss them")
  // MDD requires professional referral
  // ═══════════════════════════════════════════════════════════════════
  
  const mddMarkers = [
    'i am worthless', 'i\'m worthless', 'i destroy everything',
    'i ruin everything', 'everyone would be better off',
    'i hate myself', 'i\'m a terrible person', 'i can\'t do anything right',
    'everything i touch', 'i always fail', 'i\'m broken',
    'no one could love', 'i don\'t deserve'
  ];
  
  if (mddMarkers.some(marker => lowerInput.includes(marker))) {
    return "I'm noticing something important in what you've shared. The feelings you're describing—the sense of worthlessness, of being fundamentally flawed—these go beyond grief for your pet.\n\nGrief says \"I miss them.\" What you're describing sounds more like depression saying \"I am defective.\"\n\n**This distinction matters.** If these feelings of worthlessness persist even in areas unconnected to your pet, please consider speaking with a mental health professional. This isn't weakness—it's wisdom.\n\n📞 **988** - Suicide & Crisis Lifeline (also for depression)\n📞 **SAMHSA: 1-800-662-4357** - Mental health referrals\n\nYour pet loved you. Depression lies about who you are. Would you like to talk more about what you're experiencing?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // GRIEF PARALYSIS - OPPOSITE ACTION (DBT Technique)
  // When grief leads to not eating, staying in bed, isolation
  // ═══════════════════════════════════════════════════════════════════
  
  const paralysisMarkers = [
    'can\'t get out of bed', 'haven\'t eaten', 'can\'t eat',
    'can\'t sleep', 'haven\'t slept', 'can\'t function',
    'can\'t do anything', 'just lay here', 'haven\'t left',
    'stopped', 'given up', 'paralyzed', 'frozen', 'stuck'
  ];
  
  if (paralysisMarkers.some(marker => lowerInput.includes(marker))) {
    return "Your body and mind are in grief shock. What you're describing—the paralysis, the inability to function—is a physiological response to loss, not a character flaw.\n\nBut here's what we know: **grief feeds on stillness.** The emotion wants you to stay frozen.\n\n**Opposite Action** is a technique that can help:\n• If you can't eat → Take one bite of anything. Just one.\n• If you can't get up → Put your feet on the floor for 30 seconds.\n• If you can't leave → Open a window. Let air touch your face.\n\nThese aren't about \"getting over it.\" They're about reminding your nervous system that you're still here, still alive.\n\nYour pet would want you to take care of yourself. What's one tiny thing you could try right now?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // NEURODIVERGENT-AWARE RESPONSE
  // For autistic individuals, the pet may be the ONLY safe attachment
  // ═══════════════════════════════════════════════════════════════════
  
  const neurodivergentMarkers = [
    'autistic', 'autism', 'adhd', 'neurodivergent', 'on the spectrum',
    'only friend', 'only one who understood', 'didn\'t judge me',
    'sensory', 'routine', 'couldn\'t connect with people'
  ];
  
  if (neurodivergentMarkers.some(marker => lowerInput.includes(marker))) {
    return "I hear you, and I want you to know: **this loss may be hitting you differently than it would others, and that's completely valid.**\n\nFor many neurodivergent people, a pet isn't just a companion—they're often the primary source of safe, regulated connection in a world that feels overwhelming. Your pet didn't require masking. They didn't judge your stims or your need for routine. They just loved you.\n\nLosing that is not \"just losing a pet.\" It's losing your anchor.\n\nYour grief may be more intense than others expect. That's not wrong—it's proportional to what you lost.\n\nWould you like to tell me about your pet? About the ways they helped you navigate the world?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 1: DEATH & GRIEF DETECTION (MUST CHECK FIRST)
  // Patterns: died, dead, passed away, hit by car, killed, put down, euthanized
  // ═══════════════════════════════════════════════════════════════════
  
  const deathKeywords = [
    'dead', 'died', 'death', 'passed away', 'passed on', 'gone', 
    'killed', 'hit by', 'ran over', 'struck by',
    'put down', 'put to sleep', 'euthanize', 'euthanized', 'euthanasia',
    'didn\'t make it', 'didn\'t survive', 'lost him', 'lost her', 'lost them',
    'no longer with us', 'crossed the rainbow bridge', 'rainbow bridge',
    'found dead', 'found deceased', 'body', 'remains',
    'murdered', 'poisoned', 'attacked and killed'
  ];
  
  const hasDeathKeyword = deathKeywords.some(keyword => lowerInput.includes(keyword));
  
  // Check for "my pet" + death (owner's pet died) vs "found dead" (stranger found deceased animal)
  const isOwnerGrief = hasDeathKeyword && (
    lowerInput.includes('my ') || 
    lowerInput.includes('our ') ||
    lowerInput.includes('i had to') ||
    lowerInput.includes('we had to') ||
    lowerInput.includes('lost my') ||
    lowerInput.includes('lost our')
  );
  
  const isFoundDeceased = hasDeathKeyword && (
    lowerInput.includes('found dead') ||
    lowerInput.includes('found a dead') ||
    lowerInput.includes('there\'s a dead') ||
    lowerInput.includes('saw a dead')
  );
  
  // OWNER'S PET DIED - Primary grief response
  if (isOwnerGrief || (hasDeathKeyword && !isFoundDeceased)) {
    // Check for traumatic death (accident, violence)
    const isTraumatic = lowerInput.includes('hit by') || 
                        lowerInput.includes('ran over') || 
                        lowerInput.includes('attacked') ||
                        lowerInput.includes('killed') ||
                        lowerInput.includes('murdered') ||
                        lowerInput.includes('poisoned');
    
    // Check for euthanasia
    const isEuthanasia = lowerInput.includes('put down') || 
                         lowerInput.includes('put to sleep') || 
                         lowerInput.includes('euthaniz');
    
    if (isTraumatic) {
      return "I am so deeply sorry. What happened to your pet is devastating, and the shock of losing them this way makes it even harder to bear. There are no words that can take away this pain.\n\nPlease know that your grief is valid. Your pet knew they were loved. That bond doesn't end - it just changes form.\n\nI'm here if you want to talk about them, share a memory, or just sit in this space together. There's no right way to grieve.";
    }
    
    if (isEuthanasia) {
      return "I'm so sorry. Making that decision is one of the hardest things a pet parent ever has to do, and it comes from a place of profound love.\n\nYou gave them the gift of a peaceful passing. You stayed with them. You put their comfort above your own pain. That is the final, greatest act of love.\n\nGrief after euthanasia is complicated - it's loss mixed with guilt, relief, and heartbreak all at once. All of those feelings are valid.\n\nWould you like to tell me about them? Sometimes sharing memories helps.";
    }
    
    // General pet death response
    return "I am so deeply sorry for your loss. Losing a pet is losing a family member, a companion, a piece of your daily life. The pain you're feeling is real and valid.\n\nThere's no timeline for grief. Some days will be harder than others. You might hear their collar jingle or reach down to pet them before remembering. That's normal. That's love.\n\nI'm here with you. Would you like to tell me about them? What was their name? What made them special?";
  }
  
  // STRANGER FOUND A DECEASED ANIMAL
  if (isFoundDeceased) {
    return "I'm sorry you had to encounter that. Finding a deceased animal is upsetting, especially if it appears to be someone's pet.\n\nIf you'd like to help:\n• **Check for a collar or tag** - There may be owner contact info\n• **Contact animal control** - They can scan for a microchip and handle remains respectfully\n• **Post on local groups** - A family may be searching\n\nThe owner, if there is one, will be grateful to have closure rather than wondering forever. Thank you for caring enough to want to help.";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 2: ANTICIPATORY GRIEF (Pet is dying/terminal)
  // ═══════════════════════════════════════════════════════════════════
  
  const anticipatoryKeywords = [
    'dying', 'terminal', 'cancer', 'tumor', 'not long',
    'vet says', 'doctor says', 'doesn\'t have long',
    'last days', 'saying goodbye', 'preparing to',
    'going to lose', 'going to put', 'have to put',
    'making the decision', 'hardest decision'
  ];
  
  if (anticipatoryKeywords.some(keyword => lowerInput.includes(keyword))) {
    // Check if they're asking about the euthanasia procedure itself
    const askingAboutProcedure = lowerInput.includes('what happens') || 
                                  lowerInput.includes('during the') ||
                                  lowerInput.includes('be there') ||
                                  lowerInput.includes('stay with') ||
                                  lowerInput.includes('hold them') ||
                                  lowerInput.includes('in the room');
    
    if (askingAboutProcedure) {
      // Pre-Euthanasia Preparation Script
      return "It helps to think about this beforehand, when you're not in the moment.\n\n**Decisions to consider:**\n• **Will you be in the room?** Most people find comfort in being present. Your pet will feel your calm.\n• **Will you hold them?** Many people do. Some prefer to let the vet handle them. Both are okay.\n• **Who else will be there?** Some want privacy. Others want support.\n• **Afterward:** Do you want a few moments alone? Paw print? Lock of fur?\n\n**What to expect:**\nFirst, a sedative helps them relax and drift into a deep sleep. Then, the final injection. It's peaceful—like falling asleep. Most vets say the pet doesn't feel pain, only your presence.\n\nIs there anything specific you want to know or prepare for?";
    }
    
    return "I hear you, and I'm so sorry you're facing this. Anticipatory grief—grieving before the loss—is one of the most painful experiences. You're losing them slowly while they're still here.\n\n**Things that help in these final days:**\n• **Capture paw prints** - Many vets offer this\n• **Take photos and videos** - Even ordinary moments\n• **Create a peaceful space** - Their favorite blanket, gentle music\n• **Just be present** - Your presence is their greatest comfort\n\n**About timing:** There's no perfect answer. But many vets say: \"Better a week too early than a day too late.\" You're trying to spare them suffering—that's love.\n\nWould you like to talk about what you're seeing day-to-day? Or would it help to discuss what to expect during the procedure?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 3: EMERGENCY (Injury, immediate danger)
  // ═══════════════════════════════════════════════════════════════════
  
  const emergencyKeywords = [
    'emergency', 'hurt', 'injured', 'bleeding', 'broken',
    'not breathing', 'unconscious', 'seizure', 'poisoned',
    'ate something', 'swallowed', 'choking', 'can\'t walk',
    'hit by car', 'accident', 'attacked', 'bitten'
  ];
  
  // Only trigger emergency if NOT death-related
  if (!hasDeathKeyword && (emergencyKeywords.some(keyword => lowerInput.includes(keyword)) || crisisType === 'emergency')) {
    return "This sounds urgent. Your pet's safety is the priority right now.\n\n**IMMEDIATE STEPS:**\n1. **Stay calm** - Your pet can sense your stress\n2. **Don't move them unnecessarily** if there might be spinal injury\n3. **Call emergency vet NOW** - They can guide you while you're on the way\n\n**If bleeding:** Apply gentle pressure with clean cloth\n**If not breathing:** Check airway is clear\n**If poisoning:** Bring the substance/packaging to the vet\n\nDo you need help finding an emergency vet in your area?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 4: SCAM DETECTION
  // ═══════════════════════════════════════════════════════════════════
  
  const scamKeywords = [
    'verification code', 'verify you', 'prove you',
    'send money first', 'shipping fee', 'transport fee',
    'different state', 'another city', 'flight nanny',
    'pay before', 'won\'t meet', 'sounds suspicious',
    'asking for money', 'wants payment', 'wire money',
    'western union', 'zelle', 'cashapp', 'gift card'
  ];
  
  if (scamKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "⚠️ **SCAM ALERT** - What you're describing has red flags of a common pet scam.\n\n**NEVER:**\n• Share verification codes (Google Voice scam)\n• Pay fees before meeting the pet in person\n• Wire money or use gift cards\n• Trust \"flight nanny\" or shipping services\n\n**LEGITIMATE finders:**\n• Will meet you in person at a safe public place\n• Can video chat with the pet\n• Won't ask for money before reunion\n• Will let you verify identity (collar, microchip, behavior)\n\nDid someone contact you about your pet? Tell me what they said and I can help you assess if it's legitimate.";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 5: LOST PET (Owner's pet is missing)
  // ═══════════════════════════════════════════════════════════════════
  
  const lostPetKeywords = [
    'lost', 'missing', 'can\'t find', 'ran away', 'escaped',
    'got out', 'slipped out', 'ran off', 'disappeared',
    'haven\'t seen', 'searching for'
  ];
  
  // Only trigger if talking about THEIR pet being lost (not a found pet, not dead)
  if (!hasDeathKeyword && (lostPetKeywords.some(keyword => lowerInput.includes(keyword)) || crisisType === 'lost_pet')) {
    if (messageCount === 0) {
      return "I'm so sorry you're going through this. The panic and fear you're feeling right now shows how much you love them.\n\nThe good news: **70% of lost dogs are found within 1 mile of home**, often within just a few blocks. Many pets are found within 24-48 hours when owners act quickly.\n\nLet's work together to bring them home. Can you tell me:\n• Their name and what they look like?\n• When and where you last saw them?\n• Do they have a collar, tags, or microchip?";
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 6: FOUND PET (Living pet, needs reunification)
  // CRITICAL: Only triggers if NOT dead/deceased
  // ═══════════════════════════════════════════════════════════════════
  
  const foundPetKeywords = ['found a', 'found this', 'there\'s a', 'stray', 'wandering'];
  
  if (!hasDeathKeyword && (foundPetKeywords.some(keyword => lowerInput.includes(keyword)) || crisisType === 'found_pet')) {
    return "Thank you for stopping to help! Your kindness could reunite this pet with a worried family.\n\n**First priority:** Is the pet safe right now? Are they contained somewhere secure?\n\n**To find the owner:**\n• Check for collar/tags with contact info\n• Take them to any vet or shelter to scan for microchip (free)\n• Post on local Facebook groups & Nextdoor (photo + location)\n• Do NOT post identifying details publicly - ask claimants to describe the pet\n\nCan you describe the pet and where you found them?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // EMOTIONAL SUPPORT RESPONSES
  // ═══════════════════════════════════════════════════════════════════
  
  // Fear and anxiety
  if (lowerInput.includes('scared') || lowerInput.includes('worried') || lowerInput.includes('afraid') || lowerInput.includes('panic') || lowerInput.includes('anxious')) {
    return "What you're feeling is completely natural. Anyone who loves their pet would feel the same way. That fear comes from love.\n\nTake a breath. You're not alone in this, and there are concrete steps we can take together.\n\nMany lost pets are found within the first 24-48 hours when owners act quickly. Let's focus on what you CAN do right now. What have you tried so far?";
  }
  
  // Despair and hopelessness
  if (lowerInput.includes('hopeless') || lowerInput.includes('give up') || lowerInput.includes('never find') || lowerInput.includes('lost hope') || lowerInput.includes('no hope')) {
    return "I hear the exhaustion and heartbreak in your words. This is emotionally draining in a way that people who haven't experienced it can't understand.\n\nBut please don't give up yet. Pets have been reunited with their families weeks, even months later. Every action you take - every poster, every call, every neighbor you tell - increases the chances.\n\nIt's okay to take breaks. Let others help search while you rest. What's one small thing we could try that you haven't done yet?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // "IF ONLY" ARCHETYPE - CBT GUILT RESTRUCTURING
  // Counterfactual thinking, personalization, hindsight bias
  // ═══════════════════════════════════════════════════════════════════
  
  const guiltKeywords = [
    'my fault', 'blame myself', 'should have', 'shouldn\'t have',
    'feel guilty', 'if only', 'i failed', 'failed them',
    'could have prevented', 'why didn\'t i', 'i let', 'let them down',
    'bad owner', 'bad parent', 'terrible person', 'never forgive myself'
  ];
  
  if (guiltKeywords.some(keyword => lowerInput.includes(keyword))) {
    // CBT "Check the Facts" Protocol
    return "I hear the weight of guilt in your words. Let me help you look at this differently.\n\n**Let's check the facts together:**\n\n1. **Outcome vs. Intent:** Guilt implies you INTENDED harm. Did you?\n2. **The Puzzle Metaphor:** What happened was a puzzle with many pieces—genetics, timing, biology, chance. Your actions were ONE piece, not the whole picture.\n3. **Hindsight isn't foresight:** You're judging yourself with information you couldn't have had.\n\nCats hide illness. Dogs bolt through doors. Bodies fail suddenly. These things happen to the most devoted pet parents.\n\n**The truth:** You loved them. You did your best with what you knew. That's not the profile of someone who deserves guilt.\n\nWould you like to talk about what specifically is weighing on you?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // DISENFRANCHISED GRIEF - RADICAL VALIDATION
  // When society has minimized their grief
  // ═══════════════════════════════════════════════════════════════════
  
  const disenfranchisedKeywords = [
    'just a', 'only a', 'silly', 'stupid', 'crazy',
    'people think', 'others don\'t understand', 'no one understands',
    'shouldn\'t be this upset', 'overreacting', 'too much',
    'it\'s just', 'just an animal', 'get another', 'move on'
  ];
  
  if (disenfranchisedKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "Let me stop you right there: **They were NOT 'just' anything.**\n\nYour pet was a family member. A source of daily comfort. A being who loved you unconditionally and regulated your stress hormones just by being near you.\n\nWhen researchers study pet loss, they find grief responses equivalent to—and sometimes MORE intense than—human bereavement. This isn't weakness. It's biology.\n\n**The people who say 'it's just a pet' have never loved like you do.** Their inability to understand says nothing about the validity of your grief.\n\nYour brain is processing a major loss. Give yourself permission to grieve fully. I'm here to witness that grief, because it matters.\n\nWould you like to tell me about them?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PEDIATRIC GRIEF - Parent seeking guidance for children
  // ═══════════════════════════════════════════════════════════════════
  
  const pediatricKeywords = [
    'my child', 'my kid', 'my daughter', 'my son', 
    'tell my', 'explain to', 'how do i tell',
    'kids are', 'children', 'little one'
  ];
  
  if (pediatricKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "Helping a child through pet loss is one of the most important conversations you'll have as a parent. Here's age-appropriate guidance:\n\n**Ages 3-5 (Toddlers):**\n• Use concrete, biological language: \"Their body stopped working\"\n• AVOID \"put to sleep\"—causes sleep anxiety\n• They may not grasp permanence; expect repeated questions\n\n**Ages 6-9:**\n• Understand death is final\n• May fear contagion: \"Will you die too?\"\n• Reassure their safety; offer rituals (drawing, burial)\n\n**Ages 10+ / Teens:**\n• May grieve privately or with peers\n• Don't minimize their bond—it was real\n• Validate that grief is normal, not weakness\n\n**For all ages:**\n• Let them see you cry—models healthy grief\n• Answer questions honestly\n• Don't rush replacement; let them grieve first\n\nHow old is your child, and how close were they to the pet?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // QUALITY OF LIFE / EUTHANASIA DECISION SUPPORT (SPIKES Protocol)
  // ═══════════════════════════════════════════════════════════════════
  
  const euthanasiaDecisionKeywords = [
    'how do i know when', 'when is it time', 'quality of life',
    'is it selfish', 'am i being selfish', 'right time',
    'too soon', 'too late', 'suffering', 'in pain',
    'good days', 'bad days', 'eating', 'not eating'
  ];
  
  if (euthanasiaDecisionKeywords.some(keyword => lowerInput.includes(keyword))) {
    return "This is one of the hardest questions a pet parent ever faces, and there's no perfect answer—only the most loving one.\n\n**The Quality of Life Scale (HHHHHMM):**\n• **Hurt** - Can their pain be managed?\n• **Hunger** - Are they eating?\n• **Hydration** - Are they drinking?\n• **Hygiene** - Can they keep themselves clean?\n• **Happiness** - Do they still have moments of joy?\n• **Mobility** - Can they move to where they want to be?\n• **More good days than bad?**\n\n**A helpful question:** \"Am I keeping them alive for THEM, or for me?\"\n\nIf you're asking this question, it often means your heart already knows. The fact that you're thinking about their quality of life—not just your own grief—is proof of how much you love them.\n\nWould it help to talk through what you're seeing day-to-day?";
  }
  
  // Positive updates
  if (lowerInput.includes('found them') || lowerInput.includes('came home') || lowerInput.includes('reunited') || lowerInput.includes('came back') || lowerInput.includes('got them back')) {
    return "Oh, that's wonderful news! 🎉 I'm so incredibly happy for you and your pet.\n\nThis reunion happened because you didn't give up. Your persistence, your love, your refusal to stop searching - that brought them home.\n\nGive them an extra cuddle from me. And take care of yourself too - you've been through an emotional marathon. The relief you're feeling right now is well-earned.\n\nWelcome home, little one. 💚";
  }
  
  // Gratitude
  if (lowerInput.includes('thank you') || lowerInput.includes('thanks') || lowerInput.includes('helpful') || lowerInput.includes('appreciate')) {
    return "You're so welcome. I wish I could do more.\n\nRemember: you're not alone in this. There are communities of people who understand what you're going through and want to help.\n\nIs there anything else I can help you think through right now?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRACTICAL GUIDANCE
  // ═══════════════════════════════════════════════════════════════════
  
  if (lowerInput.includes('what should i do') || lowerInput.includes('what now') || lowerInput.includes('next step') || lowerInput.includes('where do i start')) {
    return "Here are the most effective steps, based on what actually works:\n\n**IMMEDIATE (First 24 hours):**\n1. **Search nearby** - 70% of dogs are found within 1 mile\n2. **Put out scent items** - Their bed, your worn shirt, litter box for cats\n3. **Tell every neighbor** - Human networks find pets faster than apps\n\n**NEXT:**\n4. **Post on social media** - Facebook lost pet groups, Nextdoor\n5. **Contact ALL local shelters** - Call AND visit in person daily\n6. **Make high-visibility posters** - LARGE photo, phone number, location\n\nWhich of these would you like help with first?";
  }
  
  if (lowerInput.includes('poster') || lowerInput.includes('flyer')) {
    return "Great thinking! Effective lost pet posters should have:\n\n• **LARGE, CLEAR PHOTO** - Shows distinctive markings\n• **\"LOST [DOG/CAT]\"** in big, bold letters (visible from a car)\n• **Phone number** - Large and easy to read\n• **Last seen location** - Cross streets, neighborhood\n• **Reward** - Optional, but increases responses\n\n**Where to post:**\n• Eye level (5 feet high)\n• High-traffic areas: intersections, mailboxes, bus stops\n• Vet offices, pet stores, groomers\n• Community boards at grocery stores\n\nWould you like tips on what photo works best?";
  }
  
  if (lowerInput.includes('shelter') || lowerInput.includes('animal control')) {
    return "Contacting shelters is essential - but know that only ~20% of dogs and less than 5% of cats are reunited through shelters. Still, you must cover this base.\n\n**What to do:**\n1. **Call AND visit in person** - Photos get missed, go look yourself\n2. **Go DAILY** - New animals arrive constantly\n3. **Leave your info + photo** - They'll contact you if your pet arrives\n4. **Check neighboring counties** - Pets travel, and boundaries are arbitrary\n5. **Ask about \"stray hold\" period** - Know how long they keep animals\n\nDo you know which shelters serve your area?";
  }
  
  if (lowerInput.includes('microchip')) {
    return "Microchips are one of the best tools for reunion! Here's what to do:\n\n**If your pet has a chip:**\n1. **Update your contact info NOW** with the chip company\n2. **Report them missing** in the chip registry\n3. **Know the chip number** - shelters and vets scan routinely\n\n**The problem:** There's no single database - chips are registered with different companies (HomeAgain, AKC Reunite, etc.). Make sure YOUR chip registration is current.\n\n**If you found a pet:** Any vet or shelter will scan for free.\n\nDo you know your pet's microchip number and which company it's registered with?";
  }
  
  // Cat-specific
  if (lowerInput.includes('cat') && !hasDeathKeyword) {
    return "Cats behave differently than dogs when lost. Here's what works:\n\n**Key fact:** Most lost cats hide within 3-5 houses of home. They're scared and won't come when called.\n\n**Cat-specific tactics:**\n• **Search at night** - Use a flashlight; their eyes reflect\n• **Put their litter box outside** - They can smell it from far away\n• **Check EVERY hiding spot** - Under porches, in garages, up trees, inside car engines\n• **Leave food out at night** - Check at dawn\n• **Set a humane trap** - Your shelter may loan one\n\n**Don't:** Chase them or have lots of people searching loudly. Scared cats hide deeper.\n\nHow long has your cat been missing?";
  }
  
  // Dog-specific
  if (lowerInput.includes('dog') && !hasDeathKeyword) {
    return "Dogs can travel farther than cats but often try to find their way home. Here's what works:\n\n**Key stat:** 70% of lost dogs are found within 1 mile of where they went missing.\n\n**Dog-specific tactics:**\n• **Walk your usual routes** - They follow familiar paths\n• **Alert neighbors** - Dogs often approach people\n• **Post at dog parks** - Dog owners cover a lot of ground\n• **Contact mail carriers, delivery drivers, runners** - They're everywhere\n• **Leave a worn piece of your clothing** at the spot they went missing\n\n**If your dog is shy/scared:** Don't chase. Sit down, turn sideways, and let them approach you.\n\nDoes your dog have any favorite spots or regular walking routes?";
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // GENERIC FOLLOW-UPS (Only if nothing else matches)
  // ═══════════════════════════════════════════════════════════════════
  
  const followUps = [
    "How are you holding up? This is emotionally exhausting, and it's okay to take breaks while others help search.",
    "Is there anything specific I can help you think through right now?",
    "What's your gut telling you about where to focus the search?",
    "Have you been able to eat and rest? Taking care of yourself helps you search better. You can't pour from an empty cup.",
    "Would you like to talk through your search strategy? Sometimes a fresh perspective helps.",
    "What has been the hardest part of this for you? Sometimes it helps just to say it out loud.",
  ];
  
  return followUps[messageCount % followUps.length];
}

export default function SupportCompanionChat({ 
  onClose,
  initialCrisisType 
}: SupportCompanionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [companionState, setCompanionState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [crisisType, setCrisisType] = useState<string | undefined>(initialCrisisType);
  const [showQuickActions, setShowQuickActions] = useState(!initialCrisisType);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (showQuickActions) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedResponse]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && !initialCrisisType) {
      const greeting = SUPPORT_COMPANION_OPENINGS[Math.floor(Math.random() * SUPPORT_COMPANION_OPENINGS.length)];
      simulateTyping(greeting, () => {
        setMessages([{
          id: Date.now().toString(),
          role: 'companion',
          content: greeting,
          timestamp: new Date()
        }]);
      });
    }
  }, []);

  // Typing simulation
  const simulateTyping = useCallback((text: string, onComplete?: () => void) => {
    setIsTyping(true);
    setCompanionState('speaking');
    setDisplayedResponse('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedResponse(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setCompanionState('idle');
        setDisplayedResponse('');
        onComplete?.();
      }
    }, SUPPORT_COMPANION_CONFIG.typingSpeed);

    return () => clearInterval(interval);
  }, []);

  // Handle quick action selection
  const handleQuickAction = (actionType: string) => {
    setShowQuickActions(false);
    setCrisisType(actionType);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: CRISIS_QUICK_ACTIONS.find(a => a.type === actionType)?.label || actionType,
      timestamp: new Date()
    };
    setMessages([userMessage]);
    
    // Generate and display response
    setCompanionState('thinking');
    setTimeout(() => {
      const response = generateCompanionResponse(userMessage.content, [], actionType);
      simulateTyping(response, () => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'companion',
          content: response,
          timestamp: new Date()
        }]);
      });
    }, SUPPORT_COMPANION_CONFIG.thinkingDelay);
  };

  // Handle message submission
  const handleSubmit = (e?: React.FormEvent) => {
    const handleSendMessage = () => {
      if (!inputValue.trim()) return;
      setShowQuickActions(false);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setCompanionState('thinking');

      // Generate response after thinking delay
      setTimeout(() => {
        const response = generateCompanionResponse(userMessage.content, messages, crisisType);
        simulateTyping(response, () => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'companion',
            content: response,
            timestamp: new Date()
          }]);
        });
      }, SUPPORT_COMPANION_CONFIG.thinkingDelay);
    };

    e?.preventDefault();
    handleSendMessage();
  };

  const getQuickActionIcon = (type: string) => {
    switch (type) {
      case 'lost_pet': return <Search className="w-5 h-5" />;
      case 'found_pet': return <Heart className="w-5 h-5" />;
      case 'emergency': return <AlertTriangle className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-800/50">
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
        )}
        <SupportCompanionAvatar size="md" state={companionState} />
        <div className="flex-1">
          <h2 className="text-white font-semibold">Support Companion</h2>
          <p className="text-slate-400 text-sm">
            {companionState === 'thinking' ? 'Thinking...' : 
             companionState === 'speaking' ? 'Responding...' : 
             'Here to help'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Actions (shown only at start) */}
        {showQuickActions && !initialCrisisType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <SupportCompanionAvatar size="xl" state={companionState} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-white text-xl font-semibold">
                How can I help you today?
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                I'm here to support you through any pet-related situation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {CRISIS_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleQuickAction(action.type)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-teal-500 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:bg-teal-500/30">
                    {getQuickActionIcon(action.type)}
                  </div>
                  <span className="text-slate-200 text-sm font-medium">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message History */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                }`}
              >
                {message.role === 'companion' && (
                  <div className="flex items-center gap-2 mb-2">
                    <SupportCompanionAvatar size="sm" state="idle" />
                    <span className="text-teal-400 text-sm font-medium">Support Companion</span>
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-teal-200' : 'text-slate-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && displayedResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] p-4 rounded-2xl bg-slate-700 text-slate-100 rounded-bl-sm">
              <div className="flex items-center gap-2 mb-2">
                <SupportCompanionAvatar size="sm" state="speaking" />
                <span className="text-teal-400 text-sm font-medium">Support Companion</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{displayedResponse}</p>
            </div>
          </motion.div>
        )}

        {/* Thinking Indicator */}
        {companionState === 'thinking' && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="p-4 rounded-2xl bg-slate-700 rounded-bl-sm">
              <div className="flex items-center gap-3">
                <SupportCompanionAvatar size="sm" state="thinking" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping || companionState === 'thinking'}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping || companionState === 'thinking'}
            className="p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-slate-500 text-xs mt-2">
          Your conversations are private and not stored
        </p>
      </form>
    </div>
  );
}
