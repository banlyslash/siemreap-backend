import { PrismaClient, UserRole } from '@/generated/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  // Clean up existing data
  await prisma.leaveBalance.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.leaveType.deleteMany()
  await prisma.user.deleteMany()

  // Create leave types
  const annualLeave = await prisma.leaveType.create({
    data: {
      name: 'Annual Leave',
      description: 'Regular annual leave',
      color: '#4CAF50', // Green
    },
  })

  const sickLeave = await prisma.leaveType.create({
    data: {
      name: 'Sick Leave',
      description: 'Leave for health reasons',
      color: '#F44336', // Red
    },
  })

  const personalLeave = await prisma.leaveType.create({
    data: {
      name: 'Personal Leave',
      description: 'Leave for personal matters',
      color: '#2196F3', // Blue
    },
  })

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  })

  // Create HR user
  const hrPassword = await bcrypt.hash('hr123', 10)
  const hr = await prisma.user.create({
    data: {
      email: 'hr@example.com',
      password: hrPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: UserRole.HR,
    },
  })

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  })

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10)
  const employee = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      password: employeePassword,
      firstName: 'Regular',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
    },
  })

  // Create leave balances for all users
  const currentYear = new Date().getFullYear()
  
  // Admin leave balances
  await prisma.leaveBalance.createMany({
    data: [
      {
        userId: admin.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
        allocated: 30,
        used: 0,
      },
      {
        userId: admin.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
        allocated: 15,
        used: 0,
      },
      {
        userId: admin.id,
        leaveTypeId: personalLeave.id,
        year: currentYear,
        allocated: 5,
        used: 0,
      },
    ],
  })

  // HR leave balances
  await prisma.leaveBalance.createMany({
    data: [
      {
        userId: hr.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
        allocated: 25,
        used: 0,
      },
      {
        userId: hr.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
        allocated: 15,
        used: 0,
      },
      {
        userId: hr.id,
        leaveTypeId: personalLeave.id,
        year: currentYear,
        allocated: 5,
        used: 0,
      },
    ],
  })

  // Manager leave balances
  await prisma.leaveBalance.createMany({
    data: [
      {
        userId: manager.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
        allocated: 25,
        used: 0,
      },
      {
        userId: manager.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
        allocated: 15,
        used: 0,
      },
      {
        userId: manager.id,
        leaveTypeId: personalLeave.id,
        year: currentYear,
        allocated: 5,
        used: 0,
      },
    ],
  })

  // Employee leave balances
  await prisma.leaveBalance.createMany({
    data: [
      {
        userId: employee.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
        allocated: 20,
        used: 0,
      },
      {
        userId: employee.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
        allocated: 15,
        used: 0,
      },
      {
        userId: employee.id,
        leaveTypeId: personalLeave.id,
        year: currentYear,
        allocated: 3,
        used: 0,
      },
    ],
  })

  // Create holidays for the current year
  await prisma.holiday.createMany({
    data: [
      {
        name: 'New Year\'s Day',
        date: new Date(`${currentYear}-01-01`),
        description: 'New Year\'s Day celebration',
      },
      {
        name: 'Labor Day',
        date: new Date(`${currentYear}-05-01`),
        description: 'International Workers\' Day',
      },
      {
        name: 'Independence Day',
        date: new Date(`${currentYear}-07-04`),
        description: 'National Independence Day',
      },
      {
        name: 'Christmas Day',
        date: new Date(`${currentYear}-12-25`),
        description: 'Christmas Day celebration',
      },
    ],
  })

  console.log('Seed data created successfully!')
}

main()
  .catch(e => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
