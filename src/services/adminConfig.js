import { db, firebaseAvailable } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AGENTS, PHASES, DELIVERABLES } from '../config/agents';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/system';
import { PHASE_INSTRUCTIONS } from '../prompts/phases';

const CONFIG_DOC_PATH = 'config/simulator';

function getDefaults() {
  return {
    agents: AGENTS,
    phases: PHASES,
    deliverables: DELIVERABLES,
    systemPrompts: AGENT_SYSTEM_PROMPTS,
    phaseInstructions: PHASE_INSTRUCTIONS,
    templates: null,
  };
}

export async function loadConfig() {
  const defaults = getDefaults();

  if (!firebaseAvailable || !db) {
    return defaults;
  }

  try {
    const snap = await getDoc(doc(db, 'config', 'simulator'));
    if (!snap.exists()) {
      return defaults;
    }

    const saved = snap.data();
    return {
      agents: saved.agents || defaults.agents,
      phases: saved.phases || defaults.phases,
      deliverables: saved.deliverables || defaults.deliverables,
      systemPrompts: saved.systemPrompts || defaults.systemPrompts,
      phaseInstructions: saved.phaseInstructions || defaults.phaseInstructions,
      templates: saved.templates || defaults.templates,
    };
  } catch (err) {
    console.warn('Failed to load config from Firestore, using defaults:', err);
    return defaults;
  }
}

export async function saveConfig(section, data) {
  if (!firebaseAvailable || !db) {
    console.warn('Firebase not available, config not saved');
    return;
  }

  const ref = doc(db, 'config', 'simulator');
  await setDoc(ref, {
    [section]: data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
