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
  'Sedan',
  'SUV',
  'Truck',
  'Van',
  'Motorcycle',
  'Crossover',
  'Hatchback',
  'Luxury Vehicle',
  'Commercial Vehicle',
];

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
