import { AppliancePreset, ScheduleSlot } from '../types/simulator';

export const APPLIANCE_PRESETS: AppliancePreset[] = [
  {
    id: 'water_heater',
    socketId: 1,
    name: 'Water Heater',
    shortName: 'Water Heater',
    wattage: 1500,
    category: 'Thermal Heating',
    description: 'High-wattage tank heater ideal for off-peak pre-heating.',
    defaultDailyHours: 1.5,
  },
  {
    id: 'ac',
    socketId: 2,
    name: 'Air Conditioner (AC)',
    shortName: 'AC',
    wattage: 900,
    category: 'Climate Control',
    description: 'Sustained bedroom cooling scheduled for night off-peak hours.',
    defaultDailyHours: 6.0,
  },
  {
    id: 'dispenser',
    socketId: 3,
    name: 'Water Dispenser',
    shortName: 'Dispenser',
    wattage: 350,
    category: 'Kitchen Appliance',
    description: 'Hot/cold water dispenser with automated heating cutoff overnight.',
    defaultDailyHours: 4.0,
  },
  {
    id: 'charger',
    socketId: 4,
    name: 'Laptop Charger',
    shortName: 'Laptop Charger',
    wattage: 65,
    category: 'Personal Electronics',
    description: 'USB-C PD laptop power adapter protected by countdown auto-cutoff.',
    defaultDailyHours: 3.0,
  },
];

export const DEFAULT_SCHEDULES: ScheduleSlot[] = [
  {
    id: 'sched-water-heater',
    socketId: 1,
    label: 'Water Heater Off-Peak Heating',
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: '23:15',
    endTime: '00:15',
    enabled: true,
  },
  {
    id: 'sched-ac-night',
    socketId: 2,
    label: 'AC Night Comfort',
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: '22:00',
    endTime: '05:00',
    enabled: false,
  },
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
