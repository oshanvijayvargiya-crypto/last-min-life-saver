export const calculatePriorityScore = (deadline, category, estimatedMinutes, userOverride) => {
  let deadlineUrgency = 20;
  if (deadline) {
    const diffMs = new Date(deadline) - new Date();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs <= 0) deadlineUrgency = 100;
    else if (diffHrs <= 6) deadlineUrgency = 100;
    else if (diffHrs <= 24) deadlineUrgency = 80;
    else if (diffHrs <= 72) deadlineUrgency = 60;
    else if (diffHrs <= 168) deadlineUrgency = 40;
  }

  // Work=90, Study=80, Finance=70, Health=60, Personal=50
  const categoryWeights = {
    Work: 90,
    Study: 80,
    Finance: 70,
    Health: 60,
    Personal: 50
  };
  const importanceWeight = categoryWeights[category] || 50;

  const est = parseInt(estimatedMinutes, 10) || 30;
  const effortInverse = Math.max(0, 100 - (est / 480) * 100);

  let overrideVal = 50;
  if (userOverride === 'P1') overrideVal = 100;
  else if (userOverride === 'P2') overrideVal = 75;
  else if (userOverride === 'P3') overrideVal = 50;
  else if (userOverride === 'P4') overrideVal = 25;

  const priorityScore = Math.round(
    (deadlineUrgency * 0.4) +
    (importanceWeight * 0.35) +
    (effortInverse * 0.15) +
    (overrideVal * 0.10)
  );

  let urgencyLevel = 'P4';
  if (priorityScore >= 80) urgencyLevel = 'P1';
  else if (priorityScore >= 60) urgencyLevel = 'P2';
  else if (priorityScore >= 40) urgencyLevel = 'P3';

  return { priorityScore, urgencyLevel };
};

export const getPriorityBadgeColor = (level) => {
  switch (level) {
    case 'P1': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', emoji: '🔴' };
    case 'P2': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', emoji: '🟠' };
    case 'P3': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', emoji: '🟡' };
    case 'P4':
    default: return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', emoji: '🟢' };
  }
};
