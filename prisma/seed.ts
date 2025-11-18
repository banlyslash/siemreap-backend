import { PrismaClient, UserRole, LeaveRequestStatus } from '../src/generated/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  // Clean up existing data
  await prisma.leaveAudit.deleteMany()
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
  
  const bereavementLeave = await prisma.leaveType.create({
    data: {
      name: 'Bereavement Leave',
      description: 'Leave for family bereavement',
      color: '#9C27B0', // Purple
    },
  })
  
  const maternityLeave = await prisma.leaveType.create({
    data: {
      name: 'Maternity Leave',
      description: 'Leave for childbirth and recovery',
      color: '#FF9800', // Orange
    },
  })
  
  const paternityLeave = await prisma.leaveType.create({
    data: {
      name: 'Paternity Leave',
      description: 'Leave for new fathers',
      color: '#009688', // Teal
    },
  })
  
  const studyLeave = await prisma.leaveType.create({
    data: {
      name: 'Study Leave',
      description: 'Leave for educational purposes',
      color: '#795548', // Brown
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
      role: UserRole.hr,
    },
  })

  // Create HR users
  const hrPassword = await bcrypt.hash('hr123', 10)
  const hr = await prisma.user.create({
    data: {
      email: 'hr@example.com',
      password: hrPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: UserRole.hr,
    },
  })
  
  const hr2Password = await bcrypt.hash('hr123', 10)
  const hr2 = await prisma.user.create({
    data: {
      email: 'sarah.hr@example.com',
      password: hr2Password,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.hr,
    },
  })

  // Create manager users
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.manager,
    },
  })
  
  const manager2Password = await bcrypt.hash('manager123', 10)
  const manager2 = await prisma.user.create({
    data: {
      email: 'david.manager@example.com',
      password: manager2Password,
      firstName: 'David',
      lastName: 'Wilson',
      role: UserRole.manager,
    },
  })
  
  const manager3Password = await bcrypt.hash('manager123', 10)
  const manager3 = await prisma.user.create({
    data: {
      email: 'jennifer.manager@example.com',
      password: manager3Password,
      firstName: 'Jennifer',
      lastName: 'Lee',
      role: UserRole.manager,
    },
  })

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 10)
  const employee = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      password: employeePassword,
      firstName: 'Regular',
      lastName: 'Employee',
      role: UserRole.employee,
    },
  })
  
  const employee2Password = await bcrypt.hash('employee123', 10)
  const employee2 = await prisma.user.create({
    data: {
      email: 'john.employee@example.com',
      password: employee2Password,
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.employee,
    },
  })
  
  const employee3Password = await bcrypt.hash('employee123', 10)
  const employee3 = await prisma.user.create({
    data: {
      email: 'emily.employee@example.com',
      password: employee3Password,
      firstName: 'Emily',
      lastName: 'Davis',
      role: UserRole.employee,
    },
  })
  
  const employee4Password = await bcrypt.hash('employee123', 10)
  const employee4 = await prisma.user.create({
    data: {
      email: 'michael.employee@example.com',
      password: employee4Password,
      firstName: 'Michael',
      lastName: 'Brown',
      role: UserRole.employee,
    },
  })
  
  const employee5Password = await bcrypt.hash('employee123', 10)
  const employee5 = await prisma.user.create({
    data: {
      email: 'sophia.employee@example.com',
      password: employee5Password,
      firstName: 'Sophia',
      lastName: 'Garcia',
      role: UserRole.employee,
    },
  })

  // Create leave balances for all users
  const currentYear = new Date().getFullYear()
  
  // Create leave balances for all users with all leave types
  const createLeaveBalances = async (userId: string, annualDays: number, sickDays: number, personalDays: number) => {
    await prisma.leaveBalance.createMany({
      data: [
        {
          userId,
          leaveTypeId: annualLeave.id,
          year: currentYear,
          allocated: annualDays,
          used: 0,
        },
        {
          userId,
          leaveTypeId: sickLeave.id,
          year: currentYear,
          allocated: sickDays,
          used: 0,
        },
        {
          userId,
          leaveTypeId: personalLeave.id,
          year: currentYear,
          allocated: personalDays,
          used: 0,
        },
        {
          userId,
          leaveTypeId: bereavementLeave.id,
          year: currentYear,
          allocated: 5,
          used: 0,
        },
        {
          userId,
          leaveTypeId: maternityLeave.id,
          year: currentYear,
          allocated: 90,
          used: 0,
        },
        {
          userId,
          leaveTypeId: paternityLeave.id,
          year: currentYear,
          allocated: 14,
          used: 0,
        },
        {
          userId,
          leaveTypeId: studyLeave.id,
          year: currentYear,
          allocated: 10,
          used: 0,
        },
      ],
    })
  }
  
  // Admin leave balances
  await createLeaveBalances(admin.id, 30, 15, 5)
  
  // HR leave balances
  await createLeaveBalances(hr.id, 25, 15, 5)
  await createLeaveBalances(hr2.id, 25, 15, 5)
  
  // Manager leave balances
  await createLeaveBalances(manager.id, 25, 15, 5)
  await createLeaveBalances(manager2.id, 25, 15, 5)
  await createLeaveBalances(manager3.id, 25, 15, 5)
  
  // Employee leave balances
  await createLeaveBalances(employee.id, 20, 15, 3)
  await createLeaveBalances(employee2.id, 20, 15, 3)
  await createLeaveBalances(employee3.id, 20, 15, 3)
  await createLeaveBalances(employee4.id, 20, 15, 3)
  await createLeaveBalances(employee5.id, 20, 15, 3)

  // Create Cambodian public holidays for 2024 and 2025
  await prisma.holiday.createMany({
    data: [
      // 2024 Holidays
      {
        name: 'International New Year\'s Day',
        date: new Date('2024-01-01'),
        description: 'International New Year celebration',
      },
      {
        name: 'Victory over Genocide Day',
        date: new Date('2024-01-07'),
        description: 'Commemorating the end of the Khmer Rouge regime',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2024-04-13'),
        description: 'Khmer New Year - Day 1',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2024-04-14'),
        description: 'Khmer New Year - Day 2',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2024-04-15'),
        description: 'Khmer New Year - Day 3',
      },
      {
        name: 'International Workers\' Day',
        date: new Date('2024-05-01'),
        description: 'International Labor Day',
      },
      {
        name: 'King\'s Birthday',
        date: new Date('2024-05-14'),
        description: 'Birthday of King Norodom Sihamoni',
      },
      {
        name: 'Royal Ploughing Ceremony',
        date: new Date('2024-05-22'),
        description: 'Traditional royal ceremony marking the beginning of the rice-growing season',
      },
      {
        name: 'Queen Mother\'s Birthday',
        date: new Date('2024-06-18'),
        description: 'Birthday of Queen Mother Norodom Monineath',
      },
      {
        name: 'Constitution Day',
        date: new Date('2024-09-24'),
        description: 'Celebrating the Cambodian Constitution',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2024-10-01'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 1',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2024-10-02'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 2',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2024-10-03'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 3',
      },
      {
        name: 'King Father\'s Commemoration Day',
        date: new Date('2024-10-15'),
        description: 'Commemorating King Father Norodom Sihanouk',
      },
      {
        name: 'Paris Peace Agreement Day',
        date: new Date('2024-10-23'),
        description: 'Commemorating the Paris Peace Agreements',
      },
      {
        name: 'Independence Day',
        date: new Date('2024-11-09'),
        description: 'Cambodian Independence Day from France',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2024-11-14'),
        description: 'Water Festival - Day 1',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2024-11-15'),
        description: 'Water Festival - Day 2',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2024-11-16'),
        description: 'Water Festival - Day 3',
      },
      
      // 2025 Holidays
      {
        name: 'International New Year\'s Day',
        date: new Date('2025-01-01'),
        description: 'International New Year celebration',
      },
      {
        name: 'Victory over Genocide Day',
        date: new Date('2025-01-07'),
        description: 'Commemorating the end of the Khmer Rouge regime',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2025-04-14'),
        description: 'Khmer New Year - Day 1',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2025-04-15'),
        description: 'Khmer New Year - Day 2',
      },
      {
        name: 'Khmer New Year',
        date: new Date('2025-04-16'),
        description: 'Khmer New Year - Day 3',
      },
      {
        name: 'International Workers\' Day',
        date: new Date('2025-05-01'),
        description: 'International Labor Day',
      },
      {
        name: 'King\'s Birthday',
        date: new Date('2025-05-14'),
        description: 'Birthday of King Norodom Sihamoni',
      },
      {
        name: 'Royal Ploughing Ceremony',
        date: new Date('2025-05-10'),
        description: 'Traditional royal ceremony marking the beginning of the rice-growing season',
      },
      {
        name: 'Queen Mother\'s Birthday',
        date: new Date('2025-06-18'),
        description: 'Birthday of Queen Mother Norodom Monineath',
      },
      {
        name: 'Constitution Day',
        date: new Date('2025-09-24'),
        description: 'Celebrating the Cambodian Constitution',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2025-09-20'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 1',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2025-09-21'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 2',
      },
      {
        name: 'Pchum Ben Day',
        date: new Date('2025-09-22'),
        description: 'Pchum Ben (Ancestors\' Day) - Day 3',
      },
      {
        name: 'King Father\'s Commemoration Day',
        date: new Date('2025-10-15'),
        description: 'Commemorating King Father Norodom Sihanouk',
      },
      {
        name: 'Paris Peace Agreement Day',
        date: new Date('2025-10-23'),
        description: 'Commemorating the Paris Peace Agreements',
      },
      {
        name: 'Independence Day',
        date: new Date('2025-11-09'),
        description: 'Cambodian Independence Day from France',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2025-11-04'),
        description: 'Water Festival - Day 1',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2025-11-05'),
        description: 'Water Festival - Day 2',
      },
      {
        name: 'Water Festival (Bon Om Touk)',
        date: new Date('2025-11-06'),
        description: 'Water Festival - Day 3',
      },
    ],
  })
  
  // Create leave requests with different statuses
  // Helper function to create a date with a specific offset from today
  const getDate = (dayOffset: number): Date => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    return date
  }
  
  // Create approved leave requests
  const approvedLeaveRequest1 = await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: getDate(10),
      endDate: getDate(14),
      reason: 'Family vacation',
      status: LeaveRequestStatus.hr_approved,
      managerId: manager.id,
      managerComment: 'Approved. Enjoy your vacation!',
      managerActionAt: getDate(-5),
      hrId: hr.id,
      hrComment: 'All good. Have a nice vacation!',
      hrActionAt: getDate(-3),
    },
  })
  
  const approvedLeaveRequest2 = await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      leaveTypeId: sickLeave.id,
      startDate: getDate(5),
      endDate: getDate(6),
      reason: 'Doctor appointment',
      status: LeaveRequestStatus.hr_approved,
      managerId: manager2.id,
      managerComment: 'Approved. Get well soon!',
      managerActionAt: getDate(-2),
      hrId: hr2.id,
      hrComment: 'Approved as per policy',
      hrActionAt: getDate(-1),
    },
  })
  
  // Create pending leave requests
  const pendingLeaveRequest1 = await prisma.leaveRequest.create({
    data: {
      userId: employee3.id,
      leaveTypeId: personalLeave.id,
      startDate: getDate(15),
      endDate: getDate(15),
      halfDay: true,
      halfDayStart: true,
      reason: 'Personal errands',
      status: LeaveRequestStatus.pending,
    },
  })
  
  const pendingLeaveRequest2 = await prisma.leaveRequest.create({
    data: {
      userId: employee4.id,
      leaveTypeId: studyLeave.id,
      startDate: getDate(20),
      endDate: getDate(24),
      reason: 'Exam preparation',
      status: LeaveRequestStatus.pending,
    },
  })
  
  // Create manager approved, pending HR approval
  const managerApprovedLeaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: employee5.id,
      leaveTypeId: bereavementLeave.id,
      startDate: getDate(3),
      endDate: getDate(7),
      reason: 'Family funeral',
      status: LeaveRequestStatus.manager_approved,
      managerId: manager3.id,
      managerComment: 'Approved. My condolences.',
      managerActionAt: getDate(-1),
    },
  })
  
  // Create rejected leave requests
  const rejectedLeaveRequest1 = await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: getDate(30),
      endDate: getDate(40),
      reason: 'Extended vacation',
      status: LeaveRequestStatus.manager_rejected,
      managerId: manager.id,
      managerComment: 'Cannot approve such a long leave during this busy period.',
      managerActionAt: getDate(-4),
    },
  })
  
  const rejectedLeaveRequest2 = await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      leaveTypeId: personalLeave.id,
      startDate: getDate(25),
      endDate: getDate(26),
      reason: 'Personal matters',
      status: LeaveRequestStatus.hr_rejected,
      managerId: manager2.id,
      managerComment: 'Approved from my side.',
      managerActionAt: getDate(-6),
      hrId: hr.id,
      hrComment: 'Insufficient leave balance for this type of leave.',
      hrActionAt: getDate(-5),
    },
  })
  
  // Create leave audit entries
  await prisma.leaveAudit.createMany({
    data: [
      // Audit for approved leave request 1
      {
        leaveRequestId: approvedLeaveRequest1.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee.id,
        timestamp: getDate(-7),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      {
        leaveRequestId: approvedLeaveRequest1.id,
        action: 'MANAGER_APPROVAL',
        performedById: manager.id,
        timestamp: getDate(-5),
        details: 'Manager approved leave request',
        previousStatus: LeaveRequestStatus.pending,
        newStatus: LeaveRequestStatus.manager_approved,
      },
      {
        leaveRequestId: approvedLeaveRequest1.id,
        action: 'HR_APPROVAL',
        performedById: hr.id,
        timestamp: getDate(-3),
        details: 'HR approved leave request',
        previousStatus: LeaveRequestStatus.manager_approved,
        newStatus: LeaveRequestStatus.hr_approved,
      },
      
      // Audit for approved leave request 2
      {
        leaveRequestId: approvedLeaveRequest2.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee2.id,
        timestamp: getDate(-4),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      {
        leaveRequestId: approvedLeaveRequest2.id,
        action: 'MANAGER_APPROVAL',
        performedById: manager2.id,
        timestamp: getDate(-2),
        details: 'Manager approved leave request',
        previousStatus: LeaveRequestStatus.pending,
        newStatus: LeaveRequestStatus.manager_approved,
      },
      {
        leaveRequestId: approvedLeaveRequest2.id,
        action: 'HR_APPROVAL',
        performedById: hr2.id,
        timestamp: getDate(-1),
        details: 'HR approved leave request',
        previousStatus: LeaveRequestStatus.manager_approved,
        newStatus: LeaveRequestStatus.hr_approved,
      },
      
      // Audit for pending leave request 1
      {
        leaveRequestId: pendingLeaveRequest1.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee3.id,
        timestamp: getDate(-1),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      
      // Audit for pending leave request 2
      {
        leaveRequestId: pendingLeaveRequest2.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee4.id,
        timestamp: getDate(-2),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      
      // Audit for manager approved leave request
      {
        leaveRequestId: managerApprovedLeaveRequest.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee5.id,
        timestamp: getDate(-3),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      {
        leaveRequestId: managerApprovedLeaveRequest.id,
        action: 'MANAGER_APPROVAL',
        performedById: manager3.id,
        timestamp: getDate(-1),
        details: 'Manager approved leave request',
        previousStatus: LeaveRequestStatus.pending,
        newStatus: LeaveRequestStatus.manager_approved,
      },
      
      // Audit for rejected leave request 1
      {
        leaveRequestId: rejectedLeaveRequest1.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee.id,
        timestamp: getDate(-6),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      {
        leaveRequestId: rejectedLeaveRequest1.id,
        action: 'MANAGER_REJECTION',
        performedById: manager.id,
        timestamp: getDate(-4),
        details: 'Manager rejected leave request',
        previousStatus: LeaveRequestStatus.pending,
        newStatus: LeaveRequestStatus.manager_rejected,
      },
      
      // Audit for rejected leave request 2
      {
        leaveRequestId: rejectedLeaveRequest2.id,
        action: 'LEAVE_REQUEST_CREATED',
        performedById: employee2.id,
        timestamp: getDate(-8),
        details: 'Leave request created',
        previousStatus: null,
        newStatus: LeaveRequestStatus.pending,
      },
      {
        leaveRequestId: rejectedLeaveRequest2.id,
        action: 'MANAGER_APPROVAL',
        performedById: manager2.id,
        timestamp: getDate(-6),
        details: 'Manager approved leave request',
        previousStatus: LeaveRequestStatus.pending,
        newStatus: LeaveRequestStatus.manager_approved,
      },
      {
        leaveRequestId: rejectedLeaveRequest2.id,
        action: 'HR_REJECTION',
        performedById: hr.id,
        timestamp: getDate(-5),
        details: 'HR rejected leave request',
        previousStatus: LeaveRequestStatus.manager_approved,
        newStatus: LeaveRequestStatus.hr_rejected,
      },
    ],
  })
  
  // Update leave balances for approved leave requests
  // Helper function to calculate business days between two dates
  const getBusinessDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };
  
  // Update leave balance for employee 1's approved leave
  const daysUsed1 = getBusinessDays(getDate(10), getDate(14));
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee.id,
        leaveTypeId: annualLeave.id,
        year: currentYear,
      },
    },
    data: {
      used: daysUsed1,
    },
  });
  
  // Update leave balance for employee 2's approved leave
  const daysUsed2 = getBusinessDays(getDate(5), getDate(6));
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee2.id,
        leaveTypeId: sickLeave.id,
        year: currentYear,
      },
    },
    data: {
      used: daysUsed2,
    },
  });
  
  // Update pending leave balances
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee3.id,
        leaveTypeId: personalLeave.id,
        year: currentYear,
      },
    },
    data: {
      pending: 0.5, // Half day
    },
  });
  
  const pendingDays = getBusinessDays(getDate(20), getDate(24));
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee4.id,
        leaveTypeId: studyLeave.id,
        year: currentYear,
      },
    },
    data: {
      pending: pendingDays,
    },
  });
  
  const pendingBereavementDays = getBusinessDays(getDate(3), getDate(7));
  await prisma.leaveBalance.update({
    where: {
      userId_leaveTypeId_year: {
        userId: employee5.id,
        leaveTypeId: bereavementLeave.id,
        year: currentYear,
      },
    },
    data: {
      pending: pendingBereavementDays,
    },
  });

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
