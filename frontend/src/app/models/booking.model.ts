export interface BookingForm {
  vehicleType: string;
  services: string;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  additionalPhone: string;
  washDate: string;
  washTime: string;
  paymentType: string;
  onlinePaymentOption?: string;
  notes: string;
}

export interface Booking extends BookingForm {
  id: string;
  status: BookingStatus;
  dateCreated: string;
  price?: number;
  serviceName?: string;
  serviceDescription?: string;
  serviceDuration?: number;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
  // Add the actual properties returned by the backend API
  assigned_employee_id?: number;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_position?: string;
  // Rejection reason for rejected bookings
  rejectionReason?: string;
  rejection_reason?: string;
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export interface CarWashService {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface WashingPoint {
  id: string;
  name: string;
  address: string;
  available: boolean;
}

export const VEHICLE_TYPES = [
  'S - Small Hatchbacks (e.g., wigo, picanto, eon)',
  'M - Small Hatchbacks | Sedan | Coupes (e.g., rio, accent, city, vios, civic)',
  'L - MPVs | AUVs | Compact SUVs (e.g., rav4, avanza, ecosport, cx3)',
  'XL - SUVs | Full SUVs | Pick-ups (e.g., trailblazer, hilux, ranger, fortuner)',
  'XXL - Modified Vehicles | Big SUVs (e.g., land cruiser, patrol, prado)',
];

export const VEHICLE_TYPE_CODES = ['S', 'M', 'L', 'XL', 'XXL'];

export const SERVICE_PACKAGES = [
  '1 - Body Wash',
  '1.5 - Body Wash, Tire Black',
  '2 - Body Wash, Tire Black, Vacuum',
  '3 - Body Wash, Body Wax, Tire Black',
  '4 - Body Wash, Body Wax, Tire Black, Vacuum',
];

export const SERVICE_CODES = ['1', '1.5', '2', '3', '4'];

// Pricing table based on the image
export const PRICING_TABLE: { [key: string]: { [key: string]: number } } = {
  S: {
    '1': 140,
    '1.5': 170,
    '2': 260,
    '3': 270,
    '4': 360,
  },
  M: {
    '1': 160,
    '1.5': 190,
    '2': 300,
    '3': 310,
    '4': 420,
  },
  L: {
    '1': 180,
    '1.5': 230,
    '2': 370,
    '3': 390,
    '4': 520,
  },
  XL: {
    '1': 230,
    '1.5': 290,
    '2': 440,
    '3': 460,
    '4': 610,
  },
  XXL: {
    '1': 250,
    '1.5': 320,
    '2': 480,
    '3': 510,
    '4': 670,
  },
};

export interface PricingInfo {
  vehicleType: string;
  servicePackage: string;
  price: number;
}

export const PAYMENT_TYPES = ['Cash', 'Online Payment'];

export const ONLINE_PAYMENT_OPTIONS = ['GCash', 'PayMaya'];

export const WASHING_POINTS = [
  {
    id: '1',
    name: 'Downtown Location',
    address: '123 Main St',
    available: true,
  },
  {
    id: '2',
    name: 'Westside Branch',
    address: '456 West Ave',
    available: true,
  },
  { id: '3', name: 'East End Shop', address: '789 East Blvd', available: true },
  { id: '4', name: 'North Station', address: '321 North Rd', available: false },
];

export const CAR_WASH_SERVICES = [
  {
    id: '1',
    name: 'Basic Wash',
    description: 'Exterior wash with basic cleaning',
    price: 15.99,
  },
  {
    id: '2',
    name: 'Premium Wash',
    description: 'Exterior wash plus tire shine and wax',
    price: 24.99,
  },
  {
    id: '3',
    name: 'Deluxe Package',
    description: 'Premium wash plus interior vacuuming and dashboard cleaning',
    price: 34.99,
  },
  {
    id: '4',
    name: 'Complete Detail',
    description: 'Full interior and exterior detailing service',
    price: 89.99,
  },
  {
    id: '5',
    name: 'Express Wash',
    description: 'Quick exterior wash in under 15 minutes',
    price: 9.99,
  },
];

export interface EmployeeAssignment {
  bookingId: number;
  employeeId: number;
  employeeName: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  employeeId?: string;
  registrationDate?: string;
}
