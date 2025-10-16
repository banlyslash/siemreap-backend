/**
 * User model interface
 */
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}
