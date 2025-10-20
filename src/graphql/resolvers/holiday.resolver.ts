import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'

export const holidayResolvers = {
  Query: {
    /**
     * Get holidays with optional year filter
     */
    holidays: async (
      _: any,
      args: { year?: number },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Build filters
      const filters: any = {}
      
      if (args.year) {
        const year = args.year
        // Filter by year
        const startDate = new Date(year, 0, 1) // January 1st of the year
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999) // December 31st of the year
        
        filters.date = {
          gte: startDate,
          lte: endDate
        }
      }
      
      return prisma.holiday.findMany({
        where: filters,
        orderBy: { date: 'asc' }
      })
    },

    /**
     * Get a single holiday by ID
     */
    holiday: async (_: any, { id }: { id: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      const holiday = await prisma.holiday.findUnique({
        where: { id }
      })

      if (!holiday) {
        throw new GraphQLError('Holiday not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return holiday
    }
  },

  Mutation: {
    /**
     * Create a new holiday
     */
    createHoliday: async (
      _: any,
      { input }: { input: { name: string; date: Date; description?: string } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can create holidays
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to create holidays', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Check if date already has a holiday
      const holidayDate = new Date(input.date)
      const existingHoliday = await prisma.holiday.findFirst({
        where: {
          date: {
            equals: holidayDate
          }
        }
      })
      
      if (existingHoliday) {
        throw new GraphQLError('A holiday already exists on this date', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Create holiday
      const newHoliday = await prisma.holiday.create({
        data: {
          name: input.name,
          date: holidayDate,
          description: input.description
        }
      })
      
      return newHoliday
    },

    /**
     * Update an existing holiday
     */
    updateHoliday: async (
      _: any,
      { id, input }: { id: string; input: { name?: string; date?: Date; description?: string } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can update holidays
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to update holidays', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find the holiday to update
      const holiday = await prisma.holiday.findUnique({
        where: { id }
      })
      
      if (!holiday) {
        throw new GraphQLError('Holiday not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Check if date is being updated and if it conflicts with another holiday
      if (input.date) {
        const holidayDate = new Date(input.date)
        const existingHoliday = await prisma.holiday.findFirst({
          where: {
            date: {
              equals: holidayDate
            },
            id: {
              not: id
            }
          }
        })
        
        if (existingHoliday) {
          throw new GraphQLError('A holiday already exists on this date', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      }
      
      // Update holiday
      const updatedHoliday = await prisma.holiday.update({
        where: { id },
        data: {
          name: input.name,
          date: input.date ? new Date(input.date) : undefined,
          description: input.description
        }
      })
      
      return updatedHoliday
    },

    /**
     * Delete a holiday
     */
    deleteHoliday: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can delete holidays
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to delete holidays', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find the holiday to delete
      const holiday = await prisma.holiday.findUnique({
        where: { id }
      })
      
      if (!holiday) {
        throw new GraphQLError('Holiday not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Delete holiday
      await prisma.holiday.delete({
        where: { id }
      })
      
      return true
    }
  }
}
