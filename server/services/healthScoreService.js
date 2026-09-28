/**
 * Deterministic Rule-Based Asset Health Score & Replacement Recommendation Engine
 * Note: Purely rule-based algorithmic scoring based on empirical infrastructure reliability metrics.
 */

export const calculateHealthAndReplacementScore = (asset, maintenanceTicketCount = 0) => {
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
  const now = new Date();
  const ageYears = Math.max(0, (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25));
  
  // Category lifespan assumption (default 5 years)
  const expectedLifespan = 5.0;
  const ageRatio = Math.min(2.0, ageYears / expectedLifespan);

  // 1. BASE HEALTH SCORE START: 100
  let healthScore = 100;
  const healthDeductions = [];

  // Age factor: up to -30 points for aging past lifespan
  const ageDeduction = Math.round(Math.min(30, ageRatio * 15));
  healthScore -= ageDeduction;
  if (ageDeduction > 10) {
    healthDeductions.push(`Age factor deduction: -${ageDeduction} pts (age: ${ageYears.toFixed(1)} yrs)`);
  }

  // Condition factor
  const conditionDeductions = {
    EXCELLENT: 0,
    GOOD: 5,
    FAIR: 18,
    POOR: 32,
    CRITICAL: 50,
  };
  const condDeduction = conditionDeductions[asset.condition] ?? 10;
  healthScore -= condDeduction;

  // Maintenance tickets factor
  const maintDeduction = Math.min(25, maintenanceTicketCount * 5);
  healthScore -= maintDeduction;

  // Maintenance cost vs purchase cost factor
  const purchaseCost = asset.purchaseCost || 1;
  const maintCost = asset.maintenanceCost || 0;
  const costRatio = maintCost / purchaseCost;
  if (costRatio > 0.6) {
    healthScore -= 18;
  } else if (costRatio > 0.3) {
    healthScore -= 10;
  } else if (costRatio > 0.15) {
    healthScore -= 5;
  }

  // Warranty status factor
  let isWarrantyExpired = false;
  if (asset.warrantyExpiry) {
    const expiry = new Date(asset.warrantyExpiry);
    if (expiry < now) {
      isWarrantyExpired = true;
      healthScore -= 8;
    }
  }

  // Active status factor (if currently in REPAIR or DAMAGED)
  if (asset.status === 'DAMAGED') {
    healthScore -= 25;
  } else if (asset.status === 'REPAIR') {
    healthScore -= 15;
  } else if (asset.status === 'MAINTENANCE') {
    healthScore -= 8;
  }

  // Clamp health score between 0 and 100
  healthScore = Math.max(5, Math.min(100, Math.round(healthScore)));

  // Health Classification
  let healthStatus = 'Healthy';
  if (healthScore < 40) {
    healthStatus = 'Critical';
  } else if (healthScore < 60) {
    healthStatus = 'At Risk';
  } else if (healthScore < 80) {
    healthStatus = 'Needs Attention';
  }

  // 2. REPLACEMENT SCORE CALCULATION (0 - 100)
  // Higher score = stronger recommendation to replace
  let replacementScore = 0;
  const replacementReasons = [];

  // Age contribution (up to 30)
  if (ageYears >= expectedLifespan) {
    const ageScore = Math.min(30, Math.round(20 + (ageYears - expectedLifespan) * 5));
    replacementScore += ageScore;
    replacementReasons.push(`Asset age (${ageYears.toFixed(1)} yrs) exceeds expected lifecycle of ${expectedLifespan} yrs`);
  } else if (ageYears >= expectedLifespan * 0.75) {
    replacementScore += 12;
    replacementReasons.push(`Asset approaching end of scheduled useful life (${ageYears.toFixed(1)} yrs old)`);
  }

  // Warranty contribution (up to 15)
  if (isWarrantyExpired) {
    replacementScore += 15;
    replacementReasons.push('OEM manufacturer warranty coverage has expired (unhedged failure risk)');
  }

  // Low health contribution (up to 25)
  if (healthScore < 40) {
    replacementScore += 25;
    replacementReasons.push(`Critical health score assessment (${healthScore}/100)`);
  } else if (healthScore < 60) {
    replacementScore += 18;
    replacementReasons.push(`Degraded operational health score (${healthScore}/100)`);
  } else if (healthScore < 75) {
    replacementScore += 10;
  }

  // Maintenance frequency contribution (up to 20)
  if (maintenanceTicketCount >= 4) {
    replacementScore += 20;
    replacementReasons.push(`Recurring failure pattern (${maintenanceTicketCount} logged maintenance incidents)`);
  } else if (maintenanceTicketCount >= 2) {
    replacementScore += 10;
    replacementReasons.push(`Multiple maintenance events recorded (${maintenanceTicketCount} tickets)`);
  }

  // Maintenance cost ratio contribution (up to 20)
  if (costRatio > 0.5) {
    replacementScore += 20;
    replacementReasons.push(`Cumulative maintenance cost is ${(costRatio * 100).toFixed(0)}% of original purchase price`);
  } else if (costRatio > 0.25) {
    replacementScore += 10;
    replacementReasons.push(`Substantial maintenance expenditures incurred (${(costRatio * 100).toFixed(0)}% of purchase)`);
  }

  // Physical condition contribution
  if (asset.condition === 'CRITICAL') {
    replacementScore += 20;
    replacementReasons.push('Physical asset condition assessed as CRITICAL');
  } else if (asset.condition === 'POOR') {
    replacementScore += 12;
    replacementReasons.push('Physical asset condition assessed as POOR');
  }

  // Clamp replacement score between 0 and 100
  replacementScore = Math.max(0, Math.min(100, Math.round(replacementScore)));

  // Replacement Priority classification
  let replacementPriority = 'LOW';
  if (replacementScore >= 80) {
    replacementPriority = 'CRITICAL';
  } else if (replacementScore >= 65) {
    replacementPriority = 'HIGH';
  } else if (replacementScore >= 40) {
    replacementPriority = 'MEDIUM';
  }

  if (replacementReasons.length === 0) {
    replacementReasons.push('Asset is operating within nominal engineering parameters with active coverage');
  }

  return {
    healthScore,
    healthStatus,
    replacementScore,
    replacementPriority,
    replacementReasons,
  };
};
