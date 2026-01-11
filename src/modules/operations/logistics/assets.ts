/**
 * OPERATIONS MODULE - LOGISTICS ASSETS
 * 
 * Equipment tracking and management for volunteers.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// ASSET TYPES
// ═══════════════════════════════════════════════════════════════════

export type AssetType = 
  | 'trap'               // Animal traps
  | 'carrier'             // Animal carriers
  | 'crate'               // Animal crates
  | 'leash'               // Leashes and leads
  | 'muzzle'              // Muzzles
  | 'first_aid_kit'       // First aid kits
  | 'medical_supplies'    // Medical supplies
  | 'food'                // Animal food
  | 'water'               // Water containers
  | 'blankets'            // Blankets and bedding
  | 'toys'                // Animal toys
  | 'cleaning_supplies'   // Cleaning supplies
  | 'protective_gear'     // Protective gear (gloves, etc.)
  | 'signage'             // Signs and markers
  | 'camera'              // Trail cameras
  | 'gps_tracker'         // GPS trackers
  | 'radio'               // Communication radios
  | 'tablet'              // Tablets/mobile devices
  | 'vehicle'             // Organization vehicles
  | 'trailer'             // Trailers
  | 'other';              // Other equipment

export type AssetStatus = 
  | 'available'
  | 'checked_out'
  | 'maintenance'
  | 'repair'
  | 'retired'
  | 'lost'
  | 'damaged';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  description: string;
  serialNumber?: string;
  qrCode?: string;
  rfidTag?: string;
  
  // Location
  currentLocation: AssetLocation;
  homeLocation: AssetLocation;
  
  // Status
  status: AssetStatus;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  lastInspectedAt?: string;
  nextInspectionDue?: string;
  
  // Assignment
  assignedTo?: UserId;
  assignedAt?: string;
  dueBackAt?: string;
  checkoutHistory: AssetCheckout[];
  
  // Maintenance
  maintenanceHistory: AssetMaintenance[];
  maintenanceSchedule: MaintenanceSchedule[];
  
  // Value
  purchaseDate?: string;
  purchaseCost?: number;
  currentValue?: number;
  depreciationSchedule?: string;
  
  // Usage
  totalUsageCount: number;
  totalUsageHours?: number;
  lastUsedAt?: string;
  lastUsedBy?: UserId;
  
  // Notes
  notes: AssetNote[];
  attachments: AssetAttachment[];
  
  audit: AuditMetadata;
}

export interface AssetLocation {
  type: 'warehouse' | 'vehicle' | 'volunteer' | 'facility' | 'other';
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  contact?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface AssetCheckout {
  id: string;
  assetId: string;
  checkedOutTo: UserId;
  checkedOutAt: string;
  checkedOutBy: UserId;
  dueBackAt?: string;
  actualReturnAt?: string;
  returnedBy?: UserId;
  conditionOut: 'excellent' | 'good' | 'fair' | 'poor';
  conditionIn?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  audit: AuditMetadata;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: 'inspection' | 'repair' | 'cleaning' | 'calibration' | 'replacement';
  performedAt: string;
  performedBy: UserId | 'vendor';
  vendorName?: string;
  cost?: number;
  description: string;
  partsReplaced?: string[];
  nextMaintenanceAt?: string;
  audit: AuditMetadata;
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  type: 'inspection' | 'cleaning' | 'calibration' | 'service';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'hours_based' | 'usage_based';
  frequencyValue?: number; // For hours/usage based
  lastPerformedAt?: string;
  nextDueAt?: string;
  assignedTo?: UserId;
  isActive: boolean;
  audit: AuditMetadata;
}

export interface AssetNote {
  id: string;
  authorId: UserId;
  content: string;
  createdAt: string;
  type: 'general' | 'damage' | 'maintenance' | 'usage' | 'private';
  attachments?: string[];
}

export interface AssetAttachment {
  id: string;
  filename: string;
  url: string;
  type: 'photo' | 'manual' | 'receipt' | 'document' | 'video';
  uploadedAt: string;
  uploadedBy: UserId;
  fileSize?: number;
}

// ═══════════════════════════════════════════════════════════════════
// ASSET TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export interface AssetTemplate {
  type: AssetType;
  name: string;
  description: string;
  defaultCondition: 'excellent' | 'good' | 'fair' | 'poor';
  expectedLifespanMonths: number;
  maintenanceFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'hours_based' | 'usage_based';
  maintenanceFrequencyValue?: number;
  inspectionRequired: boolean;
  requiresTraining: boolean;
  requiredCertifications?: string[];
  replacementCost: number;
  depreciationRate: number; // percentage per year
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    type: 'trap',
    name: 'Standard Humane Trap',
    description: '30-inch humane trap for cats and small animals',
    defaultCondition: 'good',
    expectedLifespanMonths: 60,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: true,
    requiredCertifications: ['tnr_certified'],
    replacementCost: 60,
    depreciationRate: 20,
  },
  {
    type: 'trap',
    name: 'Large Humane Trap',
    description: '42-inch humane trap for larger animals',
    defaultCondition: 'good',
    expectedLifespanMonths: 60,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: true,
    requiredCertifications: ['tnr_certified'],
    replacementCost: 120,
    depreciationRate: 20,
  },
  {
    type: 'carrier',
    name: 'Small Animal Carrier',
    description: 'Hard-sided carrier for cats and small dogs',
    defaultCondition: 'good',
    expectedLifespanMonths: 48,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: false,
    replacementCost: 40,
    depreciationRate: 25,
  },
  {
    type: 'carrier',
    name: 'Large Animal Carrier',
    description: 'Hard-sided carrier for medium to large dogs',
    defaultCondition: 'good',
    expectedLifespanMonths: 48,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: false,
    replacementCost: 80,
    depreciationRate: 25,
  },
  {
    type: 'first_aid_kit',
    name: 'Animal First Aid Kit',
    description: 'Complete first aid kit for animal emergencies',
    defaultCondition: 'excellent',
    expectedLifespanMonths: 24,
    maintenanceFrequency: 'quarterly',
    inspectionRequired: true,
    requiresTraining: true,
    requiredCertifications: ['first_aid_certified'],
    replacementCost: 150,
    depreciationRate: 50,
  },
  {
    type: 'camera',
    name: 'Trail Camera',
    description: 'Motion-activated trail camera for monitoring',
    defaultCondition: 'good',
    expectedLifespanMonths: 36,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: false,
    replacementCost: 200,
    depreciationRate: 33,
  },
  {
    type: 'gps_tracker',
    name: 'GPS Animal Tracker',
    description: 'GPS tracker for collars or equipment',
    defaultCondition: 'good',
    expectedLifespanMonths: 24,
    maintenanceFrequency: 'monthly',
    inspectionRequired: true,
    requiresTraining: false,
    replacementCost: 100,
    depreciationRate: 50,
  },
];

// ═══════════════════════════════════════════════════════════════════
// ASSET MANAGER
// ═══════════════════════════════════════════════════════════════════

export class AssetManager {
  /**
   * Create new asset
   */
  createAsset(params: {
    type: AssetType;
    name: string;
    description: string;
    homeLocation: AssetLocation;
    serialNumber?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    createdBy: UserId;
  }): Asset {
    const now = new Date().toISOString();
    const template = ASSET_TEMPLATES.find(t => t.type === params.type);
    
    return {
      id: crypto.randomUUID(),
      type: params.type,
      name: params.name,
      description: params.description,
      serialNumber: params.serialNumber,
      qrCode: this.generateQRCode(),
      currentLocation: params.homeLocation,
      homeLocation: params.homeLocation,
      status: 'available',
      condition: template?.defaultCondition ?? 'good',
      totalUsageCount: 0,
      checkoutHistory: [],
      maintenanceHistory: [],
      maintenanceSchedule: [],
      notes: [],
      attachments: [],
      purchaseDate: params.purchaseDate,
      purchaseCost: params.purchaseCost,
      currentValue: params.purchaseCost,
      audit: {
        createdAt: now,
        createdBy: params.createdBy,
        version: 1,
      },
    };
  }
  
  /**
   * Check out asset to volunteer
   */
  checkoutAsset(
    asset: Asset,
    volunteerId: UserId,
    checkedOutBy: UserId,
    dueBackAt?: string
  ): Asset {
    if (asset.status !== 'available') {
      throw new Error(`Asset ${asset.id} is not available for checkout`);
    }
    
    const now = new Date().toISOString();
    const checkout: AssetCheckout = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      checkedOutTo: volunteerId,
      checkedOutAt: now,
      checkedOutBy,
      dueBackAt,
      conditionOut: asset.condition,
      notes: undefined,
      audit: {
        createdAt: now,
        createdBy: checkedOutBy,
        version: 1,
      },
    };
    
    return {
      ...asset,
      status: 'checked_out',
      assignedTo: volunteerId,
      assignedAt: now,
      dueBackAt,
      currentLocation: {
        type: 'volunteer',
        name: `Volunteer ${volunteerId}`,
      },
      checkoutHistory: [...asset.checkoutHistory, checkout],
      totalUsageCount: asset.totalUsageCount + 1,
      lastUsedAt: now,
      lastUsedBy: volunteerId,
      audit: {
        ...asset.audit,
        updatedAt: now,
        version: asset.audit.version + 1,
      },
    };
  }
  
  /**
   * Return asset from volunteer
   */
  returnAsset(
    asset: Asset,
    returnedBy: UserId,
    conditionIn: 'excellent' | 'good' | 'fair' | 'poor',
    notes?: string
  ): Asset {
    if (asset.status !== 'checked_out' || !asset.assignedTo) {
      throw new Error(`Asset ${asset.id} is not checked out`);
    }
    
    const now = new Date().toISOString();
    
    // Update the last checkout record
    const updatedHistory = asset.checkoutHistory.map(checkout => {
      if (checkout.assetId === asset.id && !checkout.actualReturnAt) {
        return {
          ...checkout,
          actualReturnAt: now,
          returnedBy,
          conditionIn,
          notes,
          audit: {
            ...checkout.audit,
            updatedAt: now,
            version: checkout.audit.version + 1,
          },
        };
      }
      return checkout;
    });
    
    // Check if maintenance is needed based on condition
    const needsMaintenance = conditionIn === 'poor' || conditionIn === 'fair';
    
    return {
      ...asset,
      status: needsMaintenance ? 'maintenance' : 'available',
      assignedTo: undefined,
      assignedAt: undefined,
      dueBackAt: undefined,
      currentLocation: asset.homeLocation,
      condition: conditionIn,
      checkoutHistory: updatedHistory,
      audit: {
        ...asset.audit,
        updatedAt: now,
        version: asset.audit.version + 1,
      },
    };
  }
  
  /**
   * Schedule maintenance
   */
  scheduleMaintenance(
    asset: Asset,
    type: AssetMaintenance['type'],
    scheduledBy: UserId,
    scheduledFor?: string,
    assignedTo?: UserId
  ): Asset {
    const now = new Date().toISOString();
    
    const maintenance: AssetMaintenance = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      type,
      performedAt: scheduledFor ?? now,
      performedBy: assignedTo ?? scheduledBy,
      description: `Scheduled ${type}`,
      audit: {
        createdAt: now,
        createdBy: scheduledBy,
        version: 1,
      },
    };
    
    return {
      ...asset,
      status: 'maintenance',
      maintenanceHistory: [...asset.maintenanceHistory, maintenance],
      audit: {
        ...asset.audit,
        updatedAt: now,
        version: asset.audit.version + 1,
      },
    };
  }
  
  /**
   * Complete maintenance
   */
  completeMaintenance(
    asset: Asset,
    maintenanceId: string,
    performedBy: UserId,
    description: string,
    cost?: number,
    nextMaintenanceAt?: string
  ): Asset {
    const now = new Date().toISOString();
    
    const updatedHistory = asset.maintenanceHistory.map(maintenance => {
      if (maintenance.id === maintenanceId) {
        return {
          ...maintenance,
          performedAt: now,
          performedBy,
          description,
          cost,
          nextMaintenanceAt,
          audit: {
            ...maintenance.audit,
            updatedAt: now,
            version: maintenance.audit.version + 1,
          },
        };
      }
      return maintenance;
    });
    
    return {
      ...asset,
      status: 'available',
      maintenanceHistory: updatedHistory,
      lastInspectedAt: now,
      nextInspectionDue: nextMaintenanceAt,
      audit: {
        ...asset.audit,
        updatedAt: now,
        version: asset.audit.version + 1,
      },
    };
  }
  
  /**
   * Get assets due for maintenance
   */
  getAssetsDueForMaintenance(assets: Asset[]): Asset[] {
    const now = new Date();
    
    return assets.filter(asset => {
      // Check scheduled maintenance
      for (const schedule of asset.maintenanceSchedule) {
        if (!schedule.isActive) continue;
        
        if (schedule.nextDueAt && new Date(schedule.nextDueAt) <= now) {
          return true;
        }
      }
      
      // Check condition-based maintenance
      if (asset.condition === 'poor' || asset.status === 'damaged') {
        return true;
      }
      
      // Check inspection due
      if (asset.nextInspectionDue && new Date(asset.nextInspectionDue) <= now) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Get overdue checkouts
   */
  getOverdueCheckouts(assets: Asset[]): Asset[] {
    const now = new Date();
    
    return assets.filter(asset => 
      asset.status === 'checked_out' && 
      asset.dueBackAt && 
      new Date(asset.dueBackAt) <= now
    );
  }
  
  /**
   * Calculate asset utilization
   */
  calculateUtilization(asset: Asset, periodDays: number = 30): {
    utilizationRate: number; // percentage
    totalDays: number;
    daysInUse: number;
    averageUsagePerMonth: number;
  } {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    // Calculate days in use during period
    let daysInUse = 0;
    
    for (const checkout of asset.checkoutHistory) {
      const checkoutStart = new Date(checkout.checkedOutAt);
      const checkoutEnd = checkout.actualReturnAt 
        ? new Date(checkout.actualReturnAt)
        : now;
      
      // Check if checkout overlaps with period
      if (checkoutEnd >= periodStart && checkoutStart <= now) {
        const overlapStart = checkoutStart > periodStart ? checkoutStart : periodStart;
        const overlapEnd = checkoutEnd < now ? checkoutEnd : now;
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        
        daysInUse += overlapDays;
      }
    }
    
    const utilizationRate = (daysInUse / periodDays) * 100;
    const averageUsagePerMonth = (asset.totalUsageCount / Math.max(1, this.getAssetAgeInMonths(asset))) * 30;
    
    return {
      utilizationRate,
      totalDays: periodDays,
      daysInUse,
      averageUsagePerMonth,
    };
  }
  
  /**
   * Get asset value depreciation
   */
  calculateDepreciatedValue(asset: Asset): number {
    if (!asset.purchaseDate || !asset.purchaseCost) return 0;
    
    const template = ASSET_TEMPLATES.find(t => t.type === asset.type);
    const depreciationRate = template?.depreciationRate ?? 20;
    
    const monthsOwned = this.getAssetAgeInMonths(asset);
    const yearlyDepreciation = (asset.purchaseCost * depreciationRate) / 100;
    const totalDepreciation = (yearlyDepreciation * monthsOwned) / 12;
    
    return Math.max(0, asset.purchaseCost - totalDepreciation);
  }
  
  private generateQRCode(): string {
    // Generate unique QR code
    return 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  private getAssetAgeInMonths(asset: Asset): number {
    if (!asset.purchaseDate) return 0;
    
    const now = new Date();
    const purchase = new Date(asset.purchaseDate);
    return Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30));
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const assetManager = new AssetManager();

export function createAssetLocation(type: AssetLocation['type'], name: string): AssetLocation {
  return {
    type,
    name,
  };
}

export function canCheckoutAsset(
  volunteerId: UserId,
  asset: Asset,
  volunteerCertifications: string[] = []
): { allowed: boolean; reason?: string } {
  // Check if asset is available
  if (asset.status !== 'available') {
    return { allowed: false, reason: 'Asset not available' };
  }
  
  // Check if volunteer has required certifications
  const template = ASSET_TEMPLATES.find(t => t.type === asset.type);
  if (template?.requiresTraining && template.requiredCertifications) {
    const hasRequiredCerts = template.requiredCertifications.every(cert => 
      volunteerCertifications.includes(cert)
    );
    
    if (!hasRequiredCerts) {
      return { 
        allowed: false, 
        reason: `Requires certifications: ${template.requiredCertifications.join(', ')}` 
      };
    }
  }
  
  return { allowed: true };
}

export function getAssetSummary(assets: Asset[]): {
  total: number;
  available: number;
  checkedOut: number;
  maintenance: number;
  retired: number;
  totalValue: number;
  utilizationRate: number;
} {
  const total = assets.length;
  const available = assets.filter(a => a.status === 'available').length;
  const checkedOut = assets.filter(a => a.status === 'checked_out').length;
  const maintenance = assets.filter(a => a.status === 'maintenance').length;
  const retired = assets.filter(a => a.status === 'retired').length;
  
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue ?? 0), 0);
  
  // Calculate average utilization
  const utilizationRates = assets.map(asset => 
    assetManager.calculateUtilization(asset).utilizationRate
  );
  const utilizationRate = utilizationRates.length > 0
    ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length
    : 0;
  
  return {
    total,
    available,
    checkedOut,
    maintenance,
    retired,
    totalValue,
    utilizationRate,
  };
}

export function getAssetTypeDistribution(assets: Asset[]): Record<AssetType, number> {
  const distribution: Record<string, number> = {};
  
  for (const asset of assets) {
    distribution[asset.type] = (distribution[asset.type] ?? 0) + 1;
  }
  
  return distribution as Record<AssetType, number>;
}

export function isAssetOverdue(asset: Asset): boolean {
  return asset.status === 'checked_out' &&
         !!asset.dueBackAt &&
         new Date(asset.dueBackAt).getTime() <= Date.now();
}

export function getMaintenanceSchedule(asset: Asset): MaintenanceSchedule[] {
  return asset.maintenanceSchedule.filter(schedule => schedule.isActive);
}

export function addMaintenanceSchedule(
  asset: Asset,
  type: MaintenanceSchedule['type'],
  frequency: MaintenanceSchedule['frequency'],
  frequencyValue?: number,
  assignedTo?: UserId
): Asset {
  const now = new Date().toISOString();
  
  const schedule: MaintenanceSchedule = {
    id: crypto.randomUUID(),
    assetId: asset.id,
    type,
    frequency,
    frequencyValue,
    lastPerformedAt: asset.lastInspectedAt,
    nextDueAt: calculateNextDueDate(frequency, frequencyValue, now),
    assignedTo,
    isActive: true,
    audit: {
      createdAt: now,
      createdBy: asset.audit.createdBy,
      version: 1,
    },
  };
  
  return {
    ...asset,
    maintenanceSchedule: [...asset.maintenanceSchedule, schedule],
    audit: {
      ...asset.audit,
      updatedAt: now,
      version: asset.audit.version + 1,
    },
  };
}

function calculateNextDueDate(
  frequency: MaintenanceSchedule['frequency'],
  frequencyValue: number | undefined,
  fromDate: string
): string {
  const date = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'hours_based':
      if (frequencyValue) {
        // Assume 8 hours per day usage
        const days = frequencyValue / 8;
        date.setDate(date.getDate() + days);
      }
      break;
    case 'usage_based':
      if (frequencyValue) {
        // Assume 1 usage per day average
        date.setDate(date.getDate() + frequencyValue);
      }
      break;
  }
  
  return date.toISOString();
}
