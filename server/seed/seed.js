import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Location from '../models/Location.js';
import Department from '../models/Department.js';
import Vendor from '../models/Vendor.js';
import Asset from '../models/Asset.js';
import AssetHistory from '../models/AssetHistory.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { calculateHealthAndReplacementScore } from '../services/healthScoreService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Preparing fresh dataset...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Location.deleteMany({}),
      Department.deleteMany({}),
      Vendor.deleteMany({}),
      Asset.deleteMany({}),
      AssetHistory.deleteMany({}),
      MaintenanceTicket.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared old collections.');

    // 1. SEED USERS
    // Password will be hashed by pre-save hook in User model
    const users = await User.create([
      {
        name: 'Siddharth Patel',
        email: 'admin@infraro.com',
        password: 'Admin@123',
        role: 'ADMIN',
        department: 'Infrastructure',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Ananya Roy',
        email: 'manager@infraro.com',
        password: 'Manager@123',
        role: 'MANAGER',
        department: 'Operations',
        phone: '+91 98765 43211',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      },
      {
        name: 'Vikram Shah',
        email: 'tech@infraro.com',
        password: 'Tech@123',
        role: 'TECHNICIAN',
        department: 'IT Support',
        phone: '+91 98765 43212',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Rohit Verma',
        email: 'rohit.tech@infraro.com',
        password: 'Tech@123',
        role: 'TECHNICIAN',
        department: 'Network Operations',
        phone: '+91 98765 43213',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ]);
    console.log(`[Seed] Seeded ${users.length} users (Admin, Manager, Technicians).`);

    const adminUser = users[0];
    const managerUser = users[1];
    const techUser = users[2];
    const rohitTech = users[3];

    // 2. SEED CATEGORIES
    const categoriesData = [
      { name: 'Server', code: 'SRV', description: 'Enterprise rack and blade computing systems', icon: 'Server', expectedLifespanYears: 5 },
      { name: 'Router', code: 'RTR', description: 'Core and edge IP routing platforms', icon: 'Network', expectedLifespanYears: 6 },
      { name: 'Switch', code: 'SWT', description: 'L2/L3 managed network switches', icon: 'Cpu', expectedLifespanYears: 6 },
      { name: 'Laptop', code: 'LAP', description: 'High-performance engineering and office laptops', icon: 'Laptop', expectedLifespanYears: 4 },
      { name: 'Desktop', code: 'DSK', description: 'Fixed workstations and CAD computers', icon: 'Monitor', expectedLifespanYears: 5 },
      { name: 'Printer', code: 'PRN', description: 'Multifunction laser printers and plotters', icon: 'Printer', expectedLifespanYears: 4 },
      { name: 'CCTV', code: 'CCTV', description: 'Surveillance cameras, NVRs, and security video', icon: 'Video', expectedLifespanYears: 5 },
      { name: 'UPS', code: 'UPS', description: 'Uninterruptible power supplies and battery banks', icon: 'BatteryCharging', expectedLifespanYears: 4 },
      { name: 'Firewall', code: 'FWL', description: 'Next-gen security gateways and UTMs', icon: 'Shield', expectedLifespanYears: 5 },
      { name: 'Access Point', code: 'AP', description: 'Enterprise Wi-Fi 6 access points', icon: 'Wifi', expectedLifespanYears: 4 },
      { name: 'Storage', code: 'STR', description: 'SAN, NAS arrays and tape backup storage', icon: 'HardDrive', expectedLifespanYears: 7 },
      { name: 'Other', code: 'OTH', description: 'Peripherals and auxiliary infrastructure items', icon: 'Box', expectedLifespanYears: 5 },
    ];
    const categories = await Category.create(categoriesData);
    console.log(`[Seed] Seeded ${categories.length} categories.`);
    const catMap = new Map(categories.map((c) => [c.code, c]));

    // 3. SEED DEPARTMENTS
    const departmentsData = [
      { name: 'IT Infrastructure', code: 'IT-INF', manager: adminUser._id, description: 'Core compute, virtualization and cloud infra' },
      { name: 'Network Operations', code: 'NET-OPS', manager: adminUser._id, description: 'Backbone routing, switches and wireless' },
      { name: 'Cybersecurity', code: 'SEC-OPS', manager: managerUser._id, description: 'Threat monitoring, firewalls and audits' },
      { name: 'Engineering & DevOps', code: 'ENG-DEV', manager: managerUser._id, description: 'Software engineering workstations and testbeds' },
      { name: 'Finance & Accounts', code: 'FIN-ACC', manager: managerUser._id, description: 'Financial auditing and payroll hardware' },
      { name: 'Human Resources', code: 'HR-OPS', manager: managerUser._id, description: 'People operations and onboarding terminals' },
      { name: 'Facilities & Safety', code: 'FAC-SAF', manager: adminUser._id, description: 'Power backup, HVAC monitoring, and CCTV surveillance' },
      { name: 'Executive Administration', code: 'EXEC-ADM', manager: adminUser._id, description: 'Leadership hardware and board meeting infra' },
    ];
    const departments = await Department.create(departmentsData);
    console.log(`[Seed] Seeded ${departments.length} departments.`);

    // 4. SEED LOCATIONS
    const locationsData = [
      { building: 'Ahmedabad HQ', floor: 'Basement 1', room: 'Main Server Room (DC-1)', rack: 'Rack R01', address: 'SG Highway, Ahmedabad, Gujarat', description: 'Primary production tier-3 data center rack' },
      { building: 'Ahmedabad HQ', floor: 'Basement 1', room: 'Main Server Room (DC-1)', rack: 'Rack R02', address: 'SG Highway, Ahmedabad, Gujarat', description: 'Core routing and storage enclosure' },
      { building: 'Ahmedabad HQ', floor: 'Basement 1', room: 'Power & Utility Bay', rack: 'UPS Bay 1', address: 'SG Highway, Ahmedabad, Gujarat', description: 'Central UPS and power distribution' },
      { building: 'Ahmedabad HQ', floor: 'Floor 1', room: 'NOC Command Center', rack: 'Wall Rack W01', address: 'SG Highway, Ahmedabad, Gujarat', description: '24/7 Network Operations and monitoring room' },
      { building: 'Ahmedabad HQ', floor: 'Floor 2', room: 'Engineering Hub', rack: 'Desk Bay A', address: 'SG Highway, Ahmedabad, Gujarat', description: 'Engineering workstation pool' },
      { building: 'Ahmedabad HQ', floor: 'Floor 3', room: 'Executive Suites', rack: 'Exec Bay 1', address: 'SG Highway, Ahmedabad, Gujarat', description: 'Senior leadership desks' },
      { building: 'Mumbai DC', floor: 'Floor 4', room: 'Data Hall B', rack: 'Cage C-04', address: 'Bandra Kurla Complex, Mumbai', description: 'Secondary disaster recovery and low-latency colocation' },
      { building: 'Bengaluru Tech Park', floor: 'Floor 2', room: 'Lab 204', rack: 'Rack B-12', address: 'Outer Ring Road, Bengaluru', description: 'Cloud AI testbed and edge computing' },
      { building: 'Pune Campus', floor: 'Floor 1', room: 'Network IDF Closet', rack: 'IDF-01', address: 'Hinjawadi Phase 1, Pune', description: 'Branch distribution switches' },
      { building: 'Delhi NCR Hub', floor: 'Floor 3', room: 'IDF Hub North', rack: 'IDF-N1', address: 'Cyber City, Gurugram', description: 'North regional network termination' },
    ];
    const locations = await Location.create(locationsData);
    console.log(`[Seed] Seeded ${locations.length} locations.`);

    // 5. SEED VENDORS
    const vendorsData = [
      { name: 'Dell Technologies', contactPerson: 'Rajesh Mehra', email: 'enterprise.support@dell.com', phone: '+1-800-456-3355', website: 'https://www.dell.com' },
      { name: 'Cisco Systems', contactPerson: 'Michael Chang', email: 'tac@cisco.com', phone: '+1-800-553-2447', website: 'https://www.cisco.com' },
      { name: 'Hewlett Packard Enterprise', contactPerson: 'Priya Nambiar', email: 'hpe.support@hpe.com', phone: '+1-800-474-6836', website: 'https://www.hpe.com' },
      { name: 'Lenovo Enterprise', contactPerson: 'Amitabh Sen', email: 'premier@lenovo.com', phone: '+1-800-426-7378', website: 'https://www.lenovo.com' },
      { name: 'APC by Schneider Electric', contactPerson: 'David Ross', email: 'support@apc.com', phone: '+1-800-800-4272', website: 'https://www.apc.com' },
      { name: 'Fortinet Networks', contactPerson: 'Sarah Jenkins', email: 'support@fortinet.com', phone: '+1-866-868-3678', website: 'https://www.fortinet.com' },
      { name: 'Hikvision Digital Security', contactPerson: 'Karan Malhotra', email: 'support.india@hikvision.com', phone: '+91-22-2846-9900', website: 'https://www.hikvision.com' },
      { name: 'Synology NAS Solutions', contactPerson: 'Alexandre Dubois', email: 'sales@synology.com', phone: '+1-425-818-1587', website: 'https://www.synology.com' },
      { name: 'Ubiquiti Networks', contactPerson: 'Neha Gupta', email: 'support@ui.com', phone: '+1-800-555-0199', website: 'https://www.ui.com' },
      { name: 'Palo Alto Networks', contactPerson: 'Kevin Vance', email: 'support@paloaltonetworks.com', phone: '+1-866-898-9087', website: 'https://www.paloaltonetworks.com' },
    ];
    const vendors = await Vendor.create(vendorsData);
    console.log(`[Seed] Seeded ${vendors.length} vendors.`);
    const vendorMap = new Map(vendors.map((v) => [v.name, v]));

    // 6. CREATE SPECIAL DEMO ASSET: DELL POWEREDGE R740 (SRV-000124)
    console.log('[Seed] Generating special demo asset: Dell PowerEdge R740 (SRV-000124)...');
    const srvCategory = catMap.get('SRV');
    const dellVendor = vendorMap.get('Dell Technologies');
    const dcLocation = locations[0]; // Ahmedabad HQ DC-1 Rack R01
    const itDept = departments[0]; // IT Infrastructure

    const purchaseDateDemo = new Date('2021-03-12T09:00:00Z');
    const warrantyStartDemo = new Date('2021-03-12T09:00:00Z');
    const warrantyExpiryDemo = new Date('2024-03-12T09:00:00Z'); // Expired!

    const demoAssetData = {
      assetId: 'SRV-000124',
      name: 'Dell PowerEdge R740 Rack Server',
      category: srvCategory._id,
      categoryName: srvCategory.name,
      type: '2U Dual-Socket Rack Server',
      brand: 'Dell',
      model: 'PowerEdge R740 (2x Intel Xeon Gold 6248R, 256GB RAM, 8x 1.92TB NVMe SSD)',
      serialNumber: 'DELL-PE-740-998241',
      assetTag: 'TAG-SRV-000124',
      vendor: dellVendor._id,
      purchaseDate: purchaseDateDemo,
      purchaseCost: 14850,
      warrantyStart: warrantyStartDemo,
      warrantyExpiry: warrantyExpiryDemo,
      warrantyProvider: 'Dell ProSupport Plus',
      warrantyType: 'OEM 24x7 Mission Critical',
      location: dcLocation._id,
      department: itDept._id,
      assignedTo: adminUser._id,
      status: 'ACTIVE',
      condition: 'FAIR',
      description: 'Primary virtualization node hosting internal Kubernetes and PostgreSQL database clusters.',
      replacementCost: 16500,
      maintenanceIntervalDays: 90,
      nextMaintenanceDate: new Date('2026-10-15T00:00:00Z'),
      maintenanceCost: 3200,
    };

    // Calculate deterministic scores for demo asset
    const demoScores = calculateHealthAndReplacementScore(demoAssetData, 3);
    demoAssetData.healthScore = demoScores.healthScore;
    demoAssetData.healthStatus = demoScores.healthStatus;
    demoAssetData.replacementScore = demoScores.replacementScore;
    demoAssetData.replacementPriority = demoScores.replacementPriority;
    demoAssetData.replacementReasons = demoScores.replacementReasons;

    const demoAsset = await Asset.create(demoAssetData);

    // Create rich Lifecycle Timeline for Demo Asset
    const demoAssetHistory = [
      {
        asset: demoAsset._id,
        action: 'PURCHASED',
        description: 'Asset procured from Dell Technologies under PO-2021-089 for $14,850.',
        oldValue: null,
        newValue: { purchaseCost: 14850, poNumber: 'PO-2021-089' },
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        timestamp: new Date('2021-03-12T10:30:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'RECEIVED',
        description: 'Received at Ahmedabad Central Warehouse. Inspection verified unboxing without damage.',
        oldValue: 'PROCUREMENT',
        newValue: 'RECEIVED',
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: new Date('2021-03-15T14:15:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'INSTALLED',
        description: 'Mounted into Ahmedabad HQ Server Room DC-1, Rack R01 (RU 14-16). Dual 1100W PSUs connected to UPS A/B feeds.',
        oldValue: 'RECEIVED',
        newValue: 'INSTALLED',
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: new Date('2021-03-18T11:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'ASSIGNED',
        description: 'Provisioned for IT Infrastructure team. Assigned to Siddharth Patel (Admin).',
        oldValue: 'INSTALLED',
        newValue: 'ASSIGNED',
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        timestamp: new Date('2021-03-20T16:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'STATUS_CHANGED',
        description: 'Status shifted to ACTIVE. Hypervisor OS and monitoring agents initialized.',
        oldValue: 'ASSIGNED',
        newValue: 'ACTIVE',
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        timestamp: new Date('2021-03-21T09:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'MAINTENANCE_STARTED',
        description: 'Scheduled preventive cooling fan module replacement & thermal paste repasting under ticket MNT-000088.',
        oldValue: 'ACTIVE',
        newValue: 'MAINTENANCE',
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: new Date('2022-08-10T10:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'MAINTENANCE_COMPLETED',
        description: 'Cooling modules replaced, firmware updated to BIOS 2.12.1. Operational benchmarks restored. Incurred cost $1,200.',
        oldValue: 'MAINTENANCE',
        newValue: 'ACTIVE',
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: new Date('2022-08-15T15:30:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'TRANSFERRED',
        description: 'Reassigned workload priority during datacenter optimization audit.',
        oldValue: { rack: 'Rack R01' },
        newValue: { rack: 'Rack R01 (Upgraded 10GbE uplink)' },
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        timestamp: new Date('2024-01-04T12:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'WARRANTY_UPDATED',
        description: 'OEM Dell ProSupport Plus 3-Year warranty reached expiration date. Unhedged SLA failure risk triggered.',
        oldValue: 'ACTIVE',
        newValue: 'EXPIRED',
        performedBy: adminUser._id,
        performedByName: 'Infraro System Daemon',
        timestamp: new Date('2024-03-12T00:00:00Z'),
      },
      {
        asset: demoAsset._id,
        action: 'CONDITION_CHANGED',
        description: 'Condition reclassified from GOOD to FAIR following SAS drive redundancy warning.',
        oldValue: 'GOOD',
        newValue: 'FAIR',
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: new Date('2026-06-18T10:45:00Z'),
      },
    ];
    await AssetHistory.create(demoAssetHistory);

    // Create Maintenance tickets for demo asset
    await MaintenanceTicket.create([
      {
        ticketId: 'MNT-000088',
        asset: demoAsset._id,
        issue: 'Cooling Fan Module Replacement & Thermal Maintenance',
        description: 'Chassis fan 4 threw low RPM warning under heavy batch compute load. Replaced dual rotor assembly and cleaned heatsinks.',
        priority: 'HIGH',
        reportedBy: adminUser._id,
        assignedTechnician: techUser._id,
        createdDate: new Date('2022-08-10T09:30:00Z'),
        dueDate: new Date('2022-08-16T18:00:00Z'),
        status: 'RESOLVED',
        estimatedCost: 1500,
        actualCost: 1200,
        resolution: 'Replaced Fan Module 4 with genuine Dell spare part. Temperatures stabilized at 41C under 90% load.',
        resolvedDate: new Date('2022-08-15T15:30:00Z'),
        comments: [
          { author: techUser._id, authorName: techUser.name, comment: 'Spare fan picked from local warehouse. Testing fan curve.' },
          { author: adminUser._id, authorName: adminUser.name, comment: 'Verified hypervisor telemetry. Looks clean.' },
        ],
      },
      {
        ticketId: 'MNT-000095',
        asset: demoAsset._id,
        issue: 'SAS Controller Firmware Flash & Drive 3 Diagnostics',
        description: 'PERC H730P controller reported unrecoverable read patrol error on Drive Slot 3.',
        priority: 'MEDIUM',
        reportedBy: managerUser._id,
        assignedTechnician: techUser._id,
        createdDate: new Date('2024-02-05T11:00:00Z'),
        dueDate: new Date('2024-02-12T18:00:00Z'),
        status: 'RESOLVED',
        estimatedCost: 2000,
        actualCost: 2000,
        resolution: 'Drive replaced under Dell warranty before expiration; RAID 10 array rebuilt cleanly in 6.2 hours.',
        resolvedDate: new Date('2024-02-08T17:00:00Z'),
      },
      {
        ticketId: 'MNT-000101',
        asset: demoAsset._id,
        issue: 'High Fan Vibration & Secondary Power Supply Alert',
        description: 'PSU 2 logged voltage drop in event log. Requires physical inspection and diagnostic volt test.',
        priority: 'HIGH',
        reportedBy: adminUser._id,
        assignedTechnician: techUser._id,
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
        estimatedCost: 850,
        actualCost: 0,
        comments: [
          { author: techUser._id, authorName: techUser.name, comment: 'Inspected power rail at Rack R01. Testing with backup C14 cable.' },
        ],
      },
    ]);

    // 7. SEED ~100 REALISTIC ASSETS
    console.log('[Seed] Generating ~100 enterprise infrastructure assets across categories...');

    const assetPrototypes = [
      // Servers
      { name: 'HP ProLiant DL380 Gen10', cat: 'SRV', brand: 'Hewlett Packard Enterprise', model: 'DL380 Gen10 2U Server', vendor: 'Hewlett Packard Enterprise', cost: 13200, lifespan: 5 },
      { name: 'Dell PowerEdge R650xs', cat: 'SRV', brand: 'Dell', model: 'PowerEdge R650xs 1U Dual-Socket', vendor: 'Dell Technologies', cost: 11400, lifespan: 5 },
      { name: 'Lenovo ThinkSystem SR650 V2', cat: 'SRV', brand: 'Lenovo Enterprise', model: 'ThinkSystem SR650 2U Rack', vendor: 'Lenovo Enterprise', cost: 12800, lifespan: 5 },
      { name: 'Cisco UCS B200 M5 Blade', cat: 'SRV', brand: 'Cisco Systems', model: 'UCS B200 M5 Blade Server', vendor: 'Cisco Systems', cost: 18500, lifespan: 6 },
      // Routers
      { name: 'Cisco ASR 1001-X Router', cat: 'RTR', brand: 'Cisco Systems', model: 'ASR 1001-X 20Gbps Aggregation Router', vendor: 'Cisco Systems', cost: 24000, lifespan: 7 },
      { name: 'Cisco Catalyst 8300 Edge Router', cat: 'RTR', brand: 'Cisco Systems', model: 'C8300-1N1S-4T2X Edge Router', vendor: 'Cisco Systems', cost: 9500, lifespan: 6 },
      { name: 'Cisco ISR 4451 Router', cat: 'RTR', brand: 'Cisco Systems', model: 'ISR4451-X/K9 Integrated Router', vendor: 'Cisco Systems', cost: 8200, lifespan: 6 },
      // Switches
      { name: 'Cisco Catalyst 9300 48-Port PoE+', cat: 'SWT', brand: 'Cisco Systems', model: 'C9300-48P-A 48-Port PoE+ Layer 3', vendor: 'Cisco Systems', cost: 6800, lifespan: 6 },
      { name: 'Cisco Nexus 93180YC-FX Switch', cat: 'SWT', brand: 'Cisco Systems', model: 'Nexus 93180YC-FX Data Center Switch', vendor: 'Cisco Systems', cost: 15600, lifespan: 6 },
      { name: 'HPE Aruba 2930F 48G PoE+', cat: 'SWT', brand: 'Hewlett Packard Enterprise', model: 'Aruba JL256A Managed Switch', vendor: 'Hewlett Packard Enterprise', cost: 4200, lifespan: 6 },
      { name: 'Ubiquiti UniFi Pro Aggregation', cat: 'SWT', brand: 'Ubiquiti Networks', model: 'USW-Pro-Aggregation 10G/25G SFP28', vendor: 'Ubiquiti Networks', cost: 2900, lifespan: 5 },
      // Firewalls
      { name: 'Fortinet FortiGate 100F Next-Gen Firewall', cat: 'FWL', brand: 'Fortinet Networks', model: 'FG-100F Security Appliance', vendor: 'Fortinet Networks', cost: 6500, lifespan: 5 },
      { name: 'Palo Alto PA-440 Next-Gen Firewall', cat: 'FWL', brand: 'Palo Alto Networks', model: 'PA-440 Enterprise Firewall', vendor: 'Palo Alto Networks', cost: 8900, lifespan: 5 },
      { name: 'Fortinet FortiGate 200F Enterprise', cat: 'FWL', brand: 'Fortinet Networks', model: 'FG-200F High-Availability Pair', vendor: 'Fortinet Networks', cost: 14200, lifespan: 5 },
      // UPS
      { name: 'APC Smart-UPS RT 5000VA On-Line', cat: 'UPS', brand: 'APC by Schneider Electric', model: 'SURTD5000XLI 230V Double Conversion', vendor: 'APC by Schneider Electric', cost: 4900, lifespan: 4 },
      { name: 'APC Smart-UPS SMX 3000VA Extended', cat: 'UPS', brand: 'APC by Schneider Electric', model: 'SMX3000LV Modular UPS', vendor: 'APC by Schneider Electric', cost: 3200, lifespan: 4 },
      { name: 'APC Galaxy 3500 3-Phase UPS', cat: 'UPS', brand: 'APC by Schneider Electric', model: 'G35T10KH 10kVA 3-Phase Heavy Duty', vendor: 'APC by Schneider Electric', cost: 18000, lifespan: 5 },
      // Storage
      { name: 'Synology RackStation RS3621xs+', cat: 'STR', brand: 'Synology NAS Solutions', model: 'RS3621xs+ 12-Bay Enterprise NAS', vendor: 'Synology NAS Solutions', cost: 7400, lifespan: 6 },
      { name: 'Dell EMC PowerStore 1000T SAN', cat: 'STR', brand: 'Dell', model: 'PowerStore 1000T All-Flash NVMe Array', vendor: 'Dell Technologies', cost: 48000, lifespan: 7 },
      // Laptops
      { name: 'Lenovo ThinkPad P16 Gen 2 Workstation', cat: 'LAP', brand: 'Lenovo Enterprise', model: 'ThinkPad P16 Gen 2 (i9, 64GB, RTX 4000)', vendor: 'Lenovo Enterprise', cost: 3400, lifespan: 4 },
      { name: 'Dell Latitude 7440 Ultrabook', cat: 'LAP', brand: 'Dell', model: 'Latitude 7440 (i7, 32GB, 1TB NVMe)', vendor: 'Dell Technologies', cost: 2100, lifespan: 4 },
      { name: 'HP EliteBook 840 G10', cat: 'LAP', brand: 'Hewlett Packard Enterprise', model: 'EliteBook 840 G10 (i7, 16GB, 512GB)', vendor: 'Hewlett Packard Enterprise', cost: 1850, lifespan: 4 },
      // Desktops
      { name: 'Dell Precision 3660 CAD Workstation', cat: 'DSK', brand: 'Dell', model: 'Precision 3660 Tower (i7, 32GB, RTX A2000)', vendor: 'Dell Technologies', cost: 2600, lifespan: 5 },
      { name: 'HP Z4 G5 Heavy Engineering Tower', cat: 'DSK', brand: 'Hewlett Packard Enterprise', model: 'Z4 G5 Workstation (Xeon W3, 64GB)', vendor: 'Hewlett Packard Enterprise', cost: 4100, lifespan: 5 },
      // Access Points
      { name: 'Cisco Catalyst 9120AX Access Point', cat: 'AP', brand: 'Cisco Systems', model: 'C9120AXI-B Wi-Fi 6 Enterprise AP', vendor: 'Cisco Systems', cost: 1200, lifespan: 4 },
      { name: 'Ubiquiti UniFi U6 Enterprise AP', cat: 'AP', brand: 'Ubiquiti Networks', model: 'U6-Enterprise Wi-Fi 6E Tri-Band', vendor: 'Ubiquiti Networks', cost: 580, lifespan: 4 },
      // CCTV
      { name: 'Hikvision 4K DarkFighter PTZ Camera', cat: 'CCTV', brand: 'Hikvision Digital Security', model: 'DS-2DF8836IX-AELW 4K 36x Optical Zoom', vendor: 'Hikvision Digital Security', cost: 1650, lifespan: 5 },
      { name: 'Hikvision AcuSense Dome 8MP', cat: 'CCTV', brand: 'Hikvision Digital Security', model: 'DS-2CD2186G2-IS 8MP IR Dome Camera', vendor: 'Hikvision Digital Security', cost: 420, lifespan: 5 },
      // Printers
      { name: 'HP LaserJet Enterprise MFP M635', cat: 'PRN', brand: 'Hewlett Packard Enterprise', model: 'MFP M635fht Heavy Duty Laser', vendor: 'Hewlett Packard Enterprise', cost: 3600, lifespan: 5 },
    ];

    const conditions = ['EXCELLENT', 'GOOD', 'GOOD', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];
    const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ASSIGNED', 'MAINTENANCE', 'REPAIR', 'RETIRED'];

    const assetsToInsert = [];
    let counter = 130;

    for (let i = 0; i < 95; i++) {
      const proto = assetPrototypes[i % assetPrototypes.length];
      const categoryDoc = catMap.get(proto.cat) || catMap.get('OTH');
      const vendorDoc = vendorMap.get(proto.vendor) || vendors[0];
      const locationDoc = locations[i % locations.length];
      const departmentDoc = departments[i % departments.length];
      const assignedUser = users[i % users.length];

      counter++;
      const assetId = `${proto.cat}-${String(counter).padStart(6, '0')}`;
      const serialNumber = `SN-${proto.cat}-${2020 + (i % 6)}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Vary purchase dates from 6 months ago to 6 years ago
      const daysAgo = Math.floor(180 + Math.random() * 2000);
      const purchaseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Warranty duration (3 years standard)
      const warrantyYears = 3;
      const warrantyStart = new Date(purchaseDate);
      const warrantyExpiry = new Date(warrantyStart);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + warrantyYears);

      // Add a cluster of expiring soon (within 30 days) for alerts demo
      if (i % 8 === 0) {
        warrantyExpiry.setTime(Date.now() + (5 + (i % 25)) * 24 * 60 * 60 * 1000);
      }

      const condition = conditions[i % conditions.length];
      let status = statuses[i % statuses.length];

      // Retired/Disposed constraints
      let retirement = null;
      let disposal = null;
      if (status === 'RETIRED') {
        retirement = {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          reason: 'Decommissioned after hardware lifecycle milestone replacement',
          approvedBy: managerUser._id,
          notes: 'Secure data wiping performed before decommissioning.',
        };
      } else if (i === 42) {
        status = 'DISPOSED';
        disposal = {
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          method: 'Certified E-Waste Recycling (ISO 14001 Partner)',
          cost: 120,
          notes: 'Destruction certificate archived with environmental compliance.',
        };
      }

      const baseCost = proto.cost;
      const maintCost = condition === 'POOR' || condition === 'CRITICAL' ? Math.round(baseCost * (0.3 + Math.random() * 0.4)) : Math.round(baseCost * (Math.random() * 0.15));

      const rawAsset = {
        assetId,
        name: `${proto.name} #${(i % 12) + 1}`,
        category: categoryDoc._id,
        categoryName: categoryDoc.name,
        type: proto.model,
        brand: proto.brand,
        model: proto.model,
        serialNumber,
        assetTag: `TAG-${assetId}`,
        vendor: vendorDoc._id,
        purchaseDate,
        purchaseCost: baseCost,
        warrantyStart,
        warrantyExpiry,
        warrantyProvider: `${proto.brand} Enterprise Care`,
        warrantyType: i % 2 === 0 ? 'Standard 24x7' : 'Extended On-Site SLA',
        location: locationDoc._id,
        department: departmentDoc._id,
        assignedTo: status === 'ACTIVE' || status === 'ASSIGNED' ? assignedUser._id : null,
        condition,
        status,
        description: `Operational infrastructure asset deployed in ${locationDoc.building}, ${locationDoc.room || locationDoc.floor}.`,
        replacementCost: Math.round(baseCost * 1.1),
        maintenanceCost: maintCost,
        maintenanceIntervalDays: 90,
        nextMaintenanceDate: new Date(Date.now() + ((i * 3) % 90) * 24 * 60 * 60 * 1000),
        retirement,
        disposal,
      };

      const ticketSimulationCount = condition === 'CRITICAL' ? 4 : condition === 'POOR' ? 3 : 1;
      const scores = calculateHealthAndReplacementScore(rawAsset, ticketSimulationCount);

      rawAsset.healthScore = scores.healthScore;
      rawAsset.healthStatus = scores.healthStatus;
      rawAsset.replacementScore = scores.replacementScore;
      rawAsset.replacementPriority = scores.replacementPriority;
      rawAsset.replacementReasons = scores.replacementReasons;

      assetsToInsert.push(rawAsset);
    }

    const createdAssets = await Asset.insertMany(assetsToInsert);
    console.log(`[Seed] Seeded ${createdAssets.length} bulk assets.`);

    // 8. SEED ASSET HISTORY EVENTS
    console.log('[Seed] Seeding ~120 lifecycle history events...');
    const historyEntries = [];

    createdAssets.slice(0, 40).forEach((asset, idx) => {
      // 1. Purchased
      historyEntries.push({
        asset: asset._id,
        action: 'PURCHASED',
        description: `Asset acquired from OEM vendor for $${asset.purchaseCost.toLocaleString()}`,
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        timestamp: asset.purchaseDate,
      });

      // 2. Installed
      const installDate = new Date(new Date(asset.purchaseDate).getTime() + 5 * 24 * 60 * 60 * 1000);
      historyEntries.push({
        asset: asset._id,
        action: 'INSTALLED',
        description: `Hardware racked and powered on in ${asset.location}`,
        performedBy: techUser._id,
        performedByName: techUser.name,
        timestamp: installDate,
      });

      // 3. Status Changed / Assigned
      if (asset.status === 'ASSIGNED' || asset.status === 'ACTIVE') {
        const assignDate = new Date(installDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        historyEntries.push({
          asset: asset._id,
          action: 'ASSIGNED',
          description: `Assigned for operational duty. Status: ${asset.status}`,
          performedBy: adminUser._id,
          performedByName: adminUser.name,
          timestamp: assignDate,
        });
      }

      // 4. Condition or maintenance
      if (asset.condition === 'POOR' || asset.condition === 'CRITICAL') {
        historyEntries.push({
          asset: asset._id,
          action: 'CONDITION_CHANGED',
          description: `Telemetry flagged hardware degradation. Condition updated to ${asset.condition}`,
          oldValue: 'GOOD',
          newValue: asset.condition,
          performedBy: rohitTech._id,
          performedByName: rohitTech.name,
          timestamp: new Date(Date.now() - (idx * 2) * 24 * 60 * 60 * 1000),
        });
      }
    });

    await AssetHistory.insertMany(historyEntries);
    console.log(`[Seed] Seeded ${historyEntries.length} asset history lifecycle entries.`);

    // 9. SEED 30 MAINTENANCE TICKETS
    console.log('[Seed] Seeding 30 maintenance tickets with technician assignments...');
    const ticketIssues = [
      { issue: 'Thermal Sensor Overheating Warning', priority: 'HIGH', desc: 'Internal chassis temp exceeded 78C during peak traffic hours.' },
      { issue: 'PoE Port Bank Fault', priority: 'MEDIUM', desc: 'Ports 24-32 dropped power delivery to IP security cameras.' },
      { issue: 'Redundant Power Supply Failure', priority: 'HIGH', desc: 'PSU B amber LED on; unit running on single power feed.' },
      { issue: 'Quarterly Firmware Security Patching', priority: 'LOW', desc: 'Routine CVE security patch upgrade on bootloader.' },
      { issue: 'Battery Capacity Degradation', priority: 'CRITICAL', desc: 'UPS runtime dropped below 7 minutes on load test; cell swelling noted.' },
      { issue: 'SFP+ Fiber Transceiver Link Flap', priority: 'MEDIUM', desc: '10GbE uplink intermittently dropping packets every 45 mins.' },
      { issue: 'NVMe Drive Predictive Failure Alert', priority: 'CRITICAL', desc: 'SMART telemetry logged 98% reallocated sector count on cache SSD.' },
      { issue: 'Access Point Periodic Reboot Cycle', priority: 'MEDIUM', desc: 'Radio controller triggering watchdog reboot due to memory leak.' },
      { issue: 'NVR Storage Pool Rebuild Required', priority: 'HIGH', desc: 'RAID 5 array degraded after sector timeout on secondary HDD.' },
      { issue: 'Cooling Blower Dust Cleanout & Lubrication', priority: 'LOW', desc: 'Preventive dust filter replacement and blower bearing servicing.' },
    ];

    const maintenanceTicketsToInsert = [];
    const ticketStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    for (let i = 0; i < 28; i++) {
      const template = ticketIssues[i % ticketIssues.length];
      const targetAsset = createdAssets[i % createdAssets.length];
      const ticketId = `MNT-000${String(110 + i).padStart(3, '0')}`;
      const status = ticketStatuses[i % ticketStatuses.length];
      const technician = i % 2 === 0 ? techUser : rohitTech;
      const createdDate = new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000);
      const estCost = Math.round(250 + Math.random() * 1400);
      const isResolved = status === 'RESOLVED' || status === 'CLOSED';
      const actualCost = isResolved ? Math.round(estCost * (0.85 + Math.random() * 0.3)) : 0;

      maintenanceTicketsToInsert.push({
        ticketId,
        asset: targetAsset._id,
        issue: template.issue,
        description: template.desc,
        priority: template.priority,
        reportedBy: managerUser._id,
        assignedTechnician: status !== 'OPEN' ? technician._id : null,
        createdDate,
        dueDate: new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status,
        estimatedCost: estCost,
        actualCost,
        resolution: isResolved ? `Engineering resolution completed by ${technician.name}. Diagnostic passes 100%.` : '',
        resolvedDate: isResolved ? new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        comments: [
          {
            author: technician._id,
            authorName: technician.name,
            comment: `Acknowledged ticket ${ticketId}. Diagnostic equipment attached.`,
            createdAt: new Date(createdDate.getTime() + 4 * 60 * 60 * 1000),
          },
        ],
      });
    }

    await MaintenanceTicket.insertMany(maintenanceTicketsToInsert);
    console.log(`[Seed] Seeded ${maintenanceTicketsToInsert.length} maintenance tickets.`);

    // 10. SEED NOTIFICATIONS
    console.log('[Seed] Seeding initial notifications...');
    await Notification.create([
      {
        title: 'Warranty Expiration Alert',
        message: 'Dell PowerEdge R740 (SRV-000124) manufacturer warranty has expired. Hardware replacement review advised.',
        type: 'WARRANTY',
        link: `/assets/${demoAsset.assetId}`,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        title: 'High Priority Ticket Assigned',
        message: 'Ticket MNT-000101 assigned to Vikram Shah: High Fan Vibration & Secondary Power Supply Alert.',
        type: 'MAINTENANCE',
        recipient: techUser._id,
        link: '/maintenance',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        title: 'Replacement Score High',
        message: 'Cisco Core Router (RTR-000135) scored 84/100 on rule-based replacement recommendation. Review suggested.',
        type: 'REPLACEMENT',
        link: '/dashboard',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        title: 'Critical Asset Condition Flagged',
        message: 'APC Smart-UPS (UPS-000142) degraded to CRITICAL. Battery swelling detected during scheduled inspection.',
        type: 'CRITICAL_ASSET',
        link: '/assets',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]);

    // 11. AUDIT LOG INITIAL RECORD
    await logAuditEvent({
      user: adminUser,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'INFRARO_CORE',
      details: 'Infraro Enterprise database initialized with complete lifecycle seed records.',
      ipAddress: '127.0.0.1',
    });

    console.log(`
========================================================================
✨ INFRARO SEED COMPLETED SUCCESSFULLY!
========================================================================
Demo Credentials:
  • ADMIN:      admin@infraro.com    / Admin@123
  • MANAGER:    manager@infraro.com  / Manager@123
  • TECHNICIAN: tech@infraro.com     / Tech@123

Special Demo Asset:
  • Dell PowerEdge R740 (Asset ID: SRV-000124)
  • Serial: DELL-PE-740-998241
  • Full lifecycle from Procurement -> Installation -> Maintenance -> Warranty Expiry!
========================================================================
`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Failed]', error);
    process.exit(1);
  }
};

seedDatabase();
